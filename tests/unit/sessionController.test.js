const Session = require('../../src/models/Session');
const {
  f_getAllSessions,
  f_getSessionById,
  f_createSession,
  f_updateSession,
  f_deleteSession
} = require('../../src/controllers/sessionController');

jest.mock('../../src/models/Session');

describe('Session Controller', () => {
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

  describe('f_getAllSessions', () => {
    it('should return paginated sessions with default pagination', async () => {
      const v_mockSessions = [
        { _id: '1', user_id: 'user1', jwt: 'token1' },
        { _id: '2', user_id: 'user2', jwt: 'token2' }
      ];

      v_mockReq = { query: {} };

      Session.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockSessions)
      });
      Session.countDocuments = jest.fn().mockResolvedValue(20);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(Session.find).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        currentPage: 1,
        totalPages: 2,
        totalSessions: 20
      });
    });

    it('should handle custom page and limit query parameters', async () => {
      const v_mockSessions = [
        { _id: '3', user_id: 'user3', jwt: 'token3' }
      ];

      v_mockReq = { query: { page: '3', limit: '5' } };

      Session.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockSessions)
      });
      Session.countDocuments = jest.fn().mockResolvedValue(25);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        currentPage: 3,
        totalPages: 5,
        totalSessions: 25
      });
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const v_mockSessions = [];

      v_mockReq = { query: { page: 'invalid', limit: '-10' } };

      Session.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockSessions)
      });
      Session.countDocuments = jest.fn().mockResolvedValue(0);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        currentPage: 1,
        totalPages: -0,
        totalSessions: 0
      });
    });

    it('should handle database errors with 500 status', async () => {
      v_mockReq = { query: {} };

      const v_mockError = new Error('Database connection failed');
      Session.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(v_mockError)
      });

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle zero results correctly', async () => {
      v_mockReq = { query: { page: '50', limit: '10' } };

      Session.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      Session.countDocuments = jest.fn().mockResolvedValue(10);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: [],
        currentPage: 50,
        totalPages: 1,
        totalSessions: 10
      });
    });

    it('should return correct pagination metadata', async () => {
      const v_mockSessions = [
        { _id: '1', user_id: 'user1', jwt: 'token1' }
      ];

      v_mockReq = { query: { page: '1', limit: '20' } };

      Session.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockSessions)
      });
      Session.countDocuments = jest.fn().mockResolvedValue(100);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        currentPage: 1,
        totalPages: 5,
        totalSessions: 100
      });
    });
  });

  describe('f_getSessionById', () => {
    it('should successfully return session by valid ObjectId', async () => {
      const v_mockSession = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      };

      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      Session.findById = jest.fn().mockResolvedValue(v_mockSession);

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(Session.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockSession);
    });

    it('should return 404 when session not found', async () => {
      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      Session.findById = jest.fn().mockResolvedValue(null);

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(404);
      expect(v_mockJson).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should handle invalid ObjectId format with 500 status', async () => {
      v_mockReq = { params: { id: 'invalid-id' } };
      const v_mockError = new Error('Cast to ObjectId failed');
      Session.findById = jest.fn().mockRejectedValue(v_mockError);

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle database errors', async () => {
      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      const v_mockError = new Error('Database error');
      Session.findById = jest.fn().mockRejectedValue(v_mockError);

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });
  });

  describe('f_createSession', () => {
    it('should successfully create session with valid data', async () => {
      const v_sessionData = {
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      };

      const v_savedSession = { _id: '123', ...v_sessionData };

      v_mockReq = { body: v_sessionData };
      Session.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedSession)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(201);
      expect(v_mockJson).toHaveBeenCalledWith(v_savedSession);
    });

    it('should return 201 status on successful creation', async () => {
      const v_sessionData = {
        user_id: 'user456',
        jwt: 'token456'
      };

      const v_savedSession = { _id: '456', ...v_sessionData };

      v_mockReq = { body: v_sessionData };
      Session.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedSession)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(201);
    });

    it('should return 400 for missing required user_id field', async () => {
      const v_sessionData = {
        jwt: 'token123'
      };

      v_mockReq = { body: v_sessionData };
      const v_mockError = new Error('Session validation failed: user_id: Path `user_id` is required.');
      Session.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_mockError)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should return 400 for missing required jwt field', async () => {
      const v_sessionData = {
        user_id: 'user123'
      };

      v_mockReq = { body: v_sessionData };
      const v_mockError = new Error('Session validation failed: jwt: Path `jwt` is required.');
      Session.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_mockError)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should validate session data through Mongoose schema', async () => {
      const v_sessionData = {
        user_id: 'user123',
        jwt: 'valid-token'
      };

      const v_savedSession = { _id: '789', ...v_sessionData };

      v_mockReq = { body: v_sessionData };
      Session.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedSession)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(201);
      expect(v_mockJson).toHaveBeenCalledWith(v_savedSession);
    });

    it('should handle empty request body', async () => {
      v_mockReq = { body: {} };
      const v_mockError = new Error('Session validation failed');
      Session.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_mockError)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });
  });

  describe('f_updateSession', () => {
    it('should successfully update session with valid data', async () => {
      const v_updateData = {
        jwt: 'new-token-value'
      };

      const v_updatedSession = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 'user123',
        ...v_updateData
      };

      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: v_updateData
      };

      Session.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedSession);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        v_updateData,
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
    });

    it('should return updated session with runValidators enabled', async () => {
      const v_updateData = { jwt: 'updated-jwt-token' };
      const v_updatedSession = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 'user123',
        jwt: 'updated-jwt-token'
      };

      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: v_updateData
      };

      Session.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedSession);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        v_updateData,
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
    });

    it('should return 404 when session not found', async () => {
      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { jwt: 'new-token' }
      };

      Session.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(404);
      expect(v_mockJson).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should return 400 for validation errors', async () => {
      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { user_id: null }
      };

      const v_mockError = new Error('Validation failed');
      Session.findByIdAndUpdate = jest.fn().mockRejectedValue(v_mockError);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle invalid ObjectId format', async () => {
      v_mockReq = {
        params: { id: 'invalid-id' },
        body: { jwt: 'new-token' }
      };

      const v_mockError = new Error('Cast to ObjectId failed');
      Session.findByIdAndUpdate = jest.fn().mockRejectedValue(v_mockError);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(400);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle partial updates', async () => {
      const v_partialUpdate = { jwt: 'only-jwt-updated' };
      const v_updatedSession = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 'original-user-id',
        jwt: 'only-jwt-updated'
      };

      v_mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: v_partialUpdate
      };

      Session.findByIdAndUpdate = jest.fn().mockResolvedValue(v_updatedSession);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
    });
  });

  describe('f_deleteSession', () => {
    it('should successfully delete session by ID', async () => {
      const v_deletedSession = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 'user123',
        jwt: 'token123'
      };

      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      Session.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedSession);

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Session deleted successfully' });
    });

    it('should return success message after deletion', async () => {
      const v_deletedSession = { _id: '123', user_id: 'user1' };

      v_mockReq = { params: { id: '123' } };
      Session.findByIdAndDelete = jest.fn().mockResolvedValue(v_deletedSession);

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Session deleted successfully' });
    });

    it('should return 404 when session not found', async () => {
      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      Session.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(404);
      expect(v_mockJson).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should handle invalid ObjectId format with 500 status', async () => {
      v_mockReq = { params: { id: 'invalid-id' } };
      const v_mockError = new Error('Cast to ObjectId failed');
      Session.findByIdAndDelete = jest.fn().mockRejectedValue(v_mockError);

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });

    it('should handle database errors', async () => {
      v_mockReq = { params: { id: '507f1f77bcf86cd799439011' } };
      const v_mockError = new Error('Database connection lost');
      Session.findByIdAndDelete = jest.fn().mockRejectedValue(v_mockError);

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(v_mockStatus).toHaveBeenCalledWith(500);
      expect(v_mockJson).toHaveBeenCalledWith({ message: v_mockError.message });
    });
  });
});
