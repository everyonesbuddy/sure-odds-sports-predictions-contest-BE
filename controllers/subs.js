const Auth = require("../models/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const prices = async (req, res) => {
  const prices = await stripe.prices.list();
  res.json(prices.data);
};

export const createSubscription = async (req, res) => {
  try {
    const auth = await Auth.findById(req.body.auth._id);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: req.body.id,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 3,
      },
      customer: auth.stripe_customer_id,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });
    console.log("checkout session", session);
    res.json(session.url);
  } catch (err) {
    console.log(err);
  }
};

export const subscriptionStatus = async (req, res) => {
  try {
    const auth = await Auth.findById(req.query._id);
    const subscriptions = await stripe.subscriptions.list({
      customer: auth.stripe_customer_id,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    const updated = await Auth.findByIdAndUpdate(
      req.query._id,
      {
        subscriptions: subscriptions.data,
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.log(err);
  }
};

export const subscriptions = async (req, res) => {
  try {
    const auth = await Auth.findById(req.query._id);
    const subscriptions = await stripe.subscriptions.list({
      customer: auth.stripe_customer_id,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    res.json(subscriptions);
  } catch (err) {
    console.log(err);
  }
};

export const customerPortal = async (req, res) => {
  try {
    const auth = await Auth.findById(req.query._id);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: auth.stripe_customer_id,
      return_url: process.env.STRIPE_SUCCESS_URL,
    });
    res.json(portalSession.url);
  } catch (err) {
    console.log(err);
  }
};
