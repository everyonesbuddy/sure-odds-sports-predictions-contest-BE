const express = require('express');
const pickem1Controller = require('../controllers/pickem1Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/').post(pickem1Controller.createPick);

module.exports = router;
