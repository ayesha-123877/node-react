const PhoneNumber = require("../models/PhoneNumber");
const PhoneAttempt = require("../models/PhoneAttempt");
const SearchHistory = require("../models/SearchHistory");
const { searchPhoneWithPuppeteer, parseHtmlData } = require("../services/puppeteerService");

// Search phone number (check DB first, then scrape if needed)
exports.searchPhone = async (req, res) => {
  try {
    const { phone_number } = req.body;
    const user = req.user;

    // Validate phone number format
    if (!phone_number || !/^\d{11}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Must be 11 digits."
      });
    }

    // Check if number already exists in database
    let savedPhone = await PhoneNumber.findOne({ phone_number });
    let source = "database";
    let status = "found";

    // If not found in database, scrape from website
    if (!savedPhone) {
      console.log(`📡 Fetching data for ${phone_number} from website...`);
      
      const apiResult = await searchPhoneWithPuppeteer(phone_number);

      if (!apiResult.success) {
        // Save failed attempt
        await PhoneAttempt.create({
          phone_number,
          full_name: null,
          cnic: null,
          address: null,
          details: { error: apiResult.error },
          raw_html: null,
          attempted_at: new Date()
        });

        // Log failed search in history
        await SearchHistory.create({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          phone_number,
          full_name: null,
          cnic: null,
          address: null,
          source: "api",
          status: "not_found",
          searchedAt: new Date()
        });

        return res.status(404).json({
          success: false,
          message: apiResult.error || "Failed to fetch data from website"
        });
      }

      // Parse the scraped HTML data
      const parsedData = parseHtmlData(apiResult.data, phone_number);

      if (!parsedData) {
        // Save attempt with no data found
        await PhoneAttempt.create({
          phone_number,
          full_name: null,
          cnic: null,
          address: null,
          details: {},
          raw_html: apiResult.data,
          attempted_at: new Date()
        });

        // Log in history
        await SearchHistory.create({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          phone_number,
          full_name: null,
          cnic: null,
          address: null,
          source: "api",
          status: "not_found",
          searchedAt: new Date()
        });

        return res.status(404).json({
          success: false,
          message: "No data found for this number"
        });
      }

      // Save to PhoneNumber collection
      savedPhone = await PhoneNumber.create({
        phone_number,
        full_name: parsedData.full_name,
        cnic: parsedData.cnic,
        address: parsedData.address,
        details: JSON.stringify(parsedData)
      });

      // Save to PhoneAttempt for tracking
      await PhoneAttempt.create({
        phone_number,
        full_name: parsedData.full_name,
        cnic: parsedData.cnic,
        address: parsedData.address,
        details: parsedData,
        raw_html: apiResult.data,
        attempted_at: new Date()
      });

      source = "api";
      console.log(` Data saved for ${phone_number}`);
    }

    // Log successful search in SearchHistory
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
      source: source
    });

  } catch (error) {
    console.error("❌ Search phone error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during search"
    });
  }
};