const ActivityLog = require('../models/ActivityLog.model');
const catchAsync = require('../utils/catchAsync');

const getActivityLogs = catchAsync(async (req, res, next) => {
  const { actor, action, entityType, from, to, page = 1, limit = 20 } = req.query;

  const query = {};
  if (actor) query.actor = actor;
  if (action) query.action = { $regex: action, $options: 'i' };
  if (entityType) query.entityType = entityType;

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const logs = await ActivityLog.find(query)
    .populate('actor', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: { logs }
  });
});

module.exports = {
  getActivityLogs
};
