require('./utils/dns-fix');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./db/connection');

// Import modular routes
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const productRoutes = require('./routes/product.routes');
const skuRoutes = require('./routes/sku.routes');
const designRoutes = require('./routes/design.routes');
const templateRoutes = require('./routes/template.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const printerRoutes = require('./routes/printer.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const paymentRoutes = require('./routes/payment.routes');
const addressRoutes = require('./routes/address.routes');
const notificationRoutes = require('./routes/notification.routes');
const settingsRoutes = require('./routes/settings.routes');
const uploadRoutes = require('./routes/upload.routes');
const couponRoutes = require('./routes/coupon.routes');
const userRoutes = require('./routes/user.routes');
const customerRoutes = require('./routes/customer.routes');

const publicUploadRoutes = require('./routes/publicUpload.routes');

const shopifyRoutes = require('./routes/shopify.routes');
const webhookRoutes = require('./webhooks/shopify.webhooks');


const app = express();
const PORT = process.env.PORT || 5000;

// Global Request Logger Middleware
app.use((req, _res, next) => {
  console.log(`[REQUEST LOG] ${new Date().toISOString()} | Method: ${req.method} | Path: ${req.originalUrl}`);
  next();
});

// Security headers. crossOriginResourcePolicy is relaxed so the separate
// frontend origins can load /uploads images; CSP is left to the frontend hosts.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Enable CORS. `credentials` only has meaning with an explicit origin list;
// combining it with '*' is rejected by browsers, so allowed origins are
// configurable and default to the local app ports.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Same-origin/server-to-server requests send no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
}));

// Body Parsers with Raw Body Capture (Needed for Shopify Webhook HMAC Signature verification)
app.use(express.json({ limit: '500mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Webhook & API Routes
app.use('/api', webhookRoutes); // Mounts POST /api/webhooks/shopify
app.use('/api/public', publicUploadRoutes); // Token-authenticated customer upload portal
app.use('/api/shopify', shopifyRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/skus', skuRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/settings', settingsRoutes);
// Both spellings are mounted: the admin editor calls /api/uploads while other
// callers use /api/upload. One router serves both rather than 404-ing one.
app.use('/api/upload', uploadRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  // readyState 1 === connected. Reporting it lets a load balancer detect a
  // database outage instead of routing traffic to an instance that 500s.
  const mongoose = require('mongoose');
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    database: dbUp ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
    service: 'THE PRINK API Server'
  });
});

// Root Endpoint
app.get('/', (_req, res) => {
  res.send('<h1>THE PRINK API Server</h1><p>API is running cleanly and modularly.</p>');
});

app.get('/api/product-configs', (_req, res) => {
  res.json({ success: true, configs: {} });
});


// Error Handling Middleware.
// Internal 5xx details are logged but never returned: a raw message can carry
// file paths, connection strings or driver internals. Deliberate 4xx errors
// keep their message because they are written for the user.
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  console.error('[SERVER ERROR]', req.method, req.originalUrl, err.stack || err.message);

  if (status >= 500) {
    return res.status(status).json({
      success: false,
      error: 'Something went wrong on our side. Please try again.'
    });
  }
  res.status(status).json({ success: false, error: err.message || 'Request failed' });
});

// A rejected promise with no handler must not take the process down mid-request.
process.on('unhandledRejection', reason => {
  console.error('[UNHANDLED REJECTION]', reason);
});

// Connect DB & Start Server
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  THE PRINK — Express Backend Server`);
      console.log(`  Server running on http://localhost:${PORT}`);
      console.log(`  Webhook Endpoint: POST http://localhost:${PORT}/api/webhooks/shopify`);
      console.log(`======================================================\n`);
    });
  });
}

module.exports = app;


