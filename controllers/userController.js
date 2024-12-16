const factoryController = require('./factoryController');
const User = require('../models/userModel');

exports.createUser = factoryController.createOne(User);
exports.getAllUsers = factoryController.getAll(User);
