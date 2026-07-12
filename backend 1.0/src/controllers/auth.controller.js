const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const { welcomeEmail, otpEmail } = require('../templates/emailTemplates');
const { CLIENT_URL } = require('../config/env');

const signup = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already in use.', 400));
  }

  // Generate Email Verification Token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Force role to Employee
  const newUser = await User.create({
    name,
    email,
    password,
    role: 'Employee',
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiry: verificationTokenExpiry
  });

  // Generate verification URL
  const verifyLink = `${CLIENT_URL}/verify-email/${verificationToken}`;

  // Send Welcome Email
  try {
    await sendEmail({
      to: newUser.email,
      subject: 'Welcome to AssetFlow ERP - Verify Your Email',
      html: welcomeEmail(newUser.name, verifyLink)
    });
  } catch (error) {
    console.error('Failed to send verification email:', error.message);
  }

  // Remove password from output (toJSON transform also handles this, but select('-password') ensures it isn't fetched if needed)
  const safeUser = await User.findById(newUser._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for the verification link.',
    data: {
      user: safeUser
    }
  });
});

const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Verification token is invalid or has expired.', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpiry = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You can now log in.'
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Retrieve user with password included
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (user.status !== 'Active') {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // Generate JWT token
  const token = generateToken({ userId: user._id, role: user.role });

  // Safe user representation (exclude password)
  const safeUser = user.toJSON();

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      token,
      user: safeUser
    }
  });
});

const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Generic success response to prevent email enumeration
  const successResponse = () => {
    res.status(200).json({
      success: true,
      message: 'If that email address exists in our database, an OTP has been sent.'
    });
  };

  if (!user) {
    return successResponse();
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Hash the OTP before storing for security
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  user.passwordResetOTP = hashedOtp;
  user.passwordResetOTPExpiry = otpExpiry;
  await user.save();

  // Send reset OTP email
  try {
    await sendEmail({
      to: user.email,
      subject: 'AssetFlow ERP - Password Reset OTP',
      html: otpEmail(user.name, otp)
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
  }

  return successResponse();
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email, OTP, or OTP expired.', 400));
  }

  // Check OTP expiry
  if (!user.passwordResetOTPExpiry || user.passwordResetOTPExpiry < Date.now()) {
    return next(new AppError('OTP has expired. Please request a new one.', 400));
  }

  // Check OTP matching
  const hashedOtpInput = crypto.createHash('sha256').update(otp).digest('hex');
  if (user.passwordResetOTP !== hashedOtpInput) {
    return next(new AppError('Invalid OTP.', 400));
  }

  // Update password and clear OTP fields
  user.password = newPassword;
  user.passwordResetOTP = null;
  user.passwordResetOTPExpiry = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.'
  });
});

const me = catchAsync(async (req, res, next) => {
  // req.user is loaded fresh from verifyToken middleware
  res.status(200).json({
    success: true,
    message: 'Current user profile retrieved.',
    data: {
      user: req.user
    }
  });
});

module.exports = {
  signup,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  me
};
