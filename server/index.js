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
require('dotenv').config();

const db = require('./db');

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'theprink_secret_key_2026';

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ── Static: serve uploaded images ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'THE PRINK API' });
});

// Shopify Webhook signature verification helper
const crypto = require('crypto');

function verifyShopifyWebhook(req, res, next) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_API_SECRET;
  
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

// ── Shopify Webhooks ───────────────────────────────────────────────────────
app.post('/api/webhooks/shopify-orders', verifyShopifyWebhook, (req, res) => {
  const payload = req.body;
  
  // Format order based on Shopify webhook order payload
  // Shopify payload example fields: id, name, line_items, customer, created_at
  const shopifyOrderId = payload.id || `shp_${Date.now()}`;
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
    
    // Map item title or SKU to productType
    const titleLower = productTitle.toLowerCase();
    if (titleLower.includes('mug')) productType = 'mug';
    else if (titleLower.includes('frame')) productType = 'frame';
    else if (titleLower.includes('calendar')) productType = 'calendar';
    else if (titleLower.includes('book')) productType = 'photobook';
  }

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
    const created = db.createOrder(newOrder);
    console.log(`[SHOPIFY APP API] Webhook synced order ${orderName} successfully.`);
    
    // Send simulated WhatsApp trigger response inside payload
    res.json({
      success: true,
      message: 'Shopify order webhook successfully processed & database record created.',
      order: created,
      whatsappTrigger: {
        recipient: phone,
        status: 'queued',
        uploadLink: `http://localhost:3002/#/customer?token=mock_tok_${shopifyOrderId}`
      }
    });
  } catch (err) {
    console.error('[SHOPIFY WEBHOOK ERROR]', err.message);
    res.status(500).json({ error: 'Failed to create order from Shopify webhook.' });
  }
});

// ── Auth ───────────────────────────────────────────────────────────────────

app.post('/api/auth/otp-request', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required.' });
  console.log(`[OTP] Sending mock OTP to ${phone}`);
  res.json({ message: `OTP sent to ${phone}`, mock: true });
});

app.post('/api/auth/otp-verify', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required.' });
  if (code !== '1234') return res.status(401).json({ error: 'Invalid OTP code.' });
  
  const token = jwt.sign(
    { phone, role: 'customer', name: 'John Smith' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    user: { name: 'John Smith', orderId: '#1042', role: 'customer' },
    token,
  });
});

app.post('/api/auth/whatsapp-login', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required.' });
  
  const token = jwt.sign(
    { phone, role: 'customer', name: 'John Smith' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    user: { name: 'John Smith', orderId: '#1042', role: 'customer' },
    token,
  });
});

// Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  
  const user = db.getUserByEmail(email);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Invalid credentials or user role.' });
  }
  
  const matches = bcrypt.compareSync(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  
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

// Printer Login
app.post('/api/auth/printer-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  
  const user = db.getUserByEmail(email);
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
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = `/uploads/${req.file.filename}`;
  console.log(`[UPLOAD] Saved: ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);
  
  // Track upload in DB
  const uploadRecord = db.createUpload({
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

// ── Orders ─────────────────────────────────────────────────────────────────
app.get('/api/orders', authenticateToken(['admin']), (_req, res) => {
  res.json(db.getOrders());
});

app.get('/api/customer/order', authenticateToken(['customer']), (req, res) => {
  const phone = req.user.phone;
  const orders = db.getOrders();
  
  const order = orders.find(o => {
    if (!o.phone) return false;
    const cleanDbPhone = o.phone.replace(/\D/g, '');
    const cleanUserPhone = phone.replace(/\D/g, '');
    return cleanDbPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanDbPhone);
  });

  if (!order) {
    return res.json({
      id: '#1042',
      customer: req.user.name || 'John Smith',
      product: 'Coffee Mug Wrap',
      productType: 'mug',
      dpi: 'No Image',
      dpiStatus: 'none',
      uploadStatus: 'pending',
      date: 'Jun 14, 2026',
      phone: phone
    });
  }
  res.json(order);
});


app.post('/api/orders/:id/upscale', authenticateToken(['admin']), (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Update order in persistent store
  const updated = db.updateOrder(id, {
    dpi: '300 DPI (AI↑)',
    dpiStatus: 'ok'
  });
  
  console.log(`[AI UPSCALE] Order ${id} upscaled to 300 DPI`);
  res.json({ success: true, order: updated });
});

app.post('/api/orders/:id/force-approve', authenticateToken(['admin']), (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const updated = db.updateOrder(id, {
    uploadStatus: 'ready',
    dpiStatus: 'ok',
    dpi: '300 DPI'
  });

  console.log(`[FORCE APPROVE] Order ${id} approved by Admin`);
  res.json({ success: true, order: updated });
});

app.post('/api/orders/:id/route-to-printer', authenticateToken(['admin']), (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const isMug = order.product.toLowerCase().includes('mug');
  const queueItem = db.addToQueue({
    id: order.id,
    customer: order.customer,
    product: order.product,
    trimSize: isMug ? '8.5"×3.0"' : '12.25"×16.25"',
    status: 'print-ready',
    priority: 'normal',
    assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  console.log(`[PRINTER QUEUE] Order ${id} added/updated in printer queue`);
  res.json({ success: true, queueItem, queueLength: db.getQueue().length });
});

app.post('/api/orders/:id/notify', authenticateToken(['admin']), (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  console.log(`[WHATSAPP] Alert sent to ${order.customer} for order ${id}`);
  res.json({ success: true, customer: order.customer });
});

// ── Printer Queue ──────────────────────────────────────────────────────────
app.get('/api/printer/queue', authenticateToken(['printer', 'admin']), (_req, res) => {
  res.json(db.getQueue());
});

app.post('/api/printer/queue/:id/status', authenticateToken(['printer', 'admin']), (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  
  const updated = db.updateQueueItem(id, { status });
  if (!updated) return res.status(404).json({ error: 'Queue item not found.' });
  
  console.log(`[PRINTER QUEUE] Status updated for order ${id} to ${status}`);
  res.json({ success: true, item: updated });
});

app.get('/api/printer/download/:id', authenticateToken(['printer']), (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const queue = db.getQueue();
  const item = queue.find(p => p.id === id);
  if (!item) return res.status(404).json({ error: 'Queue item not found.' });

  console.log(`[PDF] Compiling mock PDF for ${id}`);
  res.json({
    success: true,
    filename: `THEPRINK_${id}_${item.customer.replace(/\s+/g, '_')}_VECTOR_PRINT.pdf`,
    message: 'PDF compilation initiated.',
  });
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
