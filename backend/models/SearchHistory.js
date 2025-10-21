const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },
    phone_number: {
      type: String,
      required: true,
      index: true
    },
    full_name: {
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
    },
    source: {
  type: String,
  enum: ["database", "api", "lookup", "CNIC.PK", "SimOwnerDetails"],
  default: "lookup",
},
    status: {
      type: String,
      enum: ["found", "not_found"],
      default: "found",
      index: true
    },
    errorMessage: {
      type: String,
      default: null
    },
    searchedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
searchHistorySchema.index({ userId: 1, searchedAt: -1 });
searchHistorySchema.index({ phone_number: 1, userId: 1 });

module.exports = mongoose.model("SearchHistory", searchHistorySchema);