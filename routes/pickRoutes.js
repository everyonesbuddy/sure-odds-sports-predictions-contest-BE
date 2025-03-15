const express = require('express');
const pickController = require('./../controllers/pickController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/weeklypickemstore1').post(pickController.createPick);

module.exports = router;
