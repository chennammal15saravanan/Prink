require('../utils/dns-fix');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/theprink';

/**
 * Strip credentials before logging. A mongodb+srv:// URI embeds the username
 * and password, so printing it raw leaks them into stdout, log files and any
 * log aggregator.
 */
function redact(uri) {
  return String(uri).replace(/\/\/[^@/]+@/, '//***:***@');
}

// Cached connection promise - shared across serverless invocations in same container
let connectionPromise = null;

async function connectDB() {
  // If already fully connected, return immediately
  if (mongoose.connection.readyState === 1) return;

  // If a connection attempt is already in progress, wait for it
  if (connectionPromise) return connectionPromise;

  // Start a new connection with serverless-friendly options
  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferCommands: true,
  }).then(() => {
    console.log(`[DATABASE] Connected to MongoDB at ${redact(MONGODB_URI)}`);
  }).catch(err => {
    console.error('[DATABASE CONNECT ERROR]', err.message);
    connectionPromise = null; // reset so next request can retry
    throw err;
  });

  return connectionPromise;
}

module.exports = { connectDB, MONGODB_URI, redact };
