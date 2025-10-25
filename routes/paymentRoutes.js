const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Stripe expects the raw body for webhook verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook
);

// Create checkout session
router.post(
  '/create-checkout-session',
  paymentController.createCheckoutSession
);

module.exports = router;
