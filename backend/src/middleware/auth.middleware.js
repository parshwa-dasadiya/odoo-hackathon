const User = require('../models/User.model');
const { verifyToken } = require('../utils/generateToken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const verifyAuthToken = catchAsync(async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // Verify token
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  // Check if user still exists
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // Check if user is active
  if (currentUser.status !== 'Active') {
    return next(new AppError('Your account has been deactivated. Please contact an administrator.', 401));
  }

  // Grant access
  req.user = currentUser;
  next();
});

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

module.exports = {
  verifyToken: verifyAuthToken,
  requireRole
};
