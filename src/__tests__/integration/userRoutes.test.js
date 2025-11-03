const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/userRoutes');
const User = require('../../models/User');
const { mockUser } = require('../mocks/mockModels');

jest.mock('../../models/User');
jest.mock('../../config/database', () => jest.fn());

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      const mockUsers = [mockUser, { ...mockUser, _id: '507f1f77bcf86cd799439012' }];
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments.mockResolvedValue(20);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages', 2);
      expect(response.body).toHaveProperty('totalUsers', 20);
      expect(response.body.users).toHaveLength(2);
    });

    it('should handle pagination query parameters', async () => {
      const mockUsers = [mockUser];
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments.mockResolvedValue(50);

      const response = await request(app).get('/api/users?page=3&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.currentPage).toBe(3);
      expect(response.body.totalPages).toBe(10);
    });

    it('should handle database errors', async () => {
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Database error');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/users/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', mockUser._id);
      expect(response.body).toHaveProperty('email', mockUser.email);
    });

    it('should return 404 when user not found', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/users/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should handle invalid id format', async () => {
      User.findById.mockRejectedValue(new Error('Invalid ID format'));

      const response = await request(app).get('/api/users/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      };
      const savedUser = { ...mockUser, ...newUser };
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedUser)
      }));

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('email', newUser.email);
    });

    it('should return 400 when required fields are missing', async () => {
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Validation error: name is required'))
      }));

      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when email is duplicate', async () => {
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Duplicate key error'))
      }));

      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const updatedData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updatedData };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/507f1f77bcf86cd799439011')
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Name');
    });

    it('should return 404 when user not found', async () => {
      User.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/507f1f77bcf86cd799439011')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 400 when validation fails', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Validation error'));

      const response = await request(app)
        .put('/api/users/507f1f77bcf86cd799439011')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      const response = await request(app).delete('/api/users/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should return 404 when user not found', async () => {
      User.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/users/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should handle database errors', async () => {
      User.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/users/507f1f77bcf86cd799439011');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });
});
