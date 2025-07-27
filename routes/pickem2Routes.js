const express = require('express');
const pickem2Controller = require('../controllers/pickem2Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/getPicksForPredicter')
  .get(pickem2Controller.getAllPicks)
  .patch(pickem2Controller.betPredictionResolver);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), pickem2Controller.getAllPicks)
  .post(pickem2Controller.createPick);

router.route('/user').post(pickem2Controller.getUsersPicks);

router
  .route('/user/unfiltered')
  .post(pickem2Controller.getUsersUnfilteredPicks);

router.route('/filtered').get(pickem2Controller.getAllFilteredPicks);

router.route('/:id').get(pickem2Controller.getPick);

module.exports = router;
