const User = require('../../src/models/User');
const {
  f_getAllUsers,
  f_getUserById,
  f_createUser,
  f_updateUser,
  f_deleteUser
} = require('../../src/controllers/userController');

jest.mock('../../src/models/User');

describe('User Controller', () => {
  let v_mockReq;
  let v_mockRes;
  let v_mockJson;
  let v_mockStatus;

  beforeEach(() => {
    v_mockJson = jest.fn();
    v_mockStatus = jest.fn(() => ({ json: v_mockJson }));
    v_mockRes = {
      json: v_mockJson,
      status: v_mockStatus
    };
    jest.clearAllMocks();
  });

  describe('f_getAllUsers', () => {
    it('should return paginated users with default pagination', async () => {
      const v_mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@test.com' },
        { _id: '2', name: 'User 2', email: 'user2@test.com' }
      ];

      v_mockReq = { query: {} };

      User.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockUsers)
      });
      User.countDocuments = jest.fn().mockResolvedValue(20);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(User.find).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: v_mockUsers,
        currentPage: 1,
        totalPages: 2,
        totalUsers: 20
      });
    });

    it('should handle custom page and limit query parameters', async () => {
      const v_mockUsers = [
        { _id: '3', name: 'User 3', email: 'user3@test.com' }
      ];

      v_mockReq = { query: { page: '2', limit: '5' } };

      User.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockUsers)
      });
      User.countDocuments = jest.fn().mockResolvedValue(25);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: v_mockUsers,
        currentPage: 2,
        totalPages: 5,
        totalUsers: 25
      });
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const v_mockUsers = [];

      v_mockReq = { query: { page: 'invalid', limit: '-5' } };

      User.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockUsers)
      });
      User.countDocuments = jest.fn().mockResolvedValue(0);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: v_mockUsers,
        currentPage: 1,
        totalPages: -0,
        totalUsers: 0
      });
    });

    it('should handle database errors with 500 status', async () => {
      v_mockReq = { query: {} };

      const v_mockError = new Error('Database connection failed');
      User.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(v_mockError)
      });

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle zero results correctly', async () => {
      v_mockReq = { query: { page: '100', limit: '10' } };

      User.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      User.countDocuments = jest.fn().mockResolvedValue(5);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: [],
        currentPage: 100,
        totalPages: 1,
        totalUsers: 5
      });
    });
  });

  describe('f_getUserById', () => {
    it('should successfully return user by valid ObjectId', async () => {
      const v_mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com'
      };

      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      User.findById = jest.fn().mockResolvedValue(v_mockUser);

      await f_getUserById(v_mockReq, v_mockRes);

      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockUser);
    });

    it('should return 404 when user not found', async () => {
      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      User.findById = jest.fn().mockResolvedValue(null);

      await f_getUserById(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(404);
      expect(v_mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle invalid ObjectId format with 500 status', async () => {
      v_mockReq = { params: { id: 'invalid-id' } };
      const v_mockError = new Error('Cast to ObjectId failed');
      User.findById = jest.fn().mockRejectedValue(v_mockError);

      await f_getUserById(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle database errors', async () => {
      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      const v_mockError = new Error('Database error');
      User.findById = jest.fn().mockRejectedValue(v_mockError);

      await f_getUserById(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });
  });

  describe('f_createUser', () => {
    it('should successfully create user with valid data', async () => {
      const v_userData = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123'
      };

      const v_savedUser = { _id: '123', ...v_userData };

      v_mockReq = { body: v_userData };
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedUser)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(201);
      expect(v_mockJson).toHaveBeenCalledWith(v_savedUser);
    });

    it('should return 400 for missing required name field', async () => {
      const v_userData = {
        email: 'test@test.com',
        password: 'password123'
      };

      v_mockReq = { body: v_userData };
      const v_mockError = new Error('User validation failed: name: Path `name` is required.');
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_mockError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should return 400 for missing required email field', async () => {
      const v_userData = {
        name: 'Test User',
        password: 'password123'
      };

      v_mockReq = { body: v_userData };
      const v_mockError = new Error('User validation failed: email: Path `email` is required.');
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_mockError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should return 400 for missing required password field', async () => {
      const v_userData = {
        name: 'Test User',
        email: 'test@test.com'
      };

      v_mockReq = { body: v_userData };
      const v_mockError = new Error('User validation failed: password: Path `password` is required.');
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_mockError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should return 400 for duplicate email (unique constraint)', async () => {
      const v_userData = {
        name: 'Test User',
        email: 'existing@test.com',
        password: 'password123'
      };

      v_mockReq = { body: v_userData };
      const v_mockError = new Error('E11000 duplicate key error collection');
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_mockError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle empty request body', async () => {
      v_mockReq = { body: {} };
      const v_mockError = new Error('User validation failed');
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_mockError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });
  });

  describe('f_updateUser', () => {
    it('should successfully update user with valid data', async () => {
      const v_updateData = {
        name: 'Updated User',
        email: 'updated@test.com'
      };

      const v_updatedUser = { _id: '507f1f77bcf86cd799439011', ...v_updateData };

      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: v_updateData
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedUser);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        v_updateData,
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedUser);
    });

    it('should return updated user with runValidators enabled', async () => {
      const v_updateData = { name: 'New Name' };
      const v_updatedUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'New Name',
        email: 'test@test.com'
      };

      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: v_updateData
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedUser);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        v_updateData,
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedUser);
    });

    it('should return 404 when user not found', async () => {
      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { name: 'Updated Name' }
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(404);
      expect(v_mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 400 for validation errors', async () => {
      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { email: 'invalid-email' }
      };

      const v_mockError = new Error('Validation failed');
      User.findByIdAndUpdate = jest.fn().mockRejectedValue(v_mockError);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle invalid ObjectId format', async () => {
      v_mockReq = {
        params: { id: 'invalid-id' },
        body: { name: 'Updated Name' }
      };

      const v_mockError = new Error('Cast to ObjectId failed');
      User.findByIdAndUpdate = jest.fn().mockRejectedValue(v_mockError);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle partial updates', async () => {
      const v_partialUpdate = { name: 'Only Name Updated' };
      const v_updatedUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Only Name Updated',
        email: 'original@test.com',
        password: 'original-password'
      };

      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: v_partialUpdate
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedUser);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedUser);
    });
  });

  describe('f_deleteUser', () => {
    it('should successfully delete user by ID', async () => {
      const v_deletedUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@test.com'
      };

      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      User.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedUser);

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should return success message after deletion', async () => {
      const v_deletedUser = { _id: '123', name: 'User' };

      v_mockReq = { params: { id: '123' } };
      User.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedUser);

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should return 404 when user not found', async () => {
      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      User.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(404);
      expect(v_mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle invalid ObjectId format with 500 status', async () => {
      v_mockReq = { params: { id: 'invalid-id' } };
      const v_mockError = new Error('Cast to ObjectId failed');
      User.findByIdAndDelete = jest.fn().mockRejectedValue(v_mockError);

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle database errors', async () => {
      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      const v_mockError = new Error('Database connection lost');
      User.findByIdAndDelete = jest.fn().mockRejectedValue(v_mockError);

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });
  });
});
