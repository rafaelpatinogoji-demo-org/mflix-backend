const mongoose = require('mongoose');
const User = require('../../src/models/User');
const { testRequest, generateObjectId } = require('../utils/testHelpers');
const { validUser, validUsersList, invalidUser } = require('../fixtures/userFixtures');

describe('User Routes', () => {
  describe('GET /api/users', () => {
    beforeEach(async () => {
      await User.insertMany(validUsersList);
    });

    it('should return a list of users with pagination', async () => {
      const response = await testRequest.get('/api/users');
      
      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(3);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalUsers).toBe(3);
    });

    it('should return paginated results based on page and limit parameters', async () => {
      const response = await testRequest.get('/api/users?page=1&limit=2');
      
      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should handle errors and return 500 status', async () => {
      jest.spyOn(User, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await testRequest.get('/api/users');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const user = new User(validUser);
      await user.save();
      userId = user._id.toString();
    });

    it('should return a user by ID', async () => {
      const response = await testRequest.get(`/api/users/${userId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(validUser.name);
      expect(response.body.email).toBe(validUser.email);
    });

    it('should return 404 if user not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.get(`/api/users/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.get('/api/users/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await testRequest.post('/api/users').send(validUser);
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe(validUser.name);
      expect(response.body.email).toBe(validUser.email);
      
      const savedUser = await User.findById(response.body._id);
      expect(savedUser).not.toBeNull();
    });

    it('should return 400 for invalid user data', async () => {
      const response = await testRequest.post('/api/users').send(invalidUser);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      await testRequest.post('/api/users').send(validUser);
      
      const response = await testRequest.post('/api/users').send(validUser);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const user = new User(validUser);
      await user.save();
      userId = user._id.toString();
    });

    it('should update an existing user', async () => {
      const updatedData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await testRequest.put(`/api/users/${userId}`).send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.email).toBe(updatedData.email);
      
      const updatedUser = await User.findById(userId);
      expect(updatedUser.name).toBe(updatedData.name);
    });

    it('should return 404 if user not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.put(`/api/users/${nonExistentId}`).send({
        name: 'Updated Name'
      });
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should accept invalid update data', async () => {
      const response = await testRequest.put(`/api/users/${userId}`).send({
        email: 'invalid-email' // Invalid email format
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('DELETE /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const user = new User(validUser);
      await user.save();
      userId = user._id.toString();
    });

    it('should delete an existing user', async () => {
      const response = await testRequest.delete(`/api/users/${userId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
      
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 if user not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.delete(`/api/users/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.delete('/api/users/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });
});
