const mongoose = require('mongoose');

const phoneAttemptSchema = new mongoose.Schema({
  phone_number: { type: String, required: true },
  attempted_at: { type: Date, default: Date.now },
  full_name: { type: String, default: null },
  cnic: { type: String, default: null },
  address: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: null },
  raw_html: { type: String, default: null }
});

// ⚠️ koi unique index nahi banayenge
module.exports = mongoose.model('PhoneAttempt', phoneAttemptSchema);
