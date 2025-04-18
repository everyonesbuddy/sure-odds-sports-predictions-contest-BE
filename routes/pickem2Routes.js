const express = require('express');
const pickem2Controller = require('../controllers/pickem2Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(pickem2Controller.getAllPicks)
  .post(pickem2Controller.createPick)
  .patch(pickem2Controller.betPredictionResolver);

router.route('/user').post(pickem2Controller.getUsersPicks);

router.route('/filtered').get(pickem2Controller.getAllFilteredPicks);

router.route('/:id').get(pickem2Controller.getPick);

module.exports = router;
