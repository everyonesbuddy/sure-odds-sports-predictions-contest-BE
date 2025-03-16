const Pickem1 = require('../models/pickModel');
const factoryController = require('./factoryController');

exports.createPick = factoryController.createOne(Pickem1);
exports.getAllPicks = factoryController.getAll(Pickem1);
exports.getPick = factoryController.getOne(Pickem1);
