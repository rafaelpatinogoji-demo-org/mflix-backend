const request = require('supertest');

jest.mock('../../src/config/database', () => jest.fn());
jest.mock('../../src/models/EmbeddedMovie');

const EmbeddedMovie = require('../../src/models/EmbeddedMovie');
const { mockEmbeddedMovie } = require('../utils/mockFactories');

describe('EmbeddedMovie API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = require('../../app');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/embedded-movies', () => {
    it('should return paginated embedded movies', async () => {
      const mockMovies = [mockEmbeddedMovie(), mockEmbeddedMovie({ _id: '507f1f77bcf86cd799439014' })];
      const mockTotal = 100;

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMovies)
      };

      EmbeddedMovie.find = jest.fn().mockReturnValue(mockQuery);
      EmbeddedMovie.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      const response = await request(app)
        .get('/api/embedded-movies?page=1&limit=10')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('embeddedMovies');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages', 10);
      expect(response.body).toHaveProperty('totalEmbeddedMovies', 100);
    });
  });

  describe('GET /api/embedded-movies/:id', () => {
    it('should return a single embedded movie', async () => {
      const mockMovie = mockEmbeddedMovie();
      EmbeddedMovie.findById = jest.fn().mockResolvedValue(mockMovie);

      const response = await request(app)
        .get('/api/embedded-movies/507f1f77bcf86cd799439013')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title');
    });

    it('should return 404 for non-existent movie', async () => {
      EmbeddedMovie.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/embedded-movies/507f1f77bcf86cd799439099')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Embedded movie not found');
    });
  });

  describe('POST /api/embedded-movies', () => {
    it('should create a new embedded movie', async () => {
      const movieData = {
        title: 'Test Movie',
        year: 2020,
        genres: ['Action'],
        plot: 'Test plot'
      };
      const savedMovie = { _id: '507f1f77bcf86cd799439015', ...movieData };

      const mockSave = jest.fn().mockResolvedValue(savedMovie);
      EmbeddedMovie.mockImplementation(() => ({
        save: mockSave
      }));

      const response = await request(app)
        .post('/api/embedded-movies')
        .send(movieData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title', 'Test Movie');
    });

    it('should return 400 for validation errors', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Validation failed'));
      EmbeddedMovie.mockImplementation(() => ({
        save: mockSave
      }));

      const response = await request(app)
        .post('/api/embedded-movies')
        .send({ plot: 'Missing required title' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/embedded-movies/:id', () => {
    it('should update an existing embedded movie', async () => {
      const updatedMovie = mockEmbeddedMovie({ plot: 'Updated plot' });
      EmbeddedMovie.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedMovie);

      const response = await request(app)
        .put('/api/embedded-movies/507f1f77bcf86cd799439013')
        .send({ plot: 'Updated plot' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('plot', 'Updated plot');
    });

    it('should return 404 for non-existent movie', async () => {
      EmbeddedMovie.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/embedded-movies/507f1f77bcf86cd799439099')
        .send({ plot: 'Updated plot' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Embedded movie not found');
    });
  });

  describe('DELETE /api/embedded-movies/:id', () => {
    it('should delete an embedded movie', async () => {
      const deletedMovie = mockEmbeddedMovie();
      EmbeddedMovie.findByIdAndDelete = jest.fn().mockResolvedValue(deletedMovie);

      const response = await request(app)
        .delete('/api/embedded-movies/507f1f77bcf86cd799439013')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Embedded movie deleted successfully');
    });

    it('should return 404 for non-existent movie', async () => {
      EmbeddedMovie.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/embedded-movies/507f1f77bcf86cd799439099')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Embedded movie not found');
    });
  });

  describe('GET /api/embedded-movies/search', () => {
    it('should search movies by title', async () => {
      const mockMovies = [mockEmbeddedMovie({ title: 'The Matrix' })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/api/embedded-movies/search?title=matrix')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search movies by genre', async () => {
      const mockMovies = [mockEmbeddedMovie({ genres: ['Action', 'Sci-Fi'] })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/api/embedded-movies/search?genre=Action')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search movies by year', async () => {
      const mockMovies = [mockEmbeddedMovie({ year: 1999 })];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/api/embedded-movies/search?year=1999')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search with combined filters', async () => {
      const mockMovies = [mockEmbeddedMovie()];
      EmbeddedMovie.find = jest.fn().mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/api/embedded-movies/search?title=matrix&genre=Sci-Fi&year=1999')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
