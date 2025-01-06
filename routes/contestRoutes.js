const express = require('express');
const authController = require('../controllers/authController');
const contestController = require('../controllers/contestController');

const router = express.Router();

router.use(authController.protect);

router.route('/register').post(contestController.register);
router
  .route('/check-if-registered')
  .post(contestController.checkIfRegistered);

module.exports = router;
