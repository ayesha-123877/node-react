// app.js
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const IdCard = require('./models/IdCard');
const PhoneNumber = require('./models/PhoneNumber');
const PhoneAttempt = require('./models/PhoneAttempt');

// ✅ MongoDB connect
mongoose.connect('mongodb://localhost:27017/phone_api_db')
  .then(() => console.log(' MongoDB connected'))
  .catch(err => console.error(' MongoDB connection error:', err));

// ✅ Random PK number generator
function generatePhoneNumber() {
  const prefix = ['300','301','302','303','304','305','306','307','308','309','310','311','312','313','314','315','316','317','318','319'];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `${randomPrefix}${randomNum}`;
}

// ✅ Main function
async function processNumbers() {
  let bulk = 100;
  let processed = 0;

  while (processed < bulk) {
    const phone = generatePhoneNumber();

    // check attempt under 30 days
    const recent = await PhoneAttempt.findOne({
      phone_number: phone,
      attempted_at: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    if (recent) {
      console.log(`⏩ Skipped (already tried): ${phone}`);
      continue;
    }

    // Attempt save 
    await PhoneAttempt.create({ phone_number: phone });

    try {
      const response = await axios.get('https://simownerdetails.net.pk/wp-admin/admin-ajax.php', {
        params: {
          action: 'get_number_data',
          get_number_data: `searchdata=${phone}`
        },
        headers: {
          'accept': '*/*',
          'accept-language': 'en-PK,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'no-cache',
          'local-cache': 'yes',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'referer': 'https://simownerdetails.net.pk/',
          'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"'
        }
      });

      // Response check
      console.log("📦 API Response:", response.data);
      const data = response.data?.data || response.data; // in case data is nested

      if (data?.cnic && data?.name) {
        let idCard = await IdCard.findOne({ cnic: data.cnic });
        if (!idCard) {
          idCard = await IdCard.create({ cnic: data.cnic, name: data.name });
        }

        await PhoneNumber.create({ id_card: idCard._id, phone_number: phone });
        console.log(`Saved: ${phone} for ${data.name}`);
      } else {
        console.log(`No valid data for ${phone}`);
      }

      processed++;

    } catch (error) {
      console.error(`Failed for ${phone}:`, error.message);
    }

    // 2 second wait
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('Finished 100 numbers.');
}

processNumbers();

cron.schedule('0 * * * *', processNumbers);
