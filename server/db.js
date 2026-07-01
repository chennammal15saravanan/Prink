const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/theprink';
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  uploads: path.join(DATA_DIR, 'uploads.json'),
  queue: path.join(DATA_DIR, 'queue.json'),
  products: path.join(DATA_DIR, 'products.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  templates: path.join(DATA_DIR, 'templates.json'),
  skuMappings: path.join(DATA_DIR, 'sku_mappings.json'),
};

const DEFAULT_SETTINGS = {
  shopifyStore: 'prink-in.myshopify.com',
  shopifyAccessToken: '',
  whatsappEnabled: true,
  emailEnabled: true,
  lowDpiAlertsEnabled: true,
  dailySummaryEnabled: false,
  autoUpscaleEnabled: true,
  dpiThreshold: 300,
  maxFileMB: 20
};

// Seed / Helper Static Data
const salt = bcrypt.genSaltSync(10);
const SEED_USERS = [
  {
    id: 'usr_admin',
    email: 'admin@theprink.com',
    passwordHash: bcrypt.hashSync('prink123', salt),
    role: 'admin',
    name: 'Super Admin',
  },
  {
    id: 'usr_printer',
    email: 'printer@theprink.com',
    passwordHash: bcrypt.hashSync('printer123', salt),
    role: 'printer',
    name: 'Primary Press Operator',
  },
];

