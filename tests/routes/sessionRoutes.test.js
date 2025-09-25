const mongoose = require('mongoose');
const Session = require('../../src/models/Session');
const { testRequest, generateObjectId } = require('../utils/testHelpers');
const { validSession, validSessionsList, invalidSession } = require('../fixtures/sessionFixtures');

describe('Session Routes', () => {
  describe('GET /api/sessions', () => {
    beforeEach(async () => {
      await Session.insertMany(validSessionsList);
    });

    it('should return a list of sessions with pagination', async () => {
      const response = await testRequest.get('/api/sessions');
      
      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(3);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalSessions).toBe(3);
    });

    it('should return paginated results based on page and limit parameters', async () => {
      const response = await testRequest.get('/api/sessions?page=1&limit=2');
      
      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should handle errors and return 500 status', async () => {
      jest.spyOn(Session, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await testRequest.get('/api/sessions');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/sessions/:id', () => {
    let sessionId;

    beforeEach(async () => {
      const session = new Session(validSession);
      await session.save();
      sessionId = session._id.toString();
    });

    it('should return a session by ID', async () => {
      const response = await testRequest.get(`/api/sessions/${sessionId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.user_id).toBe(validSession.user_id);
      expect(response.body.jwt).toBe(validSession.jwt);
    });

    it('should return 404 if session not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.get(`/api/sessions/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.get('/api/sessions/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const response = await testRequest.post('/api/sessions').send(validSession);
      
      expect(response.status).toBe(201);
      expect(response.body.user_id).toBe(validSession.user_id);
      expect(response.body.jwt).toBe(validSession.jwt);
      
      const savedSession = await Session.findById(response.body._id);
      expect(savedSession).not.toBeNull();
    });

    it('should return 400 for invalid session data', async () => {
      const response = await testRequest.post('/api/sessions').send(invalidSession);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/sessions/:id', () => {
    let sessionId;

    beforeEach(async () => {
      const session = new Session(validSession);
      await session.save();
      sessionId = session._id.toString();
    });

    it('should update an existing session', async () => {
      const updatedData = {
        user_id: 'updatedUser',
        jwt: 'updatedJWT.token.here'
      };

      const response = await testRequest.put(`/api/sessions/${sessionId}`).send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.user_id).toBe(updatedData.user_id);
      expect(response.body.jwt).toBe(updatedData.jwt);
      
      const updatedSession = await Session.findById(sessionId);
      expect(updatedSession.user_id).toBe(updatedData.user_id);
    });

    it('should return 404 if session not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.put(`/api/sessions/${nonExistentId}`).send({
        user_id: 'updatedUser'
      });
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    it('should return 400 for invalid update data', async () => {
      const response = await testRequest.put(`/api/sessions/${sessionId}`).send({
        user_id: 'updatedUser',
        jwt: '' // Empty JWT
      });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    let sessionId;

    beforeEach(async () => {
      const session = new Session(validSession);
      await session.save();
      sessionId = session._id.toString();
    });

    it('should delete an existing session', async () => {
      const response = await testRequest.delete(`/api/sessions/${sessionId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session deleted successfully');
      
      const deletedSession = await Session.findById(sessionId);
      expect(deletedSession).toBeNull();
    });

    it('should return 404 if session not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.delete(`/api/sessions/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.delete('/api/sessions/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });
});
