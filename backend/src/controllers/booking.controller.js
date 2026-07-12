const Booking = require('../models/Booking.model');
const Asset = require('../models/Asset.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { hasOverlap } = require('../utils/bookingOverlap');
const { logActivity, notifyUser } = require('../utils/activityLogger');

const createBooking = catchAsync(async (req, res, next) => {
  const { resourceId, startTime, endTime, purpose, department } = req.body;

  // Validate times
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) {
    return next(new AppError('endTime must be after startTime', 400));
  }
  if (start < new Date()) {
    return next(new AppError('startTime cannot be in the past', 400));
  }

  // Verify Asset exists and isBookable
  const asset = await Asset.findById(resourceId);
  if (!asset) {
    return next(new AppError('Resource not found', 404));
  }
  if (!asset.isBookable) {
    return next(new AppError('This asset is not marked as bookable', 409));
  }

  // Handle department logic: only Department Head can book on behalf of department
  let finalDepartment = null;
  if (department) {
    if (req.user.role !== 'Department Head' && req.user.role !== 'Admin') {
      return next(new AppError('Only a Department Head or Admin can book on behalf of a department', 403));
    }
    // Assume if they passed it, we trust it or we should verify req.user.department matches, 
    // but for the sake of the hackathon rules, Admin can book for any, Dept Head can book for theirs.
    if (req.user.role === 'Department Head' && req.user.department?.toString() !== department) {
      return next(new AppError('You can only book on behalf of your own department', 403));
    }
    finalDepartment = department;
  }

  // Fetch all non-cancelled existing bookings for that resource overlapping the same day/window
  // To be safe, we just fetch all Active bookings for the resource that end after our new start
  // and start before our new end. The DB query can do rough filtering, but we'll use our pure function
  // for the exact overlap check to meet the requirement.
  const existingBookings = await Booking.find({
    resource: resourceId,
    status: 'Active'
  });

  // Run through exact overlap pure function
  const conflict = hasOverlap(start, end, existingBookings);
  if (conflict) {
    return res.status(409).json({
      success: false,
      message: `This overlaps with an existing booking from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
      data: {
        conflictStart: conflict.startTime,
        conflictEnd: conflict.endTime
      }
    });
  }

  // Create booking
  const booking = await Booking.create({
    resource: resourceId,
    bookedBy: req.user.id,
    department: finalDepartment,
    startTime: start,
    endTime: end,
    purpose
  });

  await logActivity({
    actor: req.user.id,
    action: 'Created Booking',
    entityType: 'Booking',
    entityId: booking._id,
    metadata: { resourceId, startTime, endTime }
  });

  await notifyUser({
    recipient: req.user.id,
    type: 'BookingConfirmed',
    message: `Your booking for asset ${asset.name} is confirmed.`,
    relatedEntity: {
      entityType: 'Booking',
      entityId: booking._id
    },
    emailData: {
      assetName: asset.name,
      startTime: start,
      endTime: end
    }
  });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking }
  });
});

const getResourceBookings = catchAsync(async (req, res, next) => {
  const { assetId } = req.params;
  const { from, to } = req.query;

  const query = { resource: assetId, status: 'Active' };

  if (from || to) {
    query.startTime = {};
    if (from) query.startTime.$gte = new Date(from);
    if (to) query.startTime.$lte = new Date(to);
  }

  const bookings = await Booking.find(query)
    .populate('bookedBy', 'name email')
    .populate('department', 'name')
    .sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    message: 'Resource calendar retrieved',
    data: { bookings }
  });
});

const getMyBookings = catchAsync(async (req, res, next) => {
  // Bookings made by current user OR on behalf of their department
  const query = {
    $or: [
      { bookedBy: req.user.id },
      { department: req.user.department }
    ]
  };

  const bookings = await Booking.find(query)
    .populate('resource', 'name assetTag')
    .sort({ startTime: -1 });

  res.status(200).json({
    success: true,
    message: 'My bookings retrieved',
    data: { bookings }
  });
});

const cancelBooking = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { cancelReason } = req.body;

  const booking = await Booking.findById(id);
  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check role authorization
  // Only the original booker, their Department Head, or Admin/Asset Manager can cancel
  const isBooker = booking.bookedBy.toString() === req.user.id;
  const isDeptHead = req.user.role === 'Department Head' && booking.department?.toString() === req.user.department?.toString();
  const isAdminOrManager = ['Admin', 'Asset Manager'].includes(req.user.role);

  if (!isBooker && !isDeptHead && !isAdminOrManager) {
    return next(new AppError('You do not have permission to cancel this booking', 403));
  }

  // Reject if already Cancelled or Completed
  const effective = booking.effectiveStatus;
  if (effective === 'Cancelled') {
    return next(new AppError('Booking is already cancelled', 400));
  }
  if (effective === 'Completed') {
    return next(new AppError('Cannot cancel a completed booking', 400));
  }

  booking.status = 'Cancelled';
  booking.cancelReason = cancelReason;
  await booking.save();

  await logActivity({
    actor: req.user.id,
    action: 'Cancelled Booking',
    entityType: 'Booking',
    entityId: booking._id,
    metadata: { cancelReason }
  });

  await notifyUser({
    recipient: booking.bookedBy,
    type: 'BookingCancelled',
    message: `Your booking has been cancelled. Reason: ${cancelReason || 'None provided'}`,
    relatedEntity: {
      entityType: 'Booking',
      entityId: booking._id
    }
  });

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking }
  });
});

const rescheduleBooking = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { newStartTime, newEndTime } = req.body;

  const booking = await Booking.findById(id);
  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Verify only the original booker can reschedule (or follow similar rules to cancel if needed)
  if (booking.bookedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Only the original booker can reschedule', 403));
  }

  // Only allowed while Upcoming
  if (booking.effectiveStatus !== 'Upcoming') {
    return next(new AppError('Can only reschedule Upcoming bookings', 400));
  }

  const start = new Date(newStartTime);
  const end = new Date(newEndTime);
  if (end <= start) {
    return next(new AppError('newEndTime must be after newStartTime', 400));
  }
  if (start < new Date()) {
    return next(new AppError('newStartTime cannot be in the past', 400));
  }

  // Run overlap validation excluding the booking's own current record
  const existingBookings = await Booking.find({
    resource: booking.resource,
    status: 'Active',
    _id: { $ne: booking._id }
  });

  const conflict = hasOverlap(start, end, existingBookings);
  if (conflict) {
    return res.status(409).json({
      success: false,
      message: `Reschedule overlaps with an existing booking from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
      data: {
        conflictStart: conflict.startTime,
        conflictEnd: conflict.endTime
      }
    });
  }

  booking.startTime = start;
  booking.endTime = end;
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking rescheduled successfully',
    data: { booking }
  });
});

