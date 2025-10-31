import express, { Router } from 'express';
import {
  f_getAllEmbeddedMovies,
  f_getEmbeddedMovieById,
  f_createEmbeddedMovie,
  f_updateEmbeddedMovie,
  f_deleteEmbeddedMovie,
  f_searchEmbeddedMovies
} from '../controllers/embeddedMovieController';

const v_router: Router = express.Router();

v_router.get('/', f_getAllEmbeddedMovies);
v_router.get('/search', f_searchEmbeddedMovies);
v_router.get('/:id', f_getEmbeddedMovieById);
v_router.post('/', f_createEmbeddedMovie);
v_router.put('/:id', f_updateEmbeddedMovie);
v_router.delete('/:id', f_deleteEmbeddedMovie);

export default v_router;
