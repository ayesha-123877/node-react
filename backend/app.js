const cheerio = require("cheerio");
const mongoose = require("mongoose");
const axios = require("axios");
const Redis = require("ioredis");

const IdCard = require("./models/IdCard");
const PhoneNumber = require("./models/PhoneNumber");
const PhoneAttempt = require("./models/PhoneAttempt");

const MONGO_URI = "mongodb://127.0.0.1:27017/phone_api_db";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(" MongoDB connection error:", err));

const redis = new Redis(); // default 127.0.0.1:6379
redis.on("connect", () => console.log(" Redis connected"));
redis.on("error", (err) => console.error(" Redis error:", err));

const API_SERVICE_URL =
  "https://simownerdetails.net.pk/wp-admin/admin-ajax.php";

// ---- Helper: safely stringify HTML ----
function safeHtml(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  try {
    return data.toString(); // e.g. Cheerio objects
  } catch {
    return "[unserializable response]";
  }
}

// ---- Generate random phone numbers ----
function generatePhoneNumber() {
  const prefix = [
    "300",
    "301",
    "302",
    "303",
    "304",
    "305",
    "306",
    "307",
    "308",
    "309",
    "310",
    "311",
    "312",
    "313",
    "314",
    "315",
    "316",
    "317",
    "318",
    "319",
  ];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
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

async function processNumbers() {
  console.log("Starting number processing...");

  // 1) Generate and cache 100 numbers
  const phoneNumbers = await generateAndCacheNumbers();

  for (const phone of phoneNumbers) {
    // 2) Check if already in DB
    const exists = await PhoneNumber.findOne({ phone_number: phone });
    if (exists) {
      console.log(`Skipped (already exists in DB): ${phone}`);
      continue;
    }

    try {
      // 3) Call API
      console.log(`Calling API for ${phone}...`);
      const response = await axios.get(API_SERVICE_URL, {
        params: {
          action: "get_number_data",
          get_number_data: `searchdata=${phone}`,
        },
        headers: {
          accept: "*/*",
          referer: "https://simownerdetails.org.pk/",
          "cache-control": "no-cache",
        },
      });

      // 4) Parse response
      const $ = cheerio.load(response.data);
      const resultCard = $(".result-card");

      let fullName = null;
      let cnic = null;
      let address = null;

      if (resultCard.length === 0) {
        console.log(`No result found for ${phone}`);
      } else {
        fullName =
          resultCard.find(".field").eq(0).find("div").text().trim() || null;
        const phoneResult =
          resultCard.find(".field").eq(1).find("div").text().trim() || null;
        cnic =
          resultCard.find(".field").eq(2).find("div").text().trim() || null;
        address =
          resultCard.find(".field").eq(3).find("div").text().trim() || null;

        // 5) Save in PhoneNumber collection
        await PhoneNumber.create({
          phone_number: phone,
          details: {
            full_name: fullName,
            cnic: cnic,
            address: address,
            phone: phoneResult,
          },
        });

        console.log(
          `Saved ${phone} with details: ${fullName}, ${cnic}, ${address}`
        );
      }

      // 6) Always log attempt
      await PhoneAttempt.create({
        phone_number: phone,
        full_name: fullName,
        cnic: cnic,
        address: address,
        details: { full_name: fullName, cnic, address },
        raw_html: safeHtml(response.data),
        attempted_at: new Date(),
      });
    } catch (error) {
      console.error(`API error for ${phone}:`, error.message);

      // Still log attempt with nulls
      await PhoneAttempt.create({
        phone_number: phone,
        full_name: null,
        cnic: null,
        address: null,
        details: {},
        raw_html: safeHtml(error?.response?.data),
        attempted_at: new Date(),
      });
    }

    // 7) Wait 5 seconds before next call
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("Finished processing numbers.");
}

// Run immediately
processNumbers();
