const crypto = require('crypto');
const db = require('../db');
const ShopifyOrder = require('../models/ShopifyOrder');
const notificationService = require('./notification.service');

/**
 * Parses Shopify Order payload, checks for duplicates, saves to MongoDB,
 * and generates a unique customer upload link.
 */
async function processShopifyOrderWebhook(payload, topic = 'orders/create') {
  if (!payload || (!payload.id && !payload.order_number)) {
    throw new Error('Invalid Shopify order payload');
  }

  const shopifyId = String(payload.id || '');
  const orderId = payload.name || `ORD-${payload.order_number || payload.id}`;
  
  console.log(`\n======================================================`);
  console.log(`[WORKFLOW LOG] STEP 1 & 2 - Shopify Order Created & Webhook Received`);
  console.log(`[WORKFLOW LOG] Processing Shopify order ${orderId} (Shopify ID: ${shopifyId})`);
  console.log(`======================================================\n`);

  // 1. Prevent duplicate orders by checking existing MongoDB records
  const existingOrder = await db.getOrderByShopifyId(shopifyId) || await db.getOrderById(orderId);
  if (existingOrder) {
    console.log(`[SHOPIFY WEBHOOK SERVICE] Duplicate order detected for orderId: ${existingOrder.id}. Updating record.`);
  }

  // 2. Parse Customer Info
  const customer = {
    name: payload.customer 
      ? `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim() 
      : (payload.shipping_address?.name || 'Valued Customer'),
    email: payload.email || payload.customer?.email || '',
    phone: payload.shipping_address?.phone || payload.customer?.phone || payload.phone || ''
  };

  // 3. Extract Line Items / Product Details
  const lineItems = payload.line_items || [];
  const firstItem = lineItems[0] || {};
  const productTitle = firstItem.title || 'Custom Photo Product';
  const sku = firstItem.sku || 'CUSTOM-SKU';
  const quantity = firstItem.quantity || 1;

  // 4. Generate Unique Customer Upload Link & Token.
  // Reuse the existing token on a repeat webhook so a previously shared
  // WhatsApp link never stops working.
  const isNewToken = !existingOrder?.uploadToken;
  const uploadToken = existingOrder?.uploadToken || crypto.randomBytes(32).toString('hex');
  const uploadTokenHash = crypto.createHash('sha256').update(uploadToken).digest('hex');
  const expiryDays = Number(process.env.UPLOAD_LINK_EXPIRY_DAYS || 30);
  const uploadTokenExpiresAt = existingOrder?.uploadTokenExpiresAt
    || new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  const baseUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:3001';
  const uploadLink = `${baseUrl}/upload/${uploadToken}`;

  // 5. Build Parsed Order Payload
  const orderData = {
    id: orderId,
    shopifyId,
    orderNumber: String(payload.order_number || payload.id),
    customer,
    product: productTitle,
    productType: firstItem.name || productTitle,
    sku,
    quantity,
    totalPrice: payload.total_price || '0.00',
    uploadToken,
    uploadTokenHash,
    uploadTokenExpiresAt,
    uploadLink,
    uploadStatus: existingOrder?.uploadStatus || 'pending',
    customizationStatus: existingOrder?.customizationStatus || 'pending',
    orderStatus: existingOrder?.orderStatus || 'Pending',
    adminApprovalStatus: existingOrder?.adminApprovalStatus || 'pending',
    printStatus: existingOrder?.printStatus || 'queued',
    deliveryStatus: existingOrder?.deliveryStatus || 'unfulfilled',
    shippingAddress: payload.shipping_address || {},
    activityLogs: existingOrder?.activityLogs || [
      {
        type: 'WEBHOOK_RECEIVED',
        text: `Order ${orderId} received from Shopify via webhook (${topic}).`,
        timestamp: new Date()
      },
      {
        type: 'UPLOAD_LINK_GENERATED',
        text: `Customer upload link generated: ${uploadLink}`,
        timestamp: new Date()
      }
    ]
  };

  // 6. Save or Update Order in MongoDB
  const savedOrder = await db.upsertOrder({ id: orderId }, orderData);
  console.log(`[WORKFLOW LOG] STEP 3 - Created/Updated Workflow in MongoDB for Order ${orderId}`);

  // 7. Store Raw & Structured Shopify Order Log
  try {
    await ShopifyOrder.findOneAndUpdate(
      { shopifyOrderId: shopifyId },
      {
        shopifyOrderId: shopifyId,
        orderNumber: payload.order_number,
        name: payload.name || orderId,
        email: customer.email,
        financialStatus: payload.financial_status,
        fulfillmentStatus: payload.fulfillment_status || 'unfulfilled',
        totalPrice: payload.total_price,
        currency: payload.currency,
        createdAtShopify: payload.created_at ? new Date(payload.created_at) : new Date(),
        lineItems: lineItems.map(item => ({
          lineItemId: String(item.id),
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
          productId: String(item.product_id),
          variantId: String(item.variant_id)
        })),
        customer: {
          shopifyCustomerId: String(payload.customer?.id || ''),
          firstName: payload.customer?.first_name,
          lastName: payload.customer?.last_name,
          email: payload.customer?.email,
          phone: customer.phone
        },
        shippingAddress: payload.shipping_address,
        rawJson: payload
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('[SHOPIFY WEBHOOK SERVICE] Error saving ShopifyOrder log:', err.message);
  }

  // 8. Automatically dispatch WhatsApp Upload Link notification
  try {
    if (isNewToken || existingOrder?.uploadStatus === 'pending') {
      await notificationService.sendNotification(savedOrder, 'upload_link');
      console.log(`[WORKFLOW LOG] STEP 4 - WhatsApp Trigger Sent for Order ${orderId} with Upload Link: ${uploadLink}`);
    }
  } catch (err) {
    console.error('[SHOPIFY WEBHOOK SERVICE] Failed to trigger WhatsApp notification:', err.message);
  }

  console.log(`[SHOPIFY WEBHOOK SERVICE] Successfully processed order ${orderId}. Upload Link: ${uploadLink}`);
  return { order: savedOrder, uploadLink, uploadToken };
}

module.exports = {
  processShopifyOrderWebhook
};
