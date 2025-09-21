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
    enum: ['available', 'sold', 'reserved'],
    default: 'available'
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
paintingSchema.index({ title: 'text', description: 'text', materials: 'text' });

module.exports = mongoose.model('Painting', paintingSchema);