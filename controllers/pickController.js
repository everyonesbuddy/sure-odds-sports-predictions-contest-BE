const Pick = require('./../models/pickModel');
const factoryController = require('./factoryController');

exports.createPick = factoryController.createOne(Pick);
