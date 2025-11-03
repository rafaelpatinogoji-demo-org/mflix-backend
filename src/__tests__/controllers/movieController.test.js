const {
  f_getAllMovies,
  f_getMovieById,
  f_createMovie,
  f_updateMovie,
  f_deleteMovie,
  f_searchMovies
} = require('../../controllers/movieController');
const Movie = require('../../models/Movie');

jest.mock('../../models/Movie');

describe('Movie Controller', () => {
  let v_mockReq;
  let v_mockRes;

  beforeEach(() => {
    v_mockReq = {
      query: {},
      params: {},
      body: {}
    };
    v_mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('f_getAllMovies', () => {
    it('should return paginated movies with default pagination', async () => {
      const v_mockMovies = [
        { _id: '1', title: 'Movie 1', year: 2020 },
        { _id: '2', title: 'Movie 2', year: 2021 }
      ];
      
      Movie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockMovies)
      });
      Movie.countDocuments.mockResolvedValue(25);

      await f_getAllMovies(v_mockReq, v_mockRes);

      expect(Movie.find).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith({
        movies: v_mockMovies,
        currentPage: 1,
        totalPages: 3,
        totalMovies: 25
      });
    });

    it('should return paginated movies with custom pagination', async () => {
      v_mockReq.query = { page: '2', limit: '5' };
      const v_mockMovies = [
        { _id: '6', title: 'Movie 6', year: 2022 }
      ];
      
      Movie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockMovies)
      });
      Movie.countDocuments.mockResolvedValue(25);

      await f_getAllMovies(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        movies: v_mockMovies,
        currentPage: 2,
        totalPages: 5,
        totalMovies: 25
      });
    });

    it('should handle errors and return 500 status', async () => {
      Movie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await f_getAllMovies(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });

    it('should handle empty results', async () => {
      Movie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      Movie.countDocuments.mockResolvedValue(0);

      await f_getAllMovies(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        movies: [],
        currentPage: 1,
        totalPages: 0,
        totalMovies: 0
      });
    });
  });

  describe('f_getMovieById', () => {
    it('should return movie by valid ID', async () => {
      const v_mockMovie = { _id: '123', title: 'Test Movie', year: 2020 };
      v_mockReq.params.id = '123';
      Movie.findById.mockResolvedValue(v_mockMovie);

      await f_getMovieById(v_mockReq, v_mockRes);

      expect(Movie.findById).toHaveBeenCalledWith('123');
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockMovie);
    });

    it('should return 404 for non-existent movie', async () => {
      v_mockReq.params.id = '999';
      Movie.findById.mockResolvedValue(null);

      await f_getMovieById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Movie not found'
      });
    });

    it('should handle malformed ID error', async () => {
      v_mockReq.params.id = 'invalid-id';
      Movie.findById.mockRejectedValue(new Error('Cast to ObjectId failed'));

      await f_getMovieById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Cast to ObjectId failed'
      });
    });
  });

  describe('f_createMovie', () => {
    it('should create a new movie successfully', async () => {
      const v_movieData = { title: 'New Movie', year: 2023, genres: ['Action'] };
      const v_savedMovie = { _id: '123', ...v_movieData };
      v_mockReq.body = v_movieData;

      const v_mockSave = jest.fn().mockResolvedValue(v_savedMovie);
      Movie.mockImplementation(() => ({
        save: v_mockSave
      }));

      await f_createMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(v_savedMovie);
    });

    it('should return 400 for validation errors', async () => {
      v_mockReq.body = { year: 2023 };

      const v_mockSave = jest.fn().mockRejectedValue(new Error('Title is required'));
      Movie.mockImplementation(() => ({
        save: v_mockSave
      }));

      await f_createMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Title is required'
      });
    });

    it('should handle missing required fields', async () => {
      v_mockReq.body = {};

      const v_mockSave = jest.fn().mockRejectedValue(new Error('Validation failed'));
      Movie.mockImplementation(() => ({
        save: v_mockSave
      }));

      await f_createMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('f_updateMovie', () => {
    it('should update movie successfully', async () => {
      const v_updatedMovie = { _id: '123', title: 'Updated Movie', year: 2024 };
      v_mockReq.params.id = '123';
      v_mockReq.body = { title: 'Updated Movie', year: 2024 };
      Movie.findByIdAndUpdate.mockResolvedValue(v_updatedMovie);

      await f_updateMovie(v_mockReq, v_mockRes);

      expect(Movie.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { title: 'Updated Movie', year: 2024 },
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedMovie);
    });

    it('should handle partial updates', async () => {
      const v_updatedMovie = { _id: '123', title: 'Updated Title', year: 2020 };
      v_mockReq.params.id = '123';
      v_mockReq.body = { title: 'Updated Title' };
      Movie.findByIdAndUpdate.mockResolvedValue(v_updatedMovie);

      await f_updateMovie(v_mockReq, v_mockRes);

      expect(Movie.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { title: 'Updated Title' },
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedMovie);
    });

    it('should return 404 for non-existent movie', async () => {
      v_mockReq.params.id = '999';
      v_mockReq.body = { title: 'Updated' };
      Movie.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Movie not found'
      });
    });

    it('should return 400 for validation errors', async () => {
      v_mockReq.params.id = '123';
      v_mockReq.body = { year: 'invalid' };
      Movie.findByIdAndUpdate.mockRejectedValue(new Error('Validation failed'));

      await f_updateMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Validation failed'
      });
    });
  });

  describe('f_deleteMovie', () => {
    it('should delete movie successfully', async () => {
      const v_deletedMovie = { _id: '123', title: 'Deleted Movie' };
      v_mockReq.params.id = '123';
      Movie.findByIdAndDelete.mockResolvedValue(v_deletedMovie);

      await f_deleteMovie(v_mockReq, v_mockRes);

      expect(Movie.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Movie deleted successfully'
      });
    });

    it('should return 404 for non-existent movie', async () => {
      v_mockReq.params.id = '999';
      Movie.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Movie not found'
      });
    });

    it('should handle deletion errors', async () => {
      v_mockReq.params.id = '123';
      Movie.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      await f_deleteMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('f_searchMovies', () => {
    it('should search movies by title', async () => {
      v_mockReq.query = { title: 'Inception' };
      const v_mockMovies = [
        { _id: '1', title: 'Inception', year: 2010 }
      ];
      Movie.find.mockResolvedValue(v_mockMovies);

      await f_searchMovies(v_mockReq, v_mockRes);

      expect(Movie.find).toHaveBeenCalledWith({
        title: { $regex: 'Inception', $options: 'i' }
      });
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockMovies);
    });

    it('should search movies by genre', async () => {
      v_mockReq.query = { genre: 'Action' };
      const v_mockMovies = [
        { _id: '1', title: 'Action Movie', genres: ['Action'] }
      ];
      Movie.find.mockResolvedValue(v_mockMovies);

      await f_searchMovies(v_mockReq, v_mockRes);

      expect(Movie.find).toHaveBeenCalledWith({
        genres: { $in: ['Action'] }
      });
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockMovies);
    });

    it('should search movies by year', async () => {
      v_mockReq.query = { year: '2020' };
      const v_mockMovies = [
        { _id: '1', title: '2020 Movie', year: 2020 }
      ];
      Movie.find.mockResolvedValue(v_mockMovies);

      await f_searchMovies(v_mockReq, v_mockRes);

      expect(Movie.find).toHaveBeenCalledWith({
        year: 2020
      });
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockMovies);
    });

    it('should search movies with combined filters', async () => {
      v_mockReq.query = { title: 'Action', genre: 'Thriller', year: '2021' };
      const v_mockMovies = [
        { _id: '1', title: 'Action Thriller', genres: ['Thriller'], year: 2021 }
      ];
      Movie.find.mockResolvedValue(v_mockMovies);

      await f_searchMovies(v_mockReq, v_mockRes);

      expect(Movie.find).toHaveBeenCalledWith({
        title: { $regex: 'Action', $options: 'i' },
        genres: { $in: ['Thriller'] },
        year: 2021
      });
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockMovies);
    });

    it('should handle search errors', async () => {
      v_mockReq.query = { title: 'Test' };
      Movie.find.mockRejectedValue(new Error('Search error'));

      await f_searchMovies(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Search error'
      });
    });

    it('should return empty array when no matches found', async () => {
      v_mockReq.query = { title: 'NonExistent' };
      Movie.find.mockResolvedValue([]);

      await f_searchMovies(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith([]);
    });
  });
});
