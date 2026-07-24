const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopifyId: { type: String, sparse: true },
  orderNumber: { type: String },
  customer: {
    id: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  product: { type: String },
  productType: { type: String },
  sku: { type: String },
  skuDetails: { type: mongoose.Schema.Types.Mixed },
  quantity: { type: Number, default: 1 },
  totalPrice: { type: String },
  dpiInfo: { type: mongoose.Schema.Types.Mixed },
  uploadStatus: { type: String, default: 'pending' },
  uploadToken: { type: String, sparse: true },
  // SHA-256 of the upload token. New orders store only the hash; `uploadToken`
  // is retained for links already issued to customers before this change.
  uploadTokenHash: { type: String, index: true, sparse: true },
  uploadTokenExpiresAt: { type: Date },
  linkOpenedAt: { type: Date },
  uploadLink: { type: String },
  customerNotes: { type: String },
  // Set once the customer confirms; acts as the idempotency guard that stops
  // duplicate print jobs and blocks further edits.
  designLockedAt: { type: Date, default: null },
  templateId: { type: String },
  printFiles: [{ type: mongoose.Schema.Types.Mixed }],
  printGenerationStatus: { type: String, default: 'pending' },
  printGenerationErrors: [{ type: mongoose.Schema.Types.Mixed }],
  customizationStatus: { type: String, default: 'pending' },
  orderStatus: { type: String, default: 'Pending' }, // Pending -> Approved -> Printing -> Shipped -> Delivered
  adminApprovalStatus: { type: String, default: 'pending' }, // pending, approved, rejected
  printStatus: { type: String, default: 'queued' }, // queued, printing, completed
  deliveryStatus: { type: String, default: 'unfulfilled' }, // unfulfilled, shipped, delivered
  images: [{ type: mongoose.Schema.Types.Mixed }],
  // Snapshot of the composition the customer confirmed, captured the first
  // time an admin edits it so the approved artwork is always recoverable.
  customerApprovedImages: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  designData: { type: mongoose.Schema.Types.Mixed },
  designRevisions: [{ type: mongoose.Schema.Types.Mixed }],
  printerAssignedAt: { type: Date },
  priority: { type: String, default: 'normal' },
  activityLogs: [{
    type: { type: String },
    text: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  shippingAddress: { type: mongoose.Schema.Types.Mixed },
  pdfUrl: { type: String }
}, { timestamps: true });

// Indexes for the queries this app actually runs. Without these, the upload
// portal (hit on every customer page load) and the printer queue both fall
// back to full collection scans.
orderSchema.index({ uploadToken: 1 }, { sparse: true });   // legacy plaintext links
orderSchema.index({ adminApprovalStatus: 1, printStatus: 1 }); // printer queue
orderSchema.index({ 'customer.email': 1 });                // customer order lookup
orderSchema.index({ 'customer.phone': 1 });                // WhatsApp/phone lookup
orderSchema.index({ createdAt: -1 });                      // admin list ordering

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);

