const express = require('express');
const {
  f_createMovieSession, // Función para crear una nueva sesión de película
  f_getAllMovieSessions, // Función para obtener todas las sesiones de películas
  f_getMovieSessionById, // Función para obtener una sesión de película por ID
  f_updateMovieSession, // Función para actualizar una sesión de película
  f_deleteMovieSession, // Función para eliminar una sesión de película
  f_getSessionsByMovie // Función para obtener sesiones por película específica
} = require('../controllers/movieSessionController');

const v_router = express.Router();

// Create a new movie session
v_router.post('/', f_createMovieSession); // Función para crear una nueva sesión de película

// Get all movie sessions
v_router.get('/', f_getAllMovieSessions); // Función para obtener todas las sesiones de películas

// Get a movie session by ID
v_router.get('/:id', f_getMovieSessionById); // Función para obtener una sesión de película por ID

// Update a movie session
v_router.put('/:id', f_updateMovieSession); // Función para actualizar una sesión de película

// Delete a movie session
v_router.delete('/:id', f_deleteMovieSession); // Función para eliminar una sesión de película

// Get sessions by movie
v_router.get('/movie/:movieId', f_getSessionsByMovie); // Función para obtener sesiones por película específica

module.exports = v_router;
