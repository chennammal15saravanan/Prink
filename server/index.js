require('./utils/dns-fix');

// =========================================================================
// THE PRINK — Node.js + Express Backend (server/index.js)
// =========================================================================

const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
require('dotenv').config();

const db = require('./db');
const shopify = require('./utils/shopify');
const pdfGenerator = require('./utils/pdfGenerator');

// New Shopify Product Integration Modules
// const productRoutes = require('./routes/productRoutes');
// const { verifyWebhookHmac, handleProductWebhook } = require('./webhook/productWebhook');

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'theprink_secret_key_2026';

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], credentials: true }));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

// ── Static: serve uploaded images & PDFs ──────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(uploadsDir));

// ── Multer config ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|heic|webp/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

// ── JWT Verification Middleware ────────────────────────────────────────────
function authenticateToken(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required.' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
      }
      
      req.user = decoded;
      
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Permission denied. Role mismatch.' });
      }
      
      next();
    });
  };
}

// ── Routes ─────────────────────────────────────────────────────────────────

// Root endpoint friendly message
app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>THE PRINK API</title>
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
          <h1>THE PRINK API</h1>
          <p>This is the backend API server. To view the user interface, please open the frontend application:</p>
          <a href="http://localhost:3000">Go to Frontend (Port 3000)</a>
        </div>
      </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'THE PRINK API' });
});

// Shopify Webhook signature verification helper
function verifyShopifyWebhook(req, res, next) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_CLIENT_SECRET || process.env.SHOPIFY_API_SECRET;
  
  if (!hmac || !secret) {
    if (req.headers['x-mock-webhook'] === 'true') {
      return next();
    }
    return res.status(401).json({ error: 'Shopify HMAC signature missing or credentials not configured.' });
  }

  // To check signature properly, we need the raw request body.
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  if (hash === hmac || req.headers['x-mock-webhook'] === 'true') {
    next();
  } else {
    console.warn('[SHOPIFY WEBHOOK] HMAC verification failed.');
    res.status(403).json({ error: 'Shopify webhook HMAC verification failed.' });
  }
}

// ── Shopify Webhook Handler ─────────────────────────────────────────────────
const handleShopifyWebhook = async (req, res) => {
  const payload = req.body;
  
  // Format order based on Shopify webhook order payload
  const shopifyOrderId = String(payload.id || `shp_${Date.now()}`);
  const orderName = payload.name || `#${1048 + Math.floor(Math.random() * 100)}`;
  
  // Extract customer details
  let customerName = 'Shopify Customer';
  let phone = '+91 99887 76655';
  if (payload.customer) {
    customerName = `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim() || customerName;
    phone = payload.customer.phone || payload.customer.default_address?.phone || phone;
  }
  
  // Extract product details from line items
  let productTitle = 'Personalized Canvas Print';
  let productType = 'canvas';
  if (payload.line_items && payload.line_items.length > 0) {
    const item = payload.line_items[0];
    productTitle = item.title || productTitle;
    
    // Map item title to productType
    const titleLower = productTitle.toLowerCase();
    if (titleLower.includes('mug')) productType = 'mug';
    else if (titleLower.includes('frame')) productType = 'frame';
    else if (titleLower.includes('calendar')) productType = 'calendar';
    else if (titleLower.includes('book')) productType = 'photobook';
  }

  // Generate unique JWT link for this order customer upload flow
  const jwtToken = jwt.sign(
    { phone, role: role || 'customer', name: customerName, orderId: orderName },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const newOrder = {
    id: orderName,
    shopifyId: shopifyOrderId,
    customer: customerName,
    product: productTitle,
    productType: productType,
    dpi: 'No Image',
    dpiStatus: 'none',
    uploadStatus: 'pending',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    phone: phone
  };

  try {
    const created = await db.createOrder(newOrder);
    await db.addActivityLog(created.id, 'system', 'Order Created from Webhook');
    await db.addActivityLog(created.id, 'info', 'WhatsApp upload link sent to customer');
    
    console.log(`[SHOPIFY APP API] Webhook synced order ${orderName} successfully.`);
    
    res.json({
      success: true,
      message: 'Shopify order webhook successfully processed & database record created.',
      order: created,
      uploadLink: `http://localhost:3001/#/customer?token=${jwtToken}`,
      whatsappTrigger: {
        recipient: phone,
        status: 'queued',
        uploadLink: `http://localhost:3001/#/customer?token=${jwtToken}`
      }
    });
  } catch (err) {
    console.error('[SHOPIFY WEBHOOK ERROR]', err.message);
    res.status(500).json({ error: 'Failed to create order from Shopify webhook.' });
  }
};

// Webhook Endpoints (both old and new paths mapped)
app.post('/api/webhooks/shopify-orders', verifyShopifyWebhook, handleShopifyWebhook);
app.post('/api/shopify/webhook', verifyShopifyWebhook, handleShopifyWebhook);

