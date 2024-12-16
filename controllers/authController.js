const jwt = require('jsonwebtoken');
const factoryController = require('./factoryController');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

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
