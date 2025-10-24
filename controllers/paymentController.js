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

  // Ensure price is a number
  const priceInNaira = Number(price);
  if (isNaN(priceInNaira)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid price',
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'ngn', // Naira
          product_data: {
            name: `Entry for ${contestName} (₦${priceInNaira})`,
          },
          unit_amount: Math.round(priceInNaira * 100), // NGN → kobo
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

// ✅ Stripe Webhook — triggered when payment is successful
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, contestName, startDate, endDate } = session.metadata;

    try {
      const user = await User.findById(userId);
      if (user) {
        // ✅ Add contest with a placeholder access code
        const newContest = {
          name: contestName,
          accessCodeUsed: `STRIPE-${Date.now()}`, // Placeholder value
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        };

        user.registeredContests.push(newContest);
        await user.save();
        console.log(
          `✅ Contest "${contestName}" added for user ${user.email}`
        );
      }
    } catch (err) {
      console.error('Error updating user after payment:', err.message);
    }
  }

  res.status(200).json({ received: true });
};
