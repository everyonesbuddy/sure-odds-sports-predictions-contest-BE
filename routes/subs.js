import express from "express";
const requireSignin = require("../middlewares/index");

const router = express.Router();

import {
  prices,
  createSubscription,
  subscriptionStatus,
  subscriptions,
  customerPortal,
} from "../controllers/subs";

router.get("/prices", prices);
router.post("/create-subscription", requireSignin, createSubscription);
router.get("/subscription-status", requireSignin, subscriptionStatus);
router.get("/subscriptions", requireSignin, subscriptions);
router.get("/customer-portal", requireSignin, customerPortal);

module.exports = router;
