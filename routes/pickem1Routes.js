const express = require('express');
const pickem1Controller = require('../controllers/pickem1Controller');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(pickem1Controller.getAllPicks)
  .post(pickem1Controller.createPick)
  .patch(pickem1Controller.betPredictionResolver);

router.route('/:id').get(pickem1Controller.getPick);

module.exports = router;
