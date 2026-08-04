const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth.middleware');

// Register
/**
 * Public self-registration.
 *
 * The role is FORCED to 'customer'. Honouring `role` from the request body -
 * as this route previously did - let anyone mint an admin or printer account
 * simply by posting `{"role":"admin"}`. Staff accounts are provisioned by an
 * administrator through POST /api/users.
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with that email already exists.' });
    }

    const user = await db.createUser({ email, password, name, phone, role: 'customer' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
/**
 * Verify credentials and, optionally, that the account holds a required role.
 *
 * Rules enforced here (all three were previously missing, which allowed anyone
 * to mint an admin token by POSTing to /admin-login):
 *   - a password is always required and always bcrypt-compared
 *   - an account with no password hash can never be logged into
 *   - the role is read from the STORED user, never from the request
 *
 * The response text is identical for every failure so the endpoint cannot be
 * used to enumerate which emails or roles exist.
 */
async function authenticate(email, password, requiredRole) {
  const generic = { ok: false, status: 401, error: 'Invalid email or password' };

  if (!email || !password) {
    return { ok: false, status: 400, error: 'Email and password are required' };
  }

  const user = await db.getUserByEmail(email);
  if (!user || !user.passwordHash) return generic;
  if (!bcrypt.compareSync(password, user.passwordHash)) return generic;
  if (user.status && user.status !== 'active') {
    return { ok: false, status: 403, error: 'This account is not active' };
  }
  if (requiredRole && user.role !== requiredRole) return generic;

  return { ok: true, user };
}

