const express = require('express');
const router = express.Router();
const Painting = require('../models/Painting');
const AuctionChat = require('../models/AuctionChat');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Start an auction for a painting
router.post('/paintings/:paintingId/auction/start', authenticateToken, async (req, res) => {
  try {
    const { paintingId } = req.params;
    const { duration, startingPrice, bidIncrement } = req.body;
    const artistId = req.user.userId;

    if (req.user.role !== 'artist') {
      return res.status(403).json({
        success: false,
        message: 'Only artists can start auctions'
      });
    }

    const painting = await Painting.findById(paintingId);
    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found'
      });
    }

    // Check if user owns the painting
    if (painting.artist.toString() !== artistId) {
      return res.status(403).json({
        success: false,
        message: 'You can only auction your own paintings'
      });
    }

    // Check if painting is available
    if (painting.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Painting is not available for auction'
      });
    }

    // Set auction details
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (duration * 60 * 60 * 1000)); // duration in hours

    painting.saleType = 'auction';
    painting.status = 'in_auction';
    painting.auction = {
      isActive: true,
      startTime,
      endTime,
      startingPrice: startingPrice || painting.price,
      currentBid: 0,
      bidIncrement: bidIncrement || 10,
      bids: [],
      participantCount: 0
    };

    await painting.save();

    // Create auction chat room
    const auctionChat = new AuctionChat({
      paintingId,
      artistId,
      participants: [{
        userId: artistId,
        username: req.user.username || 'Artist',
        joinedAt: new Date(),
        isActive: true
      }],
      messages: [{
        senderId: artistId,
        senderName: 'System',
        content: `Auction started! Starting price: $${painting.auction.startingPrice}. Auction ends at ${endTime.toLocaleString()}.`,
        messageType: 'auction_started',
        timestamp: new Date()
      }],
      isActive: true,
      lastActivity: new Date()
    });

    await auctionChat.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('auction_started', {
        paintingId,
        painting: await painting.populate('artist', 'username email'),
        auctionChatId: auctionChat._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Auction started successfully',
      painting,
      auctionChatId: auctionChat._id
    });
  } catch (error) {
    console.error('Error starting auction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start auction'
    });
  }
});

// Join an auction
router.post('/paintings/:paintingId/auction/join', authenticateToken, async (req, res) => {
  try {
    const { paintingId } = req.params;
    const userId = req.user.userId;

    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        message: 'Only buyers can join auctions'
      });
    }

    const painting = await Painting.findById(paintingId);
    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found'
      });
    }

    if (!painting.auction || !painting.auction.isActive) {
      return res.status(400).json({
        success: false,
        message: 'No active auction for this painting'
      });
    }

    if (painting.isAuctionExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Auction has ended'
      });
    }

    // Find or create auction chat
    let auctionChat = await AuctionChat.findOne({ paintingId });
    if (!auctionChat) {
      return res.status(404).json({
        success: false,
        message: 'Auction chat not found'
      });
    }

    // Add user to participants
    await auctionChat.addParticipant(userId, req.user.username);

    // Add system message
    await auctionChat.addMessage(
      userId,
      'System',
      `${req.user.username} joined the auction`,
      'system'
    );

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`auction_${paintingId}`).emit('user_joined', {
        userId,
        username: req.user.username,
        message: `${req.user.username} joined the auction`
      });
    }

    res.json({
      success: true,
      message: 'Successfully joined auction',
      auctionChatId: auctionChat._id,
      painting,
      timeRemaining: painting.timeRemaining
    });
  } catch (error) {
    console.error('Error joining auction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join auction'
    });
  }
});

// Place a bid
router.post('/paintings/:paintingId/auction/bid', authenticateToken, async (req, res) => {
  try {
    const { paintingId } = req.params;
    const { amount } = req.body;
    const userId = req.user.userId;

    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        message: 'Only buyers can place bids'
      });
    }

    const painting = await Painting.findById(paintingId);
    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found'
      });
    }

    // Place bid using the painting method
    await painting.placeBid(userId, req.user.username, amount);

    // Update auction chat
    const auctionChat = await AuctionChat.findOne({ paintingId });
    if (auctionChat) {
      await auctionChat.addMessage(
        userId,
        req.user.username,
        `Placed bid: $${amount}`,
        'bid_placed',
        amount
      );
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`auction_${paintingId}`).emit('new_bid', {
        bidder: req.user.username,
        amount,
        timestamp: new Date(),
        currentBid: painting.auction.currentBid,
        participantCount: painting.auction.participantCount
      });
    }

    res.json({
      success: true,
      message: 'Bid placed successfully',
      currentBid: painting.auction.currentBid,
      bidCount: painting.auction.bids.length,
      timeRemaining: painting.timeRemaining
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to place bid'
    });
  }
});

