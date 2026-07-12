const Notification = require('../models/Notification.model');
const catchAsync = require('../utils/catchAsync');

const getMyNotifications = catchAsync(async (req, res, next) => {
  const { isRead, type, page = 1, limit = 10 } = req.query;

  const query = { recipient: req.user.id };
  if (isRead !== undefined) query.isRead = isRead === 'true';
  if (type) query.type = type;

  const skip = (page - 1) * limit;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: { notifications }
  });
});

const markAsRead = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user.id },
    { isRead: true },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: { notification }
  });
});

const markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
