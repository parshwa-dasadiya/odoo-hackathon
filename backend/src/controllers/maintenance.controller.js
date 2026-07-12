const MaintenanceRequest = require('../models/MaintenanceRequest.model');
const Asset = require('../models/Asset.model');
const Allocation = require('../models/Allocation.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { validateTransition } = require('../utils/assetStateMachine');
const { logActivity, notifyUser } = require('../utils/activityLogger');
const mongoose = require('mongoose');

const raiseRequest = catchAsync(async (req, res, next) => {
  const { assetId, issueDescription, priority, photo } = req.body;

  const asset = await Asset.findById(assetId);
  if (!asset) {
    return next(new AppError('Asset not found', 404));
  }

  // Employee restricted to assets they currently hold
  if (req.user.role === 'Employee') {
    const allocation = await Allocation.findOne({
      asset: assetId,
      status: 'Active',
      holderId: req.user.id
    });
    if (!allocation) {
      return next(new AppError('You can only raise maintenance requests for assets currently allocated to you.', 403));
    }
  }

  const maintenanceReq = await MaintenanceRequest.create({
    asset: assetId,
    raisedBy: req.user.id,
    issueDescription,
    priority,
    photo
  });

  res.status(201).json({
    success: true,
    message: 'Maintenance request raised successfully',
    data: { maintenanceRequest: maintenanceReq }
  });
});

const decideRequest = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { decision, decisionNotes, technicianName, technicianContact } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const maintenanceReq = await MaintenanceRequest.findById(id).session(session);
    if (!maintenanceReq) {
      throw new AppError('Maintenance request not found', 404);
    }
    if (maintenanceReq.status !== 'Pending') {
      throw new AppError(`Request is already ${maintenanceReq.status}`, 400);
    }

    if (decision === 'Rejected') {
      maintenanceReq.status = 'Rejected';
      maintenanceReq.decisionBy = req.user.id;
      maintenanceReq.decisionNotes = decisionNotes;
      await maintenanceReq.save({ session });
    } else if (decision === 'Approved') {
      if (!technicianName) {
        throw new AppError('Technician Name is required when approving a request', 400);
      }

      const asset = await Asset.findById(maintenanceReq.asset).session(session);
      
      // BUSINESS DECISION: Asset must be Available to go to Under Maintenance.
      // If it is Allocated, it must be returned first so the system properly ends the allocation cycle.
      const isValidTransition = validateTransition(asset.status, 'Under Maintenance');
      if (!isValidTransition) {
        throw new AppError(`Cannot approve maintenance: asset status is '${asset.status}'. It must be 'Available' (ensure it is returned first).`, 409);
      }

      asset.status = 'Under Maintenance';
      await asset.save({ session });

      maintenanceReq.status = 'Technician Assigned';
      maintenanceReq.decisionBy = req.user.id;
      maintenanceReq.decisionNotes = decisionNotes;
      maintenanceReq.technicianName = technicianName;
      maintenanceReq.technicianContact = technicianContact;
      await maintenanceReq.save({ session });
    }

    await session.commitTransaction();

    await logActivity({
      actor: req.user.id,
      action: `Maintenance Request ${decision}`,
      entityType: 'MaintenanceRequest',
      entityId: maintenanceReq._id,
      metadata: { decision }
    });

    await notifyUser({
      recipient: maintenanceReq.raisedBy,
      type: decision === 'Approved' ? 'MaintenanceApproved' : 'MaintenanceRejected',
      message: `Your maintenance request for asset ${asset.assetTag} was ${decision.toLowerCase()}.`,
      relatedEntity: {
        entityType: 'MaintenanceRequest',
        entityId: maintenanceReq._id
      },
      emailData: {
        assetTag: asset.assetTag
      }
    });

    res.status(200).json({
      success: true,
      message: `Maintenance request ${decision.toLowerCase()} successfully`,
      data: { maintenanceRequest: maintenanceReq }
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

const startMaintenance = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const maintenanceReq = await MaintenanceRequest.findById(id);
  if (!maintenanceReq) {
    return next(new AppError('Maintenance request not found', 404));
  }
  if (maintenanceReq.status !== 'Technician Assigned') {
    return next(new AppError('Can only start maintenance on requests with a Technician Assigned', 400));
  }

  maintenanceReq.status = 'In Progress';
  await maintenanceReq.save();

  res.status(200).json({
    success: true,
    message: 'Maintenance in progress',
    data: { maintenanceRequest: maintenanceReq }
  });
});

const resolveMaintenance = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { resolutionNotes } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const maintenanceReq = await MaintenanceRequest.findById(id).session(session);
    if (!maintenanceReq) {
      throw new AppError('Maintenance request not found', 404);
    }
    if (maintenanceReq.status !== 'In Progress' && maintenanceReq.status !== 'Technician Assigned') {
      throw new AppError('Can only resolve requests that are In Progress or Technician Assigned', 400);
    }

    const asset = await Asset.findById(maintenanceReq.asset).session(session);
    
    const isValidTransition = validateTransition(asset.status, 'Available');
    if (!isValidTransition) {
      throw new AppError(`Unexpected state: cannot transition asset from ${asset.status} to Available.`, 409);
    }

    asset.status = 'Available';
    await asset.save({ session });

    maintenanceReq.status = 'Resolved';
    maintenanceReq.resolutionNotes = resolutionNotes;
    maintenanceReq.resolvedAt = new Date();
    await maintenanceReq.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Maintenance resolved successfully',
      data: { maintenanceRequest: maintenanceReq }
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

const getRequests = catchAsync(async (req, res, next) => {
  const { status, priority, assetId, raisedBy, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assetId) query.asset = assetId;
  
  if (req.user.role === 'Employee') {
    query.raisedBy = req.user.id;
  } else if (raisedBy) {
    query.raisedBy = raisedBy;
  }

  const skip = (page - 1) * limit;

  const requests = await MaintenanceRequest.find(query)
    .populate('asset', 'name assetTag status')
    .populate('raisedBy', 'name email')
    .populate('decisionBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Maintenance requests retrieved',
    data: { requests }
  });
});

const getAssetMaintenanceHistory = catchAsync(async (req, res, next) => {
  const { assetId } = req.params;

  const history = await MaintenanceRequest.find({ asset: assetId })
    .populate('raisedBy', 'name email')
    .populate('decisionBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Asset maintenance history retrieved',
    data: { history }
  });
});

module.exports = {
  raiseRequest,
  decideRequest,
  startMaintenance,
  resolveMaintenance,
  getRequests,
  getAssetMaintenanceHistory
};
