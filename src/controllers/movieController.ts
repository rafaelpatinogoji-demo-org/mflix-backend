import { Request, Response } from 'express';
import Movie from '../models/Movie';

export const f_getAllMovies = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_page = parseInt(p_req.query.page as string) || 1;
    const v_limit = parseInt(p_req.query.limit as string) || 10;
    const v_skip = (v_page - 1) * v_limit;

    const v_movies = await Movie.find()
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await Movie.countDocuments();

    p_res.json({
      movies: v_movies,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalMovies: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};

export const f_getMovieById = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_movie = await Movie.findById(p_req.params.id);
    if (!v_movie) {
      p_res.status(404).json({ message: 'Movie not found' });
      return;
    }
    p_res.json(v_movie);
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};

export const f_createMovie = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_movie = new Movie(p_req.body);
    const v_savedMovie = await v_movie.save();
    p_res.status(201).json(v_savedMovie);
  } catch (p_error) {
    p_res.status(400).json({ message: (p_error as Error).message });
  }
};

export const f_updateMovie = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_movie = await Movie.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    );
    if (!v_movie) {
      p_res.status(404).json({ message: 'Movie not found' });
      return;
    }
    p_res.json(v_movie);
  } catch (p_error) {
    p_res.status(400).json({ message: (p_error as Error).message });
  }
};

export const f_deleteMovie = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_movie = await Movie.findByIdAndDelete(p_req.params.id);
    if (!v_movie) {
      p_res.status(404).json({ message: 'Movie not found' });
      return;
    }
    p_res.json({ message: 'Movie deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};

export const f_searchMovies = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const { title, genre, year } = p_req.query;
    const v_filter: any = {};

    if (title) {
      v_filter.title = { $regex: title, $options: 'i' };
    }
    if (genre) {
      v_filter.genres = { $in: [genre] };
    }
    if (year) {
      v_filter.year = parseInt(year as string);
    }

    const v_movies = await Movie.find(v_filter);
    p_res.json(v_movies);
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};
