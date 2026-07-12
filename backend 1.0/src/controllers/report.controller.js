const Asset = require('../models/Asset.model');
const Allocation = require('../models/Allocation.model');
const Booking = require('../models/Booking.model');
const MaintenanceRequest = require('../models/MaintenanceRequest.model');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

const getAssetUtilization = catchAsync(async (req, res, next) => {
  // Aggregate to rank assets by allocation+booking frequency
  const utilization = await Asset.aggregate([
    {
      $lookup: {
        from: 'allocations',
        localField: '_id',
        foreignField: 'asset',
        as: 'allocations'
      }
    },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'resource',
        as: 'bookings'
      }
    },
    {
      $project: {
        name: 1,
        assetTag: 1,
        status: 1,
        allocationCount: { $size: '$allocations' },
        bookingCount: { $size: '$bookings' },
        totalUsage: { $add: [{ $size: '$allocations' }, { $size: '$bookings' }] }
      }
    },
    { $sort: { totalUsage: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: { utilization }
  });
});

const getMaintenanceFrequency = catchAsync(async (req, res, next) => {
  const frequency = await MaintenanceRequest.aggregate([
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
      $lookup: {
        from: 'assetcategories',
        localField: 'assetDetails.category',
        foreignField: '_id',
        as: 'categoryDetails'
      }
    },
    { $unwind: '$categoryDetails' },
    {
      $group: {
        _id: '$categoryDetails.name',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: { frequency }
  });
});

const getMaintenanceDue = catchAsync(async (req, res, next) => {
  // Configurable threshold: e.g. assets acquired more than 3 years ago
  const { yearsOld = 3 } = req.query;
  const thresholdDate = new Date();
  thresholdDate.setFullYear(thresholdDate.getFullYear() - parseInt(yearsOld));

  const dueAssets = await Asset.aggregate([
    {
      $match: {
        acquisitionDate: { $lte: thresholdDate },
        status: { $in: ['Available', 'Allocated'] }
      }
    },
    {
      $lookup: {
        from: 'maintenancerequests',
        localField: '_id',
        foreignField: 'asset',
        as: 'maintenanceHistory'
      }
    },
    // Filter to those with no maintenance in the last year
    {
      $addFields: {
        recentMaintenance: {
          $filter: {
            input: '$maintenanceHistory',
            as: 'mreq',
            cond: { $gte: ['$$mreq.createdAt', new Date(new Date().setFullYear(new Date().getFullYear() - 1))] }
          }
        }
      }
    },
    {
      $match: {
        'recentMaintenance.0': { $exists: false }
      }
    },
    {
      $project: {
        name: 1,
        assetTag: 1,
        acquisitionDate: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: { dueAssets }
  });
});

const getDepartmentAllocationSummary = catchAsync(async (req, res, next) => {
  const matchStage = { status: 'Active' };
  
  if (req.user.role === 'Department Head') {
    matchStage.department = req.user.department; // Wait, allocations use holderId and holderType.
    // This requires a more complex lookup if holderType === Employee to get the employee's department.
    // For simplicity, let's just group by holderType Department for now, or lookup the user.
  }

  const summary = await Allocation.aggregate([
    { $match: { status: 'Active' } },
    {
      $lookup: {
        from: 'users',
        localField: 'holderId',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    {
      $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'userDetails.department',
        foreignField: '_id',
        as: 'deptFromUser'
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'holderId',
        foreignField: '_id',
        as: 'deptDirect'
      }
    },
    {
      $addFields: {
        effectiveDeptName: {
          $cond: [
            { $eq: ['$holderType', 'Employee'] },
            { $arrayElemAt: ['$deptFromUser.name', 0] },
            { $arrayElemAt: ['$deptDirect.name', 0] }
          ]
        },
        effectiveDeptId: {
          $cond: [
            { $eq: ['$holderType', 'Employee'] },
            { $arrayElemAt: ['$deptFromUser._id', 0] },
            { $arrayElemAt: ['$deptDirect._id', 0] }
          ]
        }
      }
    },
    {
      $match: req.user.role === 'Department Head' ? { effectiveDeptId: req.user.department } : {}
    },
    {
      $group: {
        _id: '$effectiveDeptName',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: { summary }
  });
});

const getBookingHeatmap = catchAsync(async (req, res, next) => {
  const heatmap = await Booking.aggregate([
    { $match: { status: 'Active' } },
    {
      $project: {
        dayOfWeek: { $dayOfWeek: '$startTime' },
        hourOfDay: { $hour: '$startTime' }
      }
    },
    {
      $group: {
        _id: { day: '$dayOfWeek', hour: '$hourOfDay' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: { heatmap }
  });
});

const getDashboardSummary = catchAsync(async (req, res, next) => {
  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Assets Available
  const assetsAvailable = await Asset.countDocuments({ status: 'Available' });

  // 2. Assets Allocated
  const assetsAllocated = await Asset.countDocuments({ status: 'Allocated' });

  // 3. Maintenance Today (Requests raised today or resolved today)
  const maintenanceToday = await MaintenanceRequest.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  // 4. Active Bookings (Ongoing right now)
  // For simplicity, we just count Active bookings that encompass 'now'
  const activeBookings = await Booking.countDocuments({
    status: 'Active',
    startTime: { $lte: now },
    endTime: { $gte: now }
  });

  // 5. Pending Transfers
  // Assuming TransferRequest model exists and is imported (we will use mongoose.model)
  const TransferRequest = mongoose.model('TransferRequest');
  const pendingTransfers = await TransferRequest.countDocuments({ status: 'Requested' });

  // 6. Overdue Returns (Active allocations where expectedReturnDate < now)
  const overdueReturnsList = await Allocation.find({
    status: 'Active',
    expectedReturnDate: { $lt: now }
  }).populate('asset', 'name assetTag').populate('holderId', 'name');

  // 7. Upcoming Returns (Active allocations where expectedReturnDate is in the next 7 days)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingReturnsList = await Allocation.find({
    status: 'Active',
    expectedReturnDate: { $gte: now, $lte: nextWeek }
  }).populate('asset', 'name assetTag').populate('holderId', 'name');

  res.status(200).json({
    success: true,
    data: {
      counts: {
        assetsAvailable,
        assetsAllocated,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturns: upcomingReturnsList.length,
        overdueReturns: overdueReturnsList.length
      },
      lists: {
        overdueReturns: overdueReturnsList,
        upcomingReturns: upcomingReturnsList
      }
    }
  });
});

module.exports = {
  getAssetUtilization,
  getMaintenanceFrequency,
  getMaintenanceDue,
  getDepartmentAllocationSummary,
  getBookingHeatmap,
  getDashboardSummary
};
