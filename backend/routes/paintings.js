const express = require('express');
const Painting = require('../models/Painting');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// @route   GET /api/paintings
// @desc    Get all paintings (for buyers and general viewing)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const paintings = await Painting.find({ status: 'available' })
      .populate('artist', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: paintings.length,
      paintings
    });
  } catch (error) {
    console.error('Get paintings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching paintings'
    });
  }
});

// @route   GET /api/paintings/my-paintings
// @desc    Get paintings by authenticated artist
// @access  Private (Artist only)
router.get('/my-paintings', authenticateToken, async (req, res) => {
  try {
    const paintings = await Painting.find({ artist: req.userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: paintings.length,
      paintings
    });
  } catch (error) {
    console.error('Get my paintings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your paintings'
    });
  }
});

// @route   POST /api/paintings/upload
// @desc    Upload a new painting
// @access  Private (Artist only)
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    // Check if user is an artist
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'artist') {
      return res.status(403).json({
        success: false,
        message: 'Only artists can upload paintings'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const { title, description, price, width, height, sizeUnit, materials, tags } = req.body;

    // Validate required fields
    if (!title || !description || !price || !width || !height || !materials) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, price, size, materials'
      });
    }

    // Create image URL
    const imageUrl = `/uploads/paintings/${req.file.filename}`;

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Create new painting
    const painting = new Painting({
      title,
      description,
      price: parseFloat(price),
      size: {
        width: parseFloat(width),
        height: parseFloat(height),
        unit: sizeUnit || 'cm'
      },
      materials,
      imageUrl,
      artist: req.userId,
      artistName: user.name,
      tags: parsedTags
    });

    await painting.save();

    res.status(201).json({
      success: true,
      message: 'Painting uploaded successfully',
      painting
    });

  } catch (error) {
    console.error('Upload painting error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during painting upload'
    });
  }
});

// @route   GET /api/paintings/:id
// @desc    Get single painting by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const painting = await Painting.findById(req.params.id)
      .populate('artist', 'name email');
    
    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found'
      });
    }

    // Increment views
    painting.views += 1;
    await painting.save();

    res.json({
      success: true,
      painting
    });
  } catch (error) {
    console.error('Get painting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching painting'
    });
  }
});

// @route   DELETE /api/paintings/:id
// @desc    Delete painting (artist only)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const painting = await Painting.findById(req.params.id);
    
    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found'
      });
    }

    // Check if user owns this painting
    if (painting.artist.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own paintings'
      });
    }

    await Painting.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Painting deleted successfully'
    });
  } catch (error) {
    console.error('Delete painting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting painting'
    });
  }
});

module.exports = router;