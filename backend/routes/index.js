var express = require('express');
var router = express.Router();
const Painting = require('../models/Painting'); // Import Painting model

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/auth', (req, res, next) => {
  res.render('auth', { title: 'Auth' });
});

router.get('/paintings', async (req, res, next) => {
  try {
    // Fetch paintings from database
    const paintings = await Painting.find().populate('artist', 'name').sort({ createdAt: -1 });
    res.render('painting', { 
      title: 'Paintings Gallery', 
      paintings: paintings 
    });
  } catch (error) {
    console.error('Error fetching paintings:', error);
    res.render('painting', { 
      title: 'Paintings Gallery', 
      paintings: [],
      error: 'Failed to load paintings'
    });
  }
});

module.exports = router;
