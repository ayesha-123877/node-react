const mongoose = require('mongoose');

const IdCardSchema = new mongoose.Schema({
  cnic: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});

module.exports = mongoose.model('IdCard', IdCardSchema);
