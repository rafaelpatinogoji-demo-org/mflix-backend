const express = require('express');
const {
  f_getAllMovies,
  f_getMovieById,
  f_createMovie,
  f_updateMovie,
  f_deleteMovie,
  f_searchMovies,
  f_getTopRatedMovies,
  f_getMoviesByGenre,
  f_getMoviesByYear,
  f_getTrendingMovies,
  f_getMovieEngagementStats
} = require('../controllers/movieController');

const v_router = express.Router();

// Obtener todas las películas
v_router.get('/', f_getAllMovies);
// Buscar películas por criterios
v_router.get('/search', f_searchMovies);
// Obtener una película por ID
v_router.get('/:id', f_getMovieById);
// Crear una nueva película
v_router.post('/', f_createMovie);
// Actualizar una película por ID
v_router.put('/:id', f_updateMovie);
// Eliminar una película por ID
v_router.delete('/:id', f_deleteMovie);

// Movie analytics routes
v_router.get('/analytics/top-rated', f_getTopRatedMovies);
v_router.get('/analytics/genres', f_getMoviesByGenre);
v_router.get('/analytics/years', f_getMoviesByYear);
v_router.get('/analytics/trending', f_getTrendingMovies);
v_router.get('/analytics/engagement/:id', f_getMovieEngagementStats);

module.exports = v_router;
