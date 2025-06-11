const cheerio = require('cheerio');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');

const IdCard = require('./models/IdCard');
const PhoneNumber = require('./models/PhoneNumber');
const PhoneAttempt = require('./models/PhoneAttempt');

<<<<<<< HEAD
// MongoDB connect
mongoose.connect('mongodb://localhost:27017/phone_api_db')
  .then(() => console.log(' MongoDB connected'))
  .catch(err => console.error(' MongoDB connection error:', err));

// Random PK number generator
=======
const MONGO_HOST = 'mongodb+srv://fatimajaved2828:aY68m1z0r1V6Xn6q@cluster0.gcgy3ia.mongodb.net/phone_api_db?retryWrites=true&w=majority&appName=Cluster0';
const API_SERVICE_URL = 'https://simownerdetails.net.pk/wp-admin/admin-ajax.php';

mongoose.connect(MONGO_HOST)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Generate a random phone number
>>>>>>> 406bf5c (updated app.js)
function generatePhoneNumber() {
  const prefix = ['300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319'];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `0${randomPrefix}${randomNum}`;
}

<<<<<<< HEAD
// Main function
=======
// Generate 1000 unique numbers excluding already attempted
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

// Main Function
>>>>>>> 406bf5c (updated app.js)
async function processNumbers() {
  console.log('Starting number processing...');
  // const phoneNumbers = await generateUniqueNumbers(1000);

  const phoneNumbers = ['03431854867']
  console.log(`generated length of numbers are: ${phoneNumbers.length}`)
  for (const phone of phoneNumbers) {
    // Save attempt first
    const phoneAttemptFound = await PhoneAttempt.findOne({
      phone_number: phone
    });

<<<<<<< HEAD
    if (recent) {
      console.log(`Skipped (already tried): ${phone}`);
=======
    console.log(`${phoneAttemptFound} attempt of given number ${phone}`)
    if (phoneAttemptFound) {
>>>>>>> 406bf5c (updated app.js)
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
          'referer': 'https://simownerdetails.net.pk/',
          'pragma': 'no-cache',
          'cache-control': 'no-cache',
          'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        }
      });

<<<<<<< HEAD
      // Response check
      console.log("API Response:", response.data);
      const data = response.data?.data || response.data; // in case data is nested
=======
      $('#resultContainer').html(response.data); // Add to page
>>>>>>> 406bf5c (updated app.js)

      // Then loop after DOM update
      $('.result-card').each((_, card) => {
        const phone = $(card).find('.field').eq(1).find('div').text().trim();
        console.log(phone);
      });


      // $('.result-card').each(async (_, card) => {
      //  console.log($(card).find('.field').text()); // or your logic    
      //   const fullName = $(card).find('.field label:contains("FULL NAME")').next().text().trim();
      //   const phoneNumber = $(card).find('.field label:contains("PHONE #")').next().text().trim();
      //   const cnic = $(card).find('.field label:contains("CNIC #")').next().text().trim();
      //   const address = $(card).find('.field label:contains("ADDRESS")').next().text().trim();


      //   console.log(fullName, phoneNumber, cnic, address);


      //   if (cnic && fullName && phoneNumber) {
      //     const exists = await PhoneNumber.findOne({
      //       phoneNumber: phoneNumber
      //     });
      //     if (!exists) {
      //       await PhoneNumber.create({
      //         phoneNumber: phoneNumber,
      //         fullName: fullName,
      //         cnic: cnic,
      //         address: address || null
      //       });

      //       console.log(`Saved: ${phoneNumber} for ${fullName}`);
      //     }
      //   } else {
      //     console.log(`Skipping incomplete result in one of the result cards.`);
      //   }
      // });

      // await PhoneAttempt.create({
      //   phone_number: phone
      // });
    } catch (error) {
      console.log(error)
    }


    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait between requests

  }

  console.log('Finished processing 1000 numbers.');
}




processNumbers();
// cron.schedule('0 * * * *', processNumbers);