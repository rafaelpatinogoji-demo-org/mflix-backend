const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../src/models/User');
const Session = require('../../src/models/Session');

jest.mock('../../src/config/database', () => jest.fn());
jest.mock('../../src/models/User');
jest.mock('../../src/models/Session');

describe('Integration Tests - API Endpoints', () => {
  beforeAll(() => {
    mongoose.connect = jest.fn().mockResolvedValue(true);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Endpoints - /api/users', () => {
    describe('GET /api/users', () => {
      it('should return paginated users with default parameters', async () => {
        const v_mockUsers = [
          { _id: '1', name: 'User 1', email: 'user1@test.com' },
          { _id: '2', name: 'User 2', email: 'user2@test.com' }
        ];

        User.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(v_mockUsers)
        });
        User.countDocuments = jest.fn().mockResolvedValue(20);

        const v_response = await request(app)
          .get('/api/users')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(v_response.body).toHaveProperty('users');
        expect(v_response.body).toHaveProperty('currentPage', 1);
        expect(v_response.body).toHaveProperty('totalPages', 2);
        expect(v_response.body).toHaveProperty('totalUsers', 20);
      });

      it('should handle custom pagination parameters', async () => {
        User.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        });
        User.countDocuments = jest.fn().mockResolvedValue(50);

        const v_response = await request(app)
          .get('/api/users?page=2&limit=5')
          .expect(200);

        expect(v_response.body.currentPage).toBe(2);
        expect(v_response.body.totalPages).toBe(10);
      });

      it('should return correct content-type header', async () => {
        User.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        });
        User.countDocuments = jest.fn().mockResolvedValue(0);

        await request(app)
          .get('/api/users')
          .expect('Content-Type', /json/);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return a single user by ID', async () => {
        const v_mockUser = {
          _id: '507f1f77bcf86cd799439011',
          name: 'Test User',
          email: 'test@example.com'
        };

        User.findById = jest.fn().mockResolvedValue(v_mockUser);

        const v_response = await request(app)
          .get('/api/users/507f1f77bcf86cd799439011')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(v_response.body).toHaveProperty('_id');
        expect(v_response.body).toHaveProperty('name');
        expect(v_response.body).toHaveProperty('email');
      });

      it('should return 404 for non-existent user', async () => {
        User.findById = jest.fn().mockResolvedValue(null);

        const v_response = await request(app)
          .get('/api/users/507f1f77bcf86cd799439011')
          .expect(404);

        expect(v_response.body).toHaveProperty('message', 'User not found');
      });

      it('should handle invalid ObjectId format', async () => {
        User.findById = jest.fn().mockRejectedValue(new Error('Cast to ObjectId failed'));

        await request(app)
          .get('/api/users/invalid-id')
          .expect(500);
      });
    });

    describe('POST /api/users', () => {
      it('should create a new user with valid data', async () => {
        const v_newUser = {
          name: 'New User',
          email: 'newuser@test.com',
          password: 'password123'
        };

        const v_savedUser = { _id: '123', ...v_newUser };

        User.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(v_savedUser)
        }));

        const v_response = await request(app)
          .post('/api/users')
          .send(v_newUser)
          .expect('Content-Type', /json/)
          .expect(201);

        expect(v_response.body).toHaveProperty('_id');
        expect(v_response.body).toHaveProperty('name', v_newUser.name);
        expect(v_response.body).toHaveProperty('email', v_newUser.email);
      });

      it('should return 400 for missing required fields', async () => {
        const v_invalidUser = {
          name: 'Test User'
        };

        User.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(new Error('Validation failed'))
        }));

        await request(app)
          .post('/api/users')
          .send(v_invalidUser)
          .expect(400);
      });

      it('should handle duplicate email constraint', async () => {
        const v_duplicateUser = {
          name: 'Test User',
          email: 'existing@test.com',
          password: 'password123'
        };

        User.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(new Error('E11000 duplicate key error'))
        }));

        await request(app)
          .post('/api/users')
          .send(v_duplicateUser)
          .expect(400);
      });
    });

    describe('PUT /api/users/:id', () => {
      it('should update an existing user', async () => {
        const v_updateData = {
          name: 'Updated Name',
          email: 'updated@test.com'
        };

        const v_updatedUser = {
          _id: '507f1f77bcf86cd799439011',
          ...v_updateData
        };

        User.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedUser);

        const v_response = await request(app)
          .put('/api/users/507f1f77bcf86cd799439011')
          .send(v_updateData)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(v_response.body).toHaveProperty('name', v_updateData.name);
        expect(v_response.body).toHaveProperty('email', v_updateData.email);
      });

      it('should return 404 for non-existent user', async () => {
        User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

        await request(app)
          .put('/api/users/507f1f77bcf86cd799439011')
          .send({ name: 'Updated Name' })
          .expect(404);
      });

      it('should validate update data', async () => {
        User.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Validation failed'));

        await request(app)
          .put('/api/users/507f1f77bcf86cd799439011')
          .send({ email: 'invalid-email' })
          .expect(400);
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('should delete an existing user', async () => {
        const v_deletedUser = {
          _id: '507f1f77bcf86cd799439011',
          name: 'Test User'
        };

        User.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedUser);

        const v_response = await request(app)
          .delete('/api/users/507f1f77bcf86cd799439011')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(v_response.body).toHaveProperty('message', 'User deleted successfully');
      });

      it('should return 404 for non-existent user', async () => {
        User.findByIdAndDelete = jest.fn().mockResolvedValue(null);

        await request(app)
          .delete('/api/users/507f1f77bcf86cd799439011')
          .expect(404);
      });
    });
  });

  describe('Session Endpoints - /api/sessions', () => {
    describe('GET /api/sessions', () => {
      it('should return paginated sessions with default parameters', async () => {
        const v_mockSessions = [
          { _id: '1', user_id: 'user1', jwt: 'token1' },
          { _id: '2', user_id: 'user2', jwt: 'token2' }
        ];

        Session.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(v_mockSessions)
        });
        Session.countDocuments = jest.fn().mockResolvedValue(15);

        const v_response = await request(app)
          .get('/api/sessions')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(v_response.body).toHaveProperty('sessions');
        expect(v_response.body).toHaveProperty('currentPage', 1);
        expect(v_response.body).toHaveProperty('totalPages', 2);
        expect(v_response.body).toHaveProperty('totalSessions', 15);
      });

      it('should handle custom pagination parameters', async () => {
        Session.find = jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        });
        Session.countDocuments = jest.fn().mockResolvedValue(30);

        const v_response = await request(app)
          .get('/api/sessions?page=3&limit=10')
          .expect(200);

        expect(v_response.body.currentPage).toBe(3);
        expect(v_response.body.totalPages).toBe(3);
      });
    });

    describe('GET /api/sessions/:id', () => {
      it('should return a single session by ID', async () => {
        const v_mockSession = {
          _id: '507f1f77bcf86cd799439011',
          user_id: 'user123',
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
        };

        Session.findById = jest.fn().mockResolvedValue(v_mockSession);

        const v_response = await request(app)
          .get('/api/sessions/507f1f77bcf86cd799439011')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(v_response.body).toHaveProperty('_id');
        expect(v_response.body).toHaveProperty('user_id');
        expect(v_response.body).toHaveProperty('jwt');
      });

      it('should return 404 for non-existent session', async () => {
        Session.findById = jest.fn().mockResolvedValue(null);

        const v_response = await request(app)
          .get('/api/sessions/507f1f77bcf86cd799439011')
          .expect(404);

        expect(v_response.body).toHaveProperty('message', 'Session not found');
      });
    });

    describe('POST /api/sessions', () => {
      it('should create a new session with valid data', async () => {
        const v_newSession = {
          user_id: 'user123',
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
        };

        const v_savedSession = { _id: '456', ...v_newSession };

        Session.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(v_savedSession)
        }));

        const v_response = await request(app)
          .post('/api/sessions')
          .send(v_newSession)
          .expect('Content-Type', /json/)
          .expect(201);

        expect(v_response.body).toHaveProperty('_id');
        expect(v_response.body).toHaveProperty('user_id', v_newSession.user_id);
        expect(v_response.body).toHaveProperty('jwt', v_newSession.jwt);
      });

      it('should return 400 for missing required fields', async () => {
        const v_invalidSession = {
          user_id: 'user123'
        };

        Session.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(new Error('Validation failed'))
        }));

        await request(app)
          .post('/api/sessions')
          .send(v_invalidSession)
          .expect(400);
      });
    });

    describe('PUT /api/sessions/:id', () => {
      it('should update an existing session', async () => {
        const v_updateData = {
          jwt: 'new-jwt-token-value'
        };

        const v_updatedSession = {
          _id: '507f1f77bcf86cd799439011',
          user_id: 'user123',
          ...v_updateData
        };

        Session.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedSession);

        const v_response = await request(app)
          .put('/api/sessions/507f1f77bcf86cd799439011')
          .send(v_updateData)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(v_response.body).toHaveProperty('jwt', v_updateData.jwt);
      });

      it('should return 404 for non-existent session', async () => {
        Session.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

        await request(app)
          .put('/api/sessions/507f1f77bcf86cd799439011')
          .send({ jwt: 'new-token' })
          .expect(404);
      });
    });

    describe('DELETE /api/sessions/:id', () => {
      it('should delete an existing session', async () => {
        const v_deletedSession = {
          _id: '507f1f77bcf86cd799439011',
          user_id: 'user123'
        };

        Session.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedSession);

        const v_response = await request(app)
          .delete('/api/sessions/507f1f77bcf86cd799439011')
          .expect('Content-Type', /json/)
          .expect(200);

        expect(v_response.body).toHaveProperty('message', 'Session deleted successfully');
      });

      it('should return 404 for non-existent session', async () => {
        Session.findByIdAndDelete = jest.fn().mockResolvedValue(null);

        await request(app)
          .delete('/api/sessions/507f1f77bcf86cd799439011')
          .expect(404);
      });
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information at root path', async () => {
      const v_response = await request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(v_response.body).toHaveProperty('message', 'MFlix API Server');
      expect(v_response.body).toHaveProperty('version');
      expect(v_response.body).toHaveProperty('endpoints');
      expect(v_response.body.endpoints).toHaveProperty('users', '/api/users');
      expect(v_response.body.endpoints).toHaveProperty('sessions', '/api/sessions');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const v_response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Route not found');
    });
  });
});