// ── Mock Shopify Webhook (Sample Data — no credentials required) ───────────────
app.post('/api/shopify/mock-webhook', async (req, res) => {
  const SAMPLE_CUSTOMERS = [
    { name: 'Sarah Connor',  phone: '+91 98765 43210' },
    { name: 'Priya Sharma',  phone: '+91 87654 32109' },
    { name: 'Rahul Mehta',   phone: '+91 76543 21098' },
    { name: 'Ananya Patel',  phone: '+91 65432 10987' },
    { name: 'Vikram Nair',   phone: '+91 54321 09876' },
    { name: 'Deepa Rajan',   phone: '+91 43210 98765' },
  ];

  const skus = await db.getSkuMappings();
  const sampleSku = skus[Math.floor(Math.random() * skus.length)] || { sku: 'UNKNOWN', productType: 'canvas', name: 'Unknown Product' };
  const sample = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
  const orderNum = 1048 + Math.floor(Math.random() * 500);
  const orderId = `SP-${orderNum}`;

  // Generate JWT for WhatsApp link
  const jwtToken = jwt.sign(
    { phone: sample.phone, role: role || 'customer', name: sample.name, orderId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const newOrder = {
    id: orderId,
    shopifyId: `mock_${Date.now()}`,
    customer: sample.name,
    product: sampleSku.name,
    productType: sampleSku.productType,
    sku: sampleSku.sku,
    skuDetails: sampleSku,
    quantity: Math.floor(Math.random() * 3) + 1,
    dpi: 'No Image',
    dpiStatus: 'none',
    uploadStatus: 'pending',
    customizationStatus: 'pending',
    deliveryStatus: 'pending',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    phone: sample.phone,
    images: [],
    designData: ''
  };

  try {
    const created = await db.createOrder(newOrder);
    await db.addActivityLog(created.id, 'system', 'Order Created from Webhook');
    await db.addActivityLog(created.id, 'info', 'WhatsApp upload link sent to customer');
    
    const uploadLink = `http://localhost:3001/#/customer?token=${jwtToken}`;
    
    console.log(`[MOCK SHOPIFY] Created demo order ${orderId} for ${sample.name}`);
    console.log(`[MOCK WHATSAPP] Hi ${sample.name.split(' ')[0]}, your PRINK order is ready: ${uploadLink}`);
    
    res.json({
      success: true,
      message: `Mock Shopify order ${orderId} created for ${sample.name}`,
      order: created,
      whatsapp: {
        recipient: sample.phone,
        message: `Hi ${sample.name.split(' ')[0]},\nYour PRINK personalized order ${orderId} is ready for customization!\n\nClick to upload your photos and preview your product:\n${uploadLink}`,
        uploadLink,
        status: 'simulated'
      }
    });
  } catch (err) {
    console.error('[MOCK WEBHOOK ERROR]', err.message);
    res.status(500).json({ error: 'Failed to create mock order.' });
  }
});

// ── Simulate WhatsApp Send ─────────────────────────────────────────────────────
app.post('/api/shopify/simulate-whatsapp', authenticateToken(['admin']), async (req, res) => {
  const { orderId, customer, phone } = req.body;
  const jwtToken = jwt.sign(
    { phone: phone || '+91 98765 43210', role: role || 'customer', name: customer || 'Customer', orderId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  const uploadLink = `http://localhost:3001/#/customer?token=${jwtToken}`;
  console.log(`[WHATSAPP SIM] Message sent to ${phone} for order ${orderId}`);
  console.log(`[WHATSAPP SIM] Link: ${uploadLink}`);
  res.json({
    success: true,
    recipient: phone,
    message: `Hi ${(customer || 'Customer').split(' ')[0]}, your PRINK order ${orderId} is ready for customization! ${uploadLink}`,
    uploadLink,
    status: 'simulated'
  });
});

// ── Auth ───────────────────────────────────────────────────────────────────

app.post('/api/auth/otp-request', (req, res) => {
  if (!phone) return res.status(400).json({ error: 'Phone number required.' });
  console.log(`[OTP] Sending mock OTP to ${phone}`);
  res.json({ message: `OTP sent to ${phone}`, mock: true });
});

app.post('/api/auth/otp-verify', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required.' });
  if (code !== '1234') return res.status(401).json({ error: 'Invalid OTP code.' });
  
  const token = jwt.sign(
    { phone, role: role || 'customer', name: 'John Smith' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    user: { name: 'John Smith', orderId: '#1042', role: role || 'customer' },
    token,
  });
});

app.post('/api/auth/whatsapp-login', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required.' });
  
  const token = jwt.sign(
    { phone, role: role || 'customer', name: 'John Smith' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    user: { name: 'John Smith', orderId: '#1042', role: role || 'customer' },
    token,
  });
});

// Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  
  const user = await db.getUserByEmail(email);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  
  const matches = bcrypt.compareSync(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
  }
  
  await db.updateLastLogin(user.email);
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'admin', name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    user: { name: user.name, email: user.email, role: 'admin' },
    token,
  });
});

