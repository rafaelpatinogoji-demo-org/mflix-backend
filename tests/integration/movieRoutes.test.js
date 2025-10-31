const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Movie = require('../../src/models/Movie');
const Comment = require('../../src/models/Comment');

jest.mock('../../src/config/database', () => jest.fn());
jest.mock('../../src/models/Movie');
jest.mock('../../src/models/Comment');

describe('Movie Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/movies', () => {
    it('should return paginated movies list', async () => {
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

      const response = await request(app)
        .get('/api/movies')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages', 10);
      expect(response.body).toHaveProperty('totalMovies', 100);
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should handle pagination parameters correctly', async () => {
      Movie.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      Movie.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/movies')
        .query({ page: 2, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.currentPage).toBe(2);
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should return a single movie by ID', async () => {
      const mockMovie = { _id: '123', title: 'Test Movie', year: 2020 };
      Movie.findById = jest.fn().mockResolvedValue(mockMovie);

      const response = await request(app).get('/api/movies/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMovie);
    });

    it('should return 404 for non-existent movie', async () => {
      Movie.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/api/movies/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Movie not found');
    });
  });

  describe('POST /api/movies', () => {
    it('should create a new movie', async () => {
      const newMovie = { title: 'New Movie', year: 2023, genres: ['Action'] };
      const savedMovie = { _id: '456', ...newMovie };

      const mockSave = jest.fn().mockResolvedValue(savedMovie);
      Movie.mockImplementation(() => ({
        save: mockSave
      }));

      const response = await request(app)
        .post('/api/movies')
        .send(newMovie);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(savedMovie);
    });

    it('should return 400 for invalid movie data', async () => {
      const invalidMovie = { year: 2023 };
      const mockSave = jest.fn().mockRejectedValue(new Error('Title is required'));
      Movie.mockImplementation(() => ({
        save: mockSave
      }));

      const response = await request(app)
        .post('/api/movies')
        .send(invalidMovie);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/movies/:id', () => {
    it('should update an existing movie', async () => {
      const updatedMovie = { _id: '123', title: 'Updated Movie', year: 2023 };
      Movie.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedMovie);

      const response = await request(app)
        .put('/api/movies/123')
        .send({ title: 'Updated Movie' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedMovie);
    });

    it('should return 404 when updating non-existent movie', async () => {
      Movie.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/movies/999')
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Movie not found');
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('should delete a movie', async () => {
      const mockMovie = { _id: '123', title: 'To Delete' };
      Movie.findByIdAndDelete = jest.fn().mockResolvedValue(mockMovie);

      const response = await request(app).delete('/api/movies/123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Movie deleted successfully');
    });

    it('should return 404 when deleting non-existent movie', async () => {
      Movie.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const response = await request(app).delete('/api/movies/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Movie not found');
    });
  });

  describe('GET /api/movies/search', () => {
    it('should search movies by title', async () => {
      const mockMovies = [{ _id: '1', title: 'Inception', year: 2010 }];
      Movie.find = jest.fn().mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/api/movies/search')
        .query({ title: 'inception' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(mockMovies);
    });

    it('should search movies by genre', async () => {
      const mockMovies = [{ _id: '2', title: 'Action Movie', genres: ['Action'] }];
      Movie.find = jest.fn().mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/api/movies/search')
        .query({ genre: 'Action' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMovies);
    });

    it('should search movies by year', async () => {
      const mockMovies = [{ _id: '3', title: '2020 Movie', year: 2020 }];
      Movie.find = jest.fn().mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/api/movies/search')
        .query({ year: 2020 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMovies);
    });

    it('should search with multiple criteria', async () => {
      const mockMovies = [{ _id: '4', title: 'Matrix', year: 1999, genres: ['Sci-Fi'] }];
      Movie.find = jest.fn().mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/api/movies/search')
        .query({ title: 'matrix', genre: 'Sci-Fi', year: 1999 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMovies);
    });
  });

  describe('GET /api/movies/analytics/top-rated', () => {
    it('should return top-rated movies', async () => {
      const mockMovies = [
        { _id: '1', title: 'Top Movie', imdb: { rating: 9.5, votes: 1000 } }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockMovies);
      Movie.countDocuments = jest.fn().mockResolvedValue(50);

      const response = await request(app)
        .get('/api/movies/analytics/top-rated')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalMovies');
    });

    it('should filter by minimum votes', async () => {
      const mockMovies = [
        { _id: '2', title: 'Popular Movie', imdb: { rating: 8.5, votes: 5000 } }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockMovies);
      Movie.countDocuments = jest.fn().mockResolvedValue(20);

      const response = await request(app)
        .get('/api/movies/analytics/top-rated')
        .query({ minVotes: 1000 });

      expect(response.status).toBe(200);
      expect(response.body.movies).toEqual(mockMovies);
    });
  });

  describe('GET /api/movies/analytics/genres', () => {
    it('should return movies grouped by genre', async () => {
      const mockResult = [
        { genre: 'Action', count: 100, averageRating: 7.5 },
        { genre: 'Drama', count: 80, averageRating: 8.0 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app).get('/api/movies/analytics/genres');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(mockResult);
    });

    it('should filter by specific genre', async () => {
      const mockResult = [{ genre: 'Comedy', count: 50, averageRating: 7.0 }];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/movies/analytics/genres')
        .query({ genre: 'Comedy' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });

    it('should sort by rating when specified', async () => {
      const mockResult = [
        { genre: 'Drama', count: 80, averageRating: 8.5 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/movies/analytics/genres')
        .query({ sortBy: 'rating' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });

  describe('GET /api/movies/analytics/years', () => {
    it('should return movies grouped by year', async () => {
      const mockResult = [
        { year: 2020, count: 50, averageRating: 7.5 },
        { year: 2021, count: 60, averageRating: 7.8 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app).get('/api/movies/analytics/years');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(mockResult);
    });

    it('should filter by year range', async () => {
      const mockResult = [
        { year: 2015, count: 40, averageRating: 7.2 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/movies/analytics/years')
        .query({ startYear: 2015, endYear: 2016 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });

    it('should sort by count when specified', async () => {
      const mockResult = [
        { year: 2021, count: 60, averageRating: 7.8 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/movies/analytics/years')
        .query({ sortBy: 'count' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });

  describe('GET /api/movies/analytics/trending', () => {
    it('should return trending movies', async () => {
      const mockResult = [
        { _id: '1', title: 'Trending Movie', commentCount: 150 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app).get('/api/movies/analytics/trending');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(mockResult);
    });

    it('should use custom days parameter', async () => {
      const mockResult = [
        { _id: '2', title: 'Hot Movie', commentCount: 200 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/movies/analytics/trending')
        .query({ days: 7 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });

    it('should limit results when specified', async () => {
      const mockResult = [
        { _id: '3', title: 'Viral Movie', commentCount: 300 }
      ];
      Movie.aggregate = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/movies/analytics/trending')
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });

  describe('GET /api/movies/analytics/engagement/:id', () => {
    it('should return engagement stats for a movie', async () => {
      const mockMovie = {
        _id: '123',
        title: 'Engagement Test',
        imdb: { rating: 8.5, votes: 1000 }
      };
      Movie.findById = jest.fn().mockResolvedValue(mockMovie);
      Comment.countDocuments = jest.fn().mockResolvedValue(50);

      mongoose.Types.ObjectId = jest.fn().mockReturnValue('123');

      const response = await request(app).get('/api/movies/analytics/engagement/123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movie');
      expect(response.body).toHaveProperty('engagementStats');
      expect(response.body.engagementStats).toHaveProperty('totalComments');
      expect(response.body.engagementStats).toHaveProperty('engagementScore');
    });

    it('should return 404 for non-existent movie', async () => {
      Movie.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/api/movies/analytics/engagement/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Movie not found');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      Movie.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const response = await request(app).get('/api/movies');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/movies/unknown-route');

      expect(response.status).toBe(404);
    });
  });
});
