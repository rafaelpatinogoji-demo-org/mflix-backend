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
v_router.get('/:id', f_getCommentById);
v_router.get('/movie/:movieId', f_getCommentsByMovie);
v_router.get('/stats/movie/:movieId', f_getCommentStatsByMovie);
v_router.get('/user/:email', f_getUserCommentHistory);
v_router.get('/top-reviewers', f_getTopReviewers);
v_router.patch('/:id/vote', f_updateHelpfulVotes);
v_router.get('/genre/:genre', f_getRecentCommentsByGenre);

v_router.post('/', f_createComment);
v_router.put('/:id', f_updateComment);
v_router.delete('/:id', f_deleteComment);

module.exports = v_router;
