const {
  f_getAllUsers,
  f_getUserById,
  f_createUser,
  f_updateUser,
  f_deleteUser
} = require('../../../src/controllers/userController');
const User = require('../../../src/models/User');

jest.mock('../../../src/models/User');

describe('userController', () => {
  let v_mockReq;
  let v_mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    v_mockReq = {
      query: {},
      params: {},
      body: {}
    };
    
    v_mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('f_getAllUsers', () => {
    it('should return paginated users with default pagination', async () => {
      const v_mockUsers = [
        { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
        { _id: 'user2', name: 'Jane Doe', email: 'jane@example.com' }
      ];
      
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockUsers)
        })
      });
      User.countDocuments.mockResolvedValue(2);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(User.find).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: v_mockUsers,
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2
      });
    });

    it('should return paginated users with custom pagination parameters', async () => {
      v_mockReq.query = { page: '2', limit: '5' };
      const v_mockUsers = [
        { _id: 'user6', name: 'User 6', email: 'user6@example.com' }
      ];
      
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockUsers)
        })
      });
      User.countDocuments.mockResolvedValue(11);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: v_mockUsers,
        currentPage: 2,
        totalPages: 3,
        totalUsers: 11
      });
    });

    it('should handle page parameter as string and convert to number', async () => {
      v_mockReq.query = { page: '3', limit: '10' };
      const v_mockUsers = [];
      
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockUsers)
        })
      });
      User.countDocuments.mockResolvedValue(25);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: v_mockUsers,
        currentPage: 3,
        totalPages: 3,
        totalUsers: 25
      });
    });

    it('should use default values when page and limit are invalid', async () => {
      v_mockReq.query = { page: 'invalid', limit: 'invalid' };
      const v_mockUsers = [];
      
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockUsers)
        })
      });
      User.countDocuments.mockResolvedValue(0);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: v_mockUsers,
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0
      });
    });

    it('should return empty array when no users exist', async () => {
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      User.countDocuments.mockResolvedValue(0);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        users: [],
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0
      });
    });

    it('should handle database error and return 500 status', async () => {
      const v_errorMessage = 'Database connection failed';
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error(v_errorMessage))
        })
      });

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
    });

    it('should calculate correct skip value for pagination', async () => {
      v_mockReq.query = { page: '3', limit: '5' };
      const v_mockSkip = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([])
      });
      
      User.find.mockReturnValue({ skip: v_mockSkip });
      User.countDocuments.mockResolvedValue(20);

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockSkip).toHaveBeenCalledWith(10);
    });

    it('should handle countDocuments error', async () => {
      const v_errorMessage = 'Count failed';
      User.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      User.countDocuments.mockRejectedValue(new Error(v_errorMessage));

      await f_getAllUsers(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
    });
  });

  describe('f_getUserById', () => {
    it('should return a user when found', async () => {
      const v_mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword'
      };
      v_mockReq.params = { id: 'user123' };
      
      User.findById.mockResolvedValue(v_mockUser);

      await f_getUserById(v_mockReq, v_mockRes);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockUser);
    });

    it('should return 404 when user is not found', async () => {
      v_mockReq.params = { id: 'nonexistent' };
      
      User.findById.mockResolvedValue(null);

      await f_getUserById(v_mockReq, v_mockRes);

      expect(User.findById).toHaveBeenCalledWith('nonexistent');
      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle database error and return 500 status', async () => {
      const v_errorMessage = 'Database error';
      v_mockReq.params = { id: 'user123' };
      
      User.findById.mockRejectedValue(new Error(v_errorMessage));

      await f_getUserById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
    });

    it('should handle invalid ObjectId format error', async () => {
      const v_castError = new Error('Cast to ObjectId failed');
      v_castError.name = 'CastError';
      v_mockReq.params = { id: 'invalid-id' };
      
      User.findById.mockRejectedValue(v_castError);

      await f_getUserById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Cast to ObjectId failed' });
    });

    it('should return user with all fields', async () => {
      const v_mockUser = {
        _id: 'user456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'securepassword123'
      };
      v_mockReq.params = { id: 'user456' };
      
      User.findById.mockResolvedValue(v_mockUser);

      await f_getUserById(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockUser);
      expect(v_mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('f_createUser', () => {
    it('should create a new user successfully', async () => {
      const v_userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      };
      const v_savedUser = {
        _id: 'newuser123',
        ...v_userData
      };
      v_mockReq.body = v_userData;
      
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedUser)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(User).toHaveBeenCalledWith(v_userData);
      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(v_savedUser);
    });

    it('should return 400 when validation fails', async () => {
      const v_validationError = new Error('Validation failed: email is required');
      v_mockReq.body = { name: 'User Without Email' };
      
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_validationError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Validation failed: email is required' });
    });

    it('should return 400 when duplicate email is provided', async () => {
      const v_duplicateError = new Error('E11000 duplicate key error');
      v_mockReq.body = {
        name: 'Duplicate User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_duplicateError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'E11000 duplicate key error' });
    });

    it('should return 400 when required fields are missing', async () => {
      const v_validationError = new Error('User validation failed: name: Path `name` is required');
      v_mockReq.body = { email: 'test@example.com', password: 'pass123' };
      
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_validationError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should create user with all required fields', async () => {
      const v_userData = {
        name: 'Complete User',
        email: 'complete@example.com',
        password: 'securePassword123!'
      };
      const v_savedUser = { _id: 'complete123', ...v_userData };
      v_mockReq.body = v_userData;
      
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedUser)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(v_savedUser);
    });

    it('should handle empty request body', async () => {
      const v_validationError = new Error('Validation failed');
      v_mockReq.body = {};
      
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_validationError)
      }));

      await f_createUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('f_updateUser', () => {
    it('should update a user successfully', async () => {
      const v_updatedUser = {
        _id: 'user123',
        name: 'Updated Name',
        email: 'updated@example.com',
        password: 'newpassword'
      };
      v_mockReq.params = { id: 'user123' };
      v_mockReq.body = { name: 'Updated Name' };
      
      User.findByIdAndUpdate.mockResolvedValue(v_updatedUser);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { name: 'Updated Name' },
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedUser);
    });

    it('should return 404 when user to update is not found', async () => {
      v_mockReq.params = { id: 'nonexistent' };
      v_mockReq.body = { name: 'New Name' };
      
      User.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 400 when validation fails during update', async () => {
      const v_validationError = new Error('Validation failed');
      v_mockReq.params = { id: 'user123' };
      v_mockReq.body = { email: 'invalid-email' };
      
      User.findByIdAndUpdate.mockRejectedValue(v_validationError);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });

    it('should update multiple fields at once', async () => {
      const v_updateData = {
        name: 'New Name',
        email: 'newemail@example.com'
      };
      const v_updatedUser = {
        _id: 'user123',
        ...v_updateData,
        password: 'existingpassword'
      };
      v_mockReq.params = { id: 'user123' };
      v_mockReq.body = v_updateData;
      
      User.findByIdAndUpdate.mockResolvedValue(v_updatedUser);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        v_updateData,
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedUser);
    });

    it('should handle duplicate email error during update', async () => {
      const v_duplicateError = new Error('E11000 duplicate key error');
      v_mockReq.params = { id: 'user123' };
      v_mockReq.body = { email: 'existing@example.com' };
      
      User.findByIdAndUpdate.mockRejectedValue(v_duplicateError);

      await f_updateUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should use runValidators option', async () => {
      v_mockReq.params = { id: 'user123' };
      v_mockReq.body = { name: 'Test' };
      
      User.findByIdAndUpdate.mockResolvedValue({ _id: 'user123', name: 'Test' });

      await f_updateUser(v_mockReq, v_mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { name: 'Test' },
        expect.objectContaining({ runValidators: true })
      );
    });

    it('should return the updated document with new: true option', async () => {
      v_mockReq.params = { id: 'user123' };
      v_mockReq.body = { name: 'Updated' };
      
      User.findByIdAndUpdate.mockResolvedValue({ _id: 'user123', name: 'Updated' });

      await f_updateUser(v_mockReq, v_mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { name: 'Updated' },
        expect.objectContaining({ new: true })
      );
    });
  });

  describe('f_deleteUser', () => {
    it('should delete a user successfully', async () => {
      const v_deletedUser = {
        _id: 'user123',
        name: 'Deleted User',
        email: 'deleted@example.com'
      };
      v_mockReq.params = { id: 'user123' };
      
      User.findByIdAndDelete.mockResolvedValue(v_deletedUser);

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should return 404 when user to delete is not found', async () => {
      v_mockReq.params = { id: 'nonexistent' };
      
      User.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle database error during deletion', async () => {
      const v_errorMessage = 'Database error during deletion';
      v_mockReq.params = { id: 'user123' };
      
      User.findByIdAndDelete.mockRejectedValue(new Error(v_errorMessage));

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
    });

    it('should handle invalid ObjectId during deletion', async () => {
      const v_castError = new Error('Cast to ObjectId failed');
      v_mockReq.params = { id: 'invalid-id-format' };
      
      User.findByIdAndDelete.mockRejectedValue(v_castError);

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should return success message after deletion', async () => {
      v_mockReq.params = { id: 'user789' };
      
      User.findByIdAndDelete.mockResolvedValue({ _id: 'user789' });

      await f_deleteUser(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
      expect(v_mockRes.status).not.toHaveBeenCalled();
    });
  });
});
