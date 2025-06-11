const factoryController = require('./factoryController');
const authController = require('./authController');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllUsers = factoryController.getAll(User);
exports.getUser = factoryController.getOne(User);
exports.createUser = factoryController.createOne(User);
exports.updateUser = factoryController.updateOne(User);
exports.deleteUser = factoryController.deleteOne(User);
exports.setUserId = factoryController.setId(User);

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { oldPassword, newPassword, passwordConfirm } = req.body;
  if (!(await user.comparePasswords(oldPassword, user.password))) {
    return next(new AppError('old password is incorrect!', 400));
  }

  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;

  await user.save({ validateBeforeSave: true });

  authController.createSendToken(user, 200, res);
});

exports.registerForContest = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const { name, accessCodeUsed, startDate, endDate } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        registeredContests: { name, accessCodeUsed, startDate, endDate },
      },
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: user,
  });
});
