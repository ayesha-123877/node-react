const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PhoneAttempt = require("./models/PhoneAttempt");
const { processNumbers } = require("./app"); // import processNumbers()

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
const MONGO_URI = "mongodb://127.0.0.1:27017/phone_api_db";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected (server.js)"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API: Lookup SIM
app.get("/api/lookup/:sim", async (req, res) => {
  try {
    const sim = req.params.sim;
    const record = await PhoneAttempt.findOne({ phone_number: sim });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "SIM not found in database",
      });
    }

    res.json({
      success: true,
      sim: record.phone_number,
      owner: record.full_name || "N/A",
      cnic: record.cnic || "N/A",
      address: record.address || "N/A",
      status: "Active",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Server error",
      details: err.message,
    });
  }
});

// Start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");

  // run script automatically when server starts
  processNumbers();
});
