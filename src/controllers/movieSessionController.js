const mongoose = require('mongoose');
const MovieSession = require('../models/MovieSession');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');

// Create a new movie session
// Crea una nueva sesión de película validando que la película y el teatro existan
const f_createMovieSession = async (p_req, p_res) => {
  try {
    const { movieId, theaterId, sessionTime, price, totalSeats } = p_req.body;

    // Validate references
    const v_movie = await Movie.findById(movieId);
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }

    const v_theater = await Theater.findById(theaterId);
    if (!v_theater) {
      return p_res.status(404).json({ message: 'Theater not found' });
    }

    // Create movie session record
    const v_movieSession = new MovieSession({
      movie: movieId,
      theater: theaterId,
      sessionTime: new Date(sessionTime),
      price,
      totalSeats,
      availableSeats: totalSeats
    });

    const v_savedMovieSession = await v_movieSession.save();

    // Populate references for response
    await v_savedMovieSession.populate([
      { path: 'movie', select: 'title year' },
      { path: 'theater', select: 'theaterId location' }
    ]);

    p_res.status(201).json({
      message: 'Movie session created successfully',
      session: v_savedMovieSession
    });
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Get all movie sessions
// Obtiene todas las sesiones de películas con paginación
const f_getAllMovieSessions = async (p_req, p_res) => {
  try {
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;

    const v_sessions = await MovieSession.find()
      .populate([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' }
      ])
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await MovieSession.countDocuments();

    p_res.json({
      sessions: v_sessions,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalSessions: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get a movie session by ID
// Obtiene una sesión de película específica por su ID
const f_getMovieSessionById = async (p_req, p_res) => {
  try {
    const v_session = await MovieSession.findById(p_req.params.id)
      .populate([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' }
      ]);
      
    if (!v_session) {
      return p_res.status(404).json({ message: 'Movie session not found' });
    }
    
    p_res.json(v_session);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Update a movie session
// Actualiza los datos de una sesión de película existente
const f_updateMovieSession = async (p_req, p_res) => {
  try {
    const v_session = await MovieSession.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'movie', select: 'title year' },
      { path: 'theater', select: 'theaterId location' }
    ]);
    
    if (!v_session) {
      return p_res.status(404).json({ message: 'Movie session not found' });
    }
    
    p_res.json({
      message: 'Movie session updated successfully',
      session: v_session
    });
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Delete a movie session
// Elimina una sesión de película del sistema
const f_deleteMovieSession = async (p_req, p_res) => {
  try {
    const v_session = await MovieSession.findByIdAndDelete(p_req.params.id);
    
    if (!v_session) {
      return p_res.status(404).json({ message: 'Movie session not found' });
    }
    
    p_res.json({ message: 'Movie session deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get sessions by movie
// Obtiene todas las sesiones de una película específica con filtros de fecha opcionales
const f_getSessionsByMovie = async (p_req, p_res) => {
  try {
    const v_movieId = p_req.params.movieId;
    const v_date = p_req.query.date;
    const v_startDate = p_req.query.startDate;
    const v_endDate = p_req.query.endDate;
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;

    // Validate movie exists
    const v_movie = await Movie.findById(v_movieId);
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }

    // Build filter
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
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' }
      ])
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await MovieSession.countDocuments(v_filter);

    p_res.json({
      movie: v_movie,
      sessions: v_sessions,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalSessions: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

module.exports = {
  f_createMovieSession,
  f_getAllMovieSessions,
  f_getMovieSessionById,
  f_updateMovieSession,
  f_deleteMovieSession,
  f_getSessionsByMovie
};
