require('./utils/dns-fix');

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
      status: 'active'
    },
    {
      id: 'usr_printer',
      email: 'printer@theprink.com',
      passwordHash: bcrypt.hashSync('printer123', salt),
      role: 'printer',
      name: 'Primary Press Operator',
      status: 'active'
    },
    {
      id: 'usr_customer',
      email: 'customer@theprink.com',
      passwordHash: bcrypt.hashSync('customer123', salt),
      role: 'customer',
      name: 'Demo Customer',
      phone: '+919876543210',
      status: 'active'
    },
  ];

// No seed orders — dashboard starts empty and shows real Shopify orders only
const SEED_ORDERS = [];

const SEED_QUEUE = [];

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
  { id: 'sku1', name: 'White Coffee Mug', sku: 'MUG001', category: 'Mug', productType: 'mug', description: '11oz White Ceramic Mug', productImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800', templateId: 't1', templateName: 'Mug Template', printAreaWidth: 8.5, printAreaHeight: 3.0, printPosition: 'Front', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 10, orientation: 'landscape', printingInstructions: 'Sublimation printing, center alignment', status: 'active' },
  { id: 'sku2', name: 'Premium T-Shirt', sku: 'TSHIRT001', category: 'Apparel', productType: 'tshirt', description: '100% Cotton T-Shirt', productImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800', templateId: 't6', templateName: 'T-Shirt Front', printAreaWidth: 12.0, printAreaHeight: 16.0, printPosition: 'Front Center', supportedImageCount: 2, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 20, orientation: 'portrait', printingInstructions: 'DTG Printing, front and back', status: 'active' },
  { id: 'sku3', name: 'Photo Frame', sku: 'FRAME001', category: 'Home Decor', productType: 'frame', description: '8x10 Wooden Photo Frame', productImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800', templateId: 't3', templateName: 'Landscape Frame', printAreaWidth: 10.0, printAreaHeight: 8.0, printPosition: 'Center', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 15, orientation: 'landscape', printingInstructions: 'High quality photo paper, 300DPI', status: 'active' },
  { id: 'sku4', name: 'Pillow Cover', sku: 'PILLOW001', category: 'Home Decor', productType: 'pillow', description: '16x16 Square Pillow Cover', productImage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800', templateId: 't8', templateName: 'Pillow Template', printAreaWidth: 16.0, printAreaHeight: 16.0, printPosition: 'Full Bleed', supportedImageCount: 2, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 25, orientation: 'square', printingInstructions: 'Sublimation on polyester, front/back', status: 'active' },
  { id: 'sku5', name: 'Wall Calendar 2027', sku: 'CAL001', category: 'Stationery', productType: 'calendar', description: '12 Month Wall Calendar', productImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800', templateId: 't4', templateName: 'Calendar Template', printAreaWidth: 11.0, printAreaHeight: 8.5, printPosition: 'Top Half', supportedImageCount: 12, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 50, orientation: 'landscape', printingInstructions: 'Wire-O binding, glossy paper', status: 'active' },
  { id: 'sku6', name: 'Canvas Print 12x16', sku: 'CANVAS12X16', category: 'Wall Art', productType: 'canvas', description: 'Stretched Canvas Print', productImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800', templateId: 't2', templateName: 'Canvas Template', printAreaWidth: 12.0, printAreaHeight: 16.0, printPosition: 'Wrap', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 20, orientation: 'portrait', printingInstructions: 'Gallery wrap, 1.5 inch edge bleed', status: 'active' },
  { id: 'sku7', name: 'Rose Photo Book', sku: 'BOOK001', category: 'Books', productType: 'photobook', description: '30 Page Hardcover Book', productImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800', templateId: 't5', templateName: 'Photobook Template', printAreaWidth: 8.0, printAreaHeight: 8.0, printPosition: 'Pages', supportedImageCount: 30, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 100, orientation: 'square', printingInstructions: 'Luster paper, layflat binding', status: 'active' },
  { id: 'sku8', name: 'Mobile Case Snap', sku: 'CASE001', category: 'Accessories', productType: 'mobilecase', description: 'Snap-on Phone Case', productImage: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=800', templateId: 't7', templateName: 'Case Template', printAreaWidth: 3.0, printAreaHeight: 6.0, printPosition: 'Back', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 5, orientation: 'portrait', printingInstructions: '3D sublimation wrap', status: 'active' },
  { id: 'sku9', name: 'Acrylic Keychain', sku: 'KEY001', category: 'Accessories', productType: 'keychain', description: '2x2 Clear Acrylic Keychain', productImage: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=800', templateId: 't9', templateName: 'Keychain Template', printAreaWidth: 2.0, printAreaHeight: 2.0, printPosition: 'Center', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 2, orientation: 'square', printingInstructions: 'UV print on acrylic', status: 'active' },
  { id: 'sku10', name: 'Magic Mug', sku: 'MUG002', category: 'Mug', productType: 'mug', description: 'Color Changing Mug', productImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800', templateId: 't1', templateName: 'Mug Template', printAreaWidth: 8.5, printAreaHeight: 3.0, printPosition: 'Wrap', supportedImageCount: 2, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 10, orientation: 'landscape', printingInstructions: 'Sublimation on heat-sensitive coating', status: 'active' },
  { id: 'sku11', name: 'Canvas Print 16x20', sku: 'CANVAS16X20', category: 'Wall Art', productType: 'canvas', description: 'Large Stretched Canvas', productImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800', templateId: 't2', templateName: 'Canvas Template', printAreaWidth: 16.0, printAreaHeight: 20.0, printPosition: 'Wrap', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 25, orientation: 'portrait', printingInstructions: 'Gallery wrap, 1.5 inch edge bleed', status: 'active' },
  { id: 'sku12', name: 'Mouse Pad', sku: 'PAD001', category: 'Office', productType: 'mousepad', description: 'Rubber Base Mouse Pad', productImage: 'https://images.unsplash.com/photo-1527814050087-379381547962?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1527814050087-379381547962?q=80&w=800', templateId: 't1', templateName: 'Mousepad Template', printAreaWidth: 9.0, printAreaHeight: 7.5, printPosition: 'Full', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 10, orientation: 'landscape', printingInstructions: 'Sublimation on fabric top', status: 'active' },
  { id: 'sku13', name: 'Tote Bag', sku: 'BAG001', category: 'Apparel', productType: 'bag', description: 'Cotton Canvas Tote', productImage: 'https://images.unsplash.com/photo-1597633244018-8d4bc4db8746?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1597633244018-8d4bc4db8746?q=80&w=800', templateId: 't6', templateName: 'Tote Template', printAreaWidth: 10.0, printAreaHeight: 10.0, printPosition: 'Front', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 15, orientation: 'square', printingInstructions: 'DTG on cotton canvas', status: 'active' },
  { id: 'sku14', name: 'Puzzle 500 Pieces', sku: 'PUZZLE500', category: 'Games', productType: 'puzzle', description: 'Custom Jigsaw Puzzle', productImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800', templateId: 't3', templateName: 'Puzzle Template', printAreaWidth: 18.0, printAreaHeight: 24.0, printPosition: 'Full', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 30, orientation: 'landscape', printingInstructions: 'High res print on puzzle board', status: 'active' },
  { id: 'sku15', name: 'Hoodie', sku: 'HOODIE001', category: 'Apparel', productType: 'apparel', description: 'Fleece Pullover Hoodie', productImage: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800', templateId: 't6', templateName: 'Hoodie Template', printAreaWidth: 12.0, printAreaHeight: 14.0, printPosition: 'Front', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 20, orientation: 'portrait', printingInstructions: 'DTF transfer', status: 'active' },
  { id: 'sku16', name: 'Water Bottle', sku: 'BOTTLE001', category: 'Drinkware', productType: 'bottle', description: 'Stainless Steel Bottle', productImage: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800', templateId: 't1', templateName: 'Bottle Template', printAreaWidth: 8.0, printAreaHeight: 5.0, printPosition: 'Wrap', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 10, orientation: 'landscape', printingInstructions: 'Rotary UV print', status: 'active' },
  { id: 'sku17', name: 'Poster 18x24', sku: 'POSTER18X24', category: 'Wall Art', productType: 'poster', description: 'Matte Finish Poster', productImage: 'https://images.unsplash.com/photo-1580192985016-89a19c5c83f6?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1580192985016-89a19c5c83f6?q=80&w=800', templateId: 't3', templateName: 'Poster Template', printAreaWidth: 18.0, printAreaHeight: 24.0, printPosition: 'Full', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 40, orientation: 'portrait', printingInstructions: 'Large format inkjet', status: 'active' },
  { id: 'sku18', name: 'Coaster Set (4)', sku: 'COASTER001', category: 'Home Decor', productType: 'coaster', description: 'Cork Backed Coasters', productImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800', templateId: 't9', templateName: 'Coaster Template', printAreaWidth: 3.75, printAreaHeight: 3.75, printPosition: 'Center', supportedImageCount: 4, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 20, orientation: 'square', printingInstructions: 'Sublimation on hardboard', status: 'active' },
  { id: 'sku19', name: 'Notebook', sku: 'NOTEBOOK001', category: 'Stationery', productType: 'notebook', description: 'Spiral Bound Notebook', productImage: 'https://images.unsplash.com/photo-1531346878377-a541e4ab04ce?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1531346878377-a541e4ab04ce?q=80&w=800', templateId: 't5', templateName: 'Notebook Template', printAreaWidth: 6.0, printAreaHeight: 9.0, printPosition: 'Cover', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 15, orientation: 'portrait', printingInstructions: 'Digital print on cardstock cover', status: 'active' },
  { id: 'sku20', name: 'Luggage Tag', sku: 'TAG001', category: 'Accessories', productType: 'tag', description: 'Plastic Luggage Tag', productImage: 'https://images.unsplash.com/photo-1551608695-1f87b87df603?q=80&w=200', mockupImage: 'https://images.unsplash.com/photo-1551608695-1f87b87df603?q=80&w=800', templateId: 't9', templateName: 'Tag Template', printAreaWidth: 2.5, printAreaHeight: 4.0, printPosition: 'Front', supportedImageCount: 1, supportedFileTypes: ['PNG', 'JPEG'], maximumFileSize: 5, orientation: 'portrait', printingInstructions: 'UV print on PVC', status: 'active' }
];

// Initialize JSON files if missing
if (!fs.existsSync(FILES.users)) writeJson(FILES.users, SEED_USERS);

// Initialize orders JSON file — empty, no seed data
if (!fs.existsSync(FILES.orders)) writeJson(FILES.orders, []);
// If the file exists but still has old ORD1001/SP seed orders, clear them out
else {
  let existingOrders = readJson(FILES.orders, []);
  if (existingOrders.some(o => o.id && (o.id.startsWith('ORD1001') || (o.id.startsWith('SP-20') && o.customer === 'Sarah Connor')))) {
    writeJson(FILES.orders, []);
  }
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
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastLogin: { type: Date }
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
  skuDetails: { type: Object, default: null },
  quantity: { type: Number, default: 1 },
  dpi: { type: String, default: 'No Image' },
  dpiStatus: { type: String, enum: ['ok', 'low', 'none'], default: 'none' },
  uploadStatus: { type: String, enum: ['pending', 'awaiting', 'ready'], default: 'pending' },
  customizationStatus: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  deliveryStatus: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
  designData: { type: String, default: '' }, // Stringified canvas layer elements
  adminComments: { type: String, default: '' },
  customerNotes: { type: String, default: '' },
  submissionStatus: { type: String, default: 'Pending Upload' },
  date: { type: String, required: true },
  phone: { type: String },
  images: [{
    id: String,
    src: String,
    url: String,
    name: String,
    serverFilename: String
  }],
  productImage: { type: String, default: '' },
  theme: { type: String },
  caption: { type: String },
  adminApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'reupload'], default: 'pending' },
  printStatus: { type: String, enum: ['pending', 'printing', 'completed'], default: 'pending' },
  submissionTime: { type: String },
  activityLogs: [{
    time: { type: String },
    type: { type: String, enum: ['system', 'success', 'error', 'info', 'upload'] },
    text: { type: String }
  }],
  pdfUrl: { type: String, default: '' },
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
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String },
  productType: { type: String, required: true },
  description: { type: String },
  productImage: { type: String },
  mockupImage: { type: String },
  templateId: { type: String },
  templateName: { type: String },
  printAreaWidth: { type: Number },
  printAreaHeight: { type: Number },
  printPosition: { type: String },
  supportedImageCount: { type: Number },
  supportedFileTypes: [{ type: String }],
  maximumFileSize: { type: Number },
  orientation: { type: String },
  printingInstructions: { type: String },
  status: { type: String, default: 'active' }
}, { timestamps: true });

const SkuMapping = mongoose.model('SkuMapping', SkuMappingSchema);

// ── Database Seeding ────────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    // Clean up any remaining mock data from MongoDB
    await Order.deleteMany({
      $or: [
        { id: { $regex: '^SP-20' } },
        { shopifyId: { $regex: '^mock_' } }
      ]
    });
    await QueueItem.deleteMany({
      $or: [
        { id: { $regex: '^SP-20' } },
        { shopifyId: { $regex: '^mock_' } }
      ]
    });

    // 1. Seed Users
          console.log('[DB] Ensuring default users exist in MongoDB...');
      for (const u of SEED_USERS) {
        await User.findOneAndUpdate({ email: u.email }, { $set: u }, { upsert: true });
      }

    // 2. Remove any lingering ORD1001/SP-20xx seed orders from MongoDB
    const seedPattern = /^(ORD1001|SP-20)/;
    const seedOrders = await Order.find({ id: { $regex: '^(ORD1001|SP-20)' } }).lean();
    if (seedOrders.length > 0) {
      console.log(`[DB] Removing ${seedOrders.length} stale seed orders from MongoDB...`);
      await Order.deleteMany({ id: { $regex: '^(ORD1001|SP-20)' } });
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
    await SkuMapping.deleteMany({});
      const mappingCount = 0;
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
    const newUser = { id: `usr_${Date.now()}`, status: 'active', ...userData };
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
  updateUser: async (id, updates) => {
    if (useMongoDb) {
      try { return await User.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean(); } catch (e) {
        console.error('[DB MONGO ERROR] updateUser, falling back:', e.message);
      }
    }
    const users = readJson(FILES.users, SEED_USERS);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      writeJson(FILES.users, users);
      return users[index];
    }
    return null;
  },
  deleteUser: async (id) => {
    if (useMongoDb) {
      try { await User.deleteOne({ id }); return true; } catch (e) {
        console.error('[DB MONGO ERROR] deleteUser, falling back:', e.message);
      }
    }
    let users = readJson(FILES.users, SEED_USERS);
    users = users.filter(u => u.id !== id);
    writeJson(FILES.users, users);
    return true;
  },
  updateLastLogin: async (email) => {
    if (useMongoDb) {
      try { await User.findOneAndUpdate({ email: email.toLowerCase() }, { $set: { lastLogin: new Date() } }); return true; } catch (e) {
        console.error('[DB MONGO ERROR] updateLastLogin:', e.message);
      }
    }
    return false;
  },

  // Orders
  getOrders: async () => {
    if (useMongoDb) {
      try { return await Order.find().sort({ updatedAt: -1 }).lean(); } catch (e) {
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
  addActivityLog: async (id, type, text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (useMongoDb) {
      try {
        return await Order.findOneAndUpdate(
          { id },
          { $push: { activityLogs: { time, type, text } } },
          { new: true }
        ).lean();
      } catch (e) {
        console.error('[DB MONGO ERROR] addActivityLog, falling back:', e.message);
      }
    }
    const orders = readJson(FILES.orders, SEED_ORDERS);
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      if (!orders[index].activityLogs) orders[index].activityLogs = [];
      orders[index].activityLogs.push({ time, type, text });
      writeJson(FILES.orders, orders);
      return orders[index];
    }
    return null;
  },
  deleteOrderById: async (id) => {
    if (useMongoDb) {
      try {
        const result = await Order.deleteOne({ id });
        return result.deletedCount > 0;
      } catch (e) {
        console.error('[DB MONGO ERROR] deleteOrderById, falling back:', e.message);
      }
    }
    let orders = readJson(FILES.orders, SEED_ORDERS);
    const before = orders.length;
    orders = orders.filter(o => o.id !== id);
    writeJson(FILES.orders, orders);
    return orders.length < before;
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
  deleteUpload: async (id) => {
    if (useMongoDb) {
      try {
        await Upload.deleteOne({ id });
        return true;
      } catch (e) {
        console.error('[DB MONGO ERROR] deleteUpload, falling back:', e.message);
      }
    }
    let uploads = readJson(FILES.uploads, []);
    uploads = uploads.filter(u => u.id !== id);
    writeJson(FILES.uploads, uploads);
    return true;
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


