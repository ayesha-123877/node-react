const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require("cheerio");

puppeteer.use(StealthPlugin());

let browser = null;

// ====== PARSER FUNCTIONS (Define FIRST before using in WEBSITES) ======

// Parser: SimOwnerDetails
function parseSimOwnerDetails(htmlContent, phone) {
  const $ = cheerio.load(htmlContent);
  const resultCard = $(".result-card");

  console.log(`    Parsing SimOwnerDetails HTML...`);
  console.log(`   Found ${resultCard.length} result cards`);

  if (resultCard.length === 0) {
    const infoMessage = $(".info").text().trim();
    if (infoMessage) {
      console.log(`    Info message: ${infoMessage}`);
    }
    return null;
  }

  const firstCard = resultCard.first();
  const fields = firstCard.find(".field");

  console.log(`   Found ${fields.length} fields`);

  if (fields.length >= 4) {
    const fullName = fields.eq(0).find("div").last().text().trim() || null;
    const cnic = fields.eq(2).find("div").last().text().trim() || null;
    const address = fields.eq(3).find("div").last().text().trim() || null;

    console.log(`   Name: ${fullName}, CNIC: ${cnic}`);

    if (fullName && cnic && fullName !== "" && cnic !== "") {
      return { full_name: fullName, cnic, address };
    }
  }

  return null;
}

// Parser: CNIC.PK - Enhanced with exact selectors from actual site
function parseCnicPk(htmlContent, phone) {
  const $ = cheerio.load(htmlContent);
  
  console.log(`    Parsing CNIC.PK HTML...`);
  
  let fullName = null;
  let cnic = null;
  let address = null;

  // EXACT METHOD: Look for data-label attributes (confirmed from screenshot)
  $('td[data-label]').each((i, elem) => {
    const label = $(elem).attr('data-label');
    const text = $(elem).text().trim();
    
    if (label === 'Name' && !fullName) {
      // Extract text from span inside
      fullName = $(elem).find('span').text().trim() || text;
      if (fullName) console.log(`    Found Name: ${fullName}`);
    }
    
    if (label === 'CNIC' && !cnic) {
      cnic = text;
      if (cnic) console.log(`    Found CNIC: ${cnic}`);
    }
    
    if (label === 'ADDRESS' && !address) {
      address = text;
      if (address) console.log(`    Found Address: ${address}`);
    }
  });

  // Fallback Method 1: Look in table rows with data-row-index
  if (!fullName || !cnic) {
    $('tr[data-row-index]').each((i, row) => {
      const cells = $(row).find('td');
      
      if (cells.length >= 3) {
        if (!fullName) {
          const nameCell = $(cells[1]); // Second cell is Name
          fullName = nameCell.find('span').text().trim() || nameCell.text().trim();
          if (fullName) console.log(`    Found Name in row: ${fullName}`);
        }
        
        if (!cnic) {
          cnic = $(cells[2]).text().trim(); // Third cell is CNIC
          if (cnic) console.log(`    Found CNIC in row: ${cnic}`);
        }
        
        if (!address && cells.length >= 4) {
          address = $(cells[3]).text().trim(); // Fourth cell is ADDRESS
        }
      }
    });
  }

  // Fallback Method 2: Look in any table with class="table"
  if (!fullName || !cnic) {
    $('table.table tbody tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const cell1 = $(cells[1]).text().trim();
        const cell2 = $(cells[2]).text().trim();
        
        // Check if second cell looks like a name and third looks like CNIC
        if (!fullName && cell1 && /^[a-zA-Z\s]{2,}$/.test(cell1)) {
          fullName = cell1;
          console.log(`   ✓ Found Name in table: ${fullName}`);
        }
        
        if (!cnic && cell2 && /^\d{13}$/.test(cell2)) {
          cnic = cell2;
          console.log(`    Found CNIC in table: ${cnic}`);
        }
      }
    });
  }

  //  Check for "no data" messages, but don't discard if we already have valid data
const bodyText = $('body').text().toLowerCase();
const noDataIndicators = ['no data found', 'not found', 'no record', 'invalid'];
let pageSaysNoData = false;

for (const indicator of noDataIndicators) {
  if (bodyText.includes(indicator)) {
    console.log(`     Page indicates: ${indicator}`);
    pageSaysNoData = true;
    break;
  }
}

