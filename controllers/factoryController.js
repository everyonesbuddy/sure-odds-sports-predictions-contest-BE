const catchAsync = require('../utils/catchAsync');

const filterObj = (obj, ...unWantedProps) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (!unWantedProps.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.filterObj = filterObj;
exports.getAll = (model) => {
  return catchAsync(async (req, res) => {
    const docs = await model.find();

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: docs,
    });
  });
};

exports.createOne = (model) => {
  return catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(req.body, 'role');
    req.body = filteredBody;

    const doc = await model.create(req.body);

    if (model === User) {
      doc.password = undefined;
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });
};
