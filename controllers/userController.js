const factoryController = require('./factoryController');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = factoryController.getAll(User);
exports.getUser = factoryController.getOne(User);
exports.createUser = factoryController.createOne(User);
exports.updateUser = factoryController.updateOne(User);
exports.deleteUser = factoryController.deleteOne(User);

// exports.updatePassword = catchAsync(async (req, res, next) => {
//   const { oldPassword, newPassword, passwordConfirm } = req.body;
// });
