const Pickem1 = require('../models/pickModel');
const factoryController = require('./factoryController');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllPicks = factoryController.getAll(Pickem1);
exports.getPick = factoryController.getOne(Pickem1);
exports.createPick = catchAsync(async (req, res, next) => {
  if (!Array.isArray(req.body)) {
    return next(new AppError(400, 'Request has to be an array'));
  }

  const picks = req.body;

  const resultPicks = await Promise.all(
    picks.map(async (pick) => {
      return Pickem1.create(pick);
    })
  );

  res.status(200).json({
    status: 'success',
    results: resultPicks.length,
    data: resultPicks,
  });
});
