const express = require('express');
const pickem1Controller = require('../controllers/pickem1Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), pickem1Controller.getAllPicks)
  .post(pickem1Controller.createPick)
  .patch(pickem1Controller.betPredictionResolver);

router.route('/user').post(pickem1Controller.getUsersPicks);

router.route('/filtered').get(pickem1Controller.getAllFilteredPicks);

router.route('/:id').get(pickem1Controller.getPick);

module.exports = router;
