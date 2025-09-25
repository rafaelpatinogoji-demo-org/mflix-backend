const mongoose = require('mongoose');
const EmbeddedMovie = require('../../src/models/EmbeddedMovie');
const { testRequest, generateObjectId } = require('../utils/testHelpers');
const { validEmbeddedMovie, validEmbeddedMoviesList, invalidEmbeddedMovie } = require('../fixtures/embeddedMovieFixtures');

describe('Embedded Movie Routes', () => {
  describe('GET /api/embedded-movies', () => {
    beforeEach(async () => {
      await EmbeddedMovie.insertMany(validEmbeddedMoviesList);
    });

    it('should return a list of embedded movies with pagination', async () => {
      const response = await testRequest.get('/api/embedded-movies');
      
      expect(response.status).toBe(200);
      expect(response.body.embeddedMovies).toHaveLength(3);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalEmbeddedMovies).toBe(3);
    });

    it('should return paginated results based on page and limit parameters', async () => {
      const response = await testRequest.get('/api/embedded-movies?page=1&limit=2');
      
      expect(response.status).toBe(200);
      expect(response.body.embeddedMovies).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should handle errors and return 500 status', async () => {
      jest.spyOn(EmbeddedMovie, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await testRequest.get('/api/embedded-movies');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/embedded-movies/search', () => {
    beforeEach(async () => {
      await EmbeddedMovie.insertMany(validEmbeddedMoviesList);
    });

    it('should search embedded movies by title', async () => {
      const response = await testRequest.get('/api/embedded-movies/search?title=Embedded Movie One');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].title).toBe('Embedded Movie One');
    });

    it('should search embedded movies by genre', async () => {
      const response = await testRequest.get('/api/embedded-movies/search?genre=Action');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].genres).toContain('Action');
    });

    it('should search embedded movies by year', async () => {
      const response = await testRequest.get('/api/embedded-movies/search?year=2022');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].year).toBe(2022);
    });

    it('should return empty array if no embedded movies match search criteria', async () => {
      const response = await testRequest.get('/api/embedded-movies/search?title=NonExistentMovie');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should handle errors in search and return 500 status', async () => {
      jest.spyOn(EmbeddedMovie, 'find').mockImplementationOnce(() => {
        throw new Error('Search error');
      });

      const response = await testRequest.get('/api/embedded-movies/search?title=Test');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/embedded-movies/:id', () => {
    let embeddedMovieId;

    beforeEach(async () => {
      const embeddedMovie = new EmbeddedMovie(validEmbeddedMovie);
      await embeddedMovie.save();
      embeddedMovieId = embeddedMovie._id.toString();
    });

    it('should return an embedded movie by ID', async () => {
      const response = await testRequest.get(`/api/embedded-movies/${embeddedMovieId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(validEmbeddedMovie.title);
      expect(response.body.year).toBe(validEmbeddedMovie.year);
      expect(response.body.genres).toEqual(validEmbeddedMovie.genres);
      expect(response.body.cast).toEqual(validEmbeddedMovie.cast);
    });

    it('should return 404 if embedded movie not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.get(`/api/embedded-movies/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Embedded movie not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.get('/api/embedded-movies/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/embedded-movies', () => {
    it('should create a new embedded movie', async () => {
      const response = await testRequest.post('/api/embedded-movies').send(validEmbeddedMovie);
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(validEmbeddedMovie.title);
      expect(response.body.year).toBe(validEmbeddedMovie.year);
      expect(response.body.genres).toEqual(validEmbeddedMovie.genres);
      expect(response.body.cast).toEqual(validEmbeddedMovie.cast);
      
      const savedEmbeddedMovie = await EmbeddedMovie.findById(response.body._id);
      expect(savedEmbeddedMovie).not.toBeNull();
    });

    it('should return 400 for invalid embedded movie data', async () => {
      const response = await testRequest.post('/api/embedded-movies').send(invalidEmbeddedMovie);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should handle complex nested data structures', async () => {
      const complexEmbeddedMovie = {
        title: 'Complex Movie',
        tomatoes: {
          viewer: {
            rating: 4.8,
            numReviews: 1000,
            meter: 95
          },
          dvd: new Date('2023-01-01'),
          lastUpdated: new Date('2023-02-01')
        },
        awards: {
          wins: 5,
          nominations: 10,
          text: 'Won 5 Oscars'
        }
      };

      const response = await testRequest.post('/api/embedded-movies').send(complexEmbeddedMovie);
      
      expect(response.status).toBe(201);
      expect(response.body.tomatoes.viewer.rating).toBe(complexEmbeddedMovie.tomatoes.viewer.rating);
      expect(response.body.awards.wins).toBe(complexEmbeddedMovie.awards.wins);
    });
  });

  describe('PUT /api/embedded-movies/:id', () => {
    let embeddedMovieId;

    beforeEach(async () => {
      const embeddedMovie = new EmbeddedMovie(validEmbeddedMovie);
      await embeddedMovie.save();
      embeddedMovieId = embeddedMovie._id.toString();
    });

    it('should update an existing embedded movie', async () => {
      const updatedData = {
        title: 'Updated Embedded Movie Title',
        year: 2024,
        genres: ['Updated', 'Genres'],
        cast: ['Updated Actor']
      };

      const response = await testRequest.put(`/api/embedded-movies/${embeddedMovieId}`).send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.year).toBe(updatedData.year);
      expect(response.body.genres).toEqual(updatedData.genres);
      expect(response.body.cast).toEqual(updatedData.cast);
      
      const updatedEmbeddedMovie = await EmbeddedMovie.findById(embeddedMovieId);
      expect(updatedEmbeddedMovie.title).toBe(updatedData.title);
    });

    it('should return 404 if embedded movie not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.put(`/api/embedded-movies/${nonExistentId}`).send({
        title: 'Updated Title'
      });
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Embedded movie not found');
    });

    it('should update nested data structures correctly', async () => {
      const updatedNestedData = {
        tomatoes: {
          viewer: {
            rating: 5.0,
            numReviews: 2000,
            meter: 100
          }
        },
        imdb: {
          rating: 10.0,
          votes: 20000,
          id: 99999
        }
      };

      const response = await testRequest.put(`/api/embedded-movies/${embeddedMovieId}`).send(updatedNestedData);
      
      expect(response.status).toBe(200);
      expect(response.body.tomatoes.viewer.rating).toBe(updatedNestedData.tomatoes.viewer.rating);
      expect(response.body.imdb.rating).toBe(updatedNestedData.imdb.rating);
    });
  });

  describe('DELETE /api/embedded-movies/:id', () => {
    let embeddedMovieId;

    beforeEach(async () => {
      const embeddedMovie = new EmbeddedMovie(validEmbeddedMovie);
      await embeddedMovie.save();
      embeddedMovieId = embeddedMovie._id.toString();
    });

    it('should delete an existing embedded movie', async () => {
      const response = await testRequest.delete(`/api/embedded-movies/${embeddedMovieId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Embedded movie deleted successfully');
      
      const deletedEmbeddedMovie = await EmbeddedMovie.findById(embeddedMovieId);
      expect(deletedEmbeddedMovie).toBeNull();
    });

    it('should return 404 if embedded movie not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.delete(`/api/embedded-movies/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Embedded movie not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.delete('/api/embedded-movies/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });
});
