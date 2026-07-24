const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { resolveTemplate } = require('../config/printTemplates');
const { fromLegacyImage, normalizeTransform } = require('../utils/designTransform');
const { generatePrintPdf } = require('../utils/printRenderer');
const { generatePDF } = require('../utils/pdfGenerator');

/**
 * List every order.
 *
 * Admin only: the documents carry customer names, emails, phone numbers and
 * shipping addresses, so this was previously an unauthenticated dump of the
 * entire customer database.
 */
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const orders = await db.getOrders();
    // Return direct array or object depending on request header/caller
    res.json(req.headers['authorization'] ? orders : { success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias for customer/orders (Filtered by customer token identity)
router.get('/customer/orders', authMiddleware(), async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userPhone = req.user.phone;
    
    // Fetch all orders
    let orders = await db.getOrders();
    
    // Filter matching email, phone, or name
    let customerOrders = [];
    const dummyMatch = userEmail ? userEmail.match(/^(\d+)@customer\.com$/) : null;
    
    if (userEmail || userPhone || req.user.name) {
      customerOrders = orders.filter(o => {
        const matchesEmail = userEmail && (
          String(o.customer?.email || '').toLowerCase() === userEmail.toLowerCase() ||
          String(o.email || '').toLowerCase() === userEmail.toLowerCase()
        );
        const matchesPhone = userPhone && (
          String(o.customer?.phone || '').replace(/\D/g, '') === userPhone.replace(/\D/g, '') ||
          String(o.phone || '').replace(/\D/g, '') === userPhone.replace(/\D/g, '')
        );
        const matchesName = req.user.name && (
          (typeof o.customer === 'object' && o.customer?.name && String(o.customer.name).toLowerCase() === req.user.name.toLowerCase()) ||
          (typeof o.customer === 'string' && String(o.customer).toLowerCase() === req.user.name.toLowerCase())
        );
        const matchesId = dummyMatch && String(o.customer?.id) === dummyMatch[1];
        return matchesEmail || matchesPhone || matchesName || matchesId;
      });
    }

    // FALLBACK: If no orders are in our database for this customer, try to fetch their orders in real-time from Shopify!
    if (customerOrders.length === 0) {
      console.log(`[REAL-TIME SYNC] No database orders found for ${userEmail}. Syncing from Shopify...`);
      const shopifyConfig = require('../config/shopify.config');
      const shopifyService = require('../services/shopify.service');
      const shop = shopifyConfig.store;
      const token = shopifyConfig.accessToken;
      
      if (token && token !== 'your_access_token_here') {
        let shopifyOrders = [];
        
        // Check if the email is a dummy email containing the Shopify ID
        const dummyMatch = userEmail ? userEmail.match(/^(\d+)@customer\.com$/) : null;
        
        if (dummyMatch) {
          // If it's a dummy email, we know the Shopify Customer ID!
          const customerId = dummyMatch[1];
          // We can fetch orders for this specific customer ID using the generic getOrders method (or custom if needed)
          try {
            // Shopify allows querying orders by customer_id
            shopifyOrders = await shopifyService.getOrdersFromShopify(shop, token, { customer_id: customerId, status: 'any' });
          } catch (e) {
             console.error('Error fetching by customer_id', e.message);
          }
        } else {
          const queryParams = { status: 'any' };
          if (userEmail) queryParams.email = userEmail;
          try {
            shopifyOrders = await shopifyService.getOrdersFromShopify(shop, token, queryParams);
          } catch (e) {
             console.error('Error fetching by email', e.message);
          }
        }
        
        if (Array.isArray(shopifyOrders) && shopifyOrders.length > 0) {
          for (const o of shopifyOrders) {
            await shopifyService.syncOrderToDb(o);
          }
          // Re-fetch
          orders = await db.getOrders();
          customerOrders = orders.filter(o => {
            const matchesEmail = userEmail && (
              String(o.customer?.email || '').toLowerCase() === userEmail.toLowerCase() ||
              String(o.email || '').toLowerCase() === userEmail.toLowerCase()
            );
            const matchesPhone = userPhone && (
              String(o.customer?.phone || '').replace(/\D/g, '') === userPhone.replace(/\D/g, '') ||
              String(o.phone || '').replace(/\D/g, '') === userPhone.replace(/\D/g, '')
            );
            const matchesId = dummyMatch && (String(o.customer?.id) === dummyMatch[1] || String(o.shopifyId) === dummyMatch[1]);
            return matchesEmail || matchesPhone || matchesId;
          });
        }
      }
    }

    res.json(customerOrders);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// Create new order. Admin only - real orders originate in Shopify.
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const order = await db.createOrder(req.body);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Order placement is NOT handled here.
 *
 * Shopify is the master of commerce data: orders and payment are created in
 * the storefront, and this app receives them via the orders/create webhook.
 * Creating an order here would produce a THE PRINK order with no Shopify
 * counterpart, no payment and no inventory movement. An explicit 501 tells
 * the caller exactly that instead of leaving an unexplained 404.
 */
router.post('/confirm', (_req, res) => {
  res.status(501).json({
    success: false,
    code: 'PLACED_IN_SHOPIFY',
    error: 'Orders are placed through the THE PRINK Shopify store. '
         + 'Once an order is paid, its personalisation link is created automatically.'
  });
});

/**
 * Legacy token lookup kept for links issued before the portal existed.
 *
 * The token is the only credential, so the response is trimmed to what a
 * customer needs. Returning the raw document would hand back the token itself,
 * the Shopify identifiers and internal workflow state.
 */
router.get('/upload-token/:token', async (req, res) => {
  try {
    const order = await db.getOrderByUploadToken(req.params.token);
    if (!order) return res.status(404).json({ success: false, error: 'Invalid or expired upload token' });

    if (order.uploadTokenExpiresAt && new Date(order.uploadTokenExpiresAt) < new Date()) {
      return res.status(410).json({ success: false, error: 'This upload link has expired.', code: 'TOKEN_EXPIRED' });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || 'Guest',
        product: order.product,
        sku: order.sku,
        quantity: order.quantity,
        uploadStatus: order.uploadStatus,
        customizationStatus: order.customizationStatus,
        designLocked: !!order.designLockedAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin only. Customers reach their own order through the tokenised portal.
router.get('/:id', adminMiddleware, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Customer Upload & Design Submission
// Admin only. The customer path is POST /api/public/order/:token/confirm,
// which validates the token and locks the design.
router.post('/:id/design', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const { images, designData, customizationStatus } = req.body;
    
    const existingOrder = await db.getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check ownership if user is not admin
    if (req.user && req.user.role !== 'admin') {
      const userEmail = req.user.email;
      const userPhone = req.user.phone;
      const o = existingOrder;
      const matchesEmail = userEmail && (
        String(o.customer?.email || '').toLowerCase() === userEmail.toLowerCase() ||
        String(o.email || '').toLowerCase() === userEmail.toLowerCase()
      );
      const matchesPhone = userPhone && (
        String(o.customer?.phone || '').replace(/\D/g, '') === userPhone.replace(/\D/g, '') ||
        String(o.phone || '').replace(/\D/g, '') === userPhone.replace(/\D/g, '')
      );
      const dummyMatch = userEmail ? userEmail.match(/^(\d+)@customer\.com$/) : null;
      const matchesId = dummyMatch && String(o.customer?.id) === dummyMatch[1];
      
      if (!matchesEmail && !matchesPhone && !matchesId) {
        return res.status(403).json({ success: false, error: 'Unauthorized to access this order' });
      }
    }

    const updates = {
      uploadStatus: customizationStatus === 'completed' ? 'completed' : 'in_progress',
      customizationStatus: customizationStatus || 'completed',
      images: images || existingOrder.images || [],
      designData: designData || existingOrder.designData || {}
    };

    const updatedOrder = await db.updateOrder(id, updates);
    await db.addActivityLog(id, 'CUSTOMER_UPLOADED_DESIGN', 'Customer uploaded design and custom images.');
    
    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Review & Approval
router.post('/:id/review', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: 'approve' | 'reject'

    const existingOrder = await db.getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const isApproved = action === 'approve';

    // Approval must not invent a PDF path. Reuse the file produced at design
    // confirmation, and generate it now only if that step failed or predates
    // the print pipeline. An order can never be approved without a real file.
    let printFiles = existingOrder.printFiles || [];
    if (isApproved && printFiles.length === 0) {
      const template = resolveTemplate({
        sku: existingOrder.sku,
        productType: existingOrder.productType,
        productTitle: existingOrder.product
      });
      const isButterfly = (existingOrder.productType || '').toLowerCase() === 'butterfly' || (existingOrder.product || '').toLowerCase().includes('butterfly');
      if (isButterfly) {
        try {
          const filename = await generatePDF(existingOrder.id, existingOrder);
          printFiles.push({ url: `/uploads/${filename}`, dpi: 300, effectiveDpi: 300, widthMm: 210, heightMm: 297, isButterfly: true });
        } catch (err) {
          console.error('[ADMIN APPROVE RENDER ERROR]', existingOrder.id, err.message);
        }
      } else {
        for (const img of existingOrder.images || []) {
          try {
            const file = await generatePrintPdf({
              orderId: existingOrder.id,
              order: existingOrder,
              image: img,
              template,
              transform: img.transform || fromLegacyImage(img)
            });
            printFiles.push({ ...file, imageId: img.id });
          } catch (err) {
            console.error('[ADMIN APPROVE RENDER ERROR]', existingOrder.id, err.message);
          }
        }
      }
      if (printFiles.length === 0) {
        return res.status(422).json({
          success: false,
          error: 'No print-ready file could be generated for this order, so it cannot be approved. Check that the customer uploads are still present.'
        });
      }
    }

    const updates = {
      adminApprovalStatus: isApproved ? 'approved' : 'rejected',
      orderStatus: isApproved ? 'Approved' : 'Pending',
      printStatus: isApproved ? 'queued' : 'hold',
      printFiles,
      pdfUrl: isApproved ? (printFiles[0]?.url || null) : null
    };

    const updatedOrder = await db.updateOrder(id, updates);
    await db.addActivityLog(
      id,
      isApproved ? 'ADMIN_APPROVED' : 'ADMIN_REJECTED',
      `Admin ${req.user?.email || ''} ${action}d the order design. ${comments ? 'Comments: ' + comments : ''}`
    );

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Assign an approved order to the print floor.
 * Only approved work may be routed, so an unreviewed design can never reach a
 * printer by calling this directly.
 */
router.post('/:id/route-to-printer', adminMiddleware, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (order.adminApprovalStatus !== 'approved') {
      return res.status(409).json({
        success: false,
        error: 'Approve this design before routing it to the print queue.'
      });
    }
    if (!(order.printFiles || []).length) {
      return res.status(409).json({
        success: false,
        error: 'This order has no print-ready file, so it cannot be routed to a printer.'
      });
    }

    const updated = await db.updateOrder(order.id, {
      printStatus: 'queued',
      orderStatus: 'Approved',
      printerAssignedAt: new Date()
    });
    await db.addActivityLog(order.id, 'PRINTER_ASSIGNED',
      `Admin ${req.user?.email || ''} routed the order to the print queue.`);

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Regenerate the print file from the ORIGINAL asset and the stored transform.
 * Guarded so two rapid clicks cannot run two renders for the same order.
 */
const regenerating = new Set();

router.post('/:id/regenerate', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  if (regenerating.has(id)) {
    return res.status(409).json({ success: false, error: 'A print file is already being generated for this order.' });
  }
  regenerating.add(id);
  try {
    const order = await db.getOrderById(id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (!(order.images || []).length) {
      return res.status(422).json({ success: false, error: 'This order has no customer photos to render.' });
    }

    const template = resolveTemplate({
      sku: order.sku, productType: order.productType, productTitle: order.product
    });

    const printFiles = [];
    const failures = [];
    const isButterfly = (order.productType || '').toLowerCase() === 'butterfly' || (order.product || '').toLowerCase().includes('butterfly');
    if (isButterfly) {
      try {
        const filename = await generatePDF(order.id, order);
        printFiles.push({ url: `/uploads/${filename}`, dpi: 300, effectiveDpi: 300, widthMm: 210, heightMm: 297, isButterfly: true });
      } catch (err) {
        failures.push({ error: err.message });
      }
    } else {
      for (const img of order.images) {
        try {
          const file = await generatePrintPdf({
            orderId: order.id, order, image: img, template,
            transform: img.transform || fromLegacyImage(img)
          });
          printFiles.push({ ...file, imageId: img.id });
        } catch (err) {
          failures.push({ imageId: img.id, error: err.message });
        }
      }
    }

    if (!printFiles.length) {
      return res.status(422).json({ success: false, error: 'Print generation failed.', failures });
    }

    const updateData = {
      printFiles,
      templateId: template.id,
      pdfUrl: printFiles[0].url,
      printGenerationStatus: failures.length ? 'partial' : 'completed',
      printGenerationErrors: failures
    };

    const updated = await db.updateOrder(id, updateData);
    await db.addActivityLog(id, 'PDF_REGENERATED',
      `Admin ${req.user?.email || ''} regenerated the print file (${printFiles.length}/${order.images.length}).`);

    console.log(`[WORKFLOW LOG] STEP 13 - Admin Generated Production File for Order ${id}`);

    res.json({ success: true, order: updated, printFiles, failures });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    regenerating.delete(id);
  }
});

/**
 * Admin design editor save.
 *
 * Creates a NEW design revision rather than overwriting the customer-approved
 * composition - `customerApprovedImages` is captured once, the first time an
 * admin edits, so the original approved artwork can always be recovered.
 * The print file is then regenerated from the ORIGINAL assets.
 */
router.post('/:id/submit-design', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  if (regenerating.has(id)) {
    return res.status(409).json({ success: false, error: 'This order is already being processed.' });
  }
  regenerating.add(id);
  try {
    const order = await db.getOrderById(id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const { designData, images } = req.body || {};
    const revisions = Array.isArray(order.designRevisions) ? order.designRevisions : [];

    const updates = {
      designData: designData ?? order.designData,
      designRevisions: [
        ...revisions,
        {
          revision: revisions.length + 1,
          editedBy: req.user?.email || 'admin',
          editedAt: new Date(),
          designData: designData ?? order.designData
        }
      ]
    };

    // Preserve the customer-approved composition the first time it is edited.
    if (!order.customerApprovedImages) {
      updates.customerApprovedImages = order.images || [];
    }

    // Admin may adjust transforms; originals are never replaced.
    if (Array.isArray(images) && images.length) {
      const byId = new Map(images.map(i => [i.id, i]));
      updates.images = (order.images || []).map(img => {
        const patch = byId.get(img.id);
        return patch && patch.transform
          ? { ...img, transform: normalizeTransform(patch.transform) }
          : img;
      });
    }

    await db.updateOrder(id, updates);

    // Regenerate the print output so the stored file matches the new design.
    const refreshed = await db.getOrderById(id);
    const template = resolveTemplate({
      sku: refreshed.sku, productType: refreshed.productType, productTitle: refreshed.product
    });

    const printFiles = [];
    const failures = [];
    const isButterfly = (refreshed.productType || '').toLowerCase() === 'butterfly' || (refreshed.product || '').toLowerCase().includes('butterfly');
    if (isButterfly) {
      try {
        const filename = await generatePDF(refreshed.id, refreshed);
        printFiles.push({ url: `/uploads/${filename}`, dpi: 300, effectiveDpi: 300, widthMm: 210, heightMm: 297, isButterfly: true });
      } catch (err) {
        failures.push({ error: err.message });
      }
    } else {
      for (const img of refreshed.images || []) {
        try {
          const file = await generatePrintPdf({
            orderId: refreshed.id, order: refreshed, image: img, template,
            transform: img.transform || fromLegacyImage(img)
          });
          printFiles.push({ ...file, imageId: img.id });
        } catch (err) {
          failures.push({ imageId: img.id, error: err.message });
        }
      }
    }

    const finalOrder = await db.updateOrder(id, {
      printFiles: printFiles.length ? printFiles : refreshed.printFiles,
      pdfUrl: printFiles.length ? printFiles[0].url : refreshed.pdfUrl,
      printGenerationStatus: failures.length ? (printFiles.length ? 'partial' : 'failed') : 'completed',
      printGenerationErrors: failures
    });

    await db.addActivityLog(id, 'ADMIN_EDITED_DESIGN', 'An administrator edited the design layout or photos.');
    
    console.log(`[WORKFLOW LOG] STEP 12 - Admin Edited Design for Order ${id}`);
    res.json({ success: true, order: finalOrder, revision: updates.designRevisions.length, printFiles, failures });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    regenerating.delete(id);
  }
});

/**
 * Reveal an order's upload token to an administrator.
 *
 * Lets staff re-send the WhatsApp link, or upload on a customer's behalf by
 * driving the same token-authenticated portal endpoints the customer uses.
 * Routing admin uploads through that one pipeline means originals, resolution
 * checks and transform handling cannot drift between the two paths.
 */
router.get('/:id/upload-token', adminMiddleware, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (!order.uploadToken) {
      return res.status(404).json({ success: false, error: 'This order has no upload link yet.' });
    }

    res.json({
      success: true,
      token: order.uploadToken,
      uploadLink: order.uploadLink,
      expiresAt: order.uploadTokenExpiresAt || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Admin override: approve without waiting for the customer to press Confirm
 * (used when a customer has uploaded but gone quiet).
 *
 * It still refuses to approve an order with no artwork - "force" shortcuts the
 * customer's confirmation, not the requirement for a real print file, because
 * approving an empty order would send a blank sheet to the press.
 */
router.post('/:id/force-approve', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  if (regenerating.has(id)) {
    return res.status(409).json({ success: false, error: 'This order is already being processed.' });
  }
  regenerating.add(id);
  try {
    const order = await db.getOrderById(id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (!(order.images || []).length) {
      return res.status(422).json({
        success: false,
        error: 'This order has no customer photos, so it cannot be approved for printing.'
      });
    }

    let printFiles = order.printFiles || [];
    if (!printFiles.length) {
      const template = resolveTemplate({
        sku: order.sku, productType: order.productType, productTitle: order.product
      });
      const isButterfly = (order.productType || '').toLowerCase() === 'butterfly' || (order.product || '').toLowerCase().includes('butterfly');
      if (isButterfly) {
        try {
          const filename = await generatePDF(order.id, order);
          printFiles.push({ url: `/uploads/${filename}`, dpi: 300, effectiveDpi: 300, widthMm: 210, heightMm: 297, isButterfly: true });
        } catch (err) {
          console.error('[FORCE APPROVE RENDER ERROR]', id, err.message);
        }
      } else {
        for (const img of order.images) {
          try {
            const file = await generatePrintPdf({
              orderId: order.id, order, image: img, template,
              transform: img.transform || fromLegacyImage(img)
            });
            printFiles.push({ ...file, imageId: img.id });
          } catch (err) {
            console.error('[FORCE APPROVE RENDER ERROR]', id, err.message);
          }
        }
      }
      if (!printFiles.length) {
        return res.status(422).json({ success: false, error: 'No print-ready file could be generated for this order.' });
      }
    }

    const updateData = {
      designLockedAt: order.designLockedAt || new Date(),
      customizationStatus: 'completed',
      uploadStatus: 'ready',
      adminApprovalStatus: 'approved',
      orderStatus: 'Approved',
      printStatus: 'queued',
      printFiles,
      pdfUrl: printFiles[0].url
    };
    
    await db.addActivityLog(id, 'PDF_REGENERATED', `An administrator generated a new production print file.`);

    const updated = await db.updateOrder(id, updateData);
    console.log(`[WORKFLOW LOG] STEP 13 - Admin Generated Production File for Order ${id}`);

    await db.addActivityLog(id, 'ADMIN_FORCE_APPROVED',
      `Admin ${req.user?.email || ''} force-approved this order without customer confirmation.`);

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    regenerating.delete(id);
  }
});

/**
 * AI upscaling is not implemented.
 *
 * Resampling a low-resolution photo to hit a pixel count does NOT create
 * detail; it would produce a file that claims 300 DPI while printing soft.
 * That is exactly the false-DPI claim this system must not make, so this
 * returns an explicit 501 rather than silently faking it. Wiring a real
 * super-resolution service here is the intended extension point.
 */
router.post('/:id/upscale', adminMiddleware, (_req, res) => {
  res.status(501).json({
    success: false,
    code: 'NOT_IMPLEMENTED',
    error: 'AI upscaling is not configured. Resampling cannot add real detail, so low-resolution '
         + 'photos must be re-requested from the customer rather than upscaled.'
  });
});

/** Restore the composition exactly as the customer approved it. */
router.post('/:id/restore-customer-design', adminMiddleware, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (!order.customerApprovedImages) {
      return res.status(409).json({ success: false, error: 'This order has not been edited, so there is nothing to restore.' });
    }

    const updated = await db.updateOrder(req.params.id, { images: order.customerApprovedImages });
    await db.addActivityLog(req.params.id, 'ADMIN_RESTORED_CUSTOMER_DESIGN',
      `Admin ${req.user?.email || ''} restored the customer-approved composition.`);
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Queue a customer notification (upload link / reminder).
 *
 * WhatsApp delivery is not configured in this environment, so the notification
 * is recorded and the workflow continues. The record carries a dedupe key so a
 * repeated click cannot enqueue the same message twice, and a delivery failure
 * never corrupts the order state.
 */
router.post('/:id/notify', adminMiddleware, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const kind = String(req.body?.type || 'upload_link');
    const { sendCustomerNotification } = require('../services/notification.service');
    const result = await sendCustomerNotification(order, kind);

    res.json({
      success: true,
      queued: result.queued,
      duplicate: result.duplicate,
      channel: result.channel,
      delivered: result.delivered,
      message: result.message
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update order status (General status patch)
// Admin only - anyone could otherwise drive any order to any status.
router.patch('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status, orderStatus, printStatus, deliveryStatus } = req.body;
    const updates = {};

    if (orderStatus) updates.orderStatus = orderStatus;
    if (status) updates.orderStatus = status;
    if (printStatus) updates.printStatus = printStatus;
    if (deliveryStatus) updates.deliveryStatus = deliveryStatus;

    const order = await db.updateOrder(req.params.id, updates);
    if (orderStatus || status) {
      await db.addActivityLog(req.params.id, 'STATUS_UPDATE', `Order status updated to ${orderStatus || status}`);
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete order
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await db.deleteOrderById(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

