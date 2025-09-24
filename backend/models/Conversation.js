const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  paintingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Painting',
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    buyer: { type: Number, default: 0 },
    artist: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ buyerId: 1, artistId: 1, paintingId: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);