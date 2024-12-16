import express from "express";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

const Auth = require("../models/auth");

import { register, login } from "../controllers/auth";

//new /register
router.post("/register", register);

//new /login to login user
router.post("/login", login);

module.exports = router;
