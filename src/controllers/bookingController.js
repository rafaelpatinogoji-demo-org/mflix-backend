const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const MovieSession = require('../models/MovieSession');
const User = require('../models/User');

// Create a new booking
// Esta función crea una nueva reserva validando referencias de película, teatro, sesión y usuario,
// verifica disponibilidad de asientos y usa transacciones para mantener consistencia de datos
const f_createBooking = async (p_req, p_res) => {
  try {
    const { movieId, theaterId, sessionId, userId, seats, totalPrice } = p_req.body;

    // Validate references
    const v_movie = await Movie.findById(movieId);
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }

    const v_theater = await Theater.findById(theaterId);
    if (!v_theater) {
      return p_res.status(404).json({ message: 'Theater not found' });
    }

    const v_session = await MovieSession.findById(sessionId);
    if (!v_session) {
      return p_res.status(404).json({ message: 'Session not found' });
    }

    const v_user = await User.findById(userId);
    if (!v_user) {
      return p_res.status(404).json({ message: 'User not found' });
    }

    // Validate session availability and capacity
    if (v_session.availableSeats < seats.length) {
      return p_res.status(400).json({ message: 'Not enough available seats for this session' });
    }

    // Check if selected seats are available
    const v_unavailableSeats = seats.filter(v_seat => v_session.bookedSeats.includes(v_seat));
    if (v_unavailableSeats.length > 0) {
      return p_res.status(400).json({ message: `Seats ${v_unavailableSeats.join(', ')} are already booked` });
    }

    // Use transaction to ensure consistency between booking creation and session update
    const v_transactionSession = await mongoose.startSession();
    v_transactionSession.startTransaction();
    
    try {
      // Create booking record
      const v_booking = new Booking({
        movie: movieId,
        theater: theaterId,
        session: sessionId,
        user: userId,
        seats,
        totalPrice
      });

      const v_savedBooking = await v_booking.save({ session: v_transactionSession });

      // Update session availability
      await MovieSession.findByIdAndUpdate(
        sessionId,
        {
          $inc: { availableSeats: -seats.length },
          $push: { bookedSeats: { $each: seats } }
        },
        { session: v_transactionSession }
      );

      await v_transactionSession.commitTransaction();

      // Populate references for response
      await v_savedBooking.populate([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' },
        { path: 'session' },
        { path: 'user', select: 'name email' }
      ]);

      p_res.status(201).json({
        message: 'Booking created successfully',
        booking: v_savedBooking
      });
    } catch (p_error) {
      await v_transactionSession.abortTransaction();
      p_res.status(400).json({ message: p_error.message });
    } finally {
      v_transactionSession.endSession();
    }
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get user booking history
// Esta función obtiene el historial de reservas de un usuario con filtros opcionales
// por estado, fechas y paginación para mostrar resultados organizados
const f_getUserBookings = async (p_req, p_res) => {
  try {
    const v_userId = p_req.params.userId;
    const v_status = p_req.query.status;
    const v_startDate = p_req.query.startDate;
    const v_endDate = p_req.query.endDate;
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;
    const v_sort = p_req.query.sort || '-createdAt';

    // Build filter
    const v_filter = { user: v_userId };
    if (v_status) {
      v_filter.status = v_status;
    }
    if (v_startDate || v_endDate) {
      v_filter.bookingDate = {};
      if (v_startDate) {
        v_filter.bookingDate.$gte = new Date(v_startDate);
      }
      if (v_endDate) {
        v_filter.bookingDate.$lte = new Date(v_endDate);
      }
    }

    const v_bookings = await Booking.find(v_filter)
      .populate([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' },
        { path: 'session' },
        { path: 'user', select: 'name email' }
      ])
      .sort(v_sort)
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await Booking.countDocuments(v_filter);

    p_res.json({
      bookings: v_bookings,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalBookings: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get movie availability across theaters
// Esta función consulta la disponibilidad de una película específica en todos los teatros,
// mostrando sesiones disponibles con información de ocupación y asientos libres
const f_getMovieAvailability = async (p_req, p_res) => {
  try {
    const v_movieId = p_req.params.movieId;
    const v_date = p_req.query.date;
    const v_startDate = p_req.query.startDate;
    const v_endDate = p_req.query.endDate;

    // Validate movie exists
    const v_movie = await Movie.findById(v_movieId);
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }

    // Build filter for movie sessions
    const v_filter = { movie: v_movieId };
    if (v_date) {
      // Find sessions for specific date
      const v_targetDate = new Date(v_date);
      const v_nextDate = new Date(v_targetDate);
      v_nextDate.setDate(v_nextDate.getDate() + 1);
      
      v_filter.sessionTime = {
        $gte: v_targetDate,
        $lt: v_nextDate
      };
    } else if (v_startDate || v_endDate) {
      // Find sessions in date range
      v_filter.sessionTime = {};
      if (v_startDate) {
        v_filter.sessionTime.$gte = new Date(v_startDate);
      }
      if (v_endDate) {
        v_filter.sessionTime.$lte = new Date(v_endDate);
      }
    }

    const v_sessions = await MovieSession.find(v_filter)
      .populate([
        { path: 'theater', select: 'theaterId location' },
        { path: 'movie', select: 'title year' }
      ]);

    // Add availability information
    const v_availability = v_sessions.map(v_session => ({
      session: v_session,
      availableSeats: v_session.availableSeats,
      totalSeats: v_session.totalSeats,
      occupancyRate: 1 - (v_session.availableSeats / v_session.totalSeats)
    }));

    p_res.json({
      movie: v_movie,
      availability: v_availability
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Cancel a booking
// Esta función cancela una reserva existente, validando que sea cancelable,
// actualiza el estado y restaura la capacidad de asientos usando transacciones
const f_cancelBooking = async (p_req, p_res) => {
  try {
    const v_bookingId = p_req.params.id;
    const { cancellationReason } = p_req.body;

    // Find booking
    const v_booking = await Booking.findById(v_bookingId);
    if (!v_booking) {
      return p_res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking can be cancelled (not already cancelled or completed)
    if (v_booking.status === 'cancelled' || v_booking.status === 'completed') {
      return p_res.status(400).json({ message: `Booking cannot be cancelled as it is already ${v_booking.status}` });
    }

    // Implement cancellation rules (time window, refund policy)
    // For now, we'll allow cancellation with a full refund
    
    // Use transaction to ensure consistency between booking cancellation and session update
    const v_dbSession = await mongoose.startSession();
    v_dbSession.startTransaction();
    
    try {
      // Update booking status
      v_booking.status = 'cancelled';
      v_booking.cancellationReason = cancellationReason;
      v_booking.cancellationDate = new Date();
      
      const v_updatedBooking = await v_booking.save({ session: v_dbSession });

      // Restore session capacity
      await MovieSession.findByIdAndUpdate(
        v_booking.session,
        {
          $inc: { availableSeats: v_booking.seats.length },
          $pull: { bookedSeats: { $in: v_booking.seats } }
        },
        { session: v_dbSession }
      );

      await v_dbSession.commitTransaction();

      // Populate references for response
      await v_updatedBooking.populate([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' },
        { path: 'session' },
        { path: 'user', select: 'name email' }
      ]);

      p_res.json({
        message: 'Booking cancelled successfully',
        booking: v_updatedBooking
      });
    } catch (p_error) {
      await v_dbSession.abortTransaction();
      p_res.status(400).json({ message: p_error.message });
    } finally {
      v_dbSession.endSession();
    }
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get booking statistics
// Esta función genera estadísticas de reservas incluyendo totales, ingresos,
// estados de reservas y tasas de ocupación por película usando agregaciones
const f_getBookingStats = async (p_req, p_res) => {
  try {
    const v_movieId = p_req.query.movieId;
    const v_theaterId = p_req.query.theaterId;
    const v_startDate = p_req.query.startDate;
    const v_endDate = p_req.query.endDate;

    // Build match filter for aggregation
    const v_matchFilter = {};
    if (v_movieId) {
      v_matchFilter.movie = mongoose.Types.ObjectId(v_movieId);
    }
    if (v_theaterId) {
      v_matchFilter.theater = mongoose.Types.ObjectId(v_theaterId);
    }
    if (v_startDate || v_endDate) {
      v_matchFilter.bookingDate = {};
      if (v_startDate) {
        v_matchFilter.bookingDate.$gte = new Date(v_startDate);
      }
      if (v_endDate) {
        v_matchFilter.bookingDate.$lte = new Date(v_endDate);
      }
    }

    // Aggregate booking statistics
    const v_stats = await Booking.aggregate([
      { $match: v_matchFilter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Group by movie for occupancy rates
    const v_occupancyByMovie = await Booking.aggregate([
      { $match: v_matchFilter },
      {
        $group: {
          _id: '$movie',
          bookingCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'movies',
          localField: '_id',
          foreignField: '_id',
          as: 'movieInfo'
        }
      },
      {
        $unwind: '$movieInfo'
      },
      {
        $project: {
          movieTitle: '$movieInfo.title',
          bookingCount: 1,
          occupancyRate: {
            $multiply: [
              { $divide: ['$bookingCount', 150] }, // Assuming 150 max seats per session
              100
            ]
          }
        }
      },
      { $sort: { bookingCount: -1 } }
    ]);

    p_res.json({
      summary: v_stats[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        pendingBookings: 0,
        completedBookings: 0
      },
      occupancyByMovie: v_occupancyByMovie
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

module.exports = {
  f_createBooking,
  f_getUserBookings,
  f_getMovieAvailability,
  f_cancelBooking,
  f_getBookingStats
};