// Continue only if name & CNIC exist (even if page says "not found")
if (fullName && cnic) {
  console.log(`    Ignoring page message, valid data extracted`);
  fullName = fullName.replace(/\s+/g, ' ').trim();
  cnic = cnic.replace(/\s+/g, '').trim();

  if (cnic.length >= 13 && /^\d+$/.test(cnic)) {
    return { full_name: fullName, cnic, address: address || null };
  }
}

// If page really has no data
if (pageSaysNoData) {
  return null;
}

  console.log(`    Final Result - Name: ${fullName}, CNIC: ${cnic}, Address: ${address}`);

  // Validate data
  if (fullName && cnic) {
    // Clean up data
    fullName = fullName.replace(/\s+/g, ' ').trim();
    cnic = cnic.replace(/\s+/g, '').trim();
    
    // Validate CNIC format (should be 13 digits)
    if (cnic.length >= 13 && /^\d+$/.test(cnic)) {
      return { 
        full_name: fullName, 
        cnic, 
        address: address || null 
      };
    } else {
      console.log(`     Invalid CNIC format: ${cnic}`);
    }
  }

  console.log(`    Incomplete data - Name: ${!!fullName}, CNIC: ${!!cnic}`);
  return null;
}

// ====== WEBSITE CONFIGURATIONS (After parser functions are defined) ======
const WEBSITES = {
  PRIMARY: {
    name: "CNIC.PK",
    url: "https://cnic.pk/",
    inputSelector: 'input[name="phone"], input[type="text"], input[name="number"]',
    submitSelector: 'button[type="submit"], input[type="submit"]',
    resultSelector: '.result-box, .data-result, .search-result, table.table',
    parseFunction: parseCnicPk
  },
  SECONDARY: {
    name: "SimOwnerDetails",
    url: "https://simownerdetails.org.pk/sim-database/",
    inputSelector: 'input[name="searchdata"]',
    submitSelector: 'button[type="submit"]',
    resultSelector: '.result-card',
    parseFunction: parseSimOwnerDetails
  }
};

// ====== BROWSER FUNCTIONS ======

async function initBrowser() {
  if (!browser) {
    console.log(" Launching browser...");
    
    const launchOptions = {
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled', // Hide automation
        '--window-size=1920x1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    };
    
    browser = await puppeteer.launch(launchOptions);
    
    // Set extra properties to avoid detection
    const pages = await browser.pages();
    if (pages.length > 0) {
      await pages[0].evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });
    }
    
    console.log(" Browser launched successfully");
  }
  return browser;
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    console.log(' Browser closed');
    browser = null;
  }
}

// ====== SEARCH FUNCTIONS ======

