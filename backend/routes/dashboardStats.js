const express = require("express");
const router = express.Router();
const PhoneNumber = require("../models/PhoneNumber");
const PhoneAttempt = require("../models/PhoneAttempt");
const { authenticate } = require("../middleware/auth");

// GET /api/dashboard/stats
router.get("/stats", authenticate, async (req, res) => {
  try {
    const totalLookups = await PhoneNumber.countDocuments();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysSearches = await PhoneAttempt.countDocuments({
      attempted_at: { $gte: startOfToday }
    });

    res.json({
      success: true,
      data: {
        totalLookups,
        todaysSearches
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats"
    });
  }
});

module.exports = router;
