const mongoose = require('mongoose');

jest.mock('mongoose', () => {
  const v_actualMongoose = jest.requireActual('mongoose');
  return {
    ...v_actualMongoose,
    Types: {
      ...v_actualMongoose.Types,
      ObjectId: jest.fn((p_id) => p_id)
    }
  };
});

const Movie = require('../../../src/models/Movie');
const Comment = require('../../../src/models/Comment');
const {
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
} = require('../../../src/controllers/movieController');

jest.mock('../../../src/models/Movie');
jest.mock('../../../src/models/Comment');

const v_mockResponse = () => {
  const v_res = {};
  v_res.status = jest.fn().mockReturnValue(v_res);
  v_res.json = jest.fn().mockReturnValue(v_res);
  return v_res;
};

const v_mockRequest = (p_params = {}, p_query = {}, p_body = {}) => ({
  params: p_params,
  query: p_query,
  body: p_body
});

describe('Movie Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('f_getAllMovies', () => {
    const v_mockMovies = [
      { _id: '507f1f77bcf86cd799439011', title: 'Movie 1', year: 2020 },
      { _id: '507f1f77bcf86cd799439012', title: 'Movie 2', year: 2021 }
    ];

    it('should return paginated movies with default pagination', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      const v_mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockMovies)
      };
      Movie.find.mockReturnValue(v_mockQuery);
      Movie.countDocuments.mockResolvedValue(20);

      await f_getAllMovies(v_req, v_res);

      expect(Movie.find).toHaveBeenCalled();
      expect(v_mockQuery.skip).toHaveBeenCalledWith(0);
      expect(v_mockQuery.limit).toHaveBeenCalledWith(10);
      expect(Movie.countDocuments).toHaveBeenCalled();
      expect(v_res.json).toHaveBeenCalledWith({
        movies: v_mockMovies,
        currentPage: 1,
        totalPages: 2,
        totalMovies: 20
      });
    });

    it('should return paginated movies with custom pagination', async () => {
      const v_req = v_mockRequest({}, { page: '2', limit: '5' });
      const v_res = v_mockResponse();

      const v_mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockMovies)
      };
      Movie.find.mockReturnValue(v_mockQuery);
      Movie.countDocuments.mockResolvedValue(20);

      await f_getAllMovies(v_req, v_res);

      expect(v_mockQuery.skip).toHaveBeenCalledWith(5);
      expect(v_mockQuery.limit).toHaveBeenCalledWith(5);
      expect(v_res.json).toHaveBeenCalledWith({
        movies: v_mockMovies,
        currentPage: 2,
        totalPages: 4,
        totalMovies: 20
      });
    });

    it('should handle database error', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      const v_mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      Movie.find.mockReturnValue(v_mockQuery);

      await f_getAllMovies(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });

    it('should handle invalid page parameter', async () => {
      const v_req = v_mockRequest({}, { page: 'invalid', limit: '10' });
      const v_res = v_mockResponse();

      const v_mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockMovies)
      };
      Movie.find.mockReturnValue(v_mockQuery);
      Movie.countDocuments.mockResolvedValue(20);

      await f_getAllMovies(v_req, v_res);

      expect(v_mockQuery.skip).toHaveBeenCalledWith(0);
      expect(v_res.json).toHaveBeenCalledWith(expect.objectContaining({
        currentPage: 1
      }));
    });

    it('should calculate totalPages correctly when total is not evenly divisible', async () => {
      const v_req = v_mockRequest({}, { page: '1', limit: '3' });
      const v_res = v_mockResponse();

      const v_mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockMovies)
      };
      Movie.find.mockReturnValue(v_mockQuery);
      Movie.countDocuments.mockResolvedValue(7);

      await f_getAllMovies(v_req, v_res);

      expect(v_res.json).toHaveBeenCalledWith(expect.objectContaining({
        totalPages: 3
      }));
    });
  });

  describe('f_getMovieById', () => {
    const v_mockMovie = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Test Movie',
      year: 2020,
      genres: ['Action', 'Drama']
    };

    it('should return a movie when found', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);

      await f_getMovieById(v_req, v_res);

      expect(Movie.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(v_res.json).toHaveBeenCalledWith(v_mockMovie);
    });

    it('should return 404 when movie not found', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(null);

      await f_getMovieById(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should handle database error', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findById.mockRejectedValue(new Error('Database error'));

      await f_getMovieById(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_createMovie', () => {
    const v_movieData = {
      title: 'New Movie',
      year: 2024,
      genres: ['Action']
    };

    it('should create a new movie successfully', async () => {
      const v_req = v_mockRequest({}, {}, v_movieData);
      const v_res = v_mockResponse();

      const v_savedMovie = { _id: '507f1f77bcf86cd799439011', ...v_movieData };
      const v_mockMovieInstance = {
        save: jest.fn().mockResolvedValue(v_savedMovie)
      };
      Movie.mockImplementation(() => v_mockMovieInstance);

      await f_createMovie(v_req, v_res);

      expect(Movie).toHaveBeenCalledWith(v_movieData);
      expect(v_mockMovieInstance.save).toHaveBeenCalled();
      expect(v_res.status).toHaveBeenCalledWith(201);
      expect(v_res.json).toHaveBeenCalledWith(v_savedMovie);
    });

    it('should handle validation error', async () => {
      const v_req = v_mockRequest({}, {}, { year: 2024 });
      const v_res = v_mockResponse();

      const v_mockMovieInstance = {
        save: jest.fn().mockRejectedValue(new Error('Title is required'))
      };
      Movie.mockImplementation(() => v_mockMovieInstance);

      await f_createMovie(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Title is required' });
    });

    it('should handle duplicate key error', async () => {
      const v_req = v_mockRequest({}, {}, v_movieData);
      const v_res = v_mockResponse();

      const v_mockMovieInstance = {
        save: jest.fn().mockRejectedValue(new Error('Duplicate key error'))
      };
      Movie.mockImplementation(() => v_mockMovieInstance);

      await f_createMovie(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Duplicate key error' });
    });
  });

  describe('f_updateMovie', () => {
    const v_updateData = { title: 'Updated Movie' };
    const v_updatedMovie = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Updated Movie',
      year: 2020
    };

    it('should update a movie successfully', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' }, {}, v_updateData);
      const v_res = v_mockResponse();

      Movie.findByIdAndUpdate.mockResolvedValue(v_updatedMovie);

      await f_updateMovie(v_req, v_res);

      expect(Movie.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        v_updateData,
        { new: true, runValidators: true }
      );
      expect(v_res.json).toHaveBeenCalledWith(v_updatedMovie);
    });

    it('should return 404 when movie not found', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' }, {}, v_updateData);
      const v_res = v_mockResponse();

      Movie.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateMovie(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should handle validation error on update', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' }, {}, { year: 'invalid' });
      const v_res = v_mockResponse();

      Movie.findByIdAndUpdate.mockRejectedValue(new Error('Validation failed'));

      await f_updateMovie(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });
  });

  describe('f_deleteMovie', () => {
    const v_deletedMovie = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Deleted Movie'
    };

    it('should delete a movie successfully', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findByIdAndDelete.mockResolvedValue(v_deletedMovie);

      await f_deleteMovie(v_req, v_res);

      expect(Movie.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Movie deleted successfully' });
    });

    it('should return 404 when movie not found', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteMovie(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should handle database error on delete', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      await f_deleteMovie(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_searchMovies', () => {
    const v_mockMovies = [
      { _id: '507f1f77bcf86cd799439011', title: 'Action Movie', year: 2020, genres: ['Action'] },
      { _id: '507f1f77bcf86cd799439012', title: 'Drama Movie', year: 2021, genres: ['Drama'] }
    ];

    it('should search movies by title', async () => {
      const v_req = v_mockRequest({}, { title: 'Action' });
      const v_res = v_mockResponse();

      Movie.find.mockResolvedValue([v_mockMovies[0]]);

      await f_searchMovies(v_req, v_res);

      expect(Movie.find).toHaveBeenCalledWith({
        title: { $regex: 'Action', $options: 'i' }
      });
      expect(v_res.json).toHaveBeenCalledWith([v_mockMovies[0]]);
    });

    it('should search movies by genre', async () => {
      const v_req = v_mockRequest({}, { genre: 'Drama' });
      const v_res = v_mockResponse();

      Movie.find.mockResolvedValue([v_mockMovies[1]]);

      await f_searchMovies(v_req, v_res);

      expect(Movie.find).toHaveBeenCalledWith({
        genres: { $in: ['Drama'] }
      });
      expect(v_res.json).toHaveBeenCalledWith([v_mockMovies[1]]);
    });

    it('should search movies by year', async () => {
      const v_req = v_mockRequest({}, { year: '2020' });
      const v_res = v_mockResponse();

      Movie.find.mockResolvedValue([v_mockMovies[0]]);

      await f_searchMovies(v_req, v_res);

      expect(Movie.find).toHaveBeenCalledWith({
        year: 2020
      });
      expect(v_res.json).toHaveBeenCalledWith([v_mockMovies[0]]);
    });

    it('should search movies with multiple filters', async () => {
      const v_req = v_mockRequest({}, { title: 'Movie', genre: 'Action', year: '2020' });
      const v_res = v_mockResponse();

      Movie.find.mockResolvedValue([v_mockMovies[0]]);

      await f_searchMovies(v_req, v_res);

      expect(Movie.find).toHaveBeenCalledWith({
        title: { $regex: 'Movie', $options: 'i' },
        genres: { $in: ['Action'] },
        year: 2020
      });
    });

    it('should return all movies when no filters provided', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.find.mockResolvedValue(v_mockMovies);

      await f_searchMovies(v_req, v_res);

      expect(Movie.find).toHaveBeenCalledWith({});
      expect(v_res.json).toHaveBeenCalledWith(v_mockMovies);
    });

    it('should handle database error', async () => {
      const v_req = v_mockRequest({}, { title: 'Test' });
      const v_res = v_mockResponse();

      Movie.find.mockRejectedValue(new Error('Database error'));

      await f_searchMovies(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getTopRatedMovies', () => {
    const v_mockTopRatedMovies = [
      { _id: '1', title: 'Top Movie 1', year: 2020, genres: ['Drama'], imdb: { rating: 9.5, votes: 1000 } },
      { _id: '2', title: 'Top Movie 2', year: 2021, genres: ['Action'], imdb: { rating: 9.0, votes: 800 } }
    ];

    it('should return top rated movies with default pagination', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockTopRatedMovies);
      Movie.countDocuments.mockResolvedValue(50);

      await f_getTopRatedMovies(v_req, v_res);

      expect(Movie.aggregate).toHaveBeenCalledWith([
        { $match: { 'imdb.rating': { $exists: true, $ne: null }, 'imdb.votes': { $gte: 0 } } },
        { $sort: { 'imdb.rating': -1 } },
        { $skip: 0 },
        { $limit: 10 },
        { $project: {
          _id: 1,
          title: 1,
          year: 1,
          genres: 1,
          'imdb.rating': 1,
          'imdb.votes': 1
        }}
      ]);
      expect(v_res.json).toHaveBeenCalledWith({
        movies: v_mockTopRatedMovies,
        currentPage: 1,
        totalPages: 5,
        totalMovies: 50
      });
    });

    it('should return top rated movies with custom pagination', async () => {
      const v_req = v_mockRequest({}, { page: '2', limit: '5' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockTopRatedMovies);
      Movie.countDocuments.mockResolvedValue(50);

      await f_getTopRatedMovies(v_req, v_res);

      expect(Movie.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ $skip: 5 }),
        expect.objectContaining({ $limit: 5 })
      ]));
      expect(v_res.json).toHaveBeenCalledWith(expect.objectContaining({
        currentPage: 2,
        totalPages: 10
      }));
    });

    it('should filter by minimum votes', async () => {
      const v_req = v_mockRequest({}, { minVotes: '500' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockTopRatedMovies);
      Movie.countDocuments.mockResolvedValue(30);

      await f_getTopRatedMovies(v_req, v_res);

      expect(Movie.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          $match: { 'imdb.rating': { $exists: true, $ne: null }, 'imdb.votes': { $gte: 500 } }
        })
      ]));
      expect(Movie.countDocuments).toHaveBeenCalledWith({
        'imdb.rating': { $exists: true, $ne: null },
        'imdb.votes': { $gte: 500 }
      });
    });

    it('should handle database error', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockRejectedValue(new Error('Aggregation error'));

      await f_getTopRatedMovies(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });
  });

  describe('f_getMoviesByGenre', () => {
    const v_mockGenreStats = [
      { genre: 'Drama', count: 100, averageRating: 7.5 },
      { genre: 'Action', count: 80, averageRating: 6.8 }
    ];

    it('should return movies grouped by genre sorted by count', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockGenreStats);

      await f_getMoviesByGenre(v_req, v_res);

      expect(Movie.aggregate).toHaveBeenCalled();
      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline).toContainEqual({ $match: { genres: { $exists: true, $ne: null }, 'imdb.rating': { $exists: true, $ne: null } } });
      expect(v_pipeline).toContainEqual({ $unwind: '$genres' });
      expect(v_pipeline[v_pipeline.length - 1]).toEqual({ $sort: { count: -1 } });
      expect(v_res.json).toHaveBeenCalledWith(v_mockGenreStats);
    });

    it('should filter by specific genre', async () => {
      const v_req = v_mockRequest({}, { genre: 'Drama' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue([v_mockGenreStats[0]]);

      await f_getMoviesByGenre(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline).toContainEqual({ $match: { genres: 'Drama' } });
    });

    it('should sort by rating when specified', async () => {
      const v_req = v_mockRequest({}, { sortBy: 'rating' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockGenreStats);

      await f_getMoviesByGenre(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline[v_pipeline.length - 1]).toEqual({ $sort: { averageRating: -1 } });
    });

    it('should handle database error', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockRejectedValue(new Error('Aggregation error'));

      await f_getMoviesByGenre(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });
  });

  describe('f_getMoviesByYear', () => {
    const v_mockYearStats = [
      { year: 2020, count: 50, averageRating: 7.2 },
      { year: 2021, count: 45, averageRating: 7.5 }
    ];

    it('should return movies grouped by year sorted by year', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockYearStats);

      await f_getMoviesByYear(v_req, v_res);

      expect(Movie.aggregate).toHaveBeenCalled();
      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline[0]).toEqual({ $match: { year: { $exists: true, $ne: null }, 'imdb.rating': { $exists: true, $ne: null } } });
      expect(v_pipeline[v_pipeline.length - 1]).toEqual({ $sort: { year: 1 } });
      expect(v_res.json).toHaveBeenCalledWith(v_mockYearStats);
    });

    it('should filter by year range with startYear only', async () => {
      const v_req = v_mockRequest({}, { startYear: '2015' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockYearStats);

      await f_getMoviesByYear(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline[0].$match.year).toMatchObject({ $gte: 2015 });
    });

    it('should filter by year range with endYear only', async () => {
      const v_req = v_mockRequest({}, { endYear: '2020' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockYearStats);

      await f_getMoviesByYear(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline[0].$match.year).toMatchObject({ $lte: 2020 });
    });

    it('should filter by year range with both startYear and endYear', async () => {
      const v_req = v_mockRequest({}, { startYear: '2015', endYear: '2020' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockYearStats);

      await f_getMoviesByYear(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline[0].$match.year).toMatchObject({ $gte: 2015, $lte: 2020 });
    });

    it('should sort by count when specified', async () => {
      const v_req = v_mockRequest({}, { sortBy: 'count' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockYearStats);

      await f_getMoviesByYear(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline[v_pipeline.length - 1]).toEqual({ $sort: { count: -1 } });
    });

    it('should sort by rating when specified', async () => {
      const v_req = v_mockRequest({}, { sortBy: 'rating' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockYearStats);

      await f_getMoviesByYear(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline[v_pipeline.length - 1]).toEqual({ $sort: { averageRating: -1 } });
    });

    it('should handle database error', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockRejectedValue(new Error('Aggregation error'));

      await f_getMoviesByYear(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });
  });

  describe('f_getTrendingMovies', () => {
    const v_mockTrendingMovies = [
      { _id: '1', title: 'Trending Movie 1', year: 2024, genres: ['Action'], commentCount: 50 },
      { _id: '2', title: 'Trending Movie 2', year: 2024, genres: ['Drama'], commentCount: 30 }
    ];

    it('should return trending movies with default parameters', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockTrendingMovies);

      await f_getTrendingMovies(v_req, v_res);

      expect(Movie.aggregate).toHaveBeenCalled();
      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline).toContainEqual(expect.objectContaining({
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'movie_id',
          as: 'comments'
        }
      }));
      expect(v_pipeline).toContainEqual({ $unwind: '$comments' });
      expect(v_pipeline).toContainEqual({ $sort: { commentCount: -1 } });
      expect(v_pipeline).toContainEqual({ $limit: 10 });
      expect(v_res.json).toHaveBeenCalledWith(v_mockTrendingMovies);
    });

    it('should use custom days parameter', async () => {
      const v_req = v_mockRequest({}, { days: '7' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockTrendingMovies);

      await f_getTrendingMovies(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      const v_matchStage = v_pipeline.find(p_stage => p_stage.$match && p_stage.$match['comments.date']);
      expect(v_matchStage).toBeDefined();
      expect(v_matchStage.$match['comments.date'].$gte).toBeInstanceOf(Date);
    });

    it('should use custom limit parameter', async () => {
      const v_req = v_mockRequest({}, { limit: '5' });
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue(v_mockTrendingMovies);

      await f_getTrendingMovies(v_req, v_res);

      const v_pipeline = Movie.aggregate.mock.calls[0][0];
      expect(v_pipeline).toContainEqual({ $limit: 5 });
    });

    it('should handle database error', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockRejectedValue(new Error('Aggregation error'));

      await f_getTrendingMovies(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });

    it('should return empty array when no trending movies found', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      Movie.aggregate.mockResolvedValue([]);

      await f_getTrendingMovies(v_req, v_res);

      expect(v_res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('f_getMovieEngagementStats', () => {
    const v_mockMovie = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Test Movie',
      year: 2020,
      imdb: { rating: 8.5, votes: 1000 }
    };

    it('should return engagement stats for a movie', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Comment.countDocuments.mockResolvedValue(25);

      await f_getMovieEngagementStats(v_req, v_res);

      expect(Movie.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(Comment.countDocuments).toHaveBeenCalled();
      expect(v_res.json).toHaveBeenCalledWith({
        movie: v_mockMovie,
        engagementStats: {
          totalComments: 25,
          engagementScore: 25 + (8.5 * 10)
        }
      });
    });

    it('should return 404 when movie not found', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(null);

      await f_getMovieEngagementStats(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should calculate engagement score without imdb rating', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      const v_movieWithoutRating = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Movie',
        year: 2020
      };

      Movie.findById.mockResolvedValue(v_movieWithoutRating);
      Comment.countDocuments.mockResolvedValue(15);

      await f_getMovieEngagementStats(v_req, v_res);

      expect(v_res.json).toHaveBeenCalledWith({
        movie: v_movieWithoutRating,
        engagementStats: {
          totalComments: 15,
          engagementScore: 15
        }
      });
    });

    it('should calculate engagement score with imdb object but no rating', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      const v_movieWithEmptyImdb = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Movie',
        year: 2020,
        imdb: {}
      };

      Movie.findById.mockResolvedValue(v_movieWithEmptyImdb);
      Comment.countDocuments.mockResolvedValue(10);

      await f_getMovieEngagementStats(v_req, v_res);

      expect(v_res.json).toHaveBeenCalledWith({
        movie: v_movieWithEmptyImdb,
        engagementStats: {
          totalComments: 10,
          engagementScore: 10
        }
      });
    });

    it('should handle database error', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findById.mockRejectedValue(new Error('Database error'));

      await f_getMovieEngagementStats(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });

    it('should handle comment count error', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Comment.countDocuments.mockRejectedValue(new Error('Comment count error'));

      await f_getMovieEngagementStats(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Comment count error' });
    });

    it('should handle zero comments', async () => {
      const v_req = v_mockRequest({ id: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Comment.countDocuments.mockResolvedValue(0);

      await f_getMovieEngagementStats(v_req, v_res);

      expect(v_res.json).toHaveBeenCalledWith({
        movie: v_mockMovie,
        engagementStats: {
          totalComments: 0,
          engagementScore: 0 + (8.5 * 10)
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty database for getAllMovies', async () => {
      const v_req = v_mockRequest({}, {});
      const v_res = v_mockResponse();

      const v_mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };
      Movie.find.mockReturnValue(v_mockQuery);
      Movie.countDocuments.mockResolvedValue(0);

      await f_getAllMovies(v_req, v_res);

      expect(v_res.json).toHaveBeenCalledWith({
        movies: [],
        currentPage: 1,
        totalPages: 0,
        totalMovies: 0
      });
    });

    it('should handle large page numbers', async () => {
      const v_req = v_mockRequest({}, { page: '1000', limit: '10' });
      const v_res = v_mockResponse();

      const v_mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };
      Movie.find.mockReturnValue(v_mockQuery);
      Movie.countDocuments.mockResolvedValue(100);

      await f_getAllMovies(v_req, v_res);

      expect(v_mockQuery.skip).toHaveBeenCalledWith(9990);
      expect(v_res.json).toHaveBeenCalledWith({
        movies: [],
        currentPage: 1000,
        totalPages: 10,
        totalMovies: 100
      });
    });

    it('should handle special characters in search title', async () => {
      const v_req = v_mockRequest({}, { title: 'Test $pecial [Characters]' });
      const v_res = v_mockResponse();

      Movie.find.mockResolvedValue([]);

      await f_searchMovies(v_req, v_res);

      expect(Movie.find).toHaveBeenCalledWith({
        title: { $regex: 'Test $pecial [Characters]', $options: 'i' }
      });
    });
  });
});
