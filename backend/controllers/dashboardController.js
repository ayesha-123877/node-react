const SearchHistory = require("../models/SearchHistory");

// Get dashboard statistics for logged-in user
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Calculate today's date range (start of day)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Count today's searches for this user
    const todaysSearches = await SearchHistory.countDocuments({
      userId: userId,
      searchedAt: { $gte: startOfToday }
    });

    // Count total searches by this user (lifetime)
    const userTotalSearches = await SearchHistory.countDocuments({
      userId: userId
    });

    // Optional: Count successful vs failed searches
    const successfulSearches = await SearchHistory.countDocuments({
      userId: userId,
      status: "found"
    });

    const failedSearches = await SearchHistory.countDocuments({
      userId: userId,
      status: "not_found"
    });

    res.json({
      success: true,
      data: {
        todaysSearches,
        userTotalSearches,
        successfulSearches,
        failedSearches
      }
    });

  } catch (error) {
    console.error(" Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats"
    });
  }
};