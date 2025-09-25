const cheerio = require('cheerio');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');

const IdCard = require('./models/IdCard');
const PhoneNumber = require('./models/PhoneNumber');
const PhoneAttempt = require('./models/PhoneAttempt');

// === MongoDB Connection ===
// Use local MongoDB for now to avoid DNS SRV errors
const MONGO_URI = "mongodb://127.0.0.1:27017/phone_api_db";

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// === API Service URL ===
const API_SERVICE_URL = 'https://simownerdetails.net.pk/wp-admin/admin-ajax.php';

// === Generate random phone number ===
function generatePhoneNumber() {
  const prefix = [
    '300', '301', '302', '303', '304', '305',
    '306', '307', '308', '309', '310', '311',
    '312', '313', '314', '315', '316', '317',
    '318', '319'
  ];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `0${randomPrefix}${randomNum}`;
}

// === Generate unique numbers ===
async function generateUniqueNumbers(count) {
  const attempted = await PhoneAttempt.find({}, 'phone_number');
  const attemptedSet = new Set(attempted.map(p => p.phone_number));

  const uniqueNumbers = new Set();
  while (uniqueNumbers.size < count) {
    const number = generatePhoneNumber();
    if (!attemptedSet.has(number)) {
      uniqueNumbers.add(number);
    }
  }
  return [...uniqueNumbers];
}

// === Main Processing Function ===
async function processNumbers() {
  console.log('Starting number processing...');

  const phoneNumbers = await generateUniqueNumbers(1000);
  // const phoneNumbers = ['03431854867'];
  console.log(`Generated ${phoneNumbers.length} number(s)`);

  for (const phone of phoneNumbers) {
    const phoneAttemptFound = await PhoneAttempt.findOne({ phone_number: phone });
    if (phoneAttemptFound) {
      console.log(`Skipped (already tried): ${phone}`);
      continue;
    }

    try {
      const response = await axios.get(API_SERVICE_URL, {
        params: {
          action: 'get_number_data',
          get_number_data: `searchdata=${phone}`
        },
        headers: {
          'accept': '*/*',
          'referer': 'https://simownerdetails.org.pk/',
          'pragma': 'no-cache',
          'cache-control': 'no-cache',
          'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        }
      });

      console.log("API Response received");

      // ✅ Parse HTML with Cheerio
      const $ = cheerio.load(response.data);
      $('.result-card').each((_, card) => {
        const phoneResult = $(card).find('.field').eq(1).find('div').text().trim();
        console.log("Extracted phone:", phoneResult);
      });

      // Save phone attempt
      await PhoneAttempt.create({ phone_number: phone });

    } catch (error) {
      console.error("API error:", error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); // wait between requests
  }

  console.log('Finished processing numbers.');
}

// Run immediately
processNumbers();

// Or schedule with cron if needed
// cron.schedule('0 * * * *', processNumbers);
