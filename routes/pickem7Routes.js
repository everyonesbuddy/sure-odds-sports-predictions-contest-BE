const express = require('express');
const pickem7Controller = require('../controllers/pickem7Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/getPicksForPredicter')
  .get(pickem7Controller.getAllPicks)
  .patch(pickem7Controller.betPredictionResolver);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), pickem7Controller.getAllPicks)
  .post(pickem7Controller.createPick);

router.route('/user').post(pickem7Controller.getUsersPicks);

router
  .route('/user/unfiltered')
  .post(pickem7Controller.getUsersUnfilteredPicks);

router.route('/filtered').get(pickem7Controller.getAllFilteredPicks);

router.route('/:id').get(pickem7Controller.getPick);

module.exports = router;
