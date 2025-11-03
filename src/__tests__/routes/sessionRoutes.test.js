const request = require('supertest');
const express = require('express');
const sessionRoutes = require('../../routes/sessionRoutes');
const Session = require('../../models/Session');

jest.mock('../../models/Session');
jest.mock('../../config/database', () => jest.fn());

describe('Session Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sessions', sessionRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sessions', () => {
    it('should return paginated sessions', async () => {
      const mockSessions = [
        { _id: '1', user_id: 'user1', jwt: 'token1' }
      ];
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });
      Session.countDocuments.mockResolvedValue(1);

      const response = await request(app).get('/api/sessions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should accept pagination parameters', async () => {
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      Session.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/sessions')
        .query({ page: 2, limit: 5 });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/sessions/active', () => {
    it('should return active sessions', async () => {
      const mockActiveSessions = [
        {
          _id: '1',
          user_id: 'user1',
          jwt: 'token1',
          status: 'active',
          expiry: new Date('2025-12-31')
        }
      ];
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockActiveSessions)
      });

      const response = await request(app).get('/api/sessions/active');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('count');
    });

    it('should accept userId filter', async () => {
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const response = await request(app)
        .get('/api/sessions/active')
        .query({ userId: 'user123' });

      expect(response.status).toBe(200);
    });

    it('should accept date range filters', async () => {
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const response = await request(app)
        .get('/api/sessions/active')
        .query({ startDate: '2025-01-01', endDate: '2025-12-31' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session by id', async () => {
      const mockSession = { _id: '1', user_id: 'user1', jwt: 'token1' };
      Session.findById.mockResolvedValue(mockSession);

      const response = await request(app).get('/api/sessions/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSession);
    });

    it('should return 404 if session not found', async () => {
      Session.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/sessions/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Session not found');
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const newSession = { user_id: 'user1', jwt: 'token1' };
      Session.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: '1', ...newSession })
      }));

      const response = await request(app)
        .post('/api/sessions')
        .send(newSession);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
    });

    it('should return 400 for validation errors', async () => {
      Session.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Validation failed'))
      }));

      const response = await request(app)
        .post('/api/sessions')
        .send({ user_id: 'user1' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/sessions/logout-all', () => {
    it('should logout all user sessions', async () => {
      Session.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const response = await request(app)
        .post('/api/sessions/logout-all')
        .send({ userId: 'user123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionsTerminated', 3);
    });

    it('should require userId', async () => {
      const response = await request(app)
        .post('/api/sessions/logout-all')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User ID is required');
    });
  });

  describe('PUT /api/sessions/:id', () => {
    it('should update a session', async () => {
      const updatedSession = { _id: '1', user_id: 'user1', jwt: 'new-token' };
      Session.findByIdAndUpdate.mockResolvedValue(updatedSession);

      const response = await request(app)
        .put('/api/sessions/1')
        .send({ jwt: 'new-token' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedSession);
    });

    it('should return 404 if session not found', async () => {
      Session.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/sessions/nonexistent')
        .send({ jwt: 'new-token' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('should delete a session', async () => {
      Session.findByIdAndDelete.mockResolvedValue({ _id: '1' });

      const response = await request(app).delete('/api/sessions/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Session deleted successfully');
    });

    it('should return 404 if session not found', async () => {
      Session.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/sessions/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