const SEED_ORDERS = [
  { id: 'SP-2001', customer: 'Sarah Connor', product: 'Premium Ceramic Coffee Mug Wrap', productType: 'mug', sku: 'PRK-MUG-CLASSIC', quantity: 2, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 28, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2002', customer: 'Sarah Connor', product: 'Magic Color Changing Mug (15oz)', productType: 'mug', sku: 'PRK-MUG-MAGIC', quantity: 1, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 29, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2003', customer: 'Sarah Connor', product: 'Custom Classic Cotton T-Shirt (White)', productType: 'tshirt', sku: 'PRK-TSHIRT-WHITE', quantity: 1, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 29, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2004', customer: 'Sarah Connor', product: 'Custom Classic Cotton T-Shirt (Black)', productType: 'tshirt', sku: 'PRK-TSHIRT-BLACK', quantity: 1, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 29, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2005', customer: 'Sarah Connor', product: 'Stretch Canvas Wall Art 12×16', productType: 'canvas', sku: 'PRK-CANVAS-1216', quantity: 2, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 30, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2006', customer: 'Sarah Connor', product: 'Premium Oak Wood Photo Frame 8×10', productType: 'frame', sku: 'PRK-FRM-810', quantity: 1, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 30, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2007', customer: 'Sarah Connor', product: 'Custom Desk Calendar 2026', productType: 'calendar', sku: 'PRK-CAL-2026', quantity: 1, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 30, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2008', customer: 'Sarah Connor', product: 'Hardcover Memories Photo Book', productType: 'photobook', sku: 'PRK-BOOK-20P', quantity: 1, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 30, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2009', customer: 'Sarah Connor', product: 'Ultra Slim Personalized Phone Case', productType: 'mobilecase', sku: 'PRK-CASE-IP15P', quantity: 1, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 30, 2026', phone: '+91 98765 43210', images: [], designData: '' },
  { id: 'SP-2010', customer: 'Sarah Connor', product: 'Soft Comfort Personalised Pillow', productType: 'pillow', sku: 'PRK-PIL-SOFT', quantity: 2, customizationStatus: 'pending', deliveryStatus: 'pending', dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending', adminApprovalStatus: 'pending', date: 'Jun 30, 2026', phone: '+91 98765 43210', images: [], designData: '' }
];

const SEED_QUEUE = [
  { id: 'SP-2004', customer: 'Sarah Connor', product: 'Photo Frame 8×10', trimSize: '8.25"×10.25"', status: 'print-ready', priority: 'high', assignedAt: '09:15 AM' },
];

const SEED_TEMPLATES = [
  { id: 't1', name: 'Classic Mug Wrap',     productType: 'mug',       thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', usageCount: 142, lastModified: 'Jun 15, 2026', elements: [], skuMapping: ['PRK-MUG-CLASSIC', 'MUG-11OZ'], isDefault: true, category: 'mug', tags: ['popular'] },
  { id: 't2', name: 'Ocean Canvas',         productType: 'canvas',    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', usageCount: 98,  lastModified: 'Jun 12, 2026', elements: [], skuMapping: ['CANVAS-12X16', 'CANVAS-16X20'], isDefault: true, category: 'canvas', tags: ['new'] },
  { id: 't3', name: 'Portrait Frame',       productType: 'frame',     thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200', usageCount: 67,  lastModified: 'Jun 10, 2026', elements: [], skuMapping: ['PRK-FRM-810', 'FRAME-8X10'], isDefault: true, category: 'frame', tags: [] },
  { id: 't4', name: '2027 Family Calendar', productType: 'calendar',  thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200', usageCount: 34,  lastModified: 'Jun 8, 2026',  elements: [], skuMapping: ['CAL-2027', 'CAL-WALL'], isDefault: true, category: 'calendar', tags: ['seasonal'] },
  { id: 't5', name: 'Rose Photo Book',      productType: 'photobook', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200', usageCount: 23,  lastModified: 'Jun 5, 2026',  elements: [], skuMapping: ['PRK-BOOK-20P', 'BOOK-ROSE'], isDefault: true, category: 'photobook', tags: [] },
  { id: 't6', name: 'T-Shirt Front Print',  productType: 'tshirt',    thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200', usageCount: 110, lastModified: 'Jun 22, 2026', elements: [], skuMapping: ['PRK-TSHIRT-L'], isDefault: true, category: 'tshirt', tags: ['popular'] },
  { id: 't7', name: 'Mobile Case Snap',     productType: 'mobilecase',thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=200', usageCount: 88,  lastModified: 'Jun 23, 2026', elements: [], skuMapping: ['PRK-CASE-IP15P'], isDefault: true, category: 'mobilecase', tags: ['new'] },
  { id: 't8', name: 'Cozy Accent Pillow',   productType: 'pillow',    thumbnail: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=200', usageCount: 45,  lastModified: 'Jun 24, 2026', elements: [], skuMapping: ['PRK-PIL-SOFT'], isDefault: true, category: 'pillow', tags: [] },
  { id: 't9', name: 'Mini Acrylic Keychain',productType: 'keychain',  thumbnail: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=200', usageCount: 120, lastModified: 'Jun 25, 2026', elements: [], skuMapping: ['PRK-KEY-ACRYLIC'], isDefault: true, category: 'keychain', tags: [] }
];

const SEED_SKU_MAPPINGS = [
  { sku: 'PRK-MUG-CLASSIC', templateId: 't1', productType: 'mug', customizationRules: { maxPhotos: 1 } },
  { sku: 'MUG-11OZ', templateId: 't1', productType: 'mug', customizationRules: { maxPhotos: 1 } },
  { sku: 'CANVAS-12X16', templateId: 't2', productType: 'canvas', customizationRules: { maxPhotos: 5 } },
  { sku: 'PRK-FRM-810', templateId: 't3', productType: 'frame', customizationRules: { maxPhotos: 1 } },
  { sku: 'CAL-2027', templateId: 't4', productType: 'calendar', customizationRules: { maxPhotos: 12 } },
  { sku: 'PRK-BOOK-20P', templateId: 't5', productType: 'photobook', customizationRules: { maxPhotos: 20 } },
  { sku: 'PRK-TSHIRT-L', templateId: 't6', productType: 'tshirt', customizationRules: { maxPhotos: 1 } },
  { sku: 'PRK-CASE-IP15P', templateId: 't7', productType: 'mobilecase', customizationRules: { maxPhotos: 1 } },
  { sku: 'PRK-PIL-SOFT', templateId: 't8', productType: 'pillow', customizationRules: { maxPhotos: 1 } },
  { sku: 'PRK-KEY-ACRYLIC', templateId: 't9', productType: 'keychain', customizationRules: { maxPhotos: 1 } },
];

// Initialize JSON files if missing
if (!fs.existsSync(FILES.users)) writeJson(FILES.users, SEED_USERS);

// Force update orders JSON if SP-2001 is missing, so demo works out-of-the-box
let existingOrders = [];
if (fs.existsSync(FILES.orders)) {
  existingOrders = readJson(FILES.orders, SEED_ORDERS);
}
if (!existingOrders.some(o => o.id === 'SP-2001')) {
  writeJson(FILES.orders, SEED_ORDERS);
} else {
  if (!fs.existsSync(FILES.orders)) writeJson(FILES.orders, SEED_ORDERS);
}
if (!fs.existsSync(FILES.uploads)) writeJson(FILES.uploads, []);
if (!fs.existsSync(FILES.queue)) writeJson(FILES.queue, SEED_QUEUE);
if (!fs.existsSync(FILES.products)) writeJson(FILES.products, []);
if (!fs.existsSync(FILES.settings)) writeJson(FILES.settings, DEFAULT_SETTINGS);
if (!fs.existsSync(FILES.templates)) writeJson(FILES.templates, SEED_TEMPLATES);
if (!fs.existsSync(FILES.skuMappings)) writeJson(FILES.skuMappings, SEED_SKU_MAPPINGS);

// JSON DB Helper functions
function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filePath, defaultValue);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[DB FALLBACK ERROR] Reading file ${filePath}:`, err.message);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`[DB FALLBACK ERROR] Writing file ${filePath}:`, err.message);
  }
}

let useMongoDb = false;

// ── Connect to MongoDB ──────────────────────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log(`[DB] Connected to MongoDB successfully at ${MONGODB_URI}`);
    useMongoDb = true;
    await seedDatabase();
  })
  .catch(err => {
    console.warn(`[DB WARNING] MongoDB connection failed: ${err.message}. Gracefully falling back to local JSON database.`);
    useMongoDb = false;
  });

// ── Schemas & Models ────────────────────────────────────────────────────────

// User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'printer', 'customer'], required: true },
  name: { type: String, required: true },
  phone: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Order name/display ID like '#1042'
  shopifyId: { type: String }, // Shopify unique order ID
  customer: { type: String, required: true },
  product: { type: String, required: true },
  productType: { type: String, default: 'canvas' },
  sku: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  dpi: { type: String, default: 'No Image' },
  dpiStatus: { type: String, enum: ['ok', 'low', 'none'], default: 'none' },
  uploadStatus: { type: String, enum: ['pending', 'awaiting', 'ready'], default: 'pending' },
  customizationStatus: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  deliveryStatus: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
  designData: { type: String, default: '' }, // Stringified canvas layer elements
  adminComments: { type: String, default: '' },
  date: { type: String, required: true },
  phone: { type: String },
  images: [{
    id: String,
    url: String,
    name: String,
    serverFilename: String
  }],
  theme: { type: String },
  caption: { type: String },
  adminApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'reupload'], default: 'pending' },
  printStatus: { type: String, enum: ['pending', 'printing', 'completed'], default: 'pending' },
  submissionTime: { type: String },
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

// Upload Schema
const UploadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  status: { type: String, default: 'ready' },
  timestamp: { type: String, required: true }
}, { timestamps: true });

const Upload = mongoose.model('Upload', UploadSchema);

// Queue Schema
const QueueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  product: { type: String, required: true },
  trimSize: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'print-ready', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  assignedAt: { type: String, required: true }
}, { timestamps: true });

const QueueItem = mongoose.model('QueueItem', QueueSchema);

// Product Schema (Shopify Synced Products)
const ProductSchema = new mongoose.Schema({
  shopifyProductId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  handle: { type: String },
  productType: { type: String },
  variants: [{
    id: String,
    title: String,
    price: String,
    sku: String
  }],
  images: [String],
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

// Setting Schema
const SettingSchema = new mongoose.Schema({
  shopifyStore: { type: String, default: 'prink-in.myshopify.com' },
  shopifyAccessToken: { type: String, default: '' },
  whatsappEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true },
  lowDpiAlertsEnabled: { type: Boolean, default: true },
  dailySummaryEnabled: { type: Boolean, default: false },
  autoUpscaleEnabled: { type: Boolean, default: true },
  dpiThreshold: { type: Number, default: 300 },
  maxFileMB: { type: Number, default: 20 }
}, { timestamps: true });

const Setting = mongoose.model('Setting', SettingSchema);

// Template Schema
const TemplateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  productType: { type: String, required: true },
  thumbnail: { type: String },
  elements: { type: Array, default: [] },
  skuMapping: [{ type: String }],
  isDefault: { type: Boolean, default: false },
  category: { type: String, default: 'mug' },
  seasonal: { type: String, default: 'none' },
  isPremium: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

const Template = mongoose.model('Template', TemplateSchema);

// SKU Mapping Schema
const SkuMappingSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  templateId: { type: String },
  productType: { type: String, required: true },
  customizationRules: { type: Object, default: {} }
}, { timestamps: true });

const SkuMapping = mongoose.model('SkuMapping', SkuMappingSchema);

// ── Database Seeding ────────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    // 1. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[DB] Seeding users to MongoDB...');
      await User.insertMany(SEED_USERS);
    }

    // 2. Seed Orders
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('[DB] Seeding orders to MongoDB...');
      await Order.insertMany(SEED_ORDERS);
    }

    // 3. Seed Queue Items
    const queueCount = await QueueItem.countDocuments();
    if (queueCount === 0) {
      console.log('[DB] Seeding printer queue to MongoDB...');
      await QueueItem.insertMany(SEED_QUEUE);
    }

    // 4. Seed Settings
    const settingCount = await Setting.countDocuments();
    if (settingCount === 0) {
      console.log('[DB] Seeding default settings to MongoDB...');
      await Setting.create(DEFAULT_SETTINGS);
    }

    // 5. Seed Templates
    const templateCount = await Template.countDocuments();
    if (templateCount === 0) {
      console.log('[DB] Seeding templates to MongoDB...');
      await Template.insertMany(SEED_TEMPLATES);
    }

    // 6. Seed SKU Mappings
    const mappingCount = await SkuMapping.countDocuments();
    if (mappingCount === 0) {
      console.log('[DB] Seeding SKU Mappings to MongoDB...');
      await SkuMapping.insertMany(SEED_SKU_MAPPINGS);
    }
  } catch (err) {
    console.error('[DB] Seeding failed:', err.message);
  }
}

// ── Exported Methods ────────────────────────────────────────────────────────
module.exports = {
  // Users
  getUsers: async () => {
    if (useMongoDb) {
      try { return await User.find().lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getUsers, falling back:', e.message);
      }
    }
    return readJson(FILES.users, SEED_USERS);
  },
  getUserByEmail: async (email) => {
    if (useMongoDb) {
      try { return await User.findOne({ email: email.toLowerCase() }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getUserByEmail, falling back:', e.message);
      }
    }
    const users = readJson(FILES.users, SEED_USERS);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserByPhone: async (phone) => {
    if (useMongoDb) {
      try { return await User.findOne({ phone }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getUserByPhone, falling back:', e.message);
      }
    }
    const users = readJson(FILES.users, SEED_USERS);
    return users.find(u => u.phone === phone);
  },
  createUser: async (userData) => {
    const newUser = { id: `usr_${Date.now()}`, ...userData };
    if (useMongoDb) {
      try {
        const u = new User(newUser);
        await u.save();
        return u.toObject();
      } catch (e) {
        console.error('[DB MONGO ERROR] createUser, falling back:', e.message);
      }
    }
    const users = readJson(FILES.users, SEED_USERS);
    users.push(newUser);
    writeJson(FILES.users, users);
    return newUser;
  },

  // Orders
  getOrders: async () => {
    if (useMongoDb) {
      try { return await Order.find().sort({ createdAt: -1 }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getOrders, falling back:', e.message);
      }
    }
    return readJson(FILES.orders, SEED_ORDERS);
  },
  getOrderById: async (id) => {
    if (useMongoDb) {
      try { return await Order.findOne({ id }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getOrderById, falling back:', e.message);
      }
    }
    const orders = readJson(FILES.orders, SEED_ORDERS);
    return orders.find(o => o.id === id);
  },
  getOrderByShopifyId: async (shopifyId) => {
    if (useMongoDb) {
      try { return await Order.findOne({ shopifyId }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getOrderByShopifyId, falling back:', e.message);
      }
    }
    const orders = readJson(FILES.orders, SEED_ORDERS);
    return orders.find(o => o.shopifyId === shopifyId);
  },
  createOrder: async (orderData) => {
    if (useMongoDb) {
      try {
        const o = new Order(orderData);
        await o.save();
        return o.toObject();
      } catch (e) {
        console.error('[DB MONGO ERROR] createOrder, falling back:', e.message);
      }
    }
    const orders = readJson(FILES.orders, SEED_ORDERS);
    orders.push(orderData);
    writeJson(FILES.orders, orders);
    return orderData;
  },
  updateOrder: async (id, updates) => {
    if (useMongoDb) {
      try { return await Order.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] updateOrder, falling back:', e.message);
      }
    }
    const orders = readJson(FILES.orders, SEED_ORDERS);
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      writeJson(FILES.orders, orders);
      return orders[index];
    }
    return null;
  },
  deleteOrdersByPhone: async (phone) => {
    if (useMongoDb) {
      try {
        await Order.deleteMany({ phone });
        return true;
      } catch (e) {
        console.error('[DB MONGO ERROR] deleteOrdersByPhone, falling back:', e.message);
      }
    }
    const phoneClean = phone.replace(/\D/g, '');
    let orders = readJson(FILES.orders, SEED_ORDERS);
    orders = orders.filter(o => !o.phone || !o.phone.replace(/\D/g, '').endsWith(phoneClean));
    writeJson(FILES.orders, orders);
    return true;
  },

  // Uploads
  getUploads: async () => {
    if (useMongoDb) {
      try { return await Upload.find().sort({ createdAt: -1 }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getUploads, falling back:', e.message);
      }
    }
    return readJson(FILES.uploads, []);
  },
  createUpload: async (uploadData) => {
    const newUpload = { id: `upl_${Date.now()}`, timestamp: new Date().toISOString(), ...uploadData };
    if (useMongoDb) {
      try {
        const u = new Upload(newUpload);
        await u.save();
        return u.toObject();
      } catch (e) {
        console.error('[DB MONGO ERROR] createUpload, falling back:', e.message);
      }
    }
    const uploads = readJson(FILES.uploads, []);
    uploads.push(newUpload);
    writeJson(FILES.uploads, uploads);
    return newUpload;
  },

  // Printer Queue
  getQueue: async () => {
    if (useMongoDb) {
      try { return await QueueItem.find().lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getQueue, falling back:', e.message);
      }
    }
    return readJson(FILES.queue, SEED_QUEUE);
  },
  addToQueue: async (item) => {
    if (useMongoDb) {
      try {
        const exists = await QueueItem.findOne({ id: item.id });
        if (!exists) {
          const newItem = new QueueItem(item);
          await newItem.save();
          return newItem.toObject();
        }
        return exists.toObject();
      } catch (e) {
        console.error('[DB MONGO ERROR] addToQueue, falling back:', e.message);
      }
    }
    const queue = readJson(FILES.queue, SEED_QUEUE);
    const exists = queue.find(q => q.id === item.id);
    if (!exists) {
      queue.push(item);
      writeJson(FILES.queue, queue);
      return item;
    }
    return exists;
  },
  updateQueueItem: async (id, updates) => {
    if (useMongoDb) {
      try { return await QueueItem.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] updateQueueItem, falling back:', e.message);
      }
    }
    const queue = readJson(FILES.queue, SEED_QUEUE);
    const index = queue.findIndex(q => q.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      writeJson(FILES.queue, queue);
      return queue[index];
    }
    return null;
  },
  deleteQueueItem: async (id) => {
    if (useMongoDb) {
      try { await QueueItem.deleteOne({ id }); return; } catch (e) {
        console.error('[DB MONGO ERROR] deleteQueueItem, falling back:', e.message);
      }
    }
    let queue = readJson(FILES.queue, SEED_QUEUE);
    queue = queue.filter(q => q.id !== id);
    writeJson(FILES.queue, queue);
  },

  // Shopify Products
  getProducts: async () => {
    if (useMongoDb) {
      try { return await Product.find().lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getProducts, falling back:', e.message);
      }
    }
    return readJson(FILES.products, []);
  },
  upsertProduct: async (productData) => {
    if (useMongoDb) {
      try {
        return await Product.findOneAndUpdate(
          { shopifyProductId: productData.shopifyProductId },
          { $set: productData },
          { new: true, upsert: true }
        ).lean();
      } catch (e) {
        console.error('[DB MONGO ERROR] upsertProduct, falling back:', e.message);
      }
    }
    const products = readJson(FILES.products, []);
    const index = products.findIndex(p => p.shopifyProductId === productData.shopifyProductId);
    if (index !== -1) {
      products[index] = { ...products[index], ...productData };
    } else {
      products.push(productData);
    }
    writeJson(FILES.products, products);
    return productData;
  },

  // Settings
  getSettings: async () => {
    if (useMongoDb) {
      try {
        let setting = await Setting.findOne().lean();
        if (!setting) {
          setting = await Setting.create(DEFAULT_SETTINGS);
        }
        return setting;
      } catch (e) {
        console.error('[DB MONGO ERROR] getSettings, falling back:', e.message);
      }
    }
    return readJson(FILES.settings, DEFAULT_SETTINGS);
  },
  updateSettings: async (updates) => {
    if (useMongoDb) {
      try {
        let setting = await Setting.findOneAndUpdate({}, { $set: updates }, { new: true, upsert: true }).lean();
        return setting;
      } catch (e) {
        console.error('[DB MONGO ERROR] updateSettings, falling back:', e.message);
      }
    }
    const settings = readJson(FILES.settings, DEFAULT_SETTINGS);
    const updated = { ...settings, ...updates };
    writeJson(FILES.settings, updated);
    return updated;
  },

  // Templates CRUD
  getTemplates: async () => {
    if (useMongoDb) {
      try { return await Template.find().lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getTemplates:', e.message);
      }
    }
    return readJson(FILES.templates, SEED_TEMPLATES);
  },
  getTemplateById: async (id) => {
    if (useMongoDb) {
      try { return await Template.findOne({ id }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getTemplateById:', e.message);
      }
    }
    const list = readJson(FILES.templates, SEED_TEMPLATES);
    return list.find(t => t.id === id);
  },
  saveTemplate: async (templateData) => {
    if (useMongoDb) {
      try {
        const t = await Template.findOneAndUpdate({ id: templateData.id }, { $set: templateData }, { new: true, upsert: true }).lean();
        return t;
      } catch (e) {
        console.error('[DB MONGO ERROR] saveTemplate:', e.message);
      }
    }
    const list = readJson(FILES.templates, SEED_TEMPLATES);
    const idx = list.findIndex(t => t.id === templateData.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...templateData };
    } else {
      list.push(templateData);
    }
    writeJson(FILES.templates, list);
    return templateData;
  },
  deleteTemplate: async (id) => {
    if (useMongoDb) {
      try { return await Template.deleteOne({ id }); } catch (e) {
        console.error('[DB MONGO ERROR] deleteTemplate:', e.message);
      }
    }
    const list = readJson(FILES.templates, SEED_TEMPLATES);
    const updated = list.filter(t => t.id !== id);
    writeJson(FILES.templates, updated);
    return true;
  },

  // SKU Mappings CRUD
  getSkuMappings: async () => {
    if (useMongoDb) {
      try { return await SkuMapping.find().lean(); } catch (e) {
        console.error('[DB MONGO ERROR] getSkuMappings:', e.message);
      }
    }
    return readJson(FILES.skuMappings, SEED_SKU_MAPPINGS);
  },
  saveSkuMapping: async (mappingData) => {
    if (useMongoDb) {
      try {
        const m = await SkuMapping.findOneAndUpdate({ sku: mappingData.sku }, { $set: mappingData }, { new: true, upsert: true }).lean();
        return m;
      } catch (e) {
        console.error('[DB MONGO ERROR] saveSkuMapping:', e.message);
      }
    }
    const list = readJson(FILES.skuMappings, SEED_SKU_MAPPINGS);
    const idx = list.findIndex(m => m.sku === mappingData.sku);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...mappingData };
    } else {
      list.push(mappingData);
    }
    writeJson(FILES.skuMappings, list);
    return mappingData;
  },
  deleteSkuMapping: async (sku) => {
    if (useMongoDb) {
      try { return await SkuMapping.deleteOne({ sku }); } catch (e) {
        console.error('[DB MONGO ERROR] deleteSkuMapping:', e.message);
      }
    }
    const list = readJson(FILES.skuMappings, SEED_SKU_MAPPINGS);
    const updated = list.filter(m => m.sku !== sku);
    writeJson(FILES.skuMappings, updated);
    return true;
  }
};
