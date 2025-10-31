import { Request, Response } from 'express';
import EmbeddedMovie from '../models/EmbeddedMovie';

export const f_getAllEmbeddedMovies = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_page = parseInt(p_req.query.page as string) || 1;
    const v_limit = parseInt(p_req.query.limit as string) || 10;
    const v_skip = (v_page - 1) * v_limit;

    const v_embeddedMovies = await EmbeddedMovie.find()
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await EmbeddedMovie.countDocuments();

    p_res.json({
      embeddedMovies: v_embeddedMovies,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalEmbeddedMovies: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};

export const f_getEmbeddedMovieById = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_embeddedMovie = await EmbeddedMovie.findById(p_req.params.id);
    if (!v_embeddedMovie) {
      p_res.status(404).json({ message: 'Embedded movie not found' });
      return;
    }
    p_res.json(v_embeddedMovie);
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};

export const f_createEmbeddedMovie = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_embeddedMovie = new EmbeddedMovie(p_req.body);
    const v_savedEmbeddedMovie = await v_embeddedMovie.save();
    p_res.status(201).json(v_savedEmbeddedMovie);
  } catch (p_error) {
    p_res.status(400).json({ message: (p_error as Error).message });
  }
};

export const f_updateEmbeddedMovie = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_embeddedMovie = await EmbeddedMovie.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    );
    if (!v_embeddedMovie) {
      p_res.status(404).json({ message: 'Embedded movie not found' });
      return;
    }
    p_res.json(v_embeddedMovie);
  } catch (p_error) {
    p_res.status(400).json({ message: (p_error as Error).message });
  }
};

export const f_deleteEmbeddedMovie = async (p_req: Request, p_res: Response): Promise<void> => {
  try {
    const v_embeddedMovie = await EmbeddedMovie.findByIdAndDelete(p_req.params.id);
    if (!v_embeddedMovie) {
      p_res.status(404).json({ message: 'Embedded movie not found' });
      return;
    }
    p_res.json({ message: 'Embedded movie deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};

export const f_searchEmbeddedMovies = async (p_req: Request, p_res: Response): Promise<void> => {
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

    const v_embeddedMovies = await EmbeddedMovie.find(v_filter);
    p_res.json(v_embeddedMovies);
  } catch (p_error) {
    p_res.status(500).json({ message: (p_error as Error).message });
  }
};
