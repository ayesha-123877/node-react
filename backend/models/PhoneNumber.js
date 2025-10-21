const mongoose = require("mongoose");

const phoneNumberSchema = new mongoose.Schema(
  {
    phone_number: { type: String, required: true, unique: true },
    full_name: { type: String, default: null },
    cnic: { type: String, default: null },
    address: { type: String, default: null },
    details: { type: Object, default: {} }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhoneNumber", phoneNumberSchema);
