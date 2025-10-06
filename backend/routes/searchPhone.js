const express = require("express");
const router = express.Router();
const PhoneNumber = require("../models/PhoneNumber");
const SearchHistory = require("../models/SearchHistory");
const { authenticate } = require("../middleware/auth");
const { searchPhoneWithPuppeteer, parseHtmlData } = require("../app");

// POST /api/search-phone
router.post("/search-phone", authenticate, async (req, res) => {
  try {
    const { phone_number } = req.body;
    const user = req.user; // authenticated user from middleware

    // Validate number
    if (!phone_number || !/^\d{11}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Must be 11 digits."
      });
    }

    let savedPhone = await PhoneNumber.findOne({ phone_number });
    let parsedData = null;
    let source = "database";
    let status = "found";
    let errorMessage = null;

    // If not in DB → fetch from API
    if (!savedPhone) {
      const apiResult = await searchPhoneWithPuppeteer(phone_number);

      if (apiResult.success) {
        parsedData = parseHtmlData(apiResult.data, phone_number);

        savedPhone = await PhoneNumber.create({
          phone_number,
          full_name: parsedData.full_name,
          cnic: parsedData.cnic,
          address: parsedData.address,
          details: JSON.stringify(parsedData)
        });

        source = "api";
      } else {
        status = "not_found";
        errorMessage = apiResult.error || "No data found";
        
        // Log failed search in SearchHistory
        await SearchHistory.create({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          phone_number,
          source: "api",
          status: "not_found",
          errorMessage: errorMessage,
          searchedAt: new Date()
        });

        return res.status(404).json({
          success: false,
          message: errorMessage
        });
      }
    }

    // ✅ Log successful search in SearchHistory
    await SearchHistory.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      phone_number: savedPhone.phone_number,
      full_name: savedPhone.full_name,
      cnic: savedPhone.cnic,
      address: savedPhone.address,
      source: source,
      status: "found",
      searchedAt: new Date()
    });

    return res.json({
      success: true,
      data: {
        phone_number: savedPhone.phone_number,
        full_name: savedPhone.full_name,
        cnic: savedPhone.cnic,
        address: savedPhone.address
      },
      source
    });

  } catch (error) {
    console.error("Search phone error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during search"
    });
  }
});

module.exports = router;