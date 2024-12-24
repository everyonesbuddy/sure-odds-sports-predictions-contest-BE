const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const factoryController = require('./factoryController');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendMail = require('../utils/sendMail');
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      user,
      token,
    },
  });
};
exports.createSendToken = createSendToken;

exports.signUp = catchAsync(async (req, res, next) => {
  const filteredBody = factoryController.filterObj(req.body, 'role');
  const user = await User.create(filteredBody);

  user.password = undefined;
  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError('Please provide both email and password', 401)
    );
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePasswords(password, user.password))) {
    return next(new AppError('Invalid email or password!', 400));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in. Please log in to access this route',
        401
      )
    );
  }
  // Verify Token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // Check if user attached to token still exists
  const user = await User.findById(decoded.id).select('+password');

  if (!user) {
    return next(
      new AppError('There is no user attached to this token', 401)
    );
  }
  // Check if user changed their password recently
  if (user.checkIfPasswordChanged(decoded.iat)) {
    return next(
      new AppError(
        'This user has changed their password since token issuance. Please login agin!',
        401
      )
    );
  }

  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You don't have permission to perform this action",
          403
        )
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new AppError('There is no user with that email address', 404)
    );
  }

  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  console.log(resetUrl);
  const message = `Forgot password? submit a PATCH request with your password and passwordConfrim to this url: ${resetUrl}. If you didn't forget your password please ignore this email.`;

  try {
    sendMail({
      email,
      subject: 'Your Password Reset Token (valid for 10 min)',
      message,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('Email failed to send, please try again later', 500)
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Email sent successfully!',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  await user.save({ validateBeforeSave: true });

  createSendToken(user, 200, res);
});
