const express = require('express');
const pickem3Controller = require('../controllers/pickem3Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/getPicksForPredicter')
  .get(pickem3Controller.getAllPicks)
  .patch(pickem3Controller.betPredictionResolver);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), pickem3Controller.getAllPicks)
  .post(pickem3Controller.createPick);

router.route('/user').post(pickem3Controller.getUsersPicks);

router
  .route('/user/unfiltered')
  .post(pickem3Controller.getUsersUnfilteredPicks);

router.route('/filtered').get(pickem3Controller.getAllFilteredPicks);

router.route('/:id').get(pickem3Controller.getPick);

module.exports = router;
