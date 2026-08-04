const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String },
  productType: { type: String },
  printDimensions: { type: mongoose.Schema.Types.Mixed },
  supportedImageCount: { type: Number, default: 1 },
  supportedFileTypes: [{ type: String }],
  orientation: { type: String, default: 'portrait' },
  printingInstructions: { type: String },
  status: { type: String, default: 'active' }
}, { timestamps: true });

module.exports = mongoose.models.SKU || mongoose.model('SKU', skuSchema);
