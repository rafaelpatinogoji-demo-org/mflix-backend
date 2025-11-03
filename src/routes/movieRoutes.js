const express = require('express');
const {
  f_getAllMovies, // Función para obtener todas las películas
  f_getMovieById, // Función para obtener una película específica por su ID
  f_createMovie, // Función para crear una nueva película
  f_updateMovie, // Función para actualizar los datos de una película existente
  f_deleteMovie, // Función para eliminar una película del sistema
  f_searchMovies, // Función para buscar películas según criterios específicos
  f_getTopRatedMovies, // Función para obtener las películas mejor calificadas
  f_getMoviesByGenre, // Función para obtener películas filtradas por género
  f_getMoviesByYear, // Función para obtener películas filtradas por año de lanzamiento
  f_getTrendingMovies, // Función para obtener las películas en tendencia
  f_getMovieEngagementStats // Función para obtener estadísticas de engagement de una película
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
