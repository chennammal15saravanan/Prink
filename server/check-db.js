require('./utils/dns-fix');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('\x1b[31m[ERROR] MONGODB_URI is not defined in your server/.env file.\x1b[0m');
  process.exit(1);
}

console.log(`Testing connection to: ${uri}...`);

mongoose.connect(uri)
  .then(() => {
    console.log('\n\x1b[32m╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   SUCCESS: Connected to MongoDB successfully!                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\x1b[0m\n');
    process.exit(0);
  })
  .catch(err => {
    console.log('\n\x1b[31m╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   FAILED: MongoDB connection failed!                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.error(`Error message: ${err.message}`);
    console.log('\nTroubleshooting Tips:');
    if (uri.includes('xxxxx')) {
      console.log('- It looks like your MONGODB_URI still contains "xxxxx". Please replace "xxxxx" with your actual MongoDB Atlas cluster ID.');
    } else {
      console.log('- Verify that the database username and password in server/.env are correct.');
      console.log('- Double check that your IP address is whitelisted (Network Access -> Allow Access from Anywhere / 0.0.0.0/0).');
    }
    console.log('\x1b[0m');
    process.exit(1);
  });
