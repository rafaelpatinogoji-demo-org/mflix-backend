const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Comment = require('../models/Comment');

// Obtiene todas las películas con paginación
const f_getAllMovies = async (p_req, p_res) => {
  try {
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
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
    p_res.status(500).json({ message: p_error.message });
  }
};

// Obtiene una película específica por su ID
const f_getMovieById = async (p_req, p_res) => {
  try {
    const v_movie = await Movie.findById(p_req.params.id);
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }
    p_res.json(v_movie);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Crea una nueva película en la base de datos
const f_createMovie = async (p_req, p_res) => {
  try {
    const v_movie = new Movie(p_req.body);
    const v_savedMovie = await v_movie.save();
    p_res.status(201).json(v_savedMovie);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Actualiza los datos de una película existente
const f_updateMovie = async (p_req, p_res) => {
  try {
    const v_movie = await Movie.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    );
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }
    p_res.json(v_movie);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Elimina una película de la base de datos
const f_deleteMovie = async (p_req, p_res) => {
  try {
    const v_movie = await Movie.findByIdAndDelete(p_req.params.id);
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }
    p_res.json({ message: 'Movie deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Busca películas por título, género o año
const f_searchMovies = async (p_req, p_res) => {
  try {
    const { title, genre, year } = p_req.query;
    const v_filter = {};

    if (title) {
      v_filter.title = { $regex: title, $options: 'i' };
    }
    if (genre) {
      v_filter.genres = { $in: [genre] };
    }
    if (year) {
      v_filter.year = parseInt(year);
    }

    const v_movies = await Movie.find(v_filter);
    p_res.json(v_movies);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get top-rated movies
// Obtiene las películas mejor calificadas con paginación
const f_getTopRatedMovies = async (p_req, p_res) => {
  try {
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_minVotes = parseInt(p_req.query.minVotes) || 0; // Optional threshold
    const v_skip = (v_page - 1) * v_limit;

    const v_movies = await Movie.aggregate([
      { $match: { 'imdb.rating': { $exists: true, $ne: null }, 'imdb.votes': { $gte: v_minVotes } } },
      { $sort: { 'imdb.rating': -1 } },
      { $skip: v_skip },
      { $limit: v_limit },
      { $project: {
        _id: 1,
        title: 1,
        year: 1,
        genres: 1,
        'imdb.rating': 1,
        'imdb.votes': 1
      }}
    ]);

    const v_total = await Movie.countDocuments({ 'imdb.rating': { $exists: true, $ne: null }, 'imdb.votes': { $gte: v_minVotes } });

    p_res.json({
      movies: v_movies,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalMovies: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get movies grouped by genre with count and average rating
// Obtiene películas agrupadas por género con conteo y calificación promedio
const f_getMoviesByGenre = async (p_req, p_res) => {
  try {
    const v_genre = p_req.query.genre;
    const v_sortBy = p_req.query.sortBy || 'count'; // 'count' or 'rating'

    const v_pipeline = [
      { $match: { genres: { $exists: true, $ne: null }, 'imdb.rating': { $exists: true, $ne: null } } },
      { $unwind: '$genres' }
    ];

    if (v_genre) {
      v_pipeline.push({ $match: { genres: v_genre } });
    }

    v_pipeline.push(
      {
        $group: {
          _id: '$genres',
          count: { $sum: 1 },
          averageRating: { $avg: '$imdb.rating' }
        }
      },
      {
        $project: {
          genre: '$_id',
          _id: 0,
          count: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    );

    if (v_sortBy === 'rating') {
      v_pipeline.push({ $sort: { averageRating: -1 } });
    } else {
      v_pipeline.push({ $sort: { count: -1 } });
    }

    const v_result = await Movie.aggregate(v_pipeline);
    p_res.json(v_result);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get movies grouped by year with count and average rating
// Obtiene películas agrupadas por año con conteo y calificación promedio
const f_getMoviesByYear = async (p_req, p_res) => {
  try {
    const v_startYear = parseInt(p_req.query.startYear);
    const v_endYear = parseInt(p_req.query.endYear);
    const v_sortBy = p_req.query.sortBy || 'year'; // 'year' or 'count' or 'rating'

    const v_pipeline = [
      { $match: { year: { $exists: true, $ne: null }, 'imdb.rating': { $exists: true, $ne: null } } }
    ];

    // Add year range filter if provided
    if (v_startYear || v_endYear) {
      const v_yearFilter = {};
      if (v_startYear) v_yearFilter.$gte = v_startYear;
      if (v_endYear) v_yearFilter.$lte = v_endYear;
      v_pipeline[0].$match.year = { ...v_pipeline[0].$match.year, ...v_yearFilter };
    }

    v_pipeline.push(
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 },
          averageRating: { $avg: '$imdb.rating' }
        }
      },
      {
        $project: {
          year: '$_id',
          _id: 0,
          count: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    );

    if (v_sortBy === 'count') {
      v_pipeline.push({ $sort: { count: -1 } });
    } else if (v_sortBy === 'rating') {
      v_pipeline.push({ $sort: { averageRating: -1 } });
    } else {
      v_pipeline.push({ $sort: { year: 1 } });
    }

    const v_result = await Movie.aggregate(v_pipeline);
    p_res.json(v_result);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get trending movies based on comment frequency
// Obtiene películas en tendencia basadas en la frecuencia de comentarios
const f_getTrendingMovies = async (p_req, p_res) => {
  try {
    const v_days = parseInt(p_req.query.days) || 30;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_dateThreshold = new Date();
    v_dateThreshold.setDate(v_dateThreshold.getDate() - v_days);

    const v_result = await Movie.aggregate([
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'movie_id',
          as: 'comments'
        }
      },
      { $unwind: '$comments' },
      { $match: { 'comments.date': { $gte: v_dateThreshold } } },
      {
        $group: {
          _id: '$_id',
          title: { $first: '$title' },
          year: { $first: '$year' },
          genres: { $first: '$genres' },
          commentCount: { $sum: 1 }
        }
      },
      { $sort: { commentCount: -1 } },
      { $limit: v_limit },
      {
        $project: {
          _id: 1,
          title: 1,
          year: 1,
          genres: 1,
          commentCount: 1
        }
      }
    ]);

    p_res.json(v_result);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get engagement stats for a single movie
// Obtiene estadísticas de engagement para una película específica
const f_getMovieEngagementStats = async (p_req, p_res) => {
  try {
    const v_movieId = p_req.params.id;

    // Get movie details
    const v_movie = await Movie.findById(v_movieId);
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }

    // Get comment stats
    const v_commentCount = await Comment.countDocuments({ movie_id: mongoose.Types.ObjectId(v_movieId) });
    
    // Calculate engagement score (weighted combination)
    const v_engagementScore = v_commentCount + 
      ((v_movie.imdb && v_movie.imdb.rating) ? v_movie.imdb.rating * 10 : 0);

    p_res.json({
      movie: v_movie,
      engagementStats: {
        totalComments: v_commentCount,
        engagementScore: v_engagementScore
      }
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

module.exports = {
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
};
