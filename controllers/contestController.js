const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.register = catchAsync(async (req, res, next) => {
  const { id } = req.body;

  if (!id) {
    if (process.env.NODE_ENV === 'development') {
      return next(new AppError('The contest does not have an id', 400));
    } else {
      return next(
        new AppError(
          'There was a problem registering for this contest, Please try again later',
          400
        )
      );
    }
  }

  // Add payment logic here

  const user = await User.findById(req.user._id);

  user.registeredContests.push({ id, isPayed: true });
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.checkIfRegistered = catchAsync(async (req, res, next) => {
  const { id } = req.body;

  if (!id) {
    if (process.env.NODE_ENV === 'development') {
      return next(new AppError('The contest does not have an id', 400));
    } else if (process.env.NODE_ENV === 'production') {
      return next(
        new AppError(
          'There was a problem with this contest, Please try again later',
          400
        )
      );
    }
  }

  const user = await User.findById(req.user._id);

  const isRegistered = user.registeredContests.some((con) => {
    return con.id === id;
  });

  res.status(200).json({
    status: 'success',
    isRegistered,
  });
});
