const mongoose = require('mongoose');
const crypto = require('crypto');

const codeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'a code must have the generated code'],
    unique: true,
  },
  isSent: {
    type: Boolean,
    default: false,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});

// Static method to generate code (can be used anywhere)
codeSchema.statics.generateRandomCode = function () {
  return crypto.randomBytes(16).toString('hex');
};

// Instance method for single document creation
codeSchema.methods.generateCode = function () {
  this.code = this.constructor.generateRandomCode();
};
// codeSchema.pre('save', function (next) {
//   if (!this.isNew) return next();
//   this.code = crypto.randomBytes(16).toString('hex');
//   next();
// });

const Code = new mongoose.model('code', codeSchema);
module.exports = Code;
