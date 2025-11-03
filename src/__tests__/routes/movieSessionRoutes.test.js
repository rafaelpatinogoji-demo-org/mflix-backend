const request = require('supertest');
const express = require('express');
const movieSessionRoutes = require('../../routes/movieSessionRoutes');
const MovieSession = require('../../models/MovieSession');
const Movie = require('../../models/Movie');
const Theater = require('../../models/Theater');

jest.mock('../../models/MovieSession');
jest.mock('../../models/Movie');
jest.mock('../../models/Theater');
jest.mock('../../config/database', () => jest.fn());

describe('Movie Session Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/movie-sessions', movieSessionRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/movie-sessions', () => {
    it('should create a new movie session', async () => {
      const newSession = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionTime: '2025-06-15T19:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      const savedSession = {
        _id: 'session123',
        ...newSession,
        populate: jest.fn().mockResolvedValue({ _id: 'session123', ...newSession })
      };
      const mockSession = {
        _id: 'session123',
        ...newSession,
        save: jest.fn().mockResolvedValue(savedSession),
        populate: jest.fn().mockResolvedValue({ _id: 'session123', ...newSession })
      };
      MovieSession.mockImplementation(() => mockSession);

      const response = await request(app)
        .post('/api/movie-sessions')
        .send(newSession);

      expect(response.status).toBe(201);
    });

    it('should return 404 if movie not found', async () => {
      Movie.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/movie-sessions')
        .send({
          movieId: 'nonexistent',
          theaterId: 'theater123',
          sessionTime: '2025-06-15T19:00:00Z',
          price: 12.99,
          totalSeats: 100
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Movie not found');
    });

    it('should return 404 if theater not found', async () => {
      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/movie-sessions')
        .send({
          movieId: 'movie123',
          theaterId: 'nonexistent',
          sessionTime: '2025-06-15T19:00:00Z',
          price: 12.99,
          totalSeats: 100
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Theater not found');
    });
  });

  describe('GET /api/movie-sessions', () => {
    it('should return paginated movie sessions', async () => {
      const mockSessions = [{ _id: 'session123' }];
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });
      MovieSession.countDocuments.mockResolvedValue(1);

      const response = await request(app).get('/api/movie-sessions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should accept pagination parameters', async () => {
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      MovieSession.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/movie-sessions')
        .query({ page: 2, limit: 5 });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/movie-sessions/:id', () => {
    it('should return movie session by id', async () => {
      const mockSession = { _id: 'session123' };
      MovieSession.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSession)
      });

      const response = await request(app).get('/api/movie-sessions/session123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSession);
    });

    it('should return 404 if session not found', async () => {
      MovieSession.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app).get('/api/movie-sessions/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/movie-sessions/:id', () => {
    it('should update a movie session', async () => {
      const updatedSession = { _id: 'session123', price: 14.99 };
      MovieSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedSession)
      });

      const response = await request(app)
        .put('/api/movie-sessions/session123')
        .send({ price: 14.99 });

      expect(response.status).toBe(200);
    });

    it('should return 404 if session not found', async () => {
      MovieSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .put('/api/movie-sessions/nonexistent')
        .send({ price: 14.99 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/movie-sessions/:id', () => {
    it('should delete a movie session', async () => {
      MovieSession.findByIdAndDelete.mockResolvedValue({ _id: 'session123' });

      const response = await request(app).delete('/api/movie-sessions/session123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Movie session deleted successfully');
    });

    it('should return 404 if session not found', async () => {
      MovieSession.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/movie-sessions/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/movie-sessions/movie/:movieId', () => {
    it('should return sessions for a specific movie', async () => {
      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: 'session123' }])
      });
      MovieSession.countDocuments.mockResolvedValue(1);

      const response = await request(app).get('/api/movie-sessions/movie/movie123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
    });

    it('should return 404 if movie not found', async () => {
      Movie.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/movie-sessions/movie/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Movie not found');
    });

    it('should accept date filter', async () => {
      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      MovieSession.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/movie-sessions/movie/movie123')
        .query({ date: '2025-06-15' });

      expect(response.status).toBe(200);
    });

    it('should accept date range filter', async () => {
      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      MovieSession.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/movie-sessions/movie/movie123')
        .query({ startDate: '2025-06-01', endDate: '2025-06-30' });

      expect(response.status).toBe(200);
    });
  });
});
