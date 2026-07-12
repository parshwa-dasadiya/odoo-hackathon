const mongoose = require('mongoose');
const TransferRequest = require('../models/TransferRequest.model');
const Allocation = require('../models/Allocation.model');
const Asset = require('../models/Asset.model');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { logActivity, notifyUser } = require('../utils/activityLogger');

const requestTransfer = catchAsync(async (req, res, next) => {
  const { assetId, toHolderType, toHolderId, reason } = req.body;

  // Resolve current active Allocation
  const activeAllocation = await Allocation.findOne({
    asset: assetId,
    status: 'Active'
  });

  if (!activeAllocation) {
    return next(new AppError('This asset is not currently allocated to anyone. You can allocate it directly instead.', 400));
  }

  // Create Transfer Request
  const request = await TransferRequest.create({
    asset: assetId,
    fromHolder: {
      holderType: activeAllocation.holderType,
      holderId: activeAllocation.holderId
    },
    toHolder: {
      holderType: toHolderType,
      holderId: toHolderId
    },
    requestedBy: req.user._id,
    decisionNotes: reason // Store initial reason in decisionNotes or a comment, let's keep it simple
  });

  res.status(201).json({
    success: true,
    message: 'Transfer request submitted successfully.',
    data: { request }
  });
});

const decideTransfer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { decision, decisionNotes } = req.body;

  const request = await TransferRequest.findById(id);
  if (!request || request.status !== 'Requested') {
    return next(new AppError('Active transfer request not found.', 404));
  }

  const asset = await Asset.findById(request.asset);
  if (!asset) {
    return next(new AppError('Associated asset not found.', 404));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    request.status = decision;
    request.decidedBy = req.user._id;
    request.decisionNotes = decisionNotes || null;
    request.decidedAt = Date.now();
    await request.save({ session });

    if (decision === 'Approved') {
      // 1. Close out the old active Allocation
      const activeAllocation = await Allocation.findOne({
        asset: request.asset,
        status: 'Active'
      });

      if (activeAllocation) {
        activeAllocation.status = 'Returned';
        activeAllocation.actualReturnDate = Date.now();
        activeAllocation.returnConditionNotes = `Closed via transfer request approval. Notes: ${decisionNotes || ''}`;
        await activeAllocation.save({ session });
      }

      // 2. Create a NEW Allocation record for the new holder
      await Allocation.create(
        [
          {
            asset: request.asset,
            holderType: request.toHolder.holderType,
            holderId: request.toHolder.holderId,
            allocatedBy: req.user._id,
            allocatedDate: Date.now()
          }
        ],
        { session }
      );

      // 3. Update the asset holder (status remains Allocated)
      asset.currentHolder = {
        holderType: request.toHolder.holderType,
        holderId: request.toHolder.holderId
      };
      await asset.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    await logActivity({
      actor: req.user._id,
      action: `Transfer Request ${decision}`,
      entityType: 'TransferRequest',
      entityId: request._id,
      metadata: { decision }
    });

    if (decision === 'Approved' && request.toHolder.holderType === 'Employee') {
      await notifyUser({
        recipient: request.toHolder.holderId,
        type: 'TransferApproved',
        message: `Transfer approved for asset ${asset.assetTag}.`,
        relatedEntity: {
          entityType: 'TransferRequest',
          entityId: request._id
        },
        emailData: {
          assetTag: asset.assetTag
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Transfer request ${decision.toLowerCase()} successfully.`,
      data: { request }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

const getTransfers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, asset, requestedBy } = req.query;

  const query = {};

  if (status) query.status = status;
  if (asset) query.asset = asset;
  if (requestedBy) query.requestedBy = requestedBy;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await TransferRequest.countDocuments(query);
  const transfers = await TransferRequest.find(query)
    .populate('asset', 'name assetTag')
    .populate('requestedBy', 'name email')
    .populate('decidedBy', 'name email')
    .populate({
      path: 'fromHolder.holderId',
      select: 'name email'
    })
    .populate({
      path: 'toHolder.holderId',
      select: 'name email'
    })
    .skip(skip)
    .limit(limitNum)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    message: 'Transfer requests retrieved successfully.',
    data: {
      transfers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

module.exports = {
  requestTransfer,
  decideTransfer,
  getTransfers
};