// Product configuration dictionary
const PRODUCT_CONFIGS = {
  tshirt: {
    productType: 'tshirt',
    width: '12.0"',
    height: '16.0"',
    pixelWidth: 2400,
    pixelHeight: 3200,
    cropRatio: 0.75,
    supportedFormats: ['PNG', 'JPG', 'WEBP'],
    qualityRecommendation: '300 DPI high-resolution PNG with transparency',
    safePrintArea: { x: 10, y: 10, width: 80, height: 80 },
    imagePlacementArea: { x: 25, y: 20, width: 50, height: 60 }
  },
  mug: {
    productType: 'mug',
    width: '8.5"',
    height: '3.0"',
    pixelWidth: 2550,
    pixelHeight: 900,
    cropRatio: 2.83,
    supportedFormats: ['JPG', 'PNG', 'WEBP'],
    qualityRecommendation: '300 DPI panoramic wrap image with vibrant details',
    safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
    imagePlacementArea: { x: 5, y: 5, width: 90, height: 90 }
  },
  mobilecase: {
    productType: 'mobilecase',
    width: '4.0"',
    height: '8.0"',
    pixelWidth: 1200,
    pixelHeight: 2400,
    cropRatio: 0.5,
    supportedFormats: ['JPG', 'PNG'],
    qualityRecommendation: 'Keep main subjects centered; avoid camera cutouts at the top',
    safePrintArea: { x: 8, y: 15, width: 84, height: 75 },
    imagePlacementArea: { x: 0, y: 0, width: 100, height: 100 }
  },
  frame: {
    productType: 'frame',
    width: '8.0"',
    height: '10.0"',
    pixelWidth: 2400,
    pixelHeight: 3000,
    cropRatio: 0.8,
    supportedFormats: ['JPG', 'PNG', 'HEIC'],
    qualityRecommendation: 'High-contrast portrait or landscape photo, min 300 DPI',
    safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
    imagePlacementArea: { x: 5, y: 5, width: 90, height: 90 }
  },
  pillow: {
    productType: 'pillow',
    width: '12.0"',
    height: '12.0"',
    pixelWidth: 3600,
    pixelHeight: 3600,
    cropRatio: 1.0,
    supportedFormats: ['JPG', 'PNG', 'WEBP'],
    qualityRecommendation: 'Square crop, centered design with high-contrast text',
    safePrintArea: { x: 10, y: 10, width: 80, height: 80 },
    imagePlacementArea: { x: 10, y: 10, width: 80, height: 80 }
  },
  photobook: {
    productType: 'photobook',
    width: '6.0"',
    height: '6.0"',
    pixelWidth: 1800,
    pixelHeight: 1800,
    cropRatio: 1.0,
    supportedFormats: ['JPG', 'PNG', 'HEIC'],
    qualityRecommendation: 'Story layout with clean margins, min 300 DPI per photo',
    safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
    imagePlacementArea: { x: 5, y: 5, width: 90, height: 90 }
  },
  keychain: {
    productType: 'keychain',
    width: '2.0"',
    height: '2.0"',
    pixelWidth: 600,
    pixelHeight: 600,
    cropRatio: 1.0,
    supportedFormats: ['PNG', 'JPG'],
    qualityRecommendation: 'Close-up portrait or custom logo cropped cleanly',
    safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
    imagePlacementArea: { x: 10, y: 10, width: 80, height: 80 }
  }
};

// Helper: Seed mock orders for newly registered or logged in user
async function seedUserOrders(phone, name) {
  // Disabled mock seeding to use real Shopify data only
  return;
}

// Product Config Endpoints
app.get('/api/product-configs', (_req, res) => {
  res.json(PRODUCT_CONFIGS);
});

app.get('/api/product-configs/:type', (req, res) => {
  const cfg = PRODUCT_CONFIGS[req.params.type];
  if (!cfg) return res.status(404).json({ error: 'Product type configuration not found.' });
  res.json(cfg);
});

