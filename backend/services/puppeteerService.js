const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require("cheerio");

puppeteer.use(StealthPlugin());

const WEBSITE_URL = process.env.WEBSITE_URL || "https://simownerdetails.org.pk/sim-database/";
let browser = null;

// Initialize browser
async function initBrowser() {
  if (!browser) {
    console.log("🚀 Launching browser...");
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
    console.log("✅ Browser launched successfully");
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

    console.log(`📡 Navigating to website for ${phone}...`);

    await page.goto(WEBSITE_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForSelector('input[name="searchdata"]', { timeout: 10000 });
    
    const phoneForSearch = phone.startsWith('0') ? phone.substring(1) : phone;
    
    console.log(`⌨️  Typing phone number: ${phoneForSearch}`);
    await page.type('input[name="searchdata"]', phoneForSearch, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`🔍 Clicking search button...`);
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
    console.log(`✅ Results received, HTML length: ${htmlContent.length}`);
    
    await page.close();

    return { success: true, data: htmlContent };

  } catch (error) {
    console.error(`❌ Puppeteer Error for ${phone}:`, error.message);
    
    if (page) {
      await page.close();
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Parse HTML data
function parseHtmlData(htmlContent, phone) {
  const $ = cheerio.load(htmlContent);
  const resultCard = $(".result-card");

  let fullName = null;
  let cnic = null;
  let address = null;

  if (resultCard.length === 0) {
    console.log(`❌ No result card found for ${phone}`);
    return null;
  }

  const firstCard = resultCard.first();
  const fields = firstCard.find(".field");

  console.log(`📊 Found ${fields.length} fields in result card`);

  if (fields.length >= 4) {
    fullName = fields.eq(0).find("div").last().text().trim() || null;
    cnic = fields.eq(2).find("div").last().text().trim() || null;
    address = fields.eq(3).find("div").last().text().trim() || null;
  }

  if (fullName && cnic) {
    console.log(`✅ Parsed data - Name: ${fullName}, CNIC: ${cnic}`);
    return {
      full_name: fullName,
      cnic: cnic,
      address: address
    };
  }

  console.log(`⚠️  Data incomplete for ${phone}`);
  return null;
}

// Close browser
async function closeBrowser() {
  if (browser) {
    await browser.close();
    console.log('🔒 Browser closed');
    browser = null;
  }
}

module.exports = {
  initBrowser,
  searchPhoneWithPuppeteer,
  parseHtmlData,
  closeBrowser
};