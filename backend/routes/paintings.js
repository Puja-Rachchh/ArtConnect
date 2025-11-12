const express = require('express');
const Painting = require('../models/Painting');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();


router.get('/', async (req, res) => {
  try {
    // Return all paintings (including sold) so gallery and dashboard can show sold items with a SOLD tag.
    const paintings = await Painting.find({})
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

// @route   GET /api/paintings/:id/bids
router.get('/:id/bids', authenticateToken, async (req, res) => {
  try {
    const painting = await Painting.findById(req.params.id).populate('auction.bids.bidder', 'name email');
    if (!painting) {
      return res.status(404).json({ success: false, message: 'Painting not found' });
    }

    // Only artist or authenticated users can view bids list (artist usually needs it)
    if (painting.artist.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Only the artist can view bids for this painting' });
    }

    res.json({ success: true, bids: painting.auction.bids || [] });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bids' });
  }
});

// @route   POST /api/paintings/:id/bids
router.post('/:id/bids', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount == null) {
      return res.status(400).json({ success: false, message: 'Bid amount is required' });
    }

    const painting = await Painting.findById(req.params.id);
    if (!painting) {
      return res.status(404).json({ success: false, message: 'Painting not found' });
    }

    const bidder = await User.findById(req.userId);
    if (!bidder) {
      return res.status(403).json({ success: false, message: 'Invalid user' });
    }

    // If painting is an auction, use model method which enforces auction rules
    if (painting.saleType === 'auction') {
      if (!painting.auction?.isActive) {
        return res.status(400).json({ success: false, message: 'This auction is not active' });
      }

      try {
        await painting.placeBid(req.userId, bidder.name || bidder.username || 'Unknown', parseFloat(amount));
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // Return latest auction state
      const updated = await Painting.findById(req.params.id).populate('auction.bids.bidder', 'name email');
      return res.json({ success: true, message: 'Bid placed', auction: updated.auction });
    }

    // If painting is a direct sale, accept offers (bids) from buyers — store them in auction.bids for the artist to review
    if (painting.saleType === 'direct_sale') {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < painting.price) {
        return res.status(400).json({ success: false, message: `Offer must be at least ₹${painting.price}` });
      }

      // Ensure auction subdocument exists
      if (!painting.auction) painting.auction = {};
      if (!Array.isArray(painting.auction.bids)) painting.auction.bids = [];

      painting.auction.bids.push({
        bidder: req.userId,
        bidderName: bidder.name || bidder.username || 'Buyer',
        amount: numericAmount,
        timestamp: new Date()
      });

      // Update currentBid to highest offer
      const maxBid = Math.max(...painting.auction.bids.map(b => b.amount));
      painting.auction.currentBid = maxBid;

      const uniqueBidders = [...new Set(painting.auction.bids.map(bid => bid.bidder.toString()))];
      painting.auction.participantCount = uniqueBidders.length;

      await painting.save();

      const updated = await Painting.findById(req.params.id).populate('auction.bids.bidder', 'name email');
      return res.json({ success: true, message: 'Offer submitted', auction: updated.auction });
    }

    // Other sale types are not open to bidding
    return res.status(400).json({ success: false, message: 'This painting is not open for bidding' });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ success: false, message: 'Error placing bid' });
  }
});

// @route   POST /api/paintings/:id/bids/:bidId/accept
router.post('/:id/bids/:bidId/accept', authenticateToken, async (req, res) => {
  try {
    const painting = await Painting.findById(req.params.id);
    if (!painting) {
      return res.status(404).json({ success: false, message: 'Painting not found' });
    }

    // Only artist can accept bids
    if (painting.artist.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Only the artist can accept a bid' });
    }

    const bid = painting.auction.bids.id(req.params.bidId);
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    // Set winner and mark painting sold
        painting.auction.winner = bid.bidder;
        painting.status = 'sold';
        // store final sale price
        painting.price = bid.amount;
        await painting.save();

        // Create an Order record (no notifications)
        try {
          const Order = require('../models/Order');
          const order = new Order({
            buyer: bid.bidder,
            artist: painting.artist,
            painting: painting._id,
            price: bid.amount
          });
          await order.save();

          res.json({ success: true, message: 'Bid accepted', buyerId: bid.bidder, amount: bid.amount, orderId: order._id });
        } catch (err) {
          console.error('Error creating order:', err);
          return res.status(500).json({ success: false, message: 'Bid accepted but failed to create order' });
        }
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ success: false, message: 'Error accepting bid' });
  }
});

// @route   PUT /api/paintings/:id
router.put('/update/:id', authenticateToken, async (req, res) => {
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
        message: 'You can only update your own paintings'
      });
    }

    // Update the painting with new data
    const updateData = req.body;
    console.log(updateData);
    const updatedPainting = await Painting.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('artist', 'name');

    res.json({
      success: true,
      message: 'Painting updated successfully',
      painting: updatedPainting
    });
  } catch (error) {
    console.error('Update painting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating painting'
    });
  }
});

// @route   DELETE /api/paintings/:id

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