const getAllBookings = catchAsync(async (req, res, next) => {
  const { resource, status, from, to, page = 1, limit = 10 } = req.query;

  const query = {};
  if (resource) query.resource = resource;
  if (status && status === 'Cancelled') {
    query.status = 'Cancelled';
  } else if (status) {
    query.status = 'Active'; // 'status' might be Upcoming/Completed/Ongoing, which requires post-filtering or complex mongo queries
  }

  if (from || to) {
    query.startTime = {};
    if (from) query.startTime.$gte = new Date(from);
    if (to) query.startTime.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  let bookings = await Booking.find(query)
    .populate('resource', 'name assetTag')
    .populate('bookedBy', 'name email')
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // If status is one of the computed ones, filter in memory for hackathon simplicity
  // (In production, use aggregation pipelines to compute effectiveStatus)
  if (status && ['Upcoming', 'Ongoing', 'Completed'].includes(status)) {
    bookings = bookings.filter(b => b.effectiveStatus === status);
  }

  res.status(200).json({
    success: true,
    message: 'All bookings retrieved',
    data: { bookings }
  });
});

const getUpcomingReminders = catchAsync(async (req, res, next) => {
  const { withinMinutes = 60 } = req.query;
  const now = new Date();
  const future = new Date(now.getTime() + parseInt(withinMinutes) * 60000);

  // Status must be Active (effectively Upcoming because start > now)
  // start > now && start <= future
  const bookings = await Booking.find({
    status: 'Active',
    reminderSent: false,
    startTime: {
      $gt: now,
      $lte: future
    }
  }).populate('bookedBy', 'name email').populate('resource', 'name');

  // TODO: wire to a scheduled job (e.g., node-cron) in Prompt 7

  res.status(200).json({
    success: true,
    message: 'Upcoming reminder candidates retrieved',
    data: { bookings }
  });
});

module.exports = {
  createBooking,
  getResourceBookings,
  getMyBookings,
  cancelBooking,
  rescheduleBooking,
  getAllBookings,
  getUpcomingReminders
};
