const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Painting = require('../models/Painting');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let conversations;
    if (userRole === 'artist') {
      conversations = await Conversation.find({ artistId: userId })
        .populate('buyerId', 'username email')
        .populate('paintingId', 'title imageUrl price')
        .populate('lastMessage')
        .sort({ lastMessageAt: -1 });
    } else {
      conversations = await Conversation.find({ buyerId: userId })
        .populate('artistId', 'username email')
        .populate('paintingId', 'title imageUrl price')
        .populate('lastMessage')
        .sort({ lastMessageAt: -1 });
    }

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// Start a new conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { paintingId } = req.body;
    const buyerId = req.user.userId;

    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        message: 'Only buyers can start conversations'
      });
    }

    // Get painting details to find the artist
    const painting = await Painting.findById(paintingId);
    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      paintingId,
      buyerId,
      artistId: painting.artist
    });

    if (conversation) {
      return res.json({
        success: true,
        conversation,
        message: 'Conversation already exists'
      });
    }

    // Create new conversation
    conversation = new Conversation({
      paintingId,
      buyerId,
      artistId: painting.artist
    });

    await conversation.save();

    // Populate the conversation
    await conversation.populate('buyerId', 'username email');
    await conversation.populate('artistId', 'username email');
    await conversation.populate('paintingId', 'title imageUrl price');

    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (conversation.buyerId.toString() !== userId && conversation.artistId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username')
      .populate('receiverId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Update unread count
    const userRole = req.user.role;
    const unreadField = userRole === 'artist' ? 'unreadCount.artist' : 'unreadCount.buyer';
    await Conversation.findByIdAndUpdate(conversationId, {
      [unreadField]: 0
    });

    res.json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', auctionDetails } = req.body;
    const senderId = req.user.userId;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (conversation.buyerId.toString() !== senderId && conversation.artistId.toString() !== senderId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Determine receiver
    const receiverId = conversation.buyerId.toString() === senderId 
      ? conversation.artistId 
      : conversation.buyerId;

    // Create message
    const message = new Message({
      conversationId,
      senderId,
      receiverId,
      content,
      messageType,
      auctionDetails
    });

    await message.save();

    // Update conversation unread count
    const userRole = req.user.role;
    const incrementField = userRole === 'artist' ? 'unreadCount.buyer' : 'unreadCount.artist';
    
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      $inc: { [incrementField]: 1 }
    });

    // Populate message
    await message.populate('senderId', 'username');
    await message.populate('receiverId', 'username');

    // Emit real-time message
    const io = req.app.get('io');
    io.to(`conversation_${conversationId}`).emit('new_message', message);

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Update auction offer status (accept/decline)
router.patch('/messages/:messageId/auction', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only receiver can update auction status
    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only auction offers can be updated
    if (message.messageType !== 'auction_offer') {
      return res.status(400).json({
        success: false,
        message: 'Not an auction offer'
      });
    }

    message.auctionDetails.status = status;
    await message.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`conversation_${message.conversationId}`).emit('auction_update', {
      messageId,
      status
    });

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error updating auction status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auction status'
    });
  }
});

module.exports = router;