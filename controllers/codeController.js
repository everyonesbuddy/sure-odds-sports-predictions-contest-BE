const factoryController = require('./factoryController');
const Code = require('../models/codeModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllCodes = factoryController.getAll(Code);

exports.getCode = factoryController.getOne(Code);

exports.createCodes = catchAsync(async (req, res, next) => {
  const amount = req.body.amount;
  const codes = Array.from({ length: amount }, () => ({
    code: Code.generateRandomCode(),
    isSent: false,
    isUsed: false,
  }));

  // Store the created documents
  const createdCodes = await Code.insertMany(codes);

  // Respond with the results (consider limiting response size)
  res.status(201).json({
    status: 'success',
    results: createdCodes.length,
    data: createdCodes,
  });
});

exports.updateCode = factoryController.updateOne(Code);

exports.deleteCode = factoryController.deleteOne(Code);

exports.checkCode = catchAsync(async (req, res, next) => {
  const code = req.body.code;
  const doc = await Code.findOne({ code });

  if (!doc || doc.isUsed === true) {
    return next(new AppError('Invalid or already used code.', 400));
  }

  doc.isUsed = true;
  await doc.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    doc,
  });
});