function issueToken(user) {
  // The role always comes from the stored record.
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await authenticate(email, password);
    if (!result.ok) return res.status(result.status).json({ success: false, error: result.error });

    await db.updateLastLogin(email);
    const { user } = result;
    res.json({
      success: true,
      token: issueToken(user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * First-run bootstrap: allow creating the very first admin ONLY while no admin
 * exists. Once one does, this path is permanently closed and further admins
 * must be created through the authenticated /api/users endpoint.
 */
async function bootstrapFirstAdmin(email, password) {
  const users = await db.getUsers();
  if ((users || []).some(u => u.role === 'admin')) return null;
  if (!password || String(password).length < 8) {
    throw Object.assign(new Error('The first admin password must be at least 8 characters.'), { status: 400 });
  }
  console.warn(`[AUTH] Bootstrapping the first admin account: ${email}`);
  return db.createUser({ email, password, name: 'Admin', role: 'admin' });
}

async function bootstrapFirstPrinter(email, password) {
  const users = await db.getUsers();
  if ((users || []).some(u => u.role === 'printer')) return null;
  if (!password || String(password).length < 8) {
    throw Object.assign(new Error('The first printer password must be at least 8 characters.'), { status: 400 });
  }
  console.warn(`[AUTH] Bootstrapping the first printer account: ${email}`);
  return db.createUser({ email, password, name: 'Printer Operator', role: 'printer' });
}

router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const bootstrapped = await bootstrapFirstAdmin(email, password);
    if (bootstrapped) {
      return res.json({
        success: true,
        bootstrapped: true,
        token: issueToken(bootstrapped),
        user: { id: bootstrapped.id, email: bootstrapped.email, role: 'admin' }
      });
    }

    const result = await authenticate(email, password, 'admin');
    if (!result.ok) return res.status(result.status).json({ success: false, error: result.error });

    await db.updateLastLogin(email);
    const { user } = result;
    res.json({ success: true, token: issueToken(user), user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * Demo/customer convenience login used by the storefront's "try it" button.
 * Disabled unless ENABLE_DEMO_LOGIN=true, so it cannot become a production
 * backdoor. It can only ever mint a customer-role token.
 */
router.post('/demo-login', async (req, res) => {
  try {
    if (String(process.env.ENABLE_DEMO_LOGIN).toLowerCase() !== 'true') {
      return res.status(404).json({ success: false, error: 'Demo login is disabled.' });
    }

    const name = String(req.body?.name || 'Demo Customer').slice(0, 80);
    const phone = String(req.body?.phone || '').slice(0, 20);
    const email = `demo_${Buffer.from(name).toString('hex').slice(0, 12)}@demo.theprink.local`;

    let user = await db.getUserByEmail(email);
    if (!user) {
      user = await db.createUser({ email, name, phone, role: 'customer', password: crypto.randomBytes(24).toString('hex') });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, phone: user.phone || '', role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: 'customer' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/printer-login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const bootstrapped = await bootstrapFirstPrinter(email, password);
    if (bootstrapped) {
      return res.json({
        success: true,
        bootstrapped: true,
        token: issueToken(bootstrapped),
        user: { id: bootstrapped.id, email: bootstrapped.email, role: 'printer' }
      });
    }

    const result = await authenticate(email, password, 'printer');
    if (!result.ok) return res.status(result.status).json({ success: false, error: result.error });

    await db.updateLastLogin(email);
    const { user } = result;
    res.json({ success: true, token: issueToken(user), user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Shopify Dev Login helper route
router.post('/shopify-dev-login', async (req, res) => {
  try {
    const { query, customerId, email, firstName, lastName, phone } = req.body;
    let identifier = query || customerId || email || '';
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Please enter a Phone Number, Email, or Order ID' });
    }
    identifier = String(identifier).trim();

    let user = null;
    let targetShopifyOrderId = null;

    // 1. Try to find the exact order by ID, Order Number, Email, or Phone
    const orders = await db.getOrders();
    const cleanId = identifier.replace(/^#/, ''); // Remove # if they typed #1001
    const cleanPhone = identifier.replace(/\D/g, ''); // Extract just digits

    const matchedOrder = orders.find(o => {
      if (String(o.orderNumber) === cleanId) return true;
      if (String(o.shopifyId) === identifier) return true;
      if (String(o.id).includes(cleanId)) return true;
      if (String(o.customer?.email || '').toLowerCase() === identifier.toLowerCase()) return true;
      
      if (cleanPhone.length > 5) {
        if (o.customer?.phone && String(o.customer.phone).replace(/\D/g, '') === cleanPhone) return true;
        if (o.phone && String(o.phone).replace(/\D/g, '') === cleanPhone) return true;
        if (o.shippingAddress?.phone && String(o.shippingAddress.phone).replace(/\D/g, '') === cleanPhone) return true;
      }
      return false;
    });

    if (!matchedOrder) {
      // Dynamic fallback: reach out to Shopify!
      const shopifyService = require('../services/shopify.service');
      const shopifyConfig = require('../config/shopify.config');
      
      try {
        let fetchedShopifyOrders = [];
        const shop = shopifyConfig.store;
        const shToken = shopifyConfig.accessToken;

        if (shToken && shToken !== 'your_access_token_here') {
          if (identifier.includes('@')) {
            fetchedShopifyOrders = await shopifyService.getOrdersFromShopify(shop, shToken, { email: identifier, status: 'any' });
          } else if (cleanPhone.length > 5) {
            const customers = await shopifyService.searchCustomersFromShopify(shop, shToken, { query: `phone:${cleanPhone}` });
            if (customers && customers.length > 0) {
              const matchedCustomer = customers.find(c => {
                if (c.phone && c.phone.replace(/\D/g, '') === cleanPhone) return true;
                if (c.default_address?.phone && c.default_address.phone.replace(/\D/g, '') === cleanPhone) return true;
                return false;
              }) || customers[0]; // fallback to first if strict match fails but query succeeded
              
              fetchedShopifyOrders = await shopifyService.getOrdersFromShopify(shop, shToken, { customer_id: matchedCustomer.id, status: 'any' });
            }
          } else {
            fetchedShopifyOrders = await shopifyService.getOrdersFromShopify(shop, shToken, { name: identifier, status: 'any' });
          }

          if (fetchedShopifyOrders && fetchedShopifyOrders.length > 0) {
            for (const shOrder of fetchedShopifyOrders) {
              await shopifyService.syncOrderToDb(shOrder);
            }
            const latestDbOrders = await db.getOrders();
            matchedOrder = latestDbOrders.find(o => String(o.shopifyId) === String(fetchedShopifyOrders[0].id));
          }
        }
      } catch (err) {
        console.error('Dynamic Shopify Fetch Error:', err.message);
      }
    }

    if (matchedOrder) {
      targetShopifyOrderId = matchedOrder.shopifyId; // Found the specific order!
      
      const targetEmail = matchedOrder.customer?.email || `${matchedOrder.shopifyId}@customer.com`;
      user = await db.getUserByEmail(targetEmail);
      if (!user) {
        user = await db.createUser({
          email: targetEmail,
          password: 'customer123',
          name: matchedOrder.customer?.name || 'Customer',
          phone: matchedOrder.customer?.phone || '',
          role: 'customer'
        });
      }
    } else {
      // 2. If no order matched, just try logging in by email or phone
      if (identifier.includes('@') || cleanPhone.length >= 7) {
        const fallbackEmail = identifier.includes('@') ? identifier : `${cleanPhone}@customer.com`;
        user = await db.getUserByEmail(fallbackEmail);
        if (!user) {
          user = await db.createUser({
            email: fallbackEmail,
            password: 'customer123',
            name: 'Customer',
            phone: identifier.includes('@') ? '' : cleanPhone,
            role: 'customer'
          });
        }
      } else {
        return res.status(404).json({ success: false, error: 'No order or account found matching those details.' });
      }
    }

    const payload = { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      phone: user.phone || '', 
      role: 'customer'
    };
    
    if (targetShopifyOrderId) {
      payload.shopifyOrderId = targetShopifyOrderId;
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: payload });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// Request OTP
router.post('/otp-request', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    // Check if there is an order with this phone number
    const orders = await db.getOrders();
    const cleanPhone = phone.replace(/\D/g, '');
    const matched = orders.find(o => 
      (o.customer?.phone && String(o.customer.phone).replace(/\D/g, '') === cleanPhone) ||
      (o.phone && String(o.phone).replace(/\D/g, '') === cleanPhone)
    );
    console.log(`[OTP REQUEST] OTP requested for phone: ${phone}. Order found: ${!!matched}`);
    res.json({ success: true, message: 'OTP sent successfully (demo: 1234)' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify OTP
router.post('/otp-verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, error: 'Phone and code are required' });
    }
    if (code !== '1234') {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const orders = await db.getOrders();
    const matchedOrder = orders.find(o => 
      (o.customer?.phone && String(o.customer.phone).replace(/\D/g, '') === cleanPhone) ||
      (o.phone && String(o.phone).replace(/\D/g, '') === cleanPhone)
    );

    let user;
    if (matchedOrder && matchedOrder.customer) {
      const email = matchedOrder.customer.email || `${cleanPhone}@customer.com`;
      user = await db.getUserByEmail(email);
      if (!user) {
        user = await db.createUser({
          email,
          password: 'customer123',
          name: matchedOrder.customer.name || 'Shopify Customer',
          phone: phone,
          role: 'customer'
        });
      }
    } else {
      const email = `${cleanPhone}@customer.com`;
      user = await db.getUserByEmail(email);
      if (!user) {
        user = await db.createUser({
          email,
          password: 'customer123',
          name: 'Shopify Customer',
          phone: phone,
          role: 'customer'
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, phone: user.phone || '', role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: 'customer' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// WhatsApp Login
router.post('/whatsapp-login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const orders = await db.getOrders();
    const matchedOrder = orders.find(o => 
      (o.customer?.phone && String(o.customer.phone).replace(/\D/g, '') === cleanPhone) ||
      (o.phone && String(o.phone).replace(/\D/g, '') === cleanPhone)
    );

    let user;
    if (matchedOrder && matchedOrder.customer) {
      const email = matchedOrder.customer.email || `${cleanPhone}@customer.com`;
      user = await db.getUserByEmail(email);
      if (!user) {
        user = await db.createUser({
          email,
          password: 'customer123',
          name: matchedOrder.customer.name || 'Shopify Customer',
          phone: phone,
          role: 'customer'
        });
      }
    } else {
      const email = `${cleanPhone}@customer.com`;
      user = await db.getUserByEmail(email);
      if (!user) {
        user = await db.createUser({
          email,
          password: 'customer123',
          name: 'Shopify Customer',
          phone: phone,
          role: 'customer'
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, phone: user.phone || '', role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: 'customer' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware(), async (req, res) => {
  try {
    const user = await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Validate Unique Upload Token (One-Click Login)
router.get('/upload-link/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const mongoose = require('mongoose');
    const ShopifyOrder = mongoose.model('ShopifyOrder');
    const order = await ShopifyOrder.findOne({ uploadToken: token }).lean();

    if (!order) {
      return res.status(404).json({ success: false, error: 'Invalid or expired upload link' });
    }

    // Ensure we have a user account for this email (or dummy email)
    const email = order.email || order.customer?.email || `order_${order.orderNumber}@customer.com`;
    const name = order.name || order.customer?.firstName || 'Customer';
    const phone = order.customer?.phone || order.shippingAddress?.phone || '';

    let user = await db.getUserByEmail(email);
    if (!user) {
      user = await db.createUser({
        email,
        password: crypto.randomBytes(24).toString('hex'),
        name,
        phone,
        role: 'customer'
      });
    }

    // Mint a JWT token tailored to this session
    const jwtToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        phone: user.phone || '', 
        role: 'customer',
        shopifyOrderId: order.shopifyOrderId // Injecting context
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      token: jwtToken, 
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: 'customer' },
      shopifyOrder: order
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

