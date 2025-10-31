const express = require('express');
const {
  f_createBooking,
  f_getUserBookings,
  f_getMovieAvailability,
  f_cancelBooking,
  f_getBookingStats
} = require('../controllers/bookingController');

const v_router = express.Router();

// Create a new booking
v_router.post('/', f_createBooking);

// Get user booking history
v_router.get('/user/:userId', f_getUserBookings);

// Get movie availability across theaters
v_router.get('/availability/:movieId', f_getMovieAvailability);

// Cancel a booking
v_router.put('/:id/cancel', f_cancelBooking);

// Get booking statistics
v_router.get('/stats', f_getBookingStats);

module.exports = v_router;
