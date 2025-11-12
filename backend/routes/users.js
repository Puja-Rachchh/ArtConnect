var express = require('express');
var router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// GET /api/users/me/notifications
// Notification endpoints removed (notifications stored on User were removed)

module.exports = router;
