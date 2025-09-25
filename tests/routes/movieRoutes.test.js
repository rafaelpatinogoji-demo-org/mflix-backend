const mongoose = require('mongoose');
const Movie = require('../../src/models/Movie');
const { testRequest, generateObjectId } = require('../utils/testHelpers');
const { validMovie, validMoviesList, invalidMovie } = require('../fixtures/movieFixtures');

describe('Movie Routes', () => {
  describe('GET /api/movies', () => {
    beforeEach(async () => {
      await Movie.insertMany(validMoviesList);
    });

    it('should return a list of movies with pagination', async () => {
      const response = await testRequest.get('/api/movies');
      
      expect(response.status).toBe(200);
      expect(response.body.movies).toHaveLength(3);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalMovies).toBe(3);
    });

    it('should return paginated results based on page and limit parameters', async () => {
      const response = await testRequest.get('/api/movies?page=1&limit=2');
      
      expect(response.status).toBe(200);
      expect(response.body.movies).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should handle errors and return 500 status', async () => {
      jest.spyOn(Movie, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await testRequest.get('/api/movies');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/movies/search', () => {
    beforeEach(async () => {
      await Movie.insertMany(validMoviesList);
    });

    it('should search movies by title', async () => {
      const response = await testRequest.get('/api/movies/search?title=Movie One');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].title).toBe('Movie One');
    });

    it('should search movies by genre', async () => {
      const response = await testRequest.get('/api/movies/search?genre=Action');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].genres).toContain('Action');
    });

    it('should search movies by year', async () => {
      const response = await testRequest.get('/api/movies/search?year=2022');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].year).toBe(2022);
    });

    it('should return empty array if no movies match search criteria', async () => {
      const response = await testRequest.get('/api/movies/search?title=NonExistentMovie');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/movies/:id', () => {
    let movieId;

    beforeEach(async () => {
      const movie = new Movie(validMovie);
      await movie.save();
      movieId = movie._id.toString();
    });

    it('should return a movie by ID', async () => {
      const response = await testRequest.get(`/api/movies/${movieId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(validMovie.title);
      expect(response.body.year).toBe(validMovie.year);
      expect(response.body.genres).toEqual(validMovie.genres);
    });

    it('should return 404 if movie not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.get(`/api/movies/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Movie not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.get('/api/movies/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/movies', () => {
    it('should create a new movie', async () => {
      const response = await testRequest.post('/api/movies').send(validMovie);
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(validMovie.title);
      expect(response.body.year).toBe(validMovie.year);
      expect(response.body.genres).toEqual(validMovie.genres);
      
      const savedMovie = await Movie.findById(response.body._id);
      expect(savedMovie).not.toBeNull();
    });

    it('should return 400 for invalid movie data', async () => {
      const response = await testRequest.post('/api/movies').send(invalidMovie);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should handle nested IMDB data correctly', async () => {
      const movieWithImdb = {
        title: 'IMDB Test Movie',
        imdb: {
          rating: 9.5,
          votes: 5000,
          id: 12345
        }
      };

      const response = await testRequest.post('/api/movies').send(movieWithImdb);
      
      expect(response.status).toBe(201);
      expect(response.body.imdb.rating).toBe(movieWithImdb.imdb.rating);
      expect(response.body.imdb.votes).toBe(movieWithImdb.imdb.votes);
      expect(response.body.imdb.id).toBe(movieWithImdb.imdb.id);
    });
  });

  describe('PUT /api/movies/:id', () => {
    let movieId;

    beforeEach(async () => {
      const movie = new Movie(validMovie);
      await movie.save();
      movieId = movie._id.toString();
    });

    it('should update an existing movie', async () => {
      const updatedData = {
        title: 'Updated Movie Title',
        year: 2024,
        genres: ['Updated', 'Genres']
      };

      const response = await testRequest.put(`/api/movies/${movieId}`).send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.year).toBe(updatedData.year);
      expect(response.body.genres).toEqual(updatedData.genres);
      
      const updatedMovie = await Movie.findById(movieId);
      expect(updatedMovie.title).toBe(updatedData.title);
    });

    it('should return 404 if movie not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.put(`/api/movies/${nonExistentId}`).send({
        title: 'Updated Title'
      });
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Movie not found');
    });

    it('should update nested IMDB data correctly', async () => {
      const updatedImdbData = {
        imdb: {
          rating: 9.9,
          votes: 10000,
          id: 99999
        }
      };

      const response = await testRequest.put(`/api/movies/${movieId}`).send(updatedImdbData);
      
      expect(response.status).toBe(200);
      expect(response.body.imdb.rating).toBe(updatedImdbData.imdb.rating);
      expect(response.body.imdb.votes).toBe(updatedImdbData.imdb.votes);
      expect(response.body.imdb.id).toBe(updatedImdbData.imdb.id);
    });
  });

  describe('DELETE /api/movies/:id', () => {
    let movieId;

    beforeEach(async () => {
      const movie = new Movie(validMovie);
      await movie.save();
      movieId = movie._id.toString();
    });

    it('should delete an existing movie', async () => {
      const response = await testRequest.delete(`/api/movies/${movieId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Movie deleted successfully');
      
      const deletedMovie = await Movie.findById(movieId);
      expect(deletedMovie).toBeNull();
    });

    it('should return 404 if movie not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.delete(`/api/movies/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Movie not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.delete('/api/movies/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });
});
