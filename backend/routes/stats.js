// backend/routes/stats.js
const express = require("express");
const router = express.Router();
const SimLookup = require("../models/SimLookup"); // apni SIM lookup ki model import karo

// Dashboard stats route
router.get("/stats", async (req, res) => {
  try {
    const totalLookups = await SimLookup.countDocuments();

    // Aaj ki searches (sirf today ki date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySearches = await SimLookup.countDocuments({
      createdAt: { $gte: today }
    });

    // CNIC records ka count (agar alag model hai)
    // const cnicCount = await CNIC.countDocuments();

    res.json({
      success: true,
      stats: {
        totalLookups,
        todaySearches,
        reports: 0, // agar abhi report ka model nahi hai to 0
        cnicRecords: 0 // replace karo apne DB ke hisaab se
      }
    });
  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
