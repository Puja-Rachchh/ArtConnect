const mongoose = require('mongoose');

const auctionChatSchema = new mongoose.Schema({
  paintingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Painting',
    required: true,
    unique: true
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    messageType: {
      type: String,
      enum: ['text', 'bid_placed', 'auction_started', 'auction_ended', 'system'],
      default: 'text'
    },
    bidAmount: {
      type: Number,
      min: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
auctionChatSchema.index({ paintingId: 1 });
auctionChatSchema.index({ artistId: 1 });
auctionChatSchema.index({ 'participants.userId': 1 });
auctionChatSchema.index({ lastActivity: -1 });

// Method to add participant
auctionChatSchema.methods.addParticipant = function(userId, username) {
  const existingParticipant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date();
  } else {
    this.participants.push({
      userId,
      username,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// Method to add message
auctionChatSchema.methods.addMessage = function(senderId, senderName, content, messageType = 'text', bidAmount = null) {
  this.messages.push({
    senderId,
    senderName,
    content,
    messageType,
    bidAmount,
    timestamp: new Date()
  });
  
  this.lastActivity = new Date();
  return this.save();
};

// Method to get recent messages
auctionChatSchema.methods.getRecentMessages = function(limit = 50) {
  return this.messages
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .reverse();
};

module.exports = mongoose.model('AuctionChat', auctionChatSchema);