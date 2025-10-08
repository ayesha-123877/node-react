const SearchHistory = require("../models/SearchHistory");

// Get user's search history
exports.getUserHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.user._id })
      .sort({ searchedAt: -1 })
      .limit(100); // Last 100 searches

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error("❌ History fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch search history"
    });
  }
};

// Get specific history item details
exports.getHistoryItem = async (req, res) => {
  try {
    const history = await SearchHistory.findOne({
      _id: req.params.id,
      userId: req.user._id // Ensure user can only access their own history
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: "History item not found"
      });
    }

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error("❌ History item fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history item"
    });
  }
};

// Delete specific history item
exports.deleteHistoryItem = async (req, res) => {
  try {
    const result = await SearchHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "History item not found"
      });
    }

    res.json({
      success: true,
      message: "History item deleted successfully"
    });
  } catch (error) {
    console.error("❌ History delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete history item"
    });
  }
};

// Clear all history for user
exports.clearAllHistory = async (req, res) => {
  try {
    const result = await SearchHistory.deleteMany({ userId: req.user._id });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} history items`
    });
  } catch (error) {
    console.error("❌ Clear history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear history"
    });
  }
};