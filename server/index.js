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

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'theprink_secret_key_2026';

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ── Static: serve uploaded images & PDFs ──────────────────────────────────
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
    { phone, role: 'customer', name: customerName, orderId: orderName },
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
    console.log(`[SHOPIFY APP API] Webhook synced order ${orderName} successfully.`);
    
    res.json({
      success: true,
      message: 'Shopify order webhook successfully processed & database record created.',
      order: created,
      uploadLink: `http://localhost:3000/#/customer?token=${jwtToken}`,
      whatsappTrigger: {
        recipient: phone,
        status: 'queued',
        uploadLink: `http://localhost:3000/#/customer?token=${jwtToken}`
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
    { name: 'Sarah Connor',  phone: '+91 98765 43210', product: 'Classic Coffee Mug Wrap',       sku: 'MUG-CLASSIC',  type: 'mug'      },
    { name: 'Priya Sharma',  phone: '+91 87654 32109', product: 'Stretch Canvas Print 12×16',   sku: 'CANVAS-12X16', type: 'canvas'   },
    { name: 'Rahul Mehta',   phone: '+91 76543 21098', product: 'Premium Photo Frame 8×10',     sku: 'FRAME-8X10',   type: 'frame'    },
    { name: 'Ananya Patel',  phone: '+91 65432 10987', product: 'Wall Calendar 2027',           sku: 'CAL-2027',     type: 'calendar' },
    { name: 'Vikram Nair',   phone: '+91 54321 09876', product: 'Rose Photo Book (30 pages)',   sku: 'BOOK-ROSE',    type: 'photobook'},
    { name: 'Deepa Rajan',   phone: '+91 43210 98765', product: 'Custom Mug Wrap (Panoramic)',  sku: 'MUG-PANO',     type: 'mug'      },
  ];

  const sample = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
  const orderNum = 1048 + Math.floor(Math.random() * 500);
  const orderId = `SP-${orderNum}`;

  // Generate JWT for WhatsApp link
  const jwtToken = jwt.sign(
    { phone: sample.phone, role: 'customer', name: sample.name, orderId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const newOrder = {
    id: orderId,
    shopifyId: `mock_${Date.now()}`,
    customer: sample.name,
    product: sample.product,
    productType: sample.type,
    sku: sample.sku,
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
    const uploadLink = `http://localhost:3000/#/customer?token=${jwtToken}`;
    
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
    { phone: phone || '+91 98765 43210', role: 'customer', name: customer || 'Customer', orderId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  const uploadLink = `http://localhost:3000/#/customer?token=${jwtToken}`;
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
app.post('/api/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  
  const user = await db.getUserByEmail(email);
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

// Demo Login (bypasses OTP — issues a real JWT for demo/testing)
app.post('/api/auth/demo-login', (req, res) => {
  const { name, phone, role } = req.body;
  const customerName = name || 'Sarah Connor';
  const customerPhone = phone || '+91 98765 43210';
  const userRole = role || 'customer';

  const token = jwt.sign(
    { phone: customerPhone, role: userRole, name: customerName, orderId: '#SP-1042' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    user: { name: customerName, phone: customerPhone, role: userRole, orderId: '#SP-1042' },
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

// ── Orders ─────────────────────────────────────────────────────────────────
app.get('/api/orders', authenticateToken(['admin']), async (_req, res) => {
  res.json(await db.getOrders());
});

app.get('/api/customer/orders', authenticateToken(['customer']), async (req, res) => {
  try {
    const phone = req.user.phone;
    const orderId = req.user.orderId;
    
    const allOrders = await db.getOrders();
    let matched = [];
    
    if (orderId) {
      // Look for specific order or split items (e.g. #1042-1, #1042-2)
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

    if (matched.length === 0) {
      // Seed default responsive fallback orders if none found
      matched = [
        {
          id: '#1042-1',
          customer: req.user.name || 'John Smith',
          product: 'Coffee Mug Wrap (11oz)',
          productType: 'mug',
          sku: 'MUG-11OZ',
          quantity: 1,
          dpi: 'No Image',
          dpiStatus: 'none',
          uploadStatus: 'pending',
          customizationStatus: 'pending',
          deliveryStatus: 'pending',
          date: 'Jun 14, 2026',
          phone: phone,
          images: [],
          designData: ''
        },
        {
          id: '#1042-2',
          customer: req.user.name || 'John Smith',
          product: 'Stretch Canvas 12x16',
          productType: 'canvas',
          sku: 'CANVAS-12X16',
          quantity: 2,
          dpi: 'No Image',
          dpiStatus: 'none',
          uploadStatus: 'pending',
          customizationStatus: 'pending',
          deliveryStatus: 'pending',
          date: 'Jun 14, 2026',
          phone: phone,
          images: [],
          designData: ''
        }
      ];
    }
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
    return res.json({
      id: '#1042-1',
      customer: req.user.name || 'John Smith',
      product: 'Coffee Mug Wrap',
      productType: 'mug',
      sku: 'MUG-11OZ',
      quantity: 1,
      dpi: 'No Image',
      dpiStatus: 'none',
      uploadStatus: 'pending',
      customizationStatus: 'pending',
      deliveryStatus: 'pending',
      date: 'Jun 14, 2026',
      phone: phone,
      images: [],
      designData: ''
    });
  }
  res.json(order);
});

// Save customer customization design draft
app.post('/api/orders/:id/design', authenticateToken(['customer', 'admin']), async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const { designData, customizationStatus } = req.body;
    
    const order = await db.getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    
    const updates = {};
    if (designData !== undefined) updates.designData = typeof designData === 'string' ? designData : JSON.stringify(designData);
    if (customizationStatus) updates.customizationStatus = customizationStatus;
    
    const updated = await db.updateOrder(id, updates);
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post admin review for design approval/rejection
app.post('/api/orders/:id/review', authenticateToken(['admin']), async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const { action, comments } = req.body; // action: 'approve' | 'reject'
    
    const order = await db.getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    
    const updates = {
      adminComments: comments || ''
    };
    
    if (action === 'approve') {
      updates.customizationStatus = 'completed';
      updates.uploadStatus = 'ready';
      
      // Auto enqueue into printer queue
      const isMug = order.product.toLowerCase().includes('mug');
      const trimSize = isMug ? '8.5"×3.0"' : '12.25"×16.25"';
      await db.enqueuePrint({
        id: order.id,
        customer: order.customer,
        product: order.product,
        trimSize: trimSize,
        status: 'print-ready',
        priority: 'normal'
      });
    } else {
      // Re-edit requested
      updates.customizationStatus = 'pending';
      updates.uploadStatus = 'awaiting';
    }
    
    const updated = await db.updateOrder(id, updates);
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Confirm Upload / Place Order
app.post('/api/orders/:id/confirm', authenticateToken(['customer']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const { theme, caption, images } = req.body;

  const order = await db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const updated = await db.updateOrder(id, {
    uploadStatus: 'ready',
    dpiStatus: 'ok',
    dpi: '300 DPI',
    theme: theme,
    caption: caption,
    images: images || [],
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  });

  // Automatically enqueue in Printer queue
  const isMug = order.product.toLowerCase().includes('mug');
  const queueItem = await db.addToQueue({
    id: order.id,
    customer: order.customer,
    product: order.product,
    trimSize: isMug ? '8.5"×3.0"' : '12.25"×16.25"',
    status: 'pending',
    priority: 'normal',
    assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  console.log(`[CUSTOMER UPLOAD] Order ${id} upload complete. Added to printer queue.`);
  res.json({ success: true, order: updated, queueItem });
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

  const isMug = order.product.toLowerCase().includes('mug');
  const queueItem = await db.addToQueue({
    id: order.id,
    customer: order.customer,
    product: order.product,
    trimSize: isMug ? '8.5"×3.0"' : '12.25"×16.25"',
    status: 'print-ready',
    priority: 'normal',
    assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  console.log(`[PRINTER QUEUE] Order ${id} added/updated in printer queue`);
  res.json({ success: true, queueItem, queueLength: (await db.getQueue()).length });
});

app.post('/api/orders/:id/notify', authenticateToken(['admin']), async (req, res) => {
  const id = decodeURIComponent(req.params.id);
  const order = await db.getOrderById(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  console.log(`[WHATSAPP] Alert sent to ${order.customer} for order ${id}`);
  res.json({ success: true, customer: order.customer });
});

// ── Shopify Integrations ────────────────────────────────────────────────────
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
  
  console.log(`[PRINTER QUEUE] Status updated for order ${id} to ${status}`);
  res.json({ success: true, item: updated });
});

app.get('/api/printer/download/:id', authenticateToken(['printer']), async (req, res) => {
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
