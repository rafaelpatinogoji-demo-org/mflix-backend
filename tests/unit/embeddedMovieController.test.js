const {
  f_getAllEmbeddedMovies,
  f_getEmbeddedMovieById,
  f_createEmbeddedMovie,
  f_updateEmbeddedMovie,
  f_deleteEmbeddedMovie,
  f_searchEmbeddedMovies
} = require('../../src/controllers/embeddedMovieController');

const EmbeddedMovie = require('../../src/models/EmbeddedMovie');
const { mockEmbeddedMovie, mockRequest, mockResponse } = require('../utils/mockFactories');

jest.mock('../../src/models/EmbeddedMovie');

describe('EmbeddedMovie Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
  });

  describe('f_getAllEmbeddedMovies', () => {
    it('should return paginated embedded movies with default pagination', async () => {
      const mockMovies = [
        mockEmbeddedMovie(),
        mockEmbeddedMovie({ _id: '507f1f77bcf86cd799439014', title: 'Avatar' })
      ];
      const mockTotal = 100;

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMovies)
      };

      EmbeddedMovie.find = jest.fn().mockReturnValue(mockQuery);
      EmbeddedMovie.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.query = {};

      await f_getAllEmbeddedMovies(req, res);

      expect(EmbeddedMovie.find).toHaveBeenCalled();
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith({
        embeddedMovies: mockMovies,
        currentPage: 1,
        totalPages: 10,
        totalEmbeddedMovies: mockTotal
      });
    });

    it('should return paginated embedded movies with custom pagination', async () => {
      const mockMovies = [mockEmbeddedMovie()];
      const mockTotal = 75;

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMovies)
      };

      EmbeddedMovie.find = jest.fn().mockReturnValue(mockQuery);
      EmbeddedMovie.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.query = { page: '3', limit: '25' };

      await f_getAllEmbeddedMovies(req, res);

      expect(mockQuery.skip).toHaveBeenCalledWith(50);
      expect(mockQuery.limit).toHaveBeenCalledWith(25);
      expect(res.json).toHaveBeenCalledWith({
        embeddedMovies: mockMovies,
        currentPage: 3,
        totalPages: 3,
        totalEmbeddedMovies: mockTotal
      });
    });

    it('should handle empty results', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      EmbeddedMovie.find = jest.fn().mockReturnValue(mockQuery);
      EmbeddedMovie.countDocuments = jest.fn().mockResolvedValue(0);

      req.query = {};

      await f_getAllEmbeddedMovies(req, res);

      expect(res.json).toHaveBeenCalledWith({
        embeddedMovies: [],
        currentPage: 1,
        totalPages: 0,
        totalEmbeddedMovies: 0
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      EmbeddedMovie.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(error)
      });

      req.query = {};

      await f_getAllEmbeddedMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getEmbeddedMovieById', () => {
    it('should return an embedded movie when found', async () => {
      const mockMovie = mockEmbeddedMovie();
      EmbeddedMovie.findById = jest.fn().mockResolvedValue(mockMovie);
      req.params = { id: '507f1f77bcf86cd799439013' };

      await f_getEmbeddedMovieById(req, res);

      expect(EmbeddedMovie.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(res.json).toHaveBeenCalledWith(mockMovie);
    });

    it('should return 404 when embedded movie not found', async () => {
      EmbeddedMovie.findById = jest.fn().mockResolvedValue(null);
      req.params = { id: '507f1f77bcf86cd799439013' };

      await f_getEmbeddedMovieById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Embedded movie not found' });
    });

    it('should handle invalid ObjectId', async () => {
      const error = new Error('Cast to ObjectId failed');
      EmbeddedMovie.findById = jest.fn().mockRejectedValue(error);
      req.params = { id: 'invalid-id' };

      await f_getEmbeddedMovieById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cast to ObjectId failed' });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      EmbeddedMovie.findById = jest.fn().mockRejectedValue(error);
      req.params = { id: '507f1f77bcf86cd799439013' };

      await f_getEmbeddedMovieById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_createEmbeddedMovie', () => {
    it('should create and return a new embedded movie', async () => {
      const movieData = {
        title: 'Interstellar',
        year: 2014,
        genres: ['Sci-Fi', 'Drama'],
        plot: 'A team of explorers travel through a wormhole...',
        runtime: 169,
        plot_embedding: [0.1, 0.2, 0.3]
      };
      const savedMovie = { _id: '507f1f77bcf86cd799439015', ...movieData };

      const mockSave = jest.fn().mockResolvedValue(savedMovie);
      EmbeddedMovie.mockImplementation(() => ({
        save: mockSave
      }));

      req.body = movieData;

      await f_createEmbeddedMovie(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(savedMovie);
    });

    it('should return 400 for validation errors (missing required title)', async () => {
      const error = new Error('Validation failed: title is required');
      const mockSave = jest.fn().mockRejectedValue(error);
      EmbeddedMovie.mockImplementation(() => ({
        save: mockSave
      }));

      req.body = { plot: 'Movie without title', year: 2020 };

      await f_createEmbeddedMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed: title is required' });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      const mockSave = jest.fn().mockRejectedValue(error);
      EmbeddedMovie.mockImplementation(() => ({
        save: mockSave
      }));

      req.body = { title: 'Test Movie' };

      await f_createEmbeddedMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database connection failed' });
    });
  });

  describe('f_updateEmbeddedMovie', () => {
    it('should update and return the embedded movie', async () => {
      const updatedMovie = mockEmbeddedMovie({ plot: 'Updated plot description' });
      EmbeddedMovie.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedMovie);

      req.params = { id: '507f1f77bcf86cd799439013' };
      req.body = { plot: 'Updated plot description' };

      await f_updateEmbeddedMovie(req, res);

      expect(EmbeddedMovie.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        { plot: 'Updated plot description' },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedMovie);
    });

    it('should return 404 when embedded movie not found', async () => {
      EmbeddedMovie.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
      req.params = { id: '507f1f77bcf86cd799439013' };
      req.body = { plot: 'Updated plot' };

      await f_updateEmbeddedMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Embedded movie not found' });
    });

    it('should return 400 for validation errors', async () => {
      const error = new Error('Validation failed');
      EmbeddedMovie.findByIdAndUpdate = jest.fn().mockRejectedValue(error);
      req.params = { id: '507f1f77bcf86cd799439013' };
      req.body = { title: '' };

      await f_updateEmbeddedMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });

    it('should handle multiple field updates', async () => {
      const updatedMovie = mockEmbeddedMovie({
        title: 'Updated Title',
        year: 2020,
        genres: ['Action']
      });
      EmbeddedMovie.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedMovie);

      req.params = { id: '507f1f77bcf86cd799439013' };
      req.body = { title: 'Updated Title', year: 2020, genres: ['Action'] };

      await f_updateEmbeddedMovie(req, res);

      expect(EmbeddedMovie.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        { title: 'Updated Title', year: 2020, genres: ['Action'] },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedMovie);
    });
  });

  describe('f_deleteEmbeddedMovie', () => {
    it('should delete the embedded movie and return success message', async () => {
      const deletedMovie = mockEmbeddedMovie();
      EmbeddedMovie.findByIdAndDelete = jest.fn().mockResolvedValue(deletedMovie);
      req.params = { id: '507f1f77bcf86cd799439013' };

      await f_deleteEmbeddedMovie(req, res);

      expect(EmbeddedMovie.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(res.json).toHaveBeenCalledWith({ message: 'Embedded movie deleted successfully' });
    });

    it('should return 404 when embedded movie not found', async () => {
      EmbeddedMovie.findByIdAndDelete = jest.fn().mockResolvedValue(null);
      req.params = { id: '507f1f77bcf86cd799439013' };

      await f_deleteEmbeddedMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Embedded movie not found' });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      EmbeddedMovie.findByIdAndDelete = jest.fn().mockRejectedValue(error);
      req.params = { id: '507f1f77bcf86cd799439013' };

      await f_deleteEmbeddedMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_searchEmbeddedMovies', () => {
    it('should search by title using regex', async () => {
      const mockMovies = [mockEmbeddedMovie({ title: 'The Matrix' })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      req.query = { title: 'matrix' };

      await f_searchEmbeddedMovies(req, res);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        title: { $regex: 'matrix', $options: 'i' }
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should search by genre using $in operator', async () => {
      const mockMovies = [
        mockEmbeddedMovie({ genres: ['Action', 'Sci-Fi'] }),
        mockEmbeddedMovie({ _id: '507f1f77bcf86cd799439014', genres: ['Action', 'Thriller'] })
      ];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      req.query = { genre: 'Action' };

      await f_searchEmbeddedMovies(req, res);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        genres: { $in: ['Action'] }
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should search by year using exact match', async () => {
      const mockMovies = [mockEmbeddedMovie({ year: 1999 })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      req.query = { year: '1999' };

      await f_searchEmbeddedMovies(req, res);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        year: 1999
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should search with combined filters', async () => {
      const mockMovies = [mockEmbeddedMovie({ title: 'The Matrix', year: 1999, genres: ['Sci-Fi'] })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      req.query = { title: 'matrix', genre: 'Sci-Fi', year: '1999' };

      await f_searchEmbeddedMovies(req, res);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        title: { $regex: 'matrix', $options: 'i' },
        genres: { $in: ['Sci-Fi'] },
        year: 1999
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should return empty array when no matches found', async () => {
      EmbeddedMovie.find = jest.fn().mockResolvedValue([]);

      req.query = { title: 'NonexistentMovie' };

      await f_searchEmbeddedMovies(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return all movies when no query params provided', async () => {
      const mockMovies = [mockEmbeddedMovie(), mockEmbeddedMovie({ _id: '507f1f77bcf86cd799439014' })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      req.query = {};

      await f_searchEmbeddedMovies(req, res);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should handle case-insensitive title search', async () => {
      const mockMovies = [mockEmbeddedMovie({ title: 'The MATRIX' })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      req.query = { title: 'MATRIX' };

      await f_searchEmbeddedMovies(req, res);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        title: { $regex: 'MATRIX', $options: 'i' }
      });
      expect(res.json).toHaveBeenCalledWith(mockMovies);
    });

    it('should handle year as string and convert to number', async () => {
      const mockMovies = [mockEmbeddedMovie({ year: 2010 })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      req.query = { year: '2010' };

      await f_searchEmbeddedMovies(req, res);

      expect(EmbeddedMovie.find).toHaveBeenCalledWith({
        year: 2010
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      EmbeddedMovie.find = jest.fn().mockRejectedValue(error);

      req.query = { title: 'test' };

      await f_searchEmbeddedMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });
});
