const request = require('supertest');
const express = require('express');
const movieRoutes = require('../../routes/movieRoutes');
const Movie = require('../../models/Movie');

jest.mock('../../models/Movie');

const v_app = express();
v_app.use(express.json());
v_app.use('/api/movies', movieRoutes);

describe('Movie Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/movies', () => {
    it('should return paginated movies', async () => {
      const v_mockMovies = [
        { _id: '1', title: 'Movie 1', year: 2020 },
        { _id: '2', title: 'Movie 2', year: 2021 }
      ];
      
      Movie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockMovies)
      });
      Movie.countDocuments.mockResolvedValue(25);

      const v_response = await request(v_app)
        .get('/api/movies')
        .expect(200);

      expect(v_response.body).toHaveProperty('movies');
      expect(v_response.body).toHaveProperty('currentPage', 1);
      expect(v_response.body).toHaveProperty('totalPages', 3);
      expect(v_response.body).toHaveProperty('totalMovies', 25);
      expect(v_response.body.movies).toEqual(v_mockMovies);
    });

    it('should handle pagination query parameters', async () => {
      const v_mockMovies = [{ _id: '3', title: 'Movie 3', year: 2022 }];
      
      Movie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockMovies)
      });
      Movie.countDocuments.mockResolvedValue(50);

      const v_response = await request(v_app)
        .get('/api/movies?page=2&limit=5')
        .expect(200);

      expect(v_response.body.currentPage).toBe(2);
      expect(v_response.body.totalPages).toBe(10);
    });
  });

  describe('GET /api/movies/search', () => {
    it('should search movies by title', async () => {
      const v_mockMovies = [
        { _id: '1', title: 'Inception', year: 2010 }
      ];
      Movie.find.mockResolvedValue(v_mockMovies);

      const v_response = await request(v_app)
        .get('/api/movies/search?title=Inception')
        .expect(200);

      expect(v_response.body).toEqual(v_mockMovies);
      expect(Movie.find).toHaveBeenCalledWith({
        title: { $regex: 'Inception', $options: 'i' }
      });
    });

    it('should search movies by genre', async () => {
      const v_mockMovies = [
        { _id: '1', title: 'Action Movie', genres: ['Action'] }
      ];
      Movie.find.mockResolvedValue(v_mockMovies);

      const v_response = await request(v_app)
        .get('/api/movies/search?genre=Action')
        .expect(200);

      expect(v_response.body).toEqual(v_mockMovies);
      expect(Movie.find).toHaveBeenCalledWith({
        genres: { $in: ['Action'] }
      });
    });

    it('should search movies with multiple filters', async () => {
      const v_mockMovies = [
        { _id: '1', title: 'Action 2020', genres: ['Action'], year: 2020 }
      ];
      Movie.find.mockResolvedValue(v_mockMovies);

      const v_response = await request(v_app)
        .get('/api/movies/search?title=Action&genre=Action&year=2020')
        .expect(200);

      expect(v_response.body).toEqual(v_mockMovies);
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should return a movie by ID', async () => {
      const v_mockMovie = { _id: '123', title: 'Test Movie', year: 2020 };
      Movie.findById.mockResolvedValue(v_mockMovie);

      const v_response = await request(v_app)
        .get('/api/movies/123')
        .expect(200);

      expect(v_response.body).toEqual(v_mockMovie);
      expect(Movie.findById).toHaveBeenCalledWith('123');
    });

    it('should return 404 for non-existent movie', async () => {
      Movie.findById.mockResolvedValue(null);

      const v_response = await request(v_app)
        .get('/api/movies/999')
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Movie not found');
    });
  });

  describe('POST /api/movies', () => {
    it('should create a new movie', async () => {
      const v_newMovie = { title: 'New Movie', year: 2023, genres: ['Drama'] };
      const v_savedMovie = { _id: '123', ...v_newMovie };

      const v_mockSave = jest.fn().mockResolvedValue(v_savedMovie);
      Movie.mockImplementation(() => ({
        save: v_mockSave
      }));

      const v_response = await request(v_app)
        .post('/api/movies')
        .send(v_newMovie)
        .expect(201);

      expect(v_response.body).toEqual(v_savedMovie);
    });

    it('should return 400 for validation errors', async () => {
      const v_mockSave = jest.fn().mockRejectedValue(new Error('Title is required'));
      Movie.mockImplementation(() => ({
        save: v_mockSave
      }));

      const v_response = await request(v_app)
        .post('/api/movies')
        .send({ year: 2023 })
        .expect(400);

      expect(v_response.body).toHaveProperty('message', 'Title is required');
    });
  });

  describe('PUT /api/movies/:id', () => {
    it('should update a movie', async () => {
      const v_updatedMovie = { _id: '123', title: 'Updated Movie', year: 2024 };
      Movie.findByIdAndUpdate.mockResolvedValue(v_updatedMovie);

      const v_response = await request(v_app)
        .put('/api/movies/123')
        .send({ title: 'Updated Movie', year: 2024 })
        .expect(200);

      expect(v_response.body).toEqual(v_updatedMovie);
    });

    it('should return 404 for non-existent movie', async () => {
      Movie.findByIdAndUpdate.mockResolvedValue(null);

      const v_response = await request(v_app)
        .put('/api/movies/999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Movie not found');
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('should delete a movie', async () => {
      const v_deletedMovie = { _id: '123', title: 'Deleted Movie' };
      Movie.findByIdAndDelete.mockResolvedValue(v_deletedMovie);

      const v_response = await request(v_app)
        .delete('/api/movies/123')
        .expect(200);

      expect(v_response.body).toHaveProperty('message', 'Movie deleted successfully');
    });

    it('should return 404 for non-existent movie', async () => {
      Movie.findByIdAndDelete.mockResolvedValue(null);

      const v_response = await request(v_app)
        .delete('/api/movies/999')
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Movie not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in GET /api/movies', async () => {
      Movie.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const v_response = await request(v_app)
        .get('/api/movies')
        .expect(500);

      expect(v_response.body).toHaveProperty('message', 'Database error');
    });

    it('should handle errors in POST /api/movies', async () => {
      const v_mockSave = jest.fn().mockRejectedValue(new Error('Validation failed'));
      Movie.mockImplementation(() => ({
        save: v_mockSave
      }));

      const v_response = await request(v_app)
        .post('/api/movies')
        .send({ title: 'Test' })
        .expect(400);

      expect(v_response.body).toHaveProperty('message');
    });
  });
});
