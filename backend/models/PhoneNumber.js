const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
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


