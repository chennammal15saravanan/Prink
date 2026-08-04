const express = require('express');
const router = express.Router();
const ShopifyCustomer = require('../models/ShopifyCustomer');

router.get('/', async (req, res) => {
  try {
    const customers = await ShopifyCustomer.find().sort({ createdAt: -1 });
    res.json({ success: true, customers });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ success: false, message: 'Server error fetching customers' });
  }
});

module.exports = router;
