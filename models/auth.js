const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const authSchema = mongoose.Schema({
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  email: { type: String, required: true, unique: true, lowercase:true},
  password: { type: String, required: true},
  stripe_customer_id: {type: String},
  subscriptions: {type: Array}
});

authSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Auth", authSchema);