const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a user most have a name'],
    unique: true,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, 'a user must have an email'],
    validate: [validator.isEmail, 'please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must confirm their password'],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
    },
  },
  role: {
    type: String,
    required: [true, 'A user must have a role'],
    default: 'user',
  },
  profilePhoto: {
    type: String,
    default: 'default.jpg',
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

const User = new mongoose.model('User', userSchema);
module.exports = User;
