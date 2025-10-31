const mongoose = require('mongoose');

const c_bookingSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  theater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed'],
    default: 'pending'
  },
  seats: [{
    type: String
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  cancellationReason: {
    type: String
  },
  cancellationDate: {
    type: Date
  }
}, {
  collection: 'bookings',
  timestamps: true
});

module.exports = mongoose.model('Booking', c_bookingSchema);
