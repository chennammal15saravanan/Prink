const mongoose = require('mongoose');

const ShopifyOrderSchema = new mongoose.Schema({
  shopifyOrderId: { type: String, required: true, unique: true },
  orderNumber: { type: Number },
  name: { type: String, required: true },
  email: { type: String },
  financialStatus: { type: String },
  fulfillmentStatus: { type: String, default: 'unfulfilled' },
  totalPrice: { type: String },
  currency: { type: String },
  createdAtShopify: { type: Date },
  lineItems: [
    {
      lineItemId: { type: String, required: true },
      title: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: String },
      sku: { type: String },
      productId: { type: String },
      variantId: { type: String }
    }
  ],
  customer: {
    shopifyCustomerId: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  shippingAddress: {
    address1: { type: String },
    address2: { type: String },
    city: { type: String },
    province: { type: String },
    country: { type: String },
    zip: { type: String }
  },
  rawJson: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('ShopifyOrder', ShopifyOrderSchema);
