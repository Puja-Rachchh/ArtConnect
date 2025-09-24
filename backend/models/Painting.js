const mongoose = require('mongoose');

const paintingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Painting title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  size: {
    width: {
      type: Number,
      required: [true, 'Width is required']
    },
    height: {
      type: Number,
      required: [true, 'Height is required']
    },
    unit: {
      type: String,
      required: [true, 'Size unit is required'],
      enum: ['cm', 'inches', 'mm'],
      default: 'cm'
    }
  },
  materials: {
    type: String,
    required: [true, 'Materials used is required'],
    maxlength: [500, 'Materials description cannot exceed 500 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image is required']
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Artist is required']
  },
  artistName: {
    type: String,
    required: [true, 'Artist name is required']
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved', 'in_auction'],
    default: 'available'
  },
  saleType: {
    type: String,
    enum: ['direct_sale', 'auction'],
    default: 'direct_sale'
  },
  auction: {
    isActive: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    startingPrice: {
      type: Number,
      min: [0, 'Starting price must be positive']
    },
    currentBid: {
      type: Number,
      default: 0
    },
    bidIncrement: {
      type: Number,
      default: 10,
      min: [1, 'Bid increment must be at least 1']
    },
    bids: [{
      bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      bidderName: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Bid amount must be positive']
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    participantCount: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
paintingSchema.index({ artist: 1, createdAt: -1 });
paintingSchema.index({ status: 1, createdAt: -1 });
paintingSchema.index({ saleType: 1, 'auction.isActive': 1 });
paintingSchema.index({ 'auction.endTime': 1 });
paintingSchema.index({ title: 'text', description: 'text', materials: 'text' });

// Virtual for auction time remaining
paintingSchema.virtual('timeRemaining').get(function() {
  if (this.auction && this.auction.isActive && this.auction.endTime) {
    const now = new Date();
    const remaining = this.auction.endTime - now;
    return Math.max(0, remaining);
  }
  return 0;
});

// Method to check if auction has ended
paintingSchema.methods.isAuctionExpired = function() {
  if (!this.auction || !this.auction.isActive || !this.auction.endTime) {
    return false;
  }
  return new Date() > this.auction.endTime;
};

// Method to place a bid
paintingSchema.methods.placeBid = function(bidderId, bidderName, amount) {
  if (!this.auction || !this.auction.isActive) {
    throw new Error('Auction is not active');
  }
  
  if (this.isAuctionExpired()) {
    throw new Error('Auction has ended');
  }
  
  if (amount <= this.auction.currentBid) {
    throw new Error(`Bid must be higher than current bid of $${this.auction.currentBid}`);
  }
  
  if (amount < this.auction.startingPrice) {
    throw new Error(`Bid must be at least $${this.auction.startingPrice}`);
  }

  // Add the bid
  this.auction.bids.push({
    bidder: bidderId,
    bidderName: bidderName,
    amount: amount,
    timestamp: new Date()
  });
  
  this.auction.currentBid = amount;
  
  // Update participant count if new bidder
  const uniqueBidders = [...new Set(this.auction.bids.map(bid => bid.bidder.toString()))];
  this.auction.participantCount = uniqueBidders.length;
  
  return this.save();
};

module.exports = mongoose.model('Painting', paintingSchema);