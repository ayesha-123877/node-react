const mongoose = require('mongoose');

const phoneAttemptSchema = new mongoose.Schema({
  phone_number: { type: String, required: true },
  attempted_at: { type: Date, default: Date.now },

  // New fields to store parsed data from API
  full_name: { type: String, default: null },
  cnic: { type: String, default: null },
  address: { type: String, default: null },

  // raw parsed key/value object (useful for debugging & future fields)
  details: { type: mongoose.Schema.Types.Mixed, default: {} },

  // store full HTML response if you want to debug later
  raw_html: { type: String, default: null }
});

module.exports = mongoose.model('PhoneAttempt', phoneAttemptSchema);
