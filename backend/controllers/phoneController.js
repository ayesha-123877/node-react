const PhoneNumber = require("../models/PhoneNumber");
const PhoneAttempt = require("../models/PhoneAttempt");
const SearchHistory = require("../models/SearchHistory");

// Lookup SIM number
exports.lookupSim = async (req, res) => {
  try {
    const sim = req.params.sim;

    // Validate phone number format
    if (!/^\d{11}$/.test(sim)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format. Must be 11 digits."
      });
    }

    // Check in PhoneNumber collection first
    const phoneData = await PhoneNumber.findOne({ phone_number: sim });

    if (phoneData) {
      // Save to search history
      await SearchHistory.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        phone_number: phoneData.phone_number,
        full_name: phoneData.full_name,
        cnic: phoneData.cnic,
        address: phoneData.address,
        source: "database",
        status: "found"
      });

      return res.json({
        success: true,
        data: {
          phone_number: phoneData.phone_number,
          full_name: phoneData.full_name,
          cnic: phoneData.cnic,
          address: phoneData.address
        }
      });
    }

    // Check in PhoneAttempt collection
    const record = await PhoneAttempt.findOne({ phone_number: sim });

    if (record && record.full_name && record.cnic) {
      // Save to search history
      await SearchHistory.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        phone_number: record.phone_number,
        full_name: record.full_name,
        cnic: record.cnic,
        address: record.address,
        source: "database",
        status: "found"
      });

      return res.json({
        success: true,
        data: {
          phone_number: record.phone_number,
          full_name: record.full_name,
          cnic: record.cnic,
          address: record.address
        }
      });
    }

    // Save to history even when not found
    await SearchHistory.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      phone_number: sim,
      full_name: null,
      cnic: null,
      address: null,
      source: "lookup",
      status: "not_found"
    });

    return res.status(404).json({
      success: false,
      error: "Number not found"
    });

  } catch (err) {
    console.error("❌ Lookup error:", err);
    res.status(500).json({
      success: false,
      error: "Server error",
      details: err.message,
    });
  }
};