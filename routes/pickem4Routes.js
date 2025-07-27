const express = require('express');
const pickem4Controller = require('../controllers/pickem4Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/getPicksForPredicter')
  .get(pickem4Controller.getAllPicks)
  .patch(pickem4Controller.betPredictionResolver);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), pickem4Controller.getAllPicks)
  .post(pickem4Controller.createPick);

router.route('/user').post(pickem4Controller.getUsersPicks);

router
  .route('/user/unfiltered')
  .post(pickem4Controller.getUsersUnfilteredPicks);

router.route('/filtered').get(pickem4Controller.getAllFilteredPicks);

router.route('/:id').get(pickem4Controller.getPick);

module.exports = router;
