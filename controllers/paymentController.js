const Stripe = require('stripe');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Create a Checkout Session
exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const { userId, contestName, price, startDate, endDate } = req.body;

  if (!userId || !contestName || !price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing required fields',
    });
  }

  const priceInNaira = Number(price);
  if (isNaN(priceInNaira)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid price',
    });
  }

  // ✅ Create Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'ngn',
          product_data: {
            name: `Entry for ${contestName}`,
          },
          unit_amount: Math.round(priceInNaira * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      contestName,
      startDate,
      endDate,
    },
    success_url: `${
      process.env.FRONTEND_URL
    }/payment-success?contest=${encodeURIComponent(contestName)}`,
    cancel_url: `${
      process.env.FRONTEND_URL
    }/payment-cancelled?contest=${encodeURIComponent(contestName)}`,
  });

  res.status(200).json({
    status: 'success',
    url: session.url,
  });
});

// ✅ Handle Stripe Webhook
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(
      '⚠️ Webhook signature verification failed:',
      err.message
    );
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Payment completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, contestName, startDate, endDate } = session.metadata;

    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error('❌ User not found:', userId);
        return res.status(200).json({ received: true });
      }

      const alreadyRegistered = user.registeredContests.some(
        (c) => c.name === contestName
      );

      if (!alreadyRegistered) {
        user.registeredContests.push({
          name: contestName,
          accessCodeUsed: `STRIPE-${Date.now()}`,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });

        await user.save();
        console.log(`✅ Added "${contestName}" to ${user.email}`);
      } else {
        console.log(
          `ℹ️ User ${user.email} already registered for "${contestName}"`
        );
      }
    } catch (err) {
      console.error('🔥 Error updating user registration:', err.message);
    }
  }

  res.status(200).json({ received: true });
};
