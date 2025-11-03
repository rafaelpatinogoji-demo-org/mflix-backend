const express = require('express');
const {
  f_createBooking, // Función para crear una nueva reserva
  f_getUserBookings, // Función para obtener el historial de reservas de un usuario
  f_getMovieAvailability, // Función para obtener la disponibilidad de una película en los cines
  f_cancelBooking, // Función para cancelar una reserva
  f_getBookingStats // Función para obtener estadísticas de reservas
} = require('../controllers/bookingController');

const v_router = express.Router();

// Create a new booking
v_router.post('/', f_createBooking); // Función para crear una nueva reserva

// Get user booking history
v_router.get('/user/:userId', f_getUserBookings); // Función para obtener el historial de reservas de un usuario

// Get movie availability across theaters
v_router.get('/availability/:movieId', f_getMovieAvailability); // Función para obtener la disponibilidad de una película en los cines

// Cancel a booking
v_router.put('/:id/cancel', f_cancelBooking); // Función para cancelar una reserva

// Get booking statistics
v_router.get('/stats', f_getBookingStats); // Función para obtener estadísticas de reservas

module.exports = v_router;
