const AuditCycle = require('../models/AuditCycle.model');
const AuditItem = require('../models/AuditItem.model');
const Asset = require('../models/Asset.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { validateTransition } = require('../utils/assetStateMachine');
const { logActivity, notifyUser } = require('../utils/activityLogger');
const mongoose = require('mongoose');

/**
 * Helper function to auto-generate AuditItem records for every in-scope Asset
 * @param {Object} auditCycle - The newly created audit cycle
 * @returns {Number} - Count of items created
 */
const expandScopeIntoChecklistItems = async (auditCycle) => {
  const query = {};
  
  if (auditCycle.scopeDepartment) {
    query.department = auditCycle.scopeDepartment;
  }
  if (auditCycle.scopeLocation) {
    query.location = auditCycle.scopeLocation;
  }

  // We should only audit physical assets that are not already Disposed, Retired, or Lost?
  // Usually Lost assets might be found during audit, but typically Available, Allocated, Under Maintenance are audited.
  // For simplicity, we just filter out Disposed/Retired.
  query.status = { $nin: ['Disposed', 'Retired'] };

  const assetsInScope = await Asset.find(query);

  const auditItemsToInsert = assetsInScope.map(asset => ({
    auditCycle: auditCycle._id,
    asset: asset._id,
    result: 'Pending'
  }));

  if (auditItemsToInsert.length > 0) {
    await AuditItem.insertMany(auditItemsToInsert);
  }

  return auditItemsToInsert.length;
};

const createAuditCycle = catchAsync(async (req, res, next) => {
  const { name, scopeDepartment, scopeLocation, startDate, endDate, assignedAuditors } = req.body;

  // The pre-save hook in AuditCycle.model.js will validate that assignedAuditors have the Auditor role
  
  const cycle = await AuditCycle.create({
    name,
    scopeDepartment,
    scopeLocation,
    startDate,
    endDate,
    assignedAuditors,
    createdBy: req.user.id
  });

  // Auto-expand scope into checklist items
  const itemsCreatedCount = await expandScopeIntoChecklistItems(cycle);

  await logActivity({
    actor: req.user.id,
    action: 'Created Audit Cycle',
    entityType: 'AuditCycle',
    entityId: cycle._id,
    metadata: { name, itemsCreatedCount }
  });

  if (Array.isArray(assignedAuditors)) {
    for (const auditorId of assignedAuditors) {
      await notifyUser({
        recipient: auditorId,
        type: 'AuditDiscrepancyFlagged', // Using enum for audit related alert
        message: `You have been assigned to audit cycle: ${cycle.name}`,
        relatedEntity: {
          entityType: 'AuditCycle',
          entityId: cycle._id
        },
        emailData: {
          cycleName: cycle.name
        }
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Audit cycle created successfully',
    data: { cycle, itemsCreatedCount }
  });
});

const getAuditCycles = catchAsync(async (req, res, next) => {
  const { status, scopeDepartment } = req.query;

  const query = {};
  if (status) query.status = status;
  if (scopeDepartment) query.scopeDepartment = scopeDepartment;

  const cycles = await AuditCycle.find(query)
    .populate('assignedAuditors', 'name')
    .sort({ createdAt: -1 });

  // Compute progress summary for each cycle
  const cyclesWithSummary = await Promise.all(cycles.map(async (cycle) => {
    const totalCount = await AuditItem.countDocuments({ auditCycle: cycle._id });
    const checkedCount = await AuditItem.countDocuments({ 
      auditCycle: cycle._id, 
      result: { $ne: 'Pending' } 
    });

    return {
      ...cycle.toObject(),
      progress: {
        totalCount,
        checkedCount
      }
    };
  }));

  res.status(200).json({
    success: true,
    message: 'Audit cycles retrieved',
    data: { cycles: cyclesWithSummary }
  });
});

const getAuditItems = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { result, page = 1, limit = 10 } = req.query;

  const query = { auditCycle: id };
  if (result) query.result = result;

  const skip = (page - 1) * limit;

  const items = await AuditItem.find(query)
    .populate('asset', 'name assetTag location status')
    .populate('checkedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Audit items retrieved',
    data: { items }
  });
});