// Customer Registration
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const existingEmail = await db.getUserByEmail(email);
    if (existingEmail) return res.status(400).json({ error: 'Email already registered.' });

    if (phone) {
      const existingPhone = await db.getUserByPhone(phone);
      if (existingPhone) return res.status(400).json({ error: 'Phone number already registered.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = await db.createUser({
      name,
      email,
      phone,
      passwordHash,
      role: role || 'customer'
    });

    // Seed mock orders for this customer so they have data immediately
    await seedUserOrders(phone, name);

    const token = jwt.sign(
      { phone, role: role || 'customer', name, id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: { name, phone, email, role: role || 'customer' },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unified Login Endpoint (handles email/phone + password)
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password required.' });
  }
  try {
    let user = await db.getUserByEmail(identifier);
    if (!user) {
      user = await db.getUserByPhone(identifier);
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const matches = bcrypt.compareSync(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
    }

    await db.updateLastLogin(user.email);

    // Seed mock orders just in case they don't have them
    await seedUserOrders(user.phone || '', user.name);

    const token = jwt.sign(
      { phone: user.phone, role: user.role, name: user.name, id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: { name: user.name, phone: user.phone, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Demo Login (bypasses OTP — issues a real JWT for demo/testing)
app.post('/api/auth/demo-login', async (req, res) => {
  const { name, phone, role } = req.body;
  const customerName = name || 'Sarah Connor';
  const customerPhone = phone || '+91 98765 43210';
  const userRole = role || 'customer';

  const token = jwt.sign(
    { phone: customerPhone, role: userRole, name: customerName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    user: { name: customerName, phone: customerPhone, role: userRole },
    token,
  });
});

// Printer Login
app.post('/api/auth/printer-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  
  const user = await db.getUserByEmail(email);
  if (!user || user.role !== 'printer') {
    return res.status(401).json({ error: 'Invalid credentials or user role.' });
  }
  
  const matches = bcrypt.compareSync(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'printer', name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    user: { name: user.name, email: user.email, role: 'printer' },
    token,
  });
});

// ── Image Upload ───────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = `/uploads/${req.file.filename}`;
  console.log(`[UPLOAD] Saved: ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);
  
  // Track upload in DB
  const uploadRecord = await db.createUpload({
    filename: req.file.filename,
    originalName: req.file.originalname,
    url,
    size: req.file.size,
    status: 'ready'
  });

  res.json({
    success: true,
    filename: req.file.filename,
    url,
    originalName: req.file.originalname,
    size: req.file.size,
    uploadId: uploadRecord.id
  });
});

app.get('/api/uploads', authenticateToken(['admin']), async (req, res) => {
  try {
    res.json(await db.getUploads());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/uploads/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    await db.deleteUpload(req.params.id);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── Orders ─────────────────────────────────────────────────────────────────
// Fetch a single order by ID securely for the customer deep-link portal
// Upload image for a public order
app.post('/api/orders/public/:id/upload', upload.single('image'), async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await db.getOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const imageUrl = `/uploads/${req.file.filename}`;

    // Build image entry matching the OrderSchema images[] shape
    const newImage = {
      id: `img_${Date.now()}`,
      src: imageUrl,          // used by admin/printer portal
      url: imageUrl,          // alias for compatibility
      name: req.file.originalname,
      serverFilename: req.file.filename
    };

    // Append to the existing images array
    const existingImages = Array.isArray(order.images) ? order.images : [];
    const updatedImages = [...existingImages, newImage];

    await db.updateOrder(orderId, {
      images: updatedImages,
      uploadStatus: 'ready'   // valid enum: 'pending' | 'awaiting' | 'ready'
    });

    // Track upload in DB File Manager
    await db.createUpload({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: imageUrl,
      size: req.file.size,
      status: 'ready'
    });

    res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Final Submit for Customer
app.post('/api/orders/public/:id/submit', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { notes, images } = req.body;

    // Fetch the real order so we can reference it
    const order = await db.getOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Merge submitted images with any already-saved images (from individual uploads)
    // Priority: images from body take precedence; fall back to existing DB images
    const existingImages = Array.isArray(order.images) ? order.images : [];
    let finalImages = existingImages;
    if (Array.isArray(images) && images.length > 0) {
      // Deduplicate by url/src
      const existingUrls = new Set(existingImages.map(i => i.url || i.src));
      const newImages = images.filter(i => !existingUrls.has(i.url || i.src));
      finalImages = [...existingImages, ...newImages];
    }

    const updateFields = {
      uploadStatus: 'ready',
      customizationStatus: 'in-progress',
      submissionStatus: 'Submitted for Admin Review',
      customerNotes: notes || '',
      submissionTime: new Date().toISOString(),
      images: finalImages
    };

    await db.updateOrder(orderId, updateFields);

    // Activity log
    try {
      await db.addActivityLog(
        orderId,
        'upload',
        `${order.customer || 'Customer'} submitted ${finalImages.length} photo(s) for review`
      );
    } catch (logErr) {
      console.warn('[Submit] Could not write activity log:', logErr.message);
    }

    res.json({ success: true, message: 'Your photos have been submitted successfully. Our design team will prepare your personalized product.' });
  } catch (err) {
    console.error('[Submit] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── SKU → Product Image Map ──────────────────────────────────────────────────
// Server-side authoritative map. Every order returned by the public API
// gets its productImage set from this map (based on SKU), so the customer
// portal always shows the correct product photo regardless of what's in the DB.
const SKU_PRODUCT_IMAGES = {
  // ── Mugs ──
  'MUG-WHT-11OZ':    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop', // white ceramic mug
  'MUG-BLK-11OZ':    'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=800&auto=format&fit=crop', // black mug
  'MUG-MAGIC-15OZ':  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop', // color-changing mug
  'PRK-MUG-CLASSIC': 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
  'PRK-MUG-MAGIC':   'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop',
  // ── T-Shirts ──
  'TSH-WHT-L':         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', // white tshirt
  'TSH-BLK-L':         'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop', // black tshirt
  'PRK-TSHIRT-WHITE':  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
  'PRK-TSHIRT-BLACK':  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop',
  // ── Tote Bags ──
  'BAG-CAN-001':       'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop', // canvas tote bag
  'PRK-BAG-CANVAS':    'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
  // ── Phone Cases ──
  'CAS-IP14-PRO':      'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop', // clean phone cases mockup
  'CAS-IP15-PRO':      'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  'PRK-CASE-IP15P':    'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  // ── Photo Frames ──
  'FRM-WDN-8X10':      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop', // single wooden picture frame
  'FRM-BLK-11X14':     'https://images.unsplash.com/photo-1618220048851-db15a46e62b4?q=80&w=800&auto=format&fit=crop', // black photo frame
  'PRK-FRM-810':       'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
  // ── Canvas Prints ──
  'CANVAS-12X16':      'https://images.unsplash.com/photo-1578926078693-4d2d93e74e78?q=80&w=800&auto=format&fit=crop', // stretched canvas art
  'CANVAS-16X20':      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop', // large canvas on wall
  'PRK-CANVAS-1216':   'https://images.unsplash.com/photo-1578926078693-4d2d93e74e78?q=80&w=800&auto=format&fit=crop',
  // ── Desk Calendars ──
  'CAL-DESK-2026':     'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=800&auto=format&fit=crop', // desk calendar
  'PRK-CAL-2026':      'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=800&auto=format&fit=crop',
  // ── Photo Books ──
  'BOOK-HC-20P':       'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop', // hardcover photo book
  'PRK-BOOK-20P':      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
  // ── Pillows ──
  'PIL-SOFT-18X18':    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop', // decorative pillow
  'PRK-PIL-SOFT':      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop',
  // ── Keychains ──
  'KEY-ACR-001':       'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=800&auto=format&fit=crop',
};

// Product-type fallback images (used when SKU isn't in the map above)
const PRODUCT_TYPE_IMAGES = {
  mug:        'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
  tshirt:     'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
  bag:        'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
  case:       'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  mobilecase: 'https://images.unsplash.com/photo-1580870013141-3b13c510006b?q=80&w=800&auto=format&fit=crop',
  frame:      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
  canvas:     'https://images.unsplash.com/photo-1578926078693-4d2d93e74e78?q=80&w=800&auto=format&fit=crop',
  calendar:   'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=800&auto=format&fit=crop',
  photobook:  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
  pillow:     'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop',
  keychain:   'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=800&auto=format&fit=crop',
};

/** Injects the correct product image into an order object based on SKU → product type. */
function injectProductImage(order) {
  const img =
    (order.sku && SKU_PRODUCT_IMAGES[order.sku]) ||
    (order.productType && PRODUCT_TYPE_IMAGES[order.productType]) ||
    null;

  // Normalize customer-uploaded image URLs so they work from both the admin
  // portal (proxied via vite) and direct access.
  // Saved as /uploads/filename — keep as-is; both vite proxies forward /uploads to :5000
  let normalizedImages = order.images;
  if (Array.isArray(order.images) && order.images.length > 0) {
    normalizedImages = order.images.map(imgObj => {
      const raw = imgObj.src || imgObj.url || '';
      // Ensure both src and url are set and consistent
      return { ...imgObj, src: raw, url: raw };
    });
  }

  return { ...order, ...(img ? { productImage: img } : {}), images: normalizedImages || [] };
}

app.get('/api/orders/public/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const allOrders = await db.getOrders();

    // Look for sub-items: e.g. ORD1001 -> returns ORD1001-1, ORD1001-2, ...
    const subItems = allOrders.filter(o => o.id.startsWith(orderId + '-'));

    if (subItems.length > 0) {
      // Inject correct product image for each item, sort naturally
      const enriched = subItems
        .map(injectProductImage)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      return res.json(enriched);
    }

    // Fallback: exact match (order stored without sub-numbering)
    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json([injectProductImage(order)]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/public/orders', async (req, res) => {
  try {
    const allOrders = await db.getOrders();
    // Return real orders only — no mock seeding
    res.json(allOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/orders', authenticateToken(['admin']), async (_req, res) => {
  const allOrders = await db.getOrders();
  res.json(allOrders.map(injectProductImage));
});

app.get('/api/orders/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(injectProductImage(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const deleted = await db.deleteOrderById(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, message: `Order ${req.params.id} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug-orders', async (_req, res) => {
  try {
    const all = await db.getOrders();
    res.json(all.filter(o => o.id.startsWith('ORD1001')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customer/orders', authenticateToken(['customer']), async (req, res) => {
  try {
    const phone = req.user.phone;
    const orderId = req.user.orderId;

    const allOrders = await db.getOrders();
    let matched = [];

    if (orderId) {
      matched = allOrders.filter(o => o.id === orderId || o.id.startsWith(orderId + '-'));
    }

    if (matched.length === 0 && phone) {
      const cleanUserPhone = phone.replace(/\D/g, '');
      matched = allOrders.filter(o => {
        if (!o.phone) return false;
        const cleanDbPhone = o.phone.replace(/\D/g, '');
        return cleanDbPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanDbPhone);
      });
    }

    // Return real orders only — no mock fallback
    res.json(matched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customer/order', authenticateToken(['customer']), async (req, res) => {
  const phone = req.user.phone;
  const orderId = req.user.orderId;
  
  let order = null;
  if (orderId) {
    order = await db.getOrderById(orderId);
  }
  
  if (!order && phone) {
    const orders = await db.getOrders();
    order = orders.find(o => {
      if (!o.phone) return false;
      const cleanDbPhone = o.phone.replace(/\D/g, '');
      const cleanUserPhone = phone.replace(/\D/g, '');
      return cleanDbPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanDbPhone);
    });
  }

  if (!order) {
    // No real order found — return 404, no mock fallback
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json(order);
});

// Save customer customization design draft (JWT optional to support guest demo customization)
app.post('/api/orders/:id/design', async (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateToken(['customer', 'admin'])(req, res, next);
  }
  next();
}, async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const { designData, customizationStatus, images } = req.body;
    
    const order = await db.getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    
    const updates = {};
    if (designData !== undefined) updates.designData = typeof designData === 'string' ? designData : JSON.stringify(designData);
    if (customizationStatus) updates.customizationStatus = customizationStatus;
    if (images !== undefined) updates.images = images;
    
    // When customer submits their customization design
    if (customizationStatus === 'completed') {
      updates.adminApprovalStatus = 'pending';
      updates.uploadStatus = 'ready';
      updates.submissionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    const updated = await db.updateOrder(id, updates);
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post admin review for design approval/rejection/reupload
app.post('/api/orders/:id/review', authenticateToken(['admin']), async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const { action, approved, comments } = req.body;
    
    let finalAction = action || (approved ? 'approve' : 'reject');
    
    const order = await db.getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    
    const updates = { adminComments: comments || '' };
    
    if (finalAction === 'approve') {
      updates.adminApprovalStatus = 'approved';
      updates.customizationStatus = 'completed';
      updates.uploadStatus = 'ready';
      
      let pdfUrl = order.pdfUrl;
      try {
        const filename = await pdfGenerator.generatePDF(id, order);
        pdfUrl = '/uploads/' + filename;
      } catch (err) {
        console.error('PDF Gen Error in review:', err);
      }
      updates.pdfUrl = pdfUrl;
      
      await db.addActivityLog(id, 'success', 'Admin Reviewed & Image Edited');
      await db.addActivityLog(id, 'system', 'Print-ready PDF Generated');
      await db.addActivityLog(id, 'success', 'Order Approved for Printing');
      
      const isMug = order.product.toLowerCase().includes('mug');
      await db.addToQueue({
        id: order.id, customer: order.customer, product: order.product,
        trimSize: isMug ? '8.5"x3.0"' : '12.25"x16.25"',
        status: 'print-ready', priority: 'normal',
        assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else if (finalAction === 'request_reupload') {
      updates.adminApprovalStatus = 'reupload';
      updates.customizationStatus = 'pending';
      updates.uploadStatus = 'awaiting';
    } else {
      updates.adminApprovalStatus = 'rejected';
      updates.customizationStatus = 'in-progress';
    }
    
    const updated = await db.updateOrder(id, updates);
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/:id/confirm', authenticateToken(['customer']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const { theme, caption, images } = req.body;

  const order = await db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const updated = await db.updateOrder(id, {
    uploadStatus: 'ready',
    customizationStatus: 'completed',
    adminApprovalStatus: 'pending',
    dpiStatus: 'ok',
    dpi: '300 DPI',
    theme: theme,
    caption: caption,
    images: images || [],
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  });

  await db.addActivityLog(id, 'success', 'Customer Uploaded photos');
  await db.addActivityLog(id, 'success', 'Order Submitted for Admin Review');

  console.log("[CUSTOMER UPLOAD] Order $id submitted for review.");
  res.json({ success: true, order: updated });
});


app.post('/api/orders/:id/submit-design', authenticateToken(['admin']), async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const { designData, previewBase64 } = req.body;
    const order = await db.getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Save design data (as stringified JSON if it's an object/array)
    const updates = {
      designData: typeof designData === 'string' ? designData : JSON.stringify(designData),
      adminApprovalStatus: 'approved',
      customizationStatus: 'completed',
      uploadStatus: 'ready',
      dpiStatus: 'ok',
      dpi: '300 DPI'
    };

    if (previewBase64) {
      // Decode preview image and write to disk
      const base64Data = previewBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `preview_${id}_${Date.now()}.png`;
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      updates.productImage = `/uploads/${filename}`;
    }

    // Auto-generate print-ready PDF
    let pdfUrl = order.pdfUrl;
    try {
      const filename = await pdfGenerator.generatePDF(id, { ...order, ...updates });
      pdfUrl = '/uploads/' + filename;
    } catch (err) {
      console.error('PDF Generation Error:', err);
    }
    updates.pdfUrl = pdfUrl;

    const updated = await db.updateOrder(id, updates);

    await db.addActivityLog(id, 'success', 'Admin reviewed and edited the design');
    await db.addActivityLog(id, 'system', 'Print-ready PDF Generated');
    await db.addActivityLog(id, 'success', 'Order Approved for Printing');

    // Route to Printer Queue
    const isMug = order.product.toLowerCase().includes('mug');
    const queueItem = await db.addToQueue({
      id: order.id,
      customer: order.customer,
      product: order.product,
      trimSize: isMug ? '8.5"x3.0"' : '12.25"x16.25"',
      status: 'print-ready',
      priority: 'normal',
      assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    res.json({ success: true, order: updated, queueItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/:id/upscale', authenticateToken(['admin']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = await db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Update order in persistent store
  const updated = await db.updateOrder(id, {
    dpi: '300 DPI (AI↑)',
    dpiStatus: 'ok'
  });
  
  console.log(`[AI UPSCALE] Order ${id} upscaled to 300 DPI`);
  res.json({ success: true, order: updated });
});

app.post('/api/orders/:id/force-approve', authenticateToken(['admin']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = await db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const updated = await db.updateOrder(id, {
    uploadStatus: 'ready',
    customizationStatus: 'completed',
    adminApprovalStatus: 'pending',
    dpiStatus: 'ok',
    dpi: '300 DPI'
  });

  console.log(`[FORCE APPROVE] Order ${id} approved by Admin`);
  res.json({ success: true, order: updated });
});

app.post('/api/orders/:id/route-to-printer', authenticateToken(['admin']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = await db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  let pdfUrl = order.pdfUrl;
  try {
    const filename = await pdfGenerator.generatePDF(id, order);
    pdfUrl = '/uploads/' + filename;
  } catch (err) {
    console.error('PDF Generation Error:', err);
  }

  const updated = await db.updateOrder(id, {
    adminApprovalStatus: 'approved',
    uploadStatus: 'approved',
    pdfUrl: pdfUrl
  });

  await db.addActivityLog(id, 'success', 'Admin Reviewed & Image Edited');
  await db.addActivityLog(id, 'system', 'Print-ready PDF Generated');
  await db.addActivityLog(id, 'success', 'Order Approved for Printing');

  const isMug = order.product.toLowerCase().includes('mug');
  const queueItem = await db.addToQueue({
    id: order.id,
    customer: order.customer,
    product: order.product,
    trimSize: isMug ? '8.5"x3.0"' : '12.25"x16.25"',
    status: 'print-ready',
    priority: 'normal',
    assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  console.log("[PRINTER QUEUE] Order $id added/updated in printer queue");
  res.json({ success: true, queueItem, queueLength: (await db.getQueue()).length, order: updated });
});

  app.post('/api/orders/:id/notify', authenticateToken(['admin']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = await db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  console.log(`[WHATSAPP] Alert sent to ${order.customer} for order ${id}`);
  res.json({ success: true, customer: order.customer });
});

// ── Shopify Integrations ────────────────────────────────────────────────────

// New product syncing and webhook routing
// app.use('/api', productRoutes);
// app.post('/api/webhooks/products', verifyWebhookHmac, handleProductWebhook);

app.get('/api/shopify/products', authenticateToken(['admin']), async (_req, res) => {
  try {
    const products = await shopify.syncProductsFromShopify();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shopify/orders', authenticateToken(['admin']), async (_req, res) => {
  try {
    const orders = await shopify.syncOrdersFromShopify();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shopify/test-connection', authenticateToken(['admin']), async (req, res) => {
  try {
    const settings = await db.getSettings();
    const store = settings.shopifyStore || process.env.SHOPIFY_STORE;
    const token = settings.shopifyAccessToken || process.env.SHOPIFY_ACCESS_TOKEN;
    const version = process.env.SHOPIFY_API_VERSION || '2026-04';

    if (!token || token === 'your_admin_api_access_token') {
      return res.json({ success: false, error: 'Shopify credentials are not configured.' });
    }

    const url = `https://${store}/admin/oauth/access_scopes.json`;
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const scopes = data.access_scopes.map(s => s.handle);
      return res.json({ success: true, store, scopes });
    } else {
      return res.json({
        success: false,
        status: response.status,
        error: `Shopify responded with status ${response.status}. Please check your credentials.`
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── User Management
app.get('/api/users', authenticateToken(['admin']), async (req, res) => {
  try {
    const users = await db.getUsers();
    // Remove passwordHash before sending
    const safeUsers = users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

app.post('/api/users', authenticateToken(['admin']), async (req, res) => {
  try {
    const { name, email, phone, role, password, status } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, role, and password are required.' });
    }

    const existingEmail = await db.getUserByEmail(email);
    if (existingEmail) return res.status(400).json({ error: 'Email already exists.' });

    if (phone) {
      const existingPhone = await db.getUserByPhone(phone);
      if (existingPhone) return res.status(400).json({ error: 'Phone already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = await db.createUser({
      name, email, phone, role, passwordHash, status: status || 'active'
    });

    const { passwordHash: _, ...safeUser } = newUser;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

app.put('/api/users/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password, status } = req.body;

    const updates = { name, email, phone, role, status };
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      updates.passwordHash = bcrypt.hashSync(password, salt);
    }

    const updatedUser = await db.updateUser(id, updates);
    if (!updatedUser) return res.status(404).json({ error: 'User not found.' });

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

app.delete('/api/users/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteUser(id);
    if (!deleted) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ── Settings ───────────────────────────────────────────────────────────────
app.get('/api/settings', authenticateToken(['admin']), async (_req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', authenticateToken(['admin']), async (req, res) => {
  try {
    const updated = await db.updateSettings(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Printer Queue ──────────────────────────────────────────────────────────
app.get('/api/printer/queue', authenticateToken(['printer', 'admin']), async (_req, res) => {
  res.json(await db.getQueue());
});

app.post('/api/printer/queue/:id/status', authenticateToken(['printer', 'admin']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const updated = await db.updateQueueItem(id, { status });
  if (!updated) return res.status(404).json({ error: 'Queue item not found.' });

  if (status === 'processing') {
    await db.updateOrder(id, { printStatus: 'printing' });
    await db.addActivityLog(id, 'system', 'Printing Started');
  } else if (status === 'completed') {
    await db.updateOrder(id, { printStatus: 'completed', deliveryStatus: 'shipped' });
    await db.addActivityLog(id, 'success', 'Printing Completed');
    await db.addActivityLog(id, 'info', 'Order marked ready for dispatch');
  }

  console.log("[PRINTER QUEUE] Status updated for order $id to $status");
  res.json({ success: true, item: updated });
});

app.get('/api/printer/download/:id', authenticateToken(['printer', 'admin']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = await db.getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order details not found.' });
  }

  try {
    console.log(`[PDF] Compiling real PDF for ${id}`);
    const filename = await pdfGenerator.generatePDF(id, order);
    res.json({
      success: true,
      filename: filename,
      url: `/uploads/${filename}`,
      message: 'PDF compilation completed.',
    });
  } catch (err) {
    console.error('[PDF ERROR]', err.message);
    res.status(500).json({ error: 'Failed to generate print-ready PDF.' });
  }
});

// 📝 SKUs API (SKU Management)
app.get('/api/skus', async (_req, res) => {
  try {
    const list = await db.getSkuMappings();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/skus/:sku', async (req, res) => {
  try {
    const list = await db.getSkuMappings();
    const item = list.find(s => s.sku === req.params.sku || s.id === req.params.sku);
    if (!item) return res.status(404).json({ error: 'SKU not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skus', authenticateToken(['admin']), async (req, res) => {
  try {
    const newSku = { id: `sku_${Date.now()}`, ...req.body };
    const saved = await db.saveSkuMapping(newSku);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/skus/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    // Treat id as either SKU code or the internal id. saveSkuMapping in db.js matches by sku.
    const saved = await db.saveSkuMapping({ ...req.body, id: req.params.id });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/skus/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    await db.deleteSkuMapping(req.params.id); // Assuming param is SKU string
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import / Export APIs
app.post('/api/skus/import', authenticateToken(['admin']), async (req, res) => {
  try {
    // Mock import: expects an array of SKUs
    const skus = req.body.skus || [];
    for (const sku of skus) {
      if (!sku.id) sku.id = `sku_${Date.now()}_${Math.random()}`;
      await db.saveSkuMapping(sku);
    }
    res.json({ success: true, count: skus.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/skus/export', authenticateToken(['admin']), async (req, res) => {
  try {
    const list = await db.getSkuMappings();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force manual map-sku for an order
app.post('/api/orders/map-sku', authenticateToken(['admin']), async (req, res) => {
  try {
    const { orderId, sku } = req.body;
    const order = await db.getOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const skuList = await db.getSkuMappings();
    const mappedSku = skuList.find(s => s.sku === sku);
    if (!mappedSku) return res.status(404).json({ error: 'SKU not found in catalog' });

    order.sku = mappedSku.sku;
    order.product = mappedSku.name;
    order.productType = mappedSku.productType;
    order.skuDetails = mappedSku;
    
    const updated = await db.updateOrderStatus(orderId, { 
      sku: mappedSku.sku,
      product: mappedSku.name,
      productType: mappedSku.productType,
      skuDetails: mappedSku
    });
    
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Templates API ──────────────────────────────────────────────────────────
app.get('/api/templates', async (_req, res) => {
  try {
    const list = await db.getTemplates();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/templates/:id', async (req, res) => {
  try {
    const t = await db.getTemplateById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Template not found' });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/templates', authenticateToken(['admin']), async (req, res) => {
  try {
    const saved = await db.saveTemplate(req.body);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/templates/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    await db.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SKU Mappings API ────────────────────────────────────────────────────────
app.get('/api/sku-mappings', async (_req, res) => {
  try {
    const list = await db.getSkuMappings();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sku-mappings', authenticateToken(['admin']), async (req, res) => {
  try {
    const saved = await db.saveSkuMapping(req.body);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sku-mappings/:sku', authenticateToken(['admin']), async (req, res) => {
  try {
    await db.deleteSkuMapping(req.params.sku);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Error Handler ──────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   THE PRINK — Backend Server         ║
  ║   Running on http://localhost:${PORT}   ║
  ╚══════════════════════════════════════╝
  `);
});


















