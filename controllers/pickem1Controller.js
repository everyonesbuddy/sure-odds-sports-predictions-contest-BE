const Pickem1 = require('../models/pickModel');
const factoryController = require('./factoryController');

exports.createPick = factoryController.createOne(Pickem1);
