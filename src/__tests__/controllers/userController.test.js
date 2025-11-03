const {
  f_getAllUsers,
  f_getUserById,
  f_createUser,
  f_updateUser,
  f_deleteUser
} = require('../../controllers/userController');
const User = require('../../models/User');
const { mockUser } = require('../mocks/mockModels');

jest.mock('../../models/User');

describe('UserController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('f_getAllUsers', () => {
    it('should return paginated users with default pagination', async () => {
      const mockUsers = [mockUser, { ...mockUser, _id: '507f1f77bcf86cd799439012' }];
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments.mockResolvedValue(20);

      await f_getAllUsers(mockReq, mockRes);

      expect(User.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        users: mockUsers,
        currentPage: 1,
        totalPages: 2,
        totalUsers: 20
      });
    });

    it('should return paginated users with custom page and limit', async () => {
      mockReq.query = { page: '2', limit: '5' };
      const mockUsers = [mockUser];
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments.mockResolvedValue(15);

      await f_getAllUsers(mockReq, mockRes);

      expect(User.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        users: mockUsers,
        currentPage: 2,
        totalPages: 3,
        totalUsers: 15
      });
    });

    it('should handle errors and return 500 status', async () => {
      const errorMessage = 'Database error';
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      await f_getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });

    it('should return empty array when no users exist', async () => {
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      User.countDocuments.mockResolvedValue(0);

      await f_getAllUsers(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        users: [],
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0
      });
    });
  });

  describe('f_getUserById', () => {
    it('should return user when found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      User.findById.mockResolvedValue(mockUser);

      await f_getUserById(mockReq, mockRes);

      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      User.findById.mockResolvedValue(null);

      await f_getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors and return 500 status', async () => {
      mockReq.params.id = 'invalid-id';
      const errorMessage = 'Invalid ID format';
      User.findById.mockRejectedValue(new Error(errorMessage));

      await f_getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_createUser', () => {
    it('should create user and return 201 status', async () => {
      mockReq.body = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      };
      const savedUser = { ...mockUser, ...mockReq.body };
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedUser)
      }));

      await f_createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(savedUser);
    });

    it('should return 400 when validation fails', async () => {
      mockReq.body = { name: 'Test' };
      const errorMessage = 'Validation error: email is required';
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error(errorMessage))
      }));

      await f_createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });

    it('should return 400 when duplicate email', async () => {
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password'
      };
      const errorMessage = 'Duplicate key error';
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error(errorMessage))
      }));

      await f_createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_updateUser', () => {
    it('should update user and return updated data', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.body = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      await f_updateUser(mockReq, mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockReq.body,
        { new: true, runValidators: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedUser);
    });

    it('should return 404 when user not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.body = { name: 'Updated Name' };
      User.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 400 when validation fails', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.body = { email: 'invalid-email' };
      const errorMessage = 'Validation error';
      User.findByIdAndUpdate.mockRejectedValue(new Error(errorMessage));

      await f_updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_deleteUser', () => {
    it('should delete user and return success message', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      await f_deleteUser(mockReq, mockRes);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should return 404 when user not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      User.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors and return 500 status', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      const errorMessage = 'Database error';
      User.findByIdAndDelete.mockRejectedValue(new Error(errorMessage));

      await f_deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});
