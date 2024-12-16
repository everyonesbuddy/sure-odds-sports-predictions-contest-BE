const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.route('/signup').post(
  catchAsync(async (req, res, next) => {
    req.body.role = 'admin';
    const admin = await User.create(req.body);
    admin.password = undefined;
    authController.createSendToken(admin, 201, res);
  })
);

module.exports = router;
