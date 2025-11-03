const express = require('express');
const {
  f_getAllEmbeddedMovies,
  f_getEmbeddedMovieById,
  f_createEmbeddedMovie,
  f_updateEmbeddedMovie,
  f_deleteEmbeddedMovie,
  f_searchEmbeddedMovies,
  f_vectorSearch,
  f_hybridSearch
} = require('../controllers/embeddedMovieController');

const v_router = express.Router();

// Obtiene todas las películas embebidas
v_router.get('/', f_getAllEmbeddedMovies);
// Busca películas embebidas según criterios específicos
v_router.get('/search', f_searchEmbeddedMovies);
// Vector search usando Voyage AI
v_router.get('/vector-search', f_vectorSearch);
// Hybrid search (vector + filtros)
v_router.get('/hybrid-search', f_hybridSearch);
// Obtiene una película embebida específica por su ID
v_router.get('/:id', f_getEmbeddedMovieById);
// Crea una nueva película embebida
v_router.post('/', f_createEmbeddedMovie);
// Actualiza una película embebida existente por su ID
v_router.put('/:id', f_updateEmbeddedMovie);
// Elimina una película embebida por su ID
v_router.delete('/:id', f_deleteEmbeddedMovie);

module.exports = v_router;
