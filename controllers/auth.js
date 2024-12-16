const Auth = require("../models/auth");
import { hashPassword, comparePassword } from "../helpers/auth";
import jwt from "jsonwebtoken";
const stripe = require ("stripe")(process.env.STRIPE_SECRET_KEY);

export const register = async (req, res) => {
  try {
    //validation
    const {firstName, lastName, email, password} = req.body
    if(!firstName || !lastName) {
      return res.json({
        error: "First Name and Last Name is required",
      });
    }
    if(!password || password.lenght < 6) {
      return res.json({
        error: "Password is required and should be 6 characters long",
      });
    }
    const exist = await Auth.findOne({email: email});
    if(exist) {
      return res.json({
        error: "Email is taken"
      });
    }
    //hash password
    const hashedPassword = await hashPassword(password);

    //crete account in stripe
    const customer = await stripe.customers.create({
      email,
    });

    try {
      const auth = await new Auth({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        stripe_customer_id: customer.id,
      }).save();

      //create signed token
    const token = jwt.sign({_id: auth._id}, process.env.JWT_SECRET, { expiresIn: "12h" });

      const {password, ...rest} = auth._doc;
      return res.json({
        token,
        auth: rest,
        expiresIn: 43200
      });
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err)
  }
};

export const login = async (req, res) => {

  try {
    //check email
    const auth = await Auth.findOne({ email: req.body.email });
    if(!auth) {
      return res.json({
        error: "No user found"
      });
    }

    //check password
    const match = await comparePassword(req.body.password, auth.password)
    if(!match) {
      return res.json({
        error: "Wrong password"
      });
    }
    //create signed token
    const token = jwt.sign({_id: auth._id}, process.env.JWT_SECRET, { expiresIn: "12h" });

    const {password, ...rest} = auth._doc;

    res.json({
      token,
      auth: rest,
      expiresIn: 43200
    });
  } catch (err) {
    console.log(err)
  }
}