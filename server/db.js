const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  uploads: path.join(DATA_DIR, 'uploads.json'),
  queue: path.join(DATA_DIR, 'queue.json'),
};

// Seed helper functions
function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filePath, defaultValue);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[DB ERROR] Reading file ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`[DB ERROR] Writing file ${filePath}:`, err);
  }
}

// Initial Data Seed
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
  { id: '#1042', customer: 'John Doe',    product: 'Coffee Mug Wrap',      productType: 'mug',       dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 16, 2026', phone: '+91 98765 43210' },
  { id: '#1043', customer: 'Jane Smith',  product: 'Stretch Canvas 12×16', productType: 'canvas',   dpi: '150 DPI',  dpiStatus: 'low',  uploadStatus: 'awaiting', date: 'Jun 16, 2026', phone: '+91 87654 32109' },
  { id: '#1044', customer: 'Robert Lee',  product: 'Stretch Canvas 12×16', productType: 'canvas',   dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 15, 2026', phone: '+91 76543 21098' },
  { id: '#1045', customer: 'Emily Davis', product: 'Coffee Mug Wrap',      productType: 'mug',       dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending',  date: 'Jun 15, 2026', phone: '+91 65432 10987' },
  { id: '#1046', customer: 'Priya Singh', product: 'Photo Frame 8×10',     productType: 'frame',    dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 14, 2026', phone: '+91 54321 09876' },
  { id: '#1047', customer: 'Ravi Kumar',  product: 'Wall Calendar 2027',   productType: 'calendar', dpi: '72 DPI',   dpiStatus: 'low',  uploadStatus: 'awaiting', date: 'Jun 14, 2026', phone: '+91 43210 98765' },
];

const SEED_QUEUE = [
  { id: '#1042', customer: 'John Doe',    product: 'Coffee Mug (11oz)', trimSize: '8.5"×3.0"',    status: 'print-ready', priority: 'high',   assignedAt: '09:15 AM' },
  { id: '#1044', customer: 'Robert Lee',  product: 'Canvas 12×16',      trimSize: '12.25"×16.25"', status: 'processing',  priority: 'normal', assignedAt: '09:45 AM' },
  { id: '#1046', customer: 'Priya Singh', product: 'Photo Frame 8×10',  trimSize: '8.25"×10.25"',  status: 'pending',     priority: 'low',    assignedAt: '10:00 AM' },
];

// Initialize JSON files
if (!fs.existsSync(FILES.users)) writeJson(FILES.users, SEED_USERS);
if (!fs.existsSync(FILES.orders)) writeJson(FILES.orders, SEED_ORDERS);
if (!fs.existsSync(FILES.uploads)) writeJson(FILES.uploads, []);
if (!fs.existsSync(FILES.queue)) writeJson(FILES.queue, SEED_QUEUE);

module.exports = {
  // Users
  getUsers: () => readJson(FILES.users, SEED_USERS),
  getUserByEmail: (email) => {
    const users = readJson(FILES.users, SEED_USERS);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  createUser: (user) => {
    const users = readJson(FILES.users, SEED_USERS);
    const newUser = { id: `usr_${Date.now()}`, ...user };
    users.push(newUser);
    writeJson(FILES.users, users);
    return newUser;
  },

  // Orders
  getOrders: () => readJson(FILES.orders, SEED_ORDERS),
  getOrderById: (id) => {
    const orders = readJson(FILES.orders, SEED_ORDERS);
    return orders.find(o => o.id === id);
  },
  createOrder: (order) => {
    const orders = readJson(FILES.orders, SEED_ORDERS);
    orders.push(order);
    writeJson(FILES.orders, orders);
    return order;
  },
  updateOrder: (id, updates) => {
    const orders = readJson(FILES.orders, SEED_ORDERS);
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      writeJson(FILES.orders, orders);
      return orders[index];
    }
    return null;
  },

  // Uploads
  getUploads: () => readJson(FILES.uploads, []),
  createUpload: (upload) => {
    const uploads = readJson(FILES.uploads, []);
    const newUpload = { id: `upl_${Date.now()}`, timestamp: new Date().toISOString(), ...upload };
    uploads.push(newUpload);
    writeJson(FILES.uploads, uploads);
    return newUpload;
  },

  // Printer Queue
  getQueue: () => readJson(FILES.queue, SEED_QUEUE),
  addToQueue: (item) => {
    const queue = readJson(FILES.queue, SEED_QUEUE);
    const exists = queue.find(q => q.id === item.id);
    if (!exists) {
      queue.push(item);
      writeJson(FILES.queue, queue);
      return item;
    }
    return exists;
  },
  updateQueueItem: (id, updates) => {
    const queue = readJson(FILES.queue, SEED_QUEUE);
    const index = queue.findIndex(q => q.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      writeJson(FILES.queue, queue);
      return queue[index];
    }
    return null;
  },
  deleteQueueItem: (id) => {
    let queue = readJson(FILES.queue, SEED_QUEUE);
    queue = queue.filter(q => q.id !== id);
    writeJson(FILES.queue, queue);
  }
};
