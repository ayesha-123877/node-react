const express = require("express");
const router = express.Router();
const cheerio = require("cheerio");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const PhoneNumber = require("./models/PhoneNumber");
const PhoneAttempt = require("./models/PhoneAttempt");

puppeteer.use(StealthPlugin());

const WEBSITE_URL = "https://simownerdetails.org.pk/sim-database/";

// Global browser instance
let browser = null;

// Initialize browser
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

// Search phone with Puppeteer
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

    console.log(`Navigating to website for ${phone}...`);
    
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

// Parse HTML and extract data
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

// Route 1: Check if number exists in database
router.get("/lookup/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    if (!/^\d{11}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Must be 11 digits."
      });
    }

    const phoneData = await PhoneNumber.findOne({ phone_number: phone });

    if (phoneData) {
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

    return res.status(404).json({
      success: false,
      message: "Number not found in database"
    });

  } catch (error) {
    console.error("Database lookup error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Route 2: Search phone using Puppeteer (if not in DB)
router.post("/search-phone", async (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number || !/^\d{11}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Must be 11 digits."
      });
    }

    // Check if already exists
    const exists = await PhoneNumber.findOne({ phone_number });
    if (exists) {
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

    // Fetch using Puppeteer
    console.log(`Fetching data for ${phone_number} using Puppeteer...`);
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

      return res.status(404).json({
        success: false,
        message: "Failed to fetch data"
      });
    }

    // Parse the HTML
    const parsedData = parseHtmlData(apiResult.data, phone_number);

    if (!parsedData) {
      // Save attempt with no data
      await PhoneAttempt.create({
        phone_number,
        full_name: null,
        cnic: null,
        address: null,
        details: {},
        raw_html: apiResult.data,
        attempted_at: new Date()
      });

      return res.status(404).json({
        success: false,
        message: "No data found for this number"
      });
    }

    // Save to database
    const savedPhone = await PhoneNumber.create({
      phone_number,
      full_name: parsedData.full_name,
      cnic: parsedData.cnic,
      address: parsedData.address,
      details: JSON.stringify(parsedData)
    });

    // Save to attempts
    await PhoneAttempt.create({
      phone_number,
      full_name: parsedData.full_name,
      cnic: parsedData.cnic,
      address: parsedData.address,
      details: parsedData,
      raw_html: apiResult.data,
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

// Cleanup on server shutdown
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
    console.log('Browser closed');
  }
  process.exit(0);
});

module.exports = router;