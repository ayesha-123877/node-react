const User = require("../models/User");
const SearchHistory = require("../models/SearchHistory");
const PhoneNumber = require("../models/PhoneNumber");
const PhoneAttempt = require("../models/PhoneAttempt");

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    console.error("❌ Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// Get all search history (Admin only)
exports.getAllHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find()
      .populate("userId", "name email")
      .sort({ searchedAt: -1 })
      .limit(500);

    res.json({
      success: true,
      data: {
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error("❌ Admin history fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch search history"
    });
  }
};

// Get statistics (Admin only)
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSearches = await SearchHistory.countDocuments();
    const totalNumbers = await PhoneNumber.countDocuments();
    const totalAttempts = await PhoneAttempt.countDocuments();

    const recentSearches = await SearchHistory.find()
      .sort({ searchedAt: -1 })
      .limit(5)
      .populate("userId", "name email");

    const topUsers = await SearchHistory.aggregate([
      {
        $group: {
          _id: "$userId",
          searchCount: { $sum: 1 }
        }
      },
      { $sort: { searchCount: -1 } },
      { $limit: 5 }
    ]);

    // Populate user details for top users
    const populatedTopUsers = await User.populate(topUsers, {
      path: "_id",
      select: "name email"
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalSearches,
        totalNumbers,
        totalAttempts,
        recentSearches,
        topUsers: populatedTopUsers
      }
    });
  } catch (error) {
    console.error("❌ Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
};