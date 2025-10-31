const express = require('express');
const {
  f_createMovieSession,
  f_getAllMovieSessions,
  f_getMovieSessionById,
  f_updateMovieSession,
  f_deleteMovieSession,
  f_getSessionsByMovie
} = require('../controllers/movieSessionController');

const v_router = express.Router();

// Create a new movie session
v_router.post('/', f_createMovieSession);

// Get all movie sessions
v_router.get('/', f_getAllMovieSessions);

// Get a movie session by ID
v_router.get('/:id', f_getMovieSessionById);

// Update a movie session
v_router.put('/:id', f_updateMovieSession);

// Delete a movie session
v_router.delete('/:id', f_deleteMovieSession);

// Get sessions by movie
v_router.get('/movie/:movieId', f_getSessionsByMovie);

module.exports = v_router;
