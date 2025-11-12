const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  painting: { type: mongoose.Schema.Types.ObjectId, ref: 'Painting', required: true },
  price: { type: Number, required: true },
  shippingDetails: {
    fullName: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    zipCode: String
  },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
