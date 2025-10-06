const express = require("express");
const router = express.Router();
const PhoneNumber = require("../models/PhoneNumber");
const SearchHistory = require("../models/SearchHistory");
const { authenticate } = require("../middleware/auth");

// GET /api/dashboard/stats
router.get("/stats", authenticate, async (req, res) => {
  try {
    // Total lookups in system (global count)
    const totalLookups = await PhoneNumber.countDocuments();

    // Today's searches for THIS user only
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysSearches = await SearchHistory.countDocuments({
      userId: req.user._id,
      searchedAt: { $gte: startOfToday }
    });

    // Total searches by this user (lifetime)
    const userTotalSearches = await SearchHistory.countDocuments({
      userId: req.user._id
    });

    res.json({
      success: true,
      data: {
        totalLookups,
        todaysSearches,
        userTotalSearches
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