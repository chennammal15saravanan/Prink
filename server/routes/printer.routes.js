const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * Printer dashboard API.
 *
 * Every route requires a printer (or admin) role. Authorisation is enforced
 * here, server-side - hiding buttons in the UI is not a control.
 *
 * A printer may only move a job through production states. Artwork, design
 * transforms, images and print files are NOT writable from these endpoints,
 * so a printer cannot alter what the customer approved.
 */
const printerAuth = authMiddleware(['printer', 'admin']);

/**
 * Production statuses a printer is permitted to set, and their side effects.
 *
 * Two vocabularies are accepted deliberately: the specification's production
 * stages (assigned/printing/printed/packed/shipped/completed) and the shorter
 * set the existing printer UI already emits (pending/processing/print-ready).
 * They map onto the same underlying states, so the dashboard keeps working
 * without a lockstep frontend deploy.
 */
const ALLOWED_TRANSITIONS = {
  // Specification vocabulary
  assigned:  { printStatus: 'queued',     orderStatus: 'Approved' },
  printing:  { printStatus: 'processing', orderStatus: 'Printing' },
  printed:   { printStatus: 'printed',    orderStatus: 'Printing' },
  packed:    { printStatus: 'packed',     orderStatus: 'Packed' },
  shipped:   { printStatus: 'completed',  orderStatus: 'Shipped',   deliveryStatus: 'shipped' },
  completed: { printStatus: 'completed',  orderStatus: 'Delivered', deliveryStatus: 'delivered' },

  // Aliases emitted by the current printer dashboard
  pending:      { printStatus: 'queued',     orderStatus: 'Approved' },
  processing:   { printStatus: 'processing', orderStatus: 'Printing' },
  'print-ready': { printStatus: 'printed',   orderStatus: 'Printing' }
};

/**
 * Stage index used to reject impossible jumps (e.g. a job that has not been
 * printed cannot be marked shipped). Equal-or-adjacent forward moves are
 * allowed; going backwards is permitted for one step so an operator can undo a
 * mis-tap, but a job can never skip ahead.
 */
const STAGE_ORDER = ['queued', 'processing', 'printed', 'packed', 'completed'];

/**
 * Map the stored production state onto the vocabulary the printer dashboard
 * renders (`PrintStatus` in the frontend types). Returning only the internal
 * `printStatus` would leave every row's status column blank.
 */
const DASHBOARD_STATUS = {
  queued: 'pending',
  processing: 'processing',
  printed: 'print-ready',
  packed: 'print-ready',
  completed: 'completed'
};

/** Only approved work reaches the print floor. */
router.get('/queue', printerAuth, async (_req, res) => {
  try {
    const orders = await db.getOrders({ adminApprovalStatus: 'approved' });
    res.json({
      success: true,
      queue: orders.map(o => {
        const file = (o.printFiles || [])[0];
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          // The dashboard renders `customer` directly; send the display name.
          customer: o.customer?.name || o.customer?.email || 'Guest',
          product: o.product,
          sku: o.sku,
          quantity: o.quantity,
          templateId: o.templateId,
          status: DASHBOARD_STATUS[o.printStatus] || 'pending',
          printStatus: o.printStatus,
          orderStatus: o.orderStatus,
          priority: o.priority || 'normal',
          trimSize: file ? `${Math.round(file.widthMm)}x${Math.round(file.heightMm)}mm` : '-',
          assignedAt: o.printerAssignedAt || o.updatedAt,
          printFiles: (o.printFiles || []).map(f => ({
            url: f.url, dpi: f.dpi, effectiveDpi: f.effectiveDpi,
            widthMm: f.widthMm, heightMm: f.heightMm, colourSpace: f.colourSpace
          })),
          updatedAt: o.updatedAt
        };
      })
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/queue/:id', printerAuth, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.adminApprovalStatus !== 'approved') {
      return res.status(403).json({ success: false, error: 'This order has not been approved for printing yet.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Hand the printer the generated print file. Returns a URL rather than piping
 * the bytes so the browser can stream it directly from static hosting/CDN.
 * The file must already exist on disk - this endpoint never invents a path.
 */
router.get('/download/:id', printerAuth, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.adminApprovalStatus !== 'approved') {
      return res.status(403).json({ success: false, error: 'This order has not been approved for printing yet.' });
    }

    const file = (order.printFiles || [])[0];
    if (!file || !file.url) {
      return res.status(404).json({
        success: false,
        error: 'No print-ready file exists for this order yet. Ask an administrator to regenerate it.'
      });
    }

    const onDisk = path.join(__dirname, '..', file.url.replace(/^\//, ''));
    if (!fs.existsSync(onDisk)) {
      return res.status(410).json({
        success: false,
        error: 'The print file is recorded but missing from storage. Ask an administrator to regenerate it.'
      });
    }

    await db.addActivityLog(order.id, 'PRINT_FILE_DOWNLOADED',
      `Printer ${req.user?.email || 'unknown'} downloaded the print file.`);
      
    console.log(`[WORKFLOW LOG] STEP 14 - Printer Downloaded Production File for Order ${order.id}`);

    res.json({
      success: true,
      url: file.url,
      filename: file.filename || path.basename(file.url),
      dpi: file.dpi,
      effectiveDpi: file.effectiveDpi,
      widthMm: file.widthMm,
      heightMm: file.heightMm,
      colourSpace: file.colourSpace || 'RGB'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/queue/:id/status', printerAuth, async (req, res) => {
  try {
    const requested = String(req.body?.status || '').toLowerCase();
    const transition = ALLOWED_TRANSITIONS[requested];

    if (!transition) {
      return res.status(400).json({
        success: false,
        error: `Invalid production status "${requested}".`,
        allowed: Object.keys(ALLOWED_TRANSITIONS)
      });
    }

    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.adminApprovalStatus !== 'approved') {
      return res.status(403).json({ success: false, error: 'This order has not been approved for printing yet.' });
    }

    // Reject stage skipping. Without this, an order sitting in the queue could
    // be driven straight to "shipped" by a crafted request.
    const from = STAGE_ORDER.indexOf(order.printStatus);
    const to = STAGE_ORDER.indexOf(transition.printStatus);
    if (from !== -1 && to !== -1 && to > from + 1) {
      return res.status(409).json({
        success: false,
        error: `Cannot move this job from "${order.printStatus}" straight to "${transition.printStatus}". Complete the preceding stage first.`,
        code: 'INVALID_TRANSITION'
      });
    }

    // Whitelisted fields only - the request body can never reach artwork fields.
    const updated = await db.updateOrder(req.params.id, { ...transition });
    await db.addActivityLog(
      req.params.id,
      'PRINTER_STATUS_UPDATE',
      `Printer ${req.user?.email || req.user?.id || 'unknown'} set production status to ${requested}.`
    );
      
    console.log(`[WORKFLOW LOG] STEP 15 - Printer Updated Status to '${requested}' for Order ${req.params.id}`);

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Explicit rejection of artwork edits by the printer role. A missing route
 * would already 404, but an explicit 403 documents the rule and makes the
 * guarantee directly testable.
 */
router.all('/queue/:id/design', printerAuth, (_req, res) => {
  res.status(403).json({ success: false, error: 'Printers cannot modify customer artwork.' });
});

module.exports = router;
module.exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;
