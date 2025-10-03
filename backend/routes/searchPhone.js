const express = require("express");
const router = express.Router();
const PhoneNumber = require("../models/PhoneNumber");
const PhoneAttempt = require("../models/PhoneAttempt");
const { authenticate } = require("../middleware/auth");
const { searchPhoneWithPuppeteer, parseHtmlData } = require("../app");

// POST /api/search-phone
router.post("/search-phone", authenticate, async (req, res) => {
  try {
    const { phone_number } = req.body;

    // validate number
    if (!phone_number || !/^\d{11}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Must be 11 digits."
      });
    }

    let savedPhone = await PhoneNumber.findOne({ phone_number });
    let parsedData = null;
    let source = "database";

    // if not in DB → fetch
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
        // log failed attempt also
        await PhoneAttempt.create({
          phone_number,
          attempted_at: new Date(),
          details: { error: apiResult.error }
        });

        return res.status(404).json({
          success: false,
          message: "No data found or failed to fetch"
        });
      }
    }

    // ✅ always log attempt (duplicate bhi chalega)
    await PhoneAttempt.create({
      phone_number,
      full_name: savedPhone.full_name || parsedData?.full_name || null,
      cnic: savedPhone.cnic || parsedData?.cnic || null,
      address: savedPhone.address || parsedData?.address || null,
      details: savedPhone.details || parsedData || null,
      raw_html: null,
      attempted_at: new Date()
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
