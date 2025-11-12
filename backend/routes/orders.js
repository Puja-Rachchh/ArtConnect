const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Order = require('../models/Order');

// GET /api/orders/my - get orders for current user (buyer)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.userId }).populate('painting').populate('artist', 'name');
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Get my orders error:', err);
    res.status(500).json({ success: false, message: 'Error fetching your orders' });
  }
});

module.exports = router;
