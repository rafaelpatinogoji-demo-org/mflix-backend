const mongoose = require('mongoose');
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
} = require('../../src/controllers/movieController');
const Movie = require('../../src/models/Movie');
const Comment = require('../../src/models/Comment');

jest.mock('../../src/models/Movie');
jest.mock('../../src/models/Comment');

const mockRequest = (params = {}, query = {}, body = {}) => ({
  params,
  query,
  body
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Movie Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('f_getAllMovies', () => {
    it('should return paginated movies with default page and limit', async () => {
      const mockMovies = [
        { _id: '1', title: 'Movie 1', year: 2020 },
        { _id: '2', title: 'Movie 2', year: 2021 }
      ];

      Movie.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockMovies)
        })
      });
      Movie.countDocuments = jest.fn().mockResolvedValue(100);

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getAllMovies(req, res);

      expect(Movie.find).toHaveBeenCalled();
      expect(Movie.countDocuments).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        movies: mockMovies,
        currentPage: 1,
        totalPages: 10,
        totalMovies: 100
      });
    });

    it('should return paginated movies with custom page and limit', async () => {
      const mockMovies = [{ _id: '3', title: 'Movie 3', year: 2022 }];

      Movie.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockMovies)
        })
      });
      Movie.countDocuments = jest.fn().mockResolvedValue(50);

      const req = mockRequest({}, { page: '3', limit: '5' }, {});
      const res = mockResponse();

      await f_getAllMovies(req, res);

      expect(res.json).toHaveBeenCalledWith({
        movies: mockMovies,
        currentPage: 3,
        totalPages: 10,
        totalMovies: 50
      });
    });

    it('should handle errors and return 500 status', async () => {
      Movie.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getAllMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getMovieById', () => {
    it('should return a movie when found', async () => {
      const mockMovie = { _id: '123', title: 'Test Movie', year: 2020 };
      Movie.findById = jest.fn().mockResolvedValue(mockMovie);

      const req = mockRequest({ id: '123' }, {}, {});
      const res = mockResponse();

      await f_getMovieById(req, res);

      expect(Movie.findById).toHaveBeenCalledWith('123');
      expect(res.json).toHaveBeenCalledWith(mockMovie);
    });

    it('should return 404 when movie not found', async () => {
      Movie.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({ id: '123' }, {}, {});
      const res = mockResponse();

      await f_getMovieById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should handle errors and return 500 status', async () => {
      Movie.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const req = mockRequest({ id: '123' }, {}, {});
      const res = mockResponse();

      await f_getMovieById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_createMovie', () => {
    it('should create a movie and return 201 status', async () => {
      const movieData = { title: 'New Movie', year: 2023, genres: ['Action'] };
      const savedMovie = { _id: '456', ...movieData };

      const mockSave = jest.fn().mockResolvedValue(savedMovie);
      Movie.mockImplementation(() => ({
        save: mockSave
      }));

      const req = mockRequest({}, {}, movieData);
      const res = mockResponse();

      await f_createMovie(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(savedMovie);
    });

    it('should handle validation errors and return 400 status', async () => {
      const movieData = { year: 2023 };
      const mockSave = jest.fn().mockRejectedValue(new Error('Validation failed'));
      Movie.mockImplementation(() => ({
        save: mockSave
      }));

      const req = mockRequest({}, {}, movieData);
      const res = mockResponse();

      await f_createMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });
  });

  describe('f_updateMovie', () => {
    it('should update a movie and return updated data', async () => {
      const updatedMovie = { _id: '123', title: 'Updated Movie', year: 2023 };
      Movie.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedMovie);

      const req = mockRequest({ id: '123' }, {}, { title: 'Updated Movie' });
      const res = mockResponse();

      await f_updateMovie(req, res);

      expect(Movie.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { title: 'Updated Movie' },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedMovie);
    });

    it('should return 404 when movie not found', async () => {
      Movie.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const req = mockRequest({ id: '123' }, {}, { title: 'Updated' });
      const res = mockResponse();

      await f_updateMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should handle validation errors and return 400 status', async () => {
      Movie.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Validation error'));

      const req = mockRequest({ id: '123' }, {}, { year: 'invalid' });
      const res = mockResponse();

      await f_updateMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation error' });
    });
  });

  describe('f_deleteMovie', () => {
    it('should delete a movie and return success message', async () => {
      const mockMovie = { _id: '123', title: 'To Delete' };
      Movie.findByIdAndDelete = jest.fn().mockResolvedValue(mockMovie);

      const req = mockRequest({ id: '123' }, {}, {});
      const res = mockResponse();

      await f_deleteMovie(req, res);

      expect(Movie.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(res.json).toHaveBeenCalledWith({ message: 'Movie deleted successfully' });
    });

    it('should return 404 when movie not found', async () => {
      Movie.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const req = mockRequest({ id: '123' }, {}, {});
      const res = mockResponse();

      await f_deleteMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should handle errors and return 500 status', async () => {
      Movie.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Delete error'));

      const req = mockRequest({ id: '123' }, {}, {});
      const res = mockResponse();

      await f_deleteMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Delete error' });
    });
  });

  describe('f_searchMovies', () => {
    it('should search movies by title with case-insensitive regex', async () => {
      const mockMovies = [{ _id: '1', title: 'Inception', year: 2010 }];
      Movie.find = jest.fn().mockResolvedValue(mockMovies);

      const req = mockRequest({}, { title: 'incep' }, {});
      const res = mockResponse();

      await f_searchMovies(req, res);

      expect(Movie.find).toHaveBeenCalledWith({
        title: { $regex: 'incep', $options: 'i' }
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should search movies by genre', async () => {
      const mockMovies = [{ _id: '2', title: 'Action Movie', genres: ['Action'] }];
      Movie.find = jest.fn().mockResolvedValue(mockMovies);

      const req = mockRequest({}, { genre: 'Action' }, {});
      const res = mockResponse();

      await f_searchMovies(req, res);

      expect(Movie.find).toHaveBeenCalledWith({
        genres: { $in: ['Action'] }
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should search movies by year', async () => {
      const mockMovies = [{ _id: '3', title: '2020 Movie', year: 2020 }];
      Movie.find = jest.fn().mockResolvedValue(mockMovies);

      const req = mockRequest({}, { year: '2020' }, {});
      const res = mockResponse();

      await f_searchMovies(req, res);

      expect(Movie.find).toHaveBeenCalledWith({
        year: 2020
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should search movies with combined filters', async () => {
      const mockMovies = [{ _id: '4', title: 'Matrix', year: 1999, genres: ['Sci-Fi'] }];
      Movie.find = jest.fn().mockResolvedValue(mockMovies);

      const req = mockRequest({}, { title: 'matrix', genre: 'Sci-Fi', year: '1999' }, {});
      const res = mockResponse();

      await f_searchMovies(req, res);

      expect(Movie.find).toHaveBeenCalledWith({
        title: { $regex: 'matrix', $options: 'i' },
        genres: { $in: ['Sci-Fi'] },
        year: 1999
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should return empty array when no movies match', async () => {
      Movie.find = jest.fn().mockResolvedValue([]);

      const req = mockRequest({}, { title: 'nonexistent' }, {});
      const res = mockResponse();

      await f_searchMovies(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle errors and return 500 status', async () => {
      Movie.find = jest.fn().mockRejectedValue(new Error('Search error'));

      const req = mockRequest({}, { title: 'test' }, {});
      const res = mockResponse();

      await f_searchMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Search error' });
    });
  });

  describe('f_getTopRatedMovies', () => {
    it('should return top-rated movies with default pagination', async () => {
      const mockMovies = [
        { _id: '1', title: 'Top Movie 1', imdb: { rating: 9.5, votes: 1000 } },
        { _id: '2', title: 'Top Movie 2', imdb: { rating: 9.3, votes: 800 } }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockMovies);
      Movie.countDocuments = jest.fn().mockResolvedValue(50);

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getTopRatedMovies(req, res);

      expect(Movie.aggregate).toHaveBeenCalledWith([
        { $match: { 'imdb.rating': { $exists: true, $ne: null }, 'imdb.votes': { $gte: 0 } } },
        { $sort: { 'imdb.rating': -1 } },
        { $skip: 0 },
        { $limit: 10 },
        {
          $project: {
            _id: 1,
            title: 1,
            year: 1,
            genres: 1,
            'imdb.rating': 1,
            'imdb.votes': 1
          }
        }
      ]);
      expect(res.json).toHaveBeenCalledWith({
        movies: mockMovies,
        currentPage: 1,
        totalPages: 5,
        totalMovies: 50
      });
    });

    it('should return top-rated movies with custom pagination and minVotes', async () => {
      const mockMovies = [{ _id: '3', title: 'Popular Movie', imdb: { rating: 8.5, votes: 5000 } }];
      Movie.aggregate = jest.fn().mockResolvedValue(mockMovies);
      Movie.countDocuments = jest.fn().mockResolvedValue(20);

      const req = mockRequest({}, { page: '2', limit: '5', minVotes: '1000' }, {});
      const res = mockResponse();

      await f_getTopRatedMovies(req, res);

      expect(Movie.aggregate).toHaveBeenCalledWith([
        { $match: { 'imdb.rating': { $exists: true, $ne: null }, 'imdb.votes': { $gte: 1000 } } },
        { $sort: { 'imdb.rating': -1 } },
        { $skip: 5 },
        { $limit: 5 },
        expect.any(Object)
      ]);
      expect(res.json).toHaveBeenCalledWith({
        movies: mockMovies,
        currentPage: 2,
        totalPages: 4,
        totalMovies: 20
      });
    });

    it('should handle errors and return 500 status', async () => {
      Movie.aggregate = jest.fn().mockRejectedValue(new Error('Aggregation error'));

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getTopRatedMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });
  });

  describe('f_getMoviesByGenre', () => {
    it('should return movies grouped by genre sorted by count', async () => {
      const mockResult = [
        { genre: 'Action', count: 100, averageRating: 7.5 },
        { genre: 'Drama', count: 80, averageRating: 8.0 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getMoviesByGenre(req, res);

      expect(Movie.aggregate).toHaveBeenCalled();
      const pipeline = Movie.aggregate.mock.calls[0][0];
      expect(pipeline).toEqual(expect.arrayContaining([
        { $match: { genres: { $exists: true, $ne: null }, 'imdb.rating': { $exists: true, $ne: null } } },
        { $unwind: '$genres' },
        expect.objectContaining({ $group: expect.any(Object) }),
        expect.objectContaining({ $project: expect.any(Object) }),
        { $sort: { count: -1 } }
      ]));
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should filter by specific genre when provided', async () => {
      const mockResult = [{ genre: 'Comedy', count: 50, averageRating: 7.0 }];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, { genre: 'Comedy' }, {});
      const res = mockResponse();

      await f_getMoviesByGenre(req, res);

      const pipeline = Movie.aggregate.mock.calls[0][0];
      expect(pipeline).toEqual(expect.arrayContaining([
        { $match: { genres: 'Comedy' } }
      ]));
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should sort by rating when sortBy is rating', async () => {
      const mockResult = [
        { genre: 'Drama', count: 80, averageRating: 8.5 },
        { genre: 'Action', count: 100, averageRating: 7.5 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, { sortBy: 'rating' }, {});
      const res = mockResponse();

      await f_getMoviesByGenre(req, res);

      const pipeline = Movie.aggregate.mock.calls[0][0];
      expect(pipeline[pipeline.length - 1]).toEqual({ $sort: { averageRating: -1 } });
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors and return 500 status', async () => {
      Movie.aggregate = jest.fn().mockRejectedValue(new Error('Genre aggregation error'));

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getMoviesByGenre(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Genre aggregation error' });
    });
  });

  describe('f_getMoviesByYear', () => {
    it('should return movies grouped by year with default sort', async () => {
      const mockResult = [
        { year: 2020, count: 50, averageRating: 7.5 },
        { year: 2021, count: 60, averageRating: 7.8 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getMoviesByYear(req, res);

      const pipeline = Movie.aggregate.mock.calls[0][0];
      expect(pipeline).toEqual(expect.arrayContaining([
        { $match: { year: { $exists: true, $ne: null }, 'imdb.rating': { $exists: true, $ne: null } } },
        expect.objectContaining({ $group: expect.any(Object) }),
        { $sort: { year: 1 } }
      ]));
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should filter by year range when provided', async () => {
      const mockResult = [
        { year: 2015, count: 40, averageRating: 7.2 },
        { year: 2016, count: 45, averageRating: 7.3 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, { startYear: '2015', endYear: '2016' }, {});
      const res = mockResponse();

      await f_getMoviesByYear(req, res);

      const pipeline = Movie.aggregate.mock.calls[0][0];
      expect(pipeline[0].$match.year).toEqual({
        $exists: true,
        $ne: null,
        $gte: 2015,
        $lte: 2016
      });
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should sort by count when sortBy is count', async () => {
      const mockResult = [
        { year: 2021, count: 60, averageRating: 7.8 },
        { year: 2020, count: 50, averageRating: 7.5 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, { sortBy: 'count' }, {});
      const res = mockResponse();

      await f_getMoviesByYear(req, res);

      const pipeline = Movie.aggregate.mock.calls[0][0];
      expect(pipeline[pipeline.length - 1]).toEqual({ $sort: { count: -1 } });
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should sort by rating when sortBy is rating', async () => {
      const mockResult = [
        { year: 2021, count: 60, averageRating: 8.0 },
        { year: 2020, count: 50, averageRating: 7.5 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, { sortBy: 'rating' }, {});
      const res = mockResponse();

      await f_getMoviesByYear(req, res);

      const pipeline = Movie.aggregate.mock.calls[0][0];
      expect(pipeline[pipeline.length - 1]).toEqual({ $sort: { averageRating: -1 } });
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors and return 500 status', async () => {
      Movie.aggregate = jest.fn().mockRejectedValue(new Error('Year aggregation error'));

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getMoviesByYear(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Year aggregation error' });
    });
  });

  describe('f_getTrendingMovies', () => {
    it('should return trending movies with default parameters', async () => {
      const mockResult = [
        { _id: '1', title: 'Trending Movie 1', commentCount: 150 },
        { _id: '2', title: 'Trending Movie 2', commentCount: 120 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getTrendingMovies(req, res);

      const pipeline = Movie.aggregate.mock.calls[0][0];
      expect(pipeline).toEqual(expect.arrayContaining([
        expect.objectContaining({ $lookup: expect.any(Object) }),
        { $unwind: '$comments' },
        expect.objectContaining({ $match: expect.any(Object) }),
        expect.objectContaining({ $group: expect.any(Object) }),
        { $sort: { commentCount: -1 } },
        { $limit: 10 }
      ]));
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should use custom days and limit parameters', async () => {
      const mockResult = [{ _id: '3', title: 'Hot Movie', commentCount: 200 }];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const req = mockRequest({}, { days: '7', limit: '5' }, {});
      const res = mockResponse();

      await f_getTrendingMovies(req, res);

      const pipeline = Movie.aggregate.mock.calls[0][0];
      const limitStage = pipeline.find(stage => stage.$limit !== undefined);
      expect(limitStage).toEqual({ $limit: 5 });
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors and return 500 status', async () => {
      Movie.aggregate = jest.fn().mockRejectedValue(new Error('Trending error'));

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await f_getTrendingMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Trending error' });
    });
  });

  describe('f_getMovieEngagementStats', () => {
    it('should return engagement stats for a movie', async () => {
      const mockMovie = {
        _id: '123',
        title: 'Engagement Test',
        imdb: { rating: 8.5, votes: 1000 }
      };
      Movie.findById = jest.fn().mockResolvedValue(mockMovie);
      Comment.countDocuments = jest.fn().mockResolvedValue(50);

      mongoose.Types.ObjectId = jest.fn().mockReturnValue('123');

      const req = mockRequest({ id: '123' }, {}, {});
      const res = mockResponse();

      await f_getMovieEngagementStats(req, res);

      expect(Movie.findById).toHaveBeenCalledWith('123');
      expect(Comment.countDocuments).toHaveBeenCalledWith({ movie_id: '123' });
      expect(res.json).toHaveBeenCalledWith({
        movie: mockMovie,
        engagementStats: {
          totalComments: 50,
          engagementScore: 135
        }
      });
    });

    it('should calculate engagement score correctly without rating', async () => {
      const mockMovie = {
        _id: '456',
        title: 'No Rating Movie',
        imdb: {}
      };
      Movie.findById = jest.fn().mockResolvedValue(mockMovie);
      Comment.countDocuments = jest.fn().mockResolvedValue(30);

      mongoose.Types.ObjectId = jest.fn().mockReturnValue('456');

      const req = mockRequest({ id: '456' }, {}, {});
      const res = mockResponse();

      await f_getMovieEngagementStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        movie: mockMovie,
        engagementStats: {
          totalComments: 30,
          engagementScore: 30
        }
      });
    });

    it('should return 404 when movie not found', async () => {
      Movie.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({ id: '789' }, {}, {});
      const res = mockResponse();

      await f_getMovieEngagementStats(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should handle errors and return 500 status', async () => {
      Movie.findById = jest.fn().mockRejectedValue(new Error('Engagement error'));

      const req = mockRequest({ id: '123' }, {}, {});
      const res = mockResponse();

      await f_getMovieEngagementStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Engagement error' });
    });
  });
});
