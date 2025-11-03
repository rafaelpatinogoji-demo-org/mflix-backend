const request = require('supertest');
const express = require('express');
const theaterSessionRoutes = require('../../routes/theaterSessionRoutes');
const TheaterSession = require('../../models/TheaterSession');
const Theater = require('../../models/Theater');
const Movie = require('../../models/Movie');

jest.mock('../../models/TheaterSession');
jest.mock('../../models/Theater');
jest.mock('../../models/Movie');
jest.mock('../../config/database', () => jest.fn());

describe('Theater Session Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/theater-sessions', theaterSessionRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/theater-sessions', () => {
    it('should return theater sessions with theaterId parameter', async () => {
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      TheaterSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'session123' }])
      });

      const response = await request(app)
        .get('/api/theater-sessions')
        .query({ theaterId: 'theater123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
    });

    it('should return 400 if theaterId is missing', async () => {
      const response = await request(app).get('/api/theater-sessions');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Theater ID is required');
    });

    it('should return 404 if theater not found', async () => {
      Theater.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/theater-sessions')
        .query({ theaterId: 'nonexistent' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Theater not found');
    });

    it('should accept date filter', async () => {
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      TheaterSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      const response = await request(app)
        .get('/api/theater-sessions')
        .query({ theaterId: 'theater123', date: '2025-06-15' });

      expect(response.status).toBe(200);
    });

    it('should accept movieId filter', async () => {
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      TheaterSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      const response = await request(app)
        .get('/api/theater-sessions')
        .query({ theaterId: 'theater123', movieId: 'movie123' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/theater-sessions', () => {
    it('should create a new theater session', async () => {
      const newSession = {
        theater: 'theater123',
        movie: 'movie123',
        showtime: '2025-06-15T19:00:00Z',
        endTime: '2025-06-15T21:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      Movie.findById.mockResolvedValue({ _id: 'movie123' });
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
      TheaterSession.mockImplementation(() => mockSession);

      const response = await request(app)
        .post('/api/theater-sessions')
        .send(newSession);

      expect(response.status).toBe(201);
    });

    it('should return 404 if theater not found', async () => {
      Theater.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/theater-sessions')
        .send({
          theater: 'nonexistent',
          movie: 'movie123',
          showtime: '2025-06-15T19:00:00Z',
          endTime: '2025-06-15T21:00:00Z',
          price: 12.99,
          totalSeats: 100
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Theater not found');
    });

    it('should return 404 if movie not found', async () => {
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      Movie.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/theater-sessions')
        .send({
          theater: 'theater123',
          movie: 'nonexistent',
          showtime: '2025-06-15T19:00:00Z',
          endTime: '2025-06-15T21:00:00Z',
          price: 12.99,
          totalSeats: 100
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Movie not found');
    });

    it('should return 400 if showtime is after endTime', async () => {
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      Movie.findById.mockResolvedValue({ _id: 'movie123' });

      const response = await request(app)
        .post('/api/theater-sessions')
        .send({
          theater: 'theater123',
          movie: 'movie123',
          showtime: '2025-06-15T21:00:00Z',
          endTime: '2025-06-15T19:00:00Z',
          price: 12.99,
          totalSeats: 100
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Showtime must be before end time');
    });
  });

  describe('PUT /api/theater-sessions/:id', () => {
    it('should update a theater session', async () => {
      const updatedSession = { _id: 'session123', price: 14.99 };
      TheaterSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedSession)
      });

      const response = await request(app)
        .put('/api/theater-sessions/session123')
        .send({ price: 14.99 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedSession);
    });

    it('should return 404 if session not found', async () => {
      TheaterSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .put('/api/theater-sessions/nonexistent')
        .send({ price: 14.99 });

      expect(response.status).toBe(404);
    });

    it('should validate date formats in update', async () => {
      const response = await request(app)
        .put('/api/theater-sessions/session123')
        .send({ showtime: 'invalid-date' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/theater-sessions/:id', () => {
    it('should delete a theater session', async () => {
      TheaterSession.findByIdAndDelete.mockResolvedValue({ _id: 'session123' });

      const response = await request(app).delete('/api/theater-sessions/session123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Theater session deleted successfully');
    });

    it('should return 404 if session not found', async () => {
      TheaterSession.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/theater-sessions/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
