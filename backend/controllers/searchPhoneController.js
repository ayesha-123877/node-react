const PhoneNumber = require("../models/PhoneNumber");
const PhoneAttempt = require("../models/PhoneAttempt");
const SearchHistory = require("../models/SearchHistory");
const { searchPhoneMultiSource } = require("../services/puppeteerService");

exports.searchPhone = async (req, res) => {
  try {
    const { phone_number } = req.body;
    const user = req.user;

    if (!phone_number || !/^0\d{10}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Must be 11 digits starting with 0.",
      });
    }

    console.log(`\n User ${user?.email || "Unknown"} searching for: ${phone_number}`);

    //  Check if number already exists in database
    let savedPhone = await PhoneNumber.findOne({ phone_number });
    let source = "database";

    if (savedPhone) {
      console.log(` Found in database: ${phone_number}`);
      
      await SearchHistory.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        phone_number,
        full_name: savedPhone.full_name,
        cnic: savedPhone.cnic,
        address: savedPhone.address,
        source,
        status: "found",
        searchedAt: new Date(),
      });

      //  FIXED: Return consistent format
      return res.json({
        success: true,
        data: {
          phone_number: savedPhone.phone_number,
          full_name: savedPhone.full_name,
          cnic: savedPhone.cnic,
          address: savedPhone.address,
        },
        source,
      });
    }

    //  Not in DB — fetch from multiple sources
    console.log(` Fetching from multiple sources: ${phone_number}`);
    const apiResult = await searchPhoneMultiSource(phone_number);

    if (!apiResult.success || !apiResult.data) {
      console.log(" No valid data found from any source.");

      await PhoneAttempt.create({
        phone_number,
        full_name: null,
        cnic: null,
        address: null,
        details: { error: apiResult.error || "All sources failed" },
        raw_html: null,
        attempted_at: new Date(),
      });

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
        searchedAt: new Date(),
      });

      return res.status(404).json({
        success: false,
        message: apiResult.error || "No data found for this number.",
      });
    }

    //  Save new data
    const parsedData = apiResult.data;
    source = apiResult.source;

    console.log(` Data found from ${source}`);
    console.log(`   Name: ${parsedData.full_name}`);
    console.log(`   CNIC: ${parsedData.cnic}`);
    console.log(`   Address: ${parsedData.address || "N/A"}`);

    try {
      console.log(" Saving new record to PhoneNumber collection...");
      savedPhone = await PhoneNumber.create({
        phone_number,
        full_name: parsedData.full_name,
        cnic: parsedData.cnic,
        address: parsedData.address,
        details: JSON.stringify({ ...parsedData, source }),
      });
      console.log(" Successfully saved to PhoneNumber collection");
    } catch (err) {
      console.error(" Failed to save to PhoneNumber:", err.message);
    }

    try {
      await PhoneAttempt.create({
        phone_number,
        full_name: parsedData.full_name,
        cnic: parsedData.cnic,
        address: parsedData.address,
        details: { ...parsedData, source },
        raw_html: null,
        attempted_at: new Date(),
      });
      console.log(" Saved to PhoneAttempt collection");
    } catch (err) {
      console.error(" Failed to save to PhoneAttempt:", err.message);
    }

    await SearchHistory.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      phone_number,
      full_name: parsedData.full_name,
      cnic: parsedData.cnic,
      address: parsedData.address,
      source,
      status: "found",
      searchedAt: new Date(),
    });

    //  Send response with consistent format
    return res.json({
      success: true,
      data: {
        phone_number,
        full_name: parsedData.full_name,
        cnic: parsedData.cnic,
        address: parsedData.address,
      },
      source,
    });
  } catch (error) {
    console.error(" Search phone error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during search",
    });
  }
};