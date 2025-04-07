const factoryController = require('./factoryController');
const Code = require('../models/codeModel');
const catchAsync = require('../utils/catchAsync');

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