// Get auction details
router.get('/paintings/:paintingId/auction', async (req, res) => {
  try {
    const { paintingId } = req.params;

    const painting = await Painting.findById(paintingId)
      .populate('artist', 'username email')
      .populate('auction.winner', 'username email');

    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found'
      });
    }

    if (!painting.auction) {
      return res.status(404).json({
        success: false,
        message: 'No auction found for this painting'
      });
    }

    // Get auction chat
    const auctionChat = await AuctionChat.findOne({ paintingId });

    res.json({
      success: true,
      auction: painting.auction,
      timeRemaining: painting.timeRemaining,
      isExpired: painting.isAuctionExpired(),
      auctionChatId: auctionChat?._id,
      painting: {
        _id: painting._id,
        title: painting.title,
        description: painting.description,
        imageUrl: painting.imageUrl,
        artist: painting.artist
      }
    });
  } catch (error) {
    console.error('Error fetching auction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auction details'
    });
  }
});

// Get auction chat messages
router.get('/paintings/:paintingId/auction/chat', authenticateToken, async (req, res) => {
  try {
    const { paintingId } = req.params;
    const { limit = 50 } = req.query;

    const auctionChat = await AuctionChat.findOne({ paintingId })
      .populate('participants.userId', 'username')
      .populate('messages.senderId', 'username');

    if (!auctionChat) {
      return res.status(404).json({
        success: false,
        message: 'Auction chat not found'
      });
    }

    const messages = auctionChat.getRecentMessages(parseInt(limit));

    res.json({
      success: true,
      messages,
      participants: auctionChat.participants,
      chatId: auctionChat._id
    });
  } catch (error) {
    console.error('Error fetching auction chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auction chat'
    });
  }
});

// Send message to auction chat
router.post('/paintings/:paintingId/auction/chat', authenticateToken, async (req, res) => {
  try {
    const { paintingId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const auctionChat = await AuctionChat.findOne({ paintingId });
    if (!auctionChat) {
      return res.status(404).json({
        success: false,
        message: 'Auction chat not found'
      });
    }

    // Check if user is a participant
    const isParticipant = auctionChat.participants.some(
      p => p.userId.toString() === userId && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this auction'
      });
    }

    await auctionChat.addMessage(userId, req.user.username, content, 'text');

    // Emit real-time message
    const io = req.app.get('io');
    if (io) {
      io.to(`auction_${paintingId}`).emit('auction_message', {
        senderId: userId,
        senderName: req.user.username,
        content,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending auction message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// End auction (manual or automatic)
router.post('/paintings/:paintingId/auction/end', authenticateToken, async (req, res) => {
  try {
    const { paintingId } = req.params;
    const userId = req.user.userId;

    const painting = await Painting.findById(paintingId);
    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found'
      });
    }

    // Only artist can manually end auction or system can end expired auctions
    if (req.user.role === 'artist' && painting.artist.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only end your own auctions'
      });
    }

    if (!painting.auction || !painting.auction.isActive) {
      return res.status(400).json({
        success: false,
        message: 'No active auction to end'
      });
    }

    // End the auction
    painting.auction.isActive = false;
    painting.status = painting.auction.bids.length > 0 ? 'sold' : 'available';

    // Set winner if there are bids
    if (painting.auction.bids.length > 0) {
      const highestBid = painting.auction.bids[painting.auction.bids.length - 1];
      painting.auction.winner = highestBid.bidder;
    }

    await painting.save();

    // Update auction chat
    const auctionChat = await AuctionChat.findOne({ paintingId });
    if (auctionChat) {
      const winnerMessage = painting.auction.winner
        ? `Auction ended! Winner: ${painting.auction.bids[painting.auction.bids.length - 1].bidderName} with bid $${painting.auction.currentBid}`
        : 'Auction ended with no bids.';

      await auctionChat.addMessage(
        userId,
        'System',
        winnerMessage,
        'auction_ended'
      );

      auctionChat.isActive = false;
      await auctionChat.save();
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`auction_${paintingId}`).emit('auction_ended', {
        winner: painting.auction.winner,
        finalBid: painting.auction.currentBid,
        painting: {
          _id: painting._id,
          title: painting.title
        }
      });
    }

    res.json({
      success: true,
      message: 'Auction ended successfully',
      winner: painting.auction.winner,
      finalBid: painting.auction.currentBid
    });
  } catch (error) {
    console.error('Error ending auction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end auction'
    });
  }
});

module.exports = router;