require('../utils/dns-fix');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/theprink';

let isConnected = false;

/**
 * Strip credentials before logging. A mongodb+srv:// URI embeds the username
 * and password, so printing it raw leaks them into stdout, log files and any
 * log aggregator.
 */
function redact(uri) {
  return String(uri).replace(/\/\/[^@/]+@/, '//***:***@');
}

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log(`[DATABASE] Connected to MongoDB at ${redact(MONGODB_URI)}`);
  } catch (err) {
    // Logged, not fatal: the process stays up so the health endpoint can
    // report the outage rather than crash-looping.
    console.error('[DATABASE CONNECT ERROR]', err.message);
  }
}

module.exports = { connectDB, MONGODB_URI, redact };