async function searchPhoneMultiSource(phone) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(` Multi-Source Search for: ${phone}`);
  console.log('='.repeat(60));

  const sources = ['PRIMARY', 'SECONDARY'];
  
  for (const source of sources) {
    const website = WEBSITES[source];
    
    try {
      console.log(`\n Trying ${website.name}...`);
      
      const result = await searchPhoneWithPuppeteer(phone, website);
      
      // Check if CAPTCHA detected
      if (result.hasCaptcha) {
        console.log(` CAPTCHA Issue: ${website.name} requires human verification`);
        console.log(`   Cannot extract data automatically due to CAPTCHA`);
        continue; // Try next source
      }
      
      if (result.success && result.data) {
        const parsedData = website.parseFunction(result.data, phone);
        
        if (parsedData && parsedData.full_name && parsedData.cnic) {
          console.log(` SUCCESS - Data found on ${website.name}`);
          console.log(`   Name: ${parsedData.full_name}`);
          console.log(`   CNIC: ${parsedData.cnic}`);
          
          return {
            success: true,
            data: parsedData,
            source: website.name
          };
        } else {
          console.log(`  ${website.name} - No valid data found in response`);
          
          // Save HTML for CNIC.PK debugging
          // if (website.name === 'CNIC.PK') {
          //   const fs = require('fs');
          //   const filename = `debug-cnic-${phone}-${Date.now()}.html`;
          //   try {
          //     fs.writeFileSync(filename, result.data);
          //     console.log(`    HTML saved: ${filename}`);
          //   } catch (err) {
          //     // Ignore save errors
          //   }
          // }
        }
      } else {
        console.log(` ${website.name} - Failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error(` ${website.name} - Error: ${error.message}`);
    }
    
    // Wait before trying next source
    if (source !== 'SECONDARY') {
      console.log(` Waiting 3 seconds before trying next source...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n All sources failed. No data found for ${phone}`);
  console.log(`   Note: If CAPTCHA was encountered, manual verification may be required\n`);
  
  return {
    success: false,
    error: "No data found from any source",
    source: null
  };
}

async function searchPhoneWithPuppeteer(phone, website = WEBSITES.PRIMARY) {
  let page = null;
  try {
    const browserInstance = await initBrowser();
    page = await browserInstance.newPage();
    
    page.setDefaultTimeout(30000);
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    console.log(`   Navigating to ${website.url}...`);

    await page.goto(website.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for CAPTCHA before input (less strict check)
    const hasCaptchaInitial = await page.evaluate(() => {
      // Only check for actual CAPTCHA elements, not text
      const captchaIndicators = [
        '.g-recaptcha iframe',
        '#recaptcha iframe',
        'iframe[src*="recaptcha"]',
        'iframe[src*="hcaptcha"]'
      ];
      
      for (const selector of captchaIndicators) {
        const elem = document.querySelector(selector);
        if (elem && elem.offsetHeight > 0) { // Check if visible
          return true;
        }
      }
      
      return false;
    });

    if (hasCaptchaInitial) {
      console.log(`    CAPTCHA detected on page load`);
      await page.close();
      return {
        success: false,
        error: 'CAPTCHA_DETECTED',
        hasCaptcha: true
      };
    }

    // Try to find input
    const selectors = website.inputSelector.split(', ');
    let inputFound = false;
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`    Input field found with selector: ${selector}`);
        website.actualInputSelector = selector;
        inputFound = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!inputFound) {
      throw new Error('No input field found with any selector');
    }
    
    const actualInput = website.actualInputSelector || website.inputSelector.split(', ')[0];
    await page.evaluate((selector) => {
      const input = document.querySelector(selector);
      if (input) input.value = '';
    }, actualInput);
    
    const phoneForSearch = phone.startsWith('0') ? phone.substring(1) : phone;
    
    await page.type(actualInput, phoneForSearch, { delay: 150 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`    Phone number entered: ${phoneForSearch}`);

    // Try to click submit
    const submitSelectors = website.submitSelector.split(', ');
    let submitClicked = false;
    
    for (const selector of submitSelectors) {
      try {
        await page.click(selector);
        console.log(`   Search button clicked`);
        submitClicked = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!submitClicked) {
      throw new Error('Could not click submit button');
    }
    
    try {
      await page.waitForFunction(
        (selector) => {
          return document.querySelector(selector) || 
                 document.querySelector('.info') ||
                 document.querySelector('.error') ||
                 document.querySelector('.no-data') ||
                 document.body.innerText.includes('not found') ||
                 document.body.innerText.includes('No data');
        },
        { timeout: 20000 },
        website.resultSelector
      );
    } catch (waitError) {
      console.log(`    Timeout waiting for results, checking page content...`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for CAPTCHA after submit (less strict)
    const hasCaptchaAfter = await page.evaluate(() => {
      // Only check for visible CAPTCHA iframes
      const captchaIndicators = [
        '.g-recaptcha iframe',
        '#recaptcha iframe',
        'iframe[src*="recaptcha"]',
        'iframe[src*="hcaptcha"]'
      ];
      
      for (const selector of captchaIndicators) {
        const elem = document.querySelector(selector);
        if (elem && elem.offsetHeight > 0) { // Check if visible
          return true;
        }
      }
      
      return false;
    });

    if (hasCaptchaAfter) {
      console.log(`   CAPTCHA appeared after search`);
      await page.close();
      return {
        success: false,
        error: 'CAPTCHA_DETECTED',
        hasCaptcha: true
      };
    }

    const htmlContent = await page.content();
    console.log(`    Results received (${htmlContent.length} bytes)`);
    
    await page.close();

    return { success: true, data: htmlContent, hasCaptcha: false };

  } catch (error) {
    console.error(`    Puppeteer Error: ${error.message}`);
    
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        // Ignore
      }
    }

    return {
      success: false,
      error: error.message,
      hasCaptcha: false
    };
  }
}

// Backward compatibility
function parseHtmlData(htmlContent, phone) {
  return parseSimOwnerDetails(htmlContent, phone);
}

// ====== EXPORTS ======
module.exports = {
  initBrowser,
  closeBrowser,
  searchPhoneMultiSource,
  searchPhoneWithPuppeteer,
  parseHtmlData,
  parseSimOwnerDetails,
  parseCnicPk,
  WEBSITES
};