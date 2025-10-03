const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cheerio = require("cheerio");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { body, validationResult } = require('express-validator');

const PhoneAttempt = require("./models/PhoneAttempt");
const PhoneNumber = require("./models/PhoneNumber");
const User = require("./models/User");
const SearchHistory = require("./models/SearchHistory");
const { authenticate, isAdmin, generateToken } = require("./middleware/auth");
const { processNumbers } = require("./app");

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect with detailed logging
const MONGO_URI = "mongodb://127.0.0.1:27017/phone_api_db";
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    // console.log("📁 Database name:", mongoose.connection.name);
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ====== BROWSER SETUP ======
const WEBSITE_URL = "https://simownerdetails.org.pk/sim-database/";
let browser = null;

async function initBrowser() {
  if (!browser) {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
    console.log("Browser launched successfully");
  }
  return browser;
}

async function searchPhoneWithPuppeteer(phone) {
  let page = null;
  try {
    const browserInstance = await initBrowser();
    page = await browserInstance.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    await page.goto(WEBSITE_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForSelector('input[name="searchdata"]', { timeout: 10000 });
    
    const phoneForSearch = phone.startsWith('0') ? phone.substring(1) : phone;
    
    await page.type('input[name="searchdata"]', phoneForSearch, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(
      () => {
        return document.querySelector('.result-card') || 
               document.querySelector('.info');
      },
      { timeout: 15000 }
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    const htmlContent = await page.content();
    await page.close();

    return { success: true, data: htmlContent };

  } catch (error) {
    console.error(`Puppeteer Error for ${phone}:`, error.message);
    
    if (page) {
      await page.close();
    }

    return {
      success: false,
      error: error.message
    };
  }
}

function parseHtmlData(htmlContent, phone) {
  const $ = cheerio.load(htmlContent);
  const resultCard = $(".result-card");

  let fullName = null;
  let cnic = null;
  let address = null;

  if (resultCard.length === 0) {
    return null;
  }

  const firstCard = resultCard.first();
  const fields = firstCard.find(".field");

  if (fields.length >= 4) {
    fullName = fields.eq(0).find("div").last().text().trim() || null;
    cnic = fields.eq(2).find("div").last().text().trim() || null;
    address = fields.eq(3).find("div").last().text().trim() || null;
  }

  if (fullName && cnic) {
    return {
      full_name: fullName,
      cnic: cnic,
      address: address
    };
  }

  return null;
}

// ====== AUTHENTICATION ROUTES ======

// Registration
app.post("/api/auth/register", [
  body("name").trim().isLength({ min: 3, max: 50 }).withMessage("Name must be between 3-50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Invalid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login instead."
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    console.log(`✅ New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: error.message
    });
  }
});

// Login
app.post("/api/auth/login", [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support."
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
      message: "Login successful!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});

// Get current user profile
app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile"
    });
  }
});

// Logout
app.post("/api/auth/logout", authenticate, async (req, res) => {
  try {
    console.log(`✅ User logged out: ${req.user.email}`);
    
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
});

// ====== PROTECTED API ROUTES ======

// ====== PROTECTED API ROUTES ======

// Lookup SIM
app.get("/api/lookup/:sim", authenticate, async (req, res) => {
  try {
    const sim = req.params.sim;

    if (!/^\d{11}$/.test(sim)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format. Must be 11 digits."
      });
    }

    const phoneData = await PhoneNumber.findOne({ phone_number: sim });

    if (phoneData) {
      // Save to search history with user details
      await SearchHistory.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        phone_number: phoneData.phone_number,
        full_name: phoneData.full_name,
        cnic: phoneData.cnic,
        address: phoneData.address,
        source: "database",
        status: "found"
      });

      return res.json({
        success: true,
        data: {
          phone_number: phoneData.phone_number,
          full_name: phoneData.full_name,
          cnic: phoneData.cnic,
          address: phoneData.address
        }
      });
    }

    const record = await PhoneAttempt.findOne({ phone_number: sim });

    if (record && record.full_name && record.cnic) {
      // Save to search history with user details
      await SearchHistory.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        phone_number: record.phone_number,
        full_name: record.full_name,
        cnic: record.cnic,
        address: record.address,
        source: "database",
        status: "found"
      });

      return res.json({
        success: true,
        data: {
          phone_number: record.phone_number,
          full_name: record.full_name,
          cnic: record.cnic,
          address: record.address
        }
      });
    }

    // Save to history even when not found
    await SearchHistory.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      phone_number: sim,
      full_name: null,
      cnic: null,
      address: null,
      source: "lookup",
      status: "not_found"
    });

    return res.status(404).json({
      success: false,
      error: "Number not found"
    });

  } catch (err) {
    console.error("Lookup error:", err);
    res.status(500).json({
      success: false,
      error: "Server error",
      details: err.message,
    });
  }
});

// Search phone
app.post("/api/search-phone", authenticate, async (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number || !/^\d{11}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Must be 11 digits."
      });
    }

    console.log(`🔍 User ${req.user.email} searching for: ${phone_number}`);

    const exists = await PhoneNumber.findOne({ phone_number });
    if (exists) {
      // Save to search history with user details
      await SearchHistory.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        phone_number: exists.phone_number,
        full_name: exists.full_name,
        cnic: exists.cnic,
        address: exists.address,
        source: "database",
        status: "found"
      });

      console.log(`Number Found : ${phone_number}`);
      return res.json({
        success: true,
        data: {
          phone_number: exists.phone_number,
          full_name: exists.full_name,
          cnic: exists.cnic,
          address: exists.address
        },
        source: "database"
      });
    }

    console.log(`Loading ${phone_number}`);
    const apiResult = await searchPhoneWithPuppeteer(phone_number);

    if (!apiResult.success) {
      await PhoneAttempt.create({
        phone_number,
        full_name: null,
        cnic: null,
        address: null,
        details: { error: apiResult.error },
        raw_html: null,
        attempted_at: new Date()
      });

      // Save to history even when API fails
      await SearchHistory.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        phone_number,
        full_name: null,
        cnic: null,
        address: null,
        source: "api",
        status: "not_found",
        errorMessage: apiResult.error
      });

      return res.status(404).json({
        success: false,
        message: "Failed to fetch data"
      });
    }

    const parsedData = parseHtmlData(apiResult.data, phone_number);

    if (!parsedData) {
      await PhoneAttempt.create({
        phone_number,
        full_name: null,
        cnic: null,
        address: null,
        details: {},
        raw_html: apiResult.data,
        attempted_at: new Date()
      });

      // Save to history when data not found
      await SearchHistory.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        phone_number,
        full_name: null,
        cnic: null,
        address: null,
        source: "api",
        status: "not_found"
      });

      return res.status(404).json({
        success: false,
        message: "No data found for this number"
      });
    }

    const savedPhone = await PhoneNumber.create({
      phone_number,
      full_name: parsedData.full_name,
      cnic: parsedData.cnic,
      address: parsedData.address,
      details: JSON.stringify(parsedData)
    });

    await PhoneAttempt.create({
      phone_number,
      full_name: parsedData.full_name,
      cnic: parsedData.cnic,
      address: parsedData.address,
      details: parsedData,
      raw_html: apiResult.data,
      attempted_at: new Date()
    });

    // Save to search history with user details
    await SearchHistory.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      phone_number: savedPhone.phone_number,
      full_name: savedPhone.full_name,
      cnic: savedPhone.cnic,
      address: savedPhone.address,
      source: "api",
      status: "found"
    });

    console.log(`✅ Data saved for: ${phone_number}`);

    return res.json({
      success: true,
      data: {
        phone_number: savedPhone.phone_number,
        full_name: savedPhone.full_name,
        cnic: savedPhone.cnic,
        address: savedPhone.address
      },
      source: "api"
    });

  } catch (error) {
    console.error("Search phone error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during search"
    });
  }
});

// ====== SEARCH HISTORY ROUTES ======

// Get user's search history
app.get("/api/history", authenticate, async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.user._id })
      .sort({ searchedAt: -1 })
      .limit(100); // Last 100 searches

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch search history"
    });
  }
});

// Get specific history item details
app.get("/api/history/:id", authenticate, async (req, res) => {
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
    console.error("History item fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history item"
    });
  }
});

// Delete specific history item
app.delete("/api/history/:id", authenticate, async (req, res) => {
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
    console.error("History delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete history item"
    });
  }
});

// Clear all history for user
app.delete("/api/history", authenticate, async (req, res) => {
  try {
    const result = await SearchHistory.deleteMany({ userId: req.user._id });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} history items`
    });
  } catch (error) {
    console.error("Clear history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear history"
    });
  }
});

// ====== ADMIN ROUTES ======

// Get all users (Admin only)
app.get("/api/admin/users", authenticate, isAdmin, async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});

// Get all search history (Admin only)
app.get("/api/admin/all-history", authenticate, isAdmin, async (req, res) => {
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
    console.error("Admin history fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch search history"
    });
  }
});

// Get statistics (Admin only)
app.get("/api/admin/stats", authenticate, isAdmin, async (req, res) => {
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
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
});

// Cleanup
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

// Start server
const server = app.listen(5000, () => {
  console.log("\n🚀 Server running on http://localhost:5000");
  console.log("📱 SIM Tracker API with Authentication\n");
  
  if (mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB is ready\n");
  }
  
  console.log("🔄 Starting automated number processing...\n");
  processNumbers().catch(err => {
    console.error("Error in processNumbers:", err);
  });
});

module.exports = server;