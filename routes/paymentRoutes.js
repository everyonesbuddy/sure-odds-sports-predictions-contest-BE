const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Create checkout session
router.post(
  '/create-checkout-session',
  paymentController.createCheckoutSession
);

module.exports = router;
