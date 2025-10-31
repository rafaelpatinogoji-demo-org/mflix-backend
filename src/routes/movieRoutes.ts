import express, { Router } from 'express';
import {
  f_getAllMovies,
  f_getMovieById,
  f_createMovie,
  f_updateMovie,
  f_deleteMovie,
  f_searchMovies
} from '../controllers/movieController';

const v_router: Router = express.Router();

v_router.get('/', f_getAllMovies);
v_router.get('/search', f_searchMovies);
v_router.get('/:id', f_getMovieById);
v_router.post('/', f_createMovie);
v_router.put('/:id', f_updateMovie);
v_router.delete('/:id', f_deleteMovie);

export default v_router;
