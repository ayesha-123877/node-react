const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema({
  phone_number: { // match app.js
    type: String,
    required: true,
    unique: true
  },
  details: { // short summary from API
    type: String,
    default: null
  },
  full_name: { // structured parsed field
    type: String,
    default: null
  },
  cnic: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PhoneNumber', phoneNumberSchema);
