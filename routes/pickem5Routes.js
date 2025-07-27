const express = require('express');
const pickem5Controller = require('../controllers/pickem5Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/getPicksForPredicter')
  .get(pickem5Controller.getAllPicks)
  .patch(pickem5Controller.betPredictionResolver);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), pickem5Controller.getAllPicks)
  .post(pickem5Controller.createPick);

router.route('/user').post(pickem5Controller.getUsersPicks);

router
  .route('/user/unfiltered')
  .post(pickem5Controller.getUsersUnfilteredPicks);

router.route('/filtered').get(pickem5Controller.getAllFilteredPicks);

router.route('/:id').get(pickem5Controller.getPick);

module.exports = router;
