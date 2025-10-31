import express, { Router } from 'express';
import {
  f_getAllComments,
  f_getCommentById,
  f_createComment,
  f_updateComment,
  f_deleteComment,
  f_getCommentsByMovie
} from '../controllers/commentController';

const v_router: Router = express.Router();

v_router.get('/', f_getAllComments);
v_router.get('/:id', f_getCommentById);
v_router.get('/movie/:movieId', f_getCommentsByMovie);
v_router.post('/', f_createComment);
v_router.put('/:id', f_updateComment);
v_router.delete('/:id', f_deleteComment);

export default v_router;
