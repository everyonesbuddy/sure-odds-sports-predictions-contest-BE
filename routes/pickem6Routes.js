const express = require('express');
const pickem6Controller = require('../controllers/pickem6Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/getPicksForPredicter')
  .get(pickem6Controller.getAllPicks)
  .patch(pickem6Controller.betPredictionResolver);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), pickem6Controller.getAllPicks)
  .post(pickem6Controller.createPick);

router.route('/user').post(pickem6Controller.getUsersPicks);

router
  .route('/user/unfiltered')
  .post(pickem6Controller.getUsersUnfilteredPicks);

router.route('/filtered').get(pickem6Controller.getAllFilteredPicks);

router.route('/:id').get(pickem6Controller.getPick);

module.exports = router;
