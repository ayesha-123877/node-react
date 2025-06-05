const mongoose = require('mongoose');

const PhoneAttemptSchema = new mongoose.Schema({
  phone_number: { type: String, required: true },
  attempted_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PhoneAttempt', PhoneAttemptSchema);
