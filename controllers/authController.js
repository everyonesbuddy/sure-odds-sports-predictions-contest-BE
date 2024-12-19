const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const factoryController = require('./factoryController');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
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
