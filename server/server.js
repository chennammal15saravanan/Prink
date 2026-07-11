require('./utils/dns-fix');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { verifyConnection } = require('./config/shopify');
const productRoutes = require('./routes/productRoutes');
const { verifyWebhookHmac, handleProductWebhook } = require('./webhook/productWebhook');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/theprink';

// ── Capture Raw Body for Shopify Webhook HMAC Verification ─────────────────
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// ── Enable CORS ────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// ── Connect to MongoDB ──────────────────────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`[DATABASE] MongoDB Connected Successfully at ${MONGODB_URI}`);
  })
  .catch(err => {
    console.error(`[DATABASE ERROR] MongoDB Connection Failed:`, err.message);
  });

// ── Mount Shopify Product Routes ───────────────────────────────────────────
app.use('/api', productRoutes);

// ── Mount Shopify Product Webhooks ─────────────────────────────────────────
app.post('/api/webhooks/products', verifyWebhookHmac, handleProductWebhook);

// ── Root Endpoint Friendly Message ─────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>THE PRINK Shopify Integration API</title>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f9fafb; margin: 0; color: #1f2937; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; }
          h1 { color: #db2777; margin-top: 0; }
          p { line-height: 1.5; color: #4b5563; }
          a { display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background-color: #db2777; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: background-color 0.2s; }
          a:hover { background-color: #be185d; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>THE PRINK Shopify Integration API</h1>
          <p>This is the backend API server. To view the user interface, please open the frontend application:</p>
          <a href="http://localhost:3000">Go to Frontend (Port 3000)</a>
        </div>
      </body>
    </html>
  `);
});

// ── Health Check Endpoint ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'THE PRINK Shopify Integration API'
  });
});

// ── Error Handling Middleware ──────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// ── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`
  ╔═════════════════════════════════════════════════════════════════╗
  ║   THE PRINK — Shopify Sync Server                               ║
  ║   Running on http://localhost:${PORT}                            ║
  ╚═════════════════════════════════════════════════════════════════╝
  `);
  
  // Verify connection to Shopify Admin API on start
  await verifyConnection();
});

module.exports = app;
