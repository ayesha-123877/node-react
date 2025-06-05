const mongoose = require('mongoose');

const PhoneNumberSchema = new mongoose.Schema({
  id_card: { type: mongoose.Schema.Types.ObjectId, ref: 'IdCard', required: true },
  phone_number: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PhoneNumber', PhoneNumberSchema);