const updateAuditItem = catchAsync(async (req, res, next) => {
  const { id, itemId } = req.params;
  const { result, notes } = req.body;

  const cycle = await AuditCycle.findById(id);
  if (!cycle) {
    return next(new AppError('Audit cycle not found', 404));
  }
  if (cycle.status === 'Closed') {
    return next(new AppError('Audit cycle is closed. Items cannot be updated.', 409));
  }

  // The acting user must be one of the cycle's assignedAuditors (or Admin/Asset Manager)
  const isAssigned = cycle.assignedAuditors.some(auditorId => auditorId.toString() === req.user.id);
  const isAdminOrManager = ['Admin', 'Asset Manager'].includes(req.user.role);

  if (!isAssigned && !isAdminOrManager) {
    return next(new AppError('You do not have permission to update items for this audit cycle', 403));
  }

  const item = await AuditItem.findOne({ _id: itemId, auditCycle: id });
  if (!item) {
    return next(new AppError('Audit item not found', 404));
  }

  item.result = result;
  item.notes = notes;
  item.checkedBy = req.user.id;
  item.checkedAt = new Date();

  await item.save();

  res.status(200).json({
    success: true,
    message: 'Audit item updated',
    data: { item }
  });
});

const getDiscrepancyReport = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Use aggregation to return all items with result Missing or Damaged, grouped by result
  const report = await AuditItem.aggregate([
    { $match: { auditCycle: new mongoose.Types.ObjectId(id), result: { $in: ['Missing', 'Damaged'] } } },
    {
      $lookup: {
        from: 'assets',
        localField: 'asset',
        foreignField: '_id',
        as: 'assetDetails'
      }
    },
    { $unwind: '$assetDetails' },
    {
      $group: {
        _id: '$result',
        items: {
          $push: {
            itemId: '$_id',
            assetId: '$assetDetails._id',
            assetName: '$assetDetails.name',
            assetTag: '$assetDetails.assetTag',
            location: '$assetDetails.location',
            notes: '$notes',
            checkedAt: '$checkedAt'
          }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    message: 'Discrepancy report retrieved',
    data: { report }
  });
});

const closeAuditCycle = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cycle = await AuditCycle.findById(id).session(session);
    if (!cycle) {
      throw new AppError('Audit cycle not found', 404);
    }
    if (cycle.status === 'Closed') {
      throw new AppError('Audit cycle is already closed', 409);
    }

    // BUSINESS DECISION: Block closing until all items are checked. 
    // This matches a realistic audit process where every asset in scope must be accounted for.
    const pendingCount = await AuditItem.countDocuments({ auditCycle: id, result: 'Pending' }).session(session);
    if (pendingCount > 0) {
      throw new AppError(`Cannot close audit cycle. There are still ${pendingCount} items left unchecked.`, 400);
    }

    // For every item with result Missing, transition asset to 'Lost'
    // For Damaged items, we log/notify but don't force a status change automatically.
    // A Damaged asset might still be Available or might need a separate Maintenance request.
    const missingItems = await AuditItem.find({ auditCycle: id, result: 'Missing' }).session(session);

    for (const item of missingItems) {
      const asset = await Asset.findById(item.asset).session(session);
      if (asset) {
        const isValidTransition = validateTransition(asset.status, 'Lost');
        if (isValidTransition) {
          asset.status = 'Lost';
          await asset.save({ session });
        }
      }
    }

    cycle.status = 'Closed';
    cycle.closedAt = new Date();
    await cycle.save({ session });

    await session.commitTransaction();

    await logActivity({
      actor: req.user.id,
      action: 'Closed Audit Cycle',
      entityType: 'AuditCycle',
      entityId: cycle._id,
      metadata: { missingCount: missingItems.length }
    });

    if (missingItems.length > 0) {
      await notifyUser({
        recipient: req.user.id,
        type: 'AuditDiscrepancyFlagged',
        message: `Audit cycle ${cycle.name} closed with ${missingItems.length} missing asset(s) marked as Lost.`,
        relatedEntity: {
          entityType: 'AuditCycle',
          entityId: cycle._id
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Audit cycle closed successfully. Missing assets have been marked as Lost.',
      data: { cycle }
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

module.exports = {
  createAuditCycle,
  getAuditCycles,
  getAuditItems,
  updateAuditItem,
  getDiscrepancyReport,
  closeAuditCycle
};
