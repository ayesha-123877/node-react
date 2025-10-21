const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

const IdCard = require("./models/IdCard");
const PhoneNumber = require("./models/PhoneNumber");
const PhoneAttempt = require("./models/PhoneAttempt");

const MONGO_URI = "mongodb://127.0.0.1:27017/phone_api_db";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected (app.js)"))
  .catch((err) => console.error("MongoDB connection error:", err));

const redis = new Redis();
redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err));

const WEBSITE_URL = "https://simownerdetails.org.pk/sim-database/";


// Global browser instance
let browser = null;

// ---- Helper: safely stringify HTML ----
function safeHtml(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  try {
    return data.toString();
  } catch {
    return "[unserializable response]";
  }
}

// ---- Generate random phone numbers ----
function generatePhoneNumber() {
  const prefix = [
    "300", "301", "302", "303", "304", "305", "306", "307", "308", "309",
    "310", "311", "312", "313", "314", "315", "316", "317", "318", "319",
  ];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `0${randomPrefix}${randomNum}`;
}

async function generateAndCacheNumbers() {
  const uniqueNumbers = new Set();

  while (uniqueNumbers.size < 100) {
    uniqueNumbers.add(generatePhoneNumber());
  }

  const numberList = Array.from(uniqueNumbers);
  await redis.set("phone_batch", JSON.stringify(numberList), "EX", 3600);
  console.log(`Stored ${numberList.length} numbers in Redis cache`);

  return numberList;
}

// Initialize browser
async function initBrowser() {
  if (!browser) {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: "new", // Use new headless mode
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

// Close browser
async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    console.log("Browser closed");
  }
}

async function searchPhoneWithPuppeteer(phone) {
  let page = null;
  try {
    const browserInstance = await initBrowser();
    page = await browserInstance.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Extra headers for better bot avoidance
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    console.log(` Navigating to website for ${phone}...`);
    
    // Go to the website
    await page.goto(WEBSITE_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log("✓ Page loaded");

    // Wait for the search input to be visible
    await page.waitForSelector('input[name="searchdata"]', { timeout: 10000 });
    
    console.log("Search input found");

    // Remove leading 0 from phone number (as per website documentation)
    const phoneForSearch = phone.startsWith('0') ? phone.substring(1) : phone;
    
    console.log(`Typing phone number: ${phoneForSearch}`);

    // Type the phone number
    await page.type('input[name="searchdata"]', phoneForSearch, { delay: 100 });

    // Wait a bit for human-like behavior
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("Clicking search button...");

    // Click the search button
    await page.click('button[type="submit"]');

    // Wait for results to load
    console.log(" Waiting for results...");
    
    // Wait for either result card or error message
    await page.waitForFunction(
      () => {
        return document.querySelector('.result-card') || 
               document.querySelector('.info');
      },
      { timeout: 15000 }
    );

    // Wait a bit more to ensure content is fully loaded
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the HTML content
    const htmlContent = await page.content();

    console.log("✓ Results received, HTML length:", htmlContent.length);

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

async function processNumbers() {
  console.log("Starting number processing...");

  try {
    const phoneNumbers = await generateAndCacheNumbers();

    for (let i = 0; i < phoneNumbers.length; i++) {
      const phone = phoneNumbers[i];
      
      const exists = await PhoneNumber.findOne({ phone_number: phone });
      if (exists) {
        console.log(`Skipped (already exists in DB): ${phone}`);
        continue;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing [${i + 1}/${phoneNumbers.length}]: ${phone}`);
      console.log('='.repeat(60));

      const apiResult = await searchPhoneWithPuppeteer(phone);

      if (apiResult.success) {
        const htmlContent = apiResult.data;
        const $ = cheerio.load(htmlContent);

        const resultCard = $(".result-card");
        console.log('Found result cards:', resultCard.length);

        let fullName = null;
        let cnic = null;
        let address = null;
        let phoneResult = null;

        if (resultCard.length === 0) {
          const infoMessage = $(".info").text().trim();
          console.log(` No result found for ${phone}`);
          console.log('Info message:', infoMessage);

          // Check if it's "no data" or some other error
          if (infoMessage.includes("Please Enter") || infoMessage.includes("not found")) {
            console.log(' Number not in database or invalid');
          }
        } else {
          // Parse the data from FIRST result card only (in case of multiple results)
          const firstCard = resultCard.first();
          const fields = firstCard.find(".field");

          console.log(`✓ Found ${fields.length} fields in first result card`);

          // Debug: Print all fields
          fields.each((i, elem) => {
            const label = $(elem).find("div").first().text().trim();
            const value = $(elem).find("div").last().text().trim();
            console.log(`  Field ${i} - ${label}: ${value}`);
          });

          // Extract data based on field positions
          fullName = fields.eq(0).find("div").last().text().trim() || null;
          phoneResult = fields.eq(1).find("div").last().text().trim() || null;
          cnic = fields.eq(2).find("div").last().text().trim() || null;
          address = fields.eq(3).find("div").last().text().trim() || null;

          // Only save if we have actual data
          if (fullName && fullName !== "" && cnic && cnic !== "") {
            // Save to PhoneNumber collection
            await PhoneNumber.create({
              phone_number: phone,
              full_name: fullName,
              cnic: cnic,
              address: address,
              details: JSON.stringify({
                full_name: fullName,
                cnic: cnic,
                address: address,
                phone: phoneResult,
              })
            });

            console.log(`SUCCESS - Data saved for ${phone}`);
            console.log(`  Name: ${fullName}`);
            console.log(`  CNIC: ${cnic}`);
            console.log(`  Address: ${address}`);
          } else {
            console.log(` Data found but incomplete - skipping save`);
          }
        }

        // Save to PhoneAttempt collection (for tracking)
        await PhoneAttempt.create({
          phone_number: phone,
          full_name: fullName,
          cnic: cnic,
          address: address,
          details: { full_name: fullName, cnic, address, phone: phoneResult },
          raw_html: safeHtml(htmlContent),
          attempted_at: new Date(),
        });

      } else {
        // Puppeteer failed
        console.log(`Failed to fetch data for ${phone}`);
        await PhoneAttempt.create({
          phone_number: phone,
          full_name: null,
          cnic: null,
          address: null,
          details: { error: apiResult.error },
          raw_html: null,
          attempted_at: new Date(),
        });
      }

      // Random delay between requests (8-12 seconds for safety)
      const delay = 8000 + Math.random() * 4000;
      console.log(`Waiting ${(delay / 1000).toFixed(1)} seconds before next request...\n`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

  } catch (error) {
    console.error("Fatal error in processNumbers:", error);
  } finally {
    // Close browser when done
    await closeBrowser();
  }

  console.log("\n" + "=".repeat(60));
  console.log("Finished processing all numbers");
  console.log("=".repeat(60));
}


module.exports = { processNumbers };