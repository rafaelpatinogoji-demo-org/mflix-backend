const express = require('express');
const {
  f_getAllComments,
  f_getCommentById,
  f_createComment,
  f_updateComment,
  f_deleteComment,
  f_getCommentsByMovie,
  f_getCommentStatsByMovie,
  f_getUserCommentHistory,
  f_getTopReviewers,
  f_updateHelpfulVotes,
  f_getRecentCommentsByGenre
} = require('../controllers/commentController');

const v_router = express.Router();

// Obtener todos los comentarios
v_router.get('/', f_getAllComments);
// Obtener un comentario por su ID
v_router.get('/:id', f_getCommentById);
// Obtener todos los comentarios de una película específica
v_router.get('/movie/:movieId', f_getCommentsByMovie);
// Obtener estadísticas de comentarios de una película
v_router.get('/stats/movie/:movieId', f_getCommentStatsByMovie);
// Obtener el historial de comentarios de un usuario
v_router.get('/user/:email', f_getUserCommentHistory);
// Obtener los mejores reseñadores
v_router.get('/top-reviewers', f_getTopReviewers);
// Actualizar los votos útiles de un comentario
v_router.patch('/:id/vote', f_updateHelpfulVotes);
// Obtener comentarios recientes por género
v_router.get('/genre/:genre', f_getRecentCommentsByGenre);

// Crear un nuevo comentario
v_router.post('/', f_createComment);
// Actualizar un comentario existente
v_router.put('/:id', f_updateComment);
// Eliminar un comentario
v_router.delete('/:id', f_deleteComment);

module.exports = v_router;
