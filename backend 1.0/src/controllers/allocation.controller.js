const mongoose = require('mongoose');
const Allocation = require('../models/Allocation.model');
const Asset = require('../models/Asset.model');
const User = require('../models/User.model');
const Department = require('../models/Department.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { isValidTransition } = require('../utils/assetStateMachine');
const { logActivity, notifyUser } = require('../utils/activityLogger');

const allocateAsset = catchAsync(async (req, res, next) => {
  const { assetId, holderType, holderId, expectedReturnDate } = req.body;

  // Enforce department check for Department Heads
  if (req.user.role === 'Department Head') {
    if (holderType === 'Department') {
      if (holderId.toString() !== req.user.department?.toString()) {
        return next(new AppError('As Department Head, you can only allocate assets to your own department.', 403));
      }
    } else if (holderType === 'Employee') {
      const employee = await User.findById(holderId);
      if (!employee || employee.department?.toString() !== req.user.department?.toString()) {
        return next(new AppError('As Department Head, you can only allocate assets to employees within your department.', 403));
      }
    }
  }

  // Check target asset
  const asset = await Asset.findById(assetId);
  if (!asset) {
    return next(new AppError('Asset not found.', 404));
  }

  // Critical Business Rule: check if already Allocated
  if (asset.status === 'Allocated') {
    // Resolve current holder info to construct message
    let holderName = 'Unknown';
    if (asset.currentHolder && asset.currentHolder.holderId) {
      if (asset.currentHolder.holderType === 'Employee') {
        const hUser = await User.findById(asset.currentHolder.holderId).select('name email');
        if (hUser) holderName = `${hUser.name} (${hUser.email})`;
      } else {
        const hDept = await Department.findById(asset.currentHolder.holderId).select('name');
        if (hDept) holderName = hDept.name;
      }
    }

    return res.status(409).json({
      success: false,
      message: `Asset is currently held by ${holderName} — raise a Transfer Request instead`,
      data: {
        currentHolder: asset.currentHolder,
        resolvedHolderName: holderName
      }
    });
  }

  // Validate state transition using state machine
  if (!isValidTransition(asset.status, 'Allocated')) {
    return next(new AppError(`Cannot allocate asset. Status transition from ${asset.status} to Allocated is not allowed.`, 400));
  }

  // Perform allocation in a Mongoose Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const allocation = await Allocation.create(
      [
        {
          asset: assetId,
          holderType,
          holderId,
          allocatedBy: req.user._id,
          expectedReturnDate: expectedReturnDate || null
        }
      ],
      { session }
    );

    asset.status = 'Allocated';
    asset.currentHolder = { holderType, holderId };
    await asset.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logActivity({
      actor: req.user.id,
      action: 'Allocated Asset',
      entityType: 'Allocation',
      entityId: allocation[0]._id,
      metadata: { assetId, holderType, holderId }
    });

    if (holderType === 'Employee') {
      await notifyUser({
        recipient: holderId,
        type: 'AssetAssigned',
        message: `Asset ${asset.assetTag} (${asset.name}) has been allocated to you.`,
        relatedEntity: {
          entityType: 'Allocation',
          entityId: allocation[0]._id
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Asset allocated successfully.',
      data: { allocation: allocation[0] }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

const returnAsset = catchAsync(async (req, res, next) => {
  const { id } = req.params; // allocation record ID
  const { returnConditionNotes, returnConditionRating } = req.body;

  const allocation = await Allocation.findById(id);
  if (!allocation || allocation.status !== 'Active') {
    return next(new AppError('Active allocation record not found.', 404));
  }

  const asset = await Asset.findById(allocation.asset);
  if (!asset) {
    return next(new AppError('Associated asset not found.', 404));
  }

  // Validate transition from Allocated -> Available
  if (!isValidTransition(asset.status, 'Available')) {
    return next(new AppError(`Cannot return asset. Status transition from ${asset.status} to Available is not allowed.`, 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    allocation.status = 'Returned';
    allocation.actualReturnDate = Date.now();
    allocation.returnConditionNotes = returnConditionNotes || null;
    allocation.returnConditionRating = returnConditionRating || null;
    await allocation.save({ session });

    asset.status = 'Available';
    asset.currentHolder = null;
    if (returnConditionRating) {
      asset.condition = returnConditionRating;
    }
    await asset.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logActivity({
      actor: req.user.id,
      action: 'Returned Asset',
      entityType: 'Allocation',
      entityId: allocation._id,
      metadata: { assetId: asset._id }
    });

    res.status(200).json({
      success: true,
      message: 'Asset returned successfully.',
      data: { allocation }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

const getOverdueAllocations = catchAsync(async (req, res, next) => {
  const query = {
    status: 'Active',
    expectedReturnDate: { $lt: new Date() }
  };

  const allocations = await Allocation.find(query)
    .populate('asset', 'name assetTag serialNumber')
    .populate({
      path: 'holderId',
      select: 'name email'
    })
    .sort({ expectedReturnDate: 1 }); // Most overdue first

  res.status(200).json({
    success: true,
    message: 'Overdue allocations retrieved successfully.',
    data: { allocations }
  });
});

const getAllocations = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, asset, holder, status } = req.query;

  const query = {};

  if (asset) query.asset = asset;
  if (holder) query.holderId = holder;
  if (status) query.status = status;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Allocation.countDocuments(query);
  const allocations = await Allocation.find(query)
    .populate('asset', 'name assetTag status')
    .populate('allocatedBy', 'name email')
    .populate({
      path: 'holderId',
      select: 'name email'
    })
    .skip(skip)
    .limit(limitNum)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    message: 'Allocations retrieved successfully.',
    data: {
      allocations,
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
  allocateAsset,
  returnAsset,
  getOverdueAllocations,
  getAllocations
};
