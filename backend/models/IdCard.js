const mongoose = require('mongoose');

const idCardSchema = new mongoose.Schema({
  cnic: { type: String, unique: true },
  name: String,
  phone_numbers: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('IdCard', idCardSchema);

