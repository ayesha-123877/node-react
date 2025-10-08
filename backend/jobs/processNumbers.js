const Redis = require("ioredis");
const PhoneNumber = require("../models/PhoneNumber");
const PhoneAttempt = require("../models/PhoneAttempt");
const { searchPhoneWithPuppeteer, parseHtmlData } = require("../services/puppeteerService");

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

// Helper: safely stringify HTML
function safeHtml(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  try {
    return data.toString();
  } catch {
    return "[unserializable response]";
  }
}

// Generate random Pakistani phone numbers
function generatePhoneNumber() {
  const prefixes = [
    "300", "301", "302", "303", "304", "305", "306", "307", "308", "309",
    "310", "311", "312", "313", "314", "315", "316", "317", "318", "319",
    "320", "321", "322", "323", "324", "330", "331", "332", "333", "334", 
    "335", "336", "337", "340", "341", "342", "343", "344", "345", "346", 
    "347", "348", "349"
  ];
  
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  
  return `0${randomPrefix}${randomNum}`;
}

// Generate and cache unique numbers in Redis
async function generateAndCacheNumbers() {
  const batchSize = parseInt(process.env.BATCH_SIZE) || 100;
  const uniqueNumbers = new Set();

  while (uniqueNumbers.size < batchSize) {
    uniqueNumbers.add(generatePhoneNumber());
  }

  const numberList = Array.from(uniqueNumbers);
  
  try {
    await redis.set("phone_batch", JSON.stringify(numberList), "EX", 3600);
    console.log(`📦 Stored ${numberList.length} numbers in Redis cache`);
  } catch (error) {
    console.error("❌ Redis error:", error.message);
  }

  return numberList;
}

// Main processing function
async function processNumbers() {
  console.log("🔄 Starting number processing...");

  try {
    const phoneNumbers = await generateAndCacheNumbers();
    const delayMin = parseInt(process.env.REQUEST_DELAY_MIN) || 8000;
    const delayMax = parseInt(process.env.REQUEST_DELAY_MAX) || 12000;

    for (let i = 0; i < phoneNumbers.length; i++) {
      const phone = phoneNumbers[i];
      
      // Skip if already exists in database
      const exists = await PhoneNumber.findOne({ phone_number: phone });
      if (exists) {
        console.log(`⏭️  Skipped (already exists): ${phone}`);
        continue;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📱 Processing [${i + 1}/${phoneNumbers.length}]: ${phone}`);
      console.log('='.repeat(60));

      // Scrape data from website
      const apiResult = await searchPhoneWithPuppeteer(phone);

      if (apiResult.success) {
        const htmlContent = apiResult.data;
        const parsedData = parseHtmlData(htmlContent, phone);

        if (parsedData && parsedData.full_name && parsedData.cnic) {
          // Save to PhoneNumber collection
          await PhoneNumber.create({
            phone_number: phone,
            full_name: parsedData.full_name,
            cnic: parsedData.cnic,
            address: parsedData.address,
            details: JSON.stringify(parsedData)
          });

          console.log(`✅ SUCCESS - Data saved for ${phone}`);
          console.log(`   Name: ${parsedData.full_name}`);
          console.log(`   CNIC: ${parsedData.cnic}`);
          console.log(`   Address: ${parsedData.address || 'N/A'}`);
        } else {
          console.log(`⚠️  Data found but incomplete - skipping save`);
        }

        // Save to PhoneAttempt for tracking
        await PhoneAttempt.create({
          phone_number: phone,
          full_name: parsedData?.full_name || null,
          cnic: parsedData?.cnic || null,
          address: parsedData?.address || null,
          details: parsedData || {},
          raw_html: safeHtml(htmlContent),
          attempted_at: new Date()
        });

      } else {
        // Puppeteer failed - save failed attempt
        console.log(`❌ Failed to fetch data for ${phone}`);
        
        await PhoneAttempt.create({
          phone_number: phone,
          full_name: null,
          cnic: null,
          address: null,
          details: { error: apiResult.error },
          raw_html: null,
          attempted_at: new Date()
        });
      }

      // Random delay between requests to avoid detection
      const delay = delayMin + Math.random() * (delayMax - delayMin);
      console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)} seconds before next request...\n`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

  } catch (error) {
    console.error("❌ Fatal error in processNumbers:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Finished processing all numbers");
  console.log("=".repeat(60));
}

module.exports = { processNumbers };