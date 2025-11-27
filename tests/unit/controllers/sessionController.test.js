const {
  f_getAllSessions,
  f_getSessionById,
  f_createSession,
  f_updateSession,
  f_deleteSession,
  f_getActiveUserSessions,
  f_logoutAllSessions
} = require('../../../src/controllers/sessionController');
const Session = require('../../../src/models/Session');

jest.mock('../../../src/models/Session');

describe('sessionController', () => {
  let v_mockReq;
  let v_mockRes;
  let v_consoleErrorSpy;
  let v_consoleLogSpy;

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

    v_consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    v_consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    v_consoleErrorSpy.mockRestore();
    v_consoleLogSpy.mockRestore();
  });

  describe('f_getAllSessions', () => {
    it('should return paginated sessions with default pagination', async () => {
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user1', jwt: 'token1', status: 'active' },
        { _id: 'session2', user_id: 'user2', jwt: 'token2', status: 'active' }
      ];
      
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockSessions)
        })
      });
      Session.countDocuments.mockResolvedValue(2);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(Session.find).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        currentPage: 1,
        totalPages: 1,
        totalSessions: 2
      });
    });

    it('should return paginated sessions with custom pagination parameters', async () => {
      v_mockReq.query = { page: '2', limit: '5' };
      const v_mockSessions = [
        { _id: 'session6', user_id: 'user6', jwt: 'token6', status: 'inactive' }
      ];
      
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockSessions)
        })
      });
      Session.countDocuments.mockResolvedValue(11);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        currentPage: 2,
        totalPages: 3,
        totalSessions: 11
      });
    });

    it('should handle page parameter as string and convert to number', async () => {
      v_mockReq.query = { page: '3', limit: '10' };
      const v_mockSessions = [];
      
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockSessions)
        })
      });
      Session.countDocuments.mockResolvedValue(25);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        currentPage: 3,
        totalPages: 3,
        totalSessions: 25
      });
    });

    it('should use default values when page and limit are invalid', async () => {
      v_mockReq.query = { page: 'invalid', limit: 'invalid' };
      const v_mockSessions = [];
      
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(v_mockSessions)
        })
      });
      Session.countDocuments.mockResolvedValue(0);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        currentPage: 1,
        totalPages: 0,
        totalSessions: 0
      });
    });

    it('should return empty array when no sessions exist', async () => {
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      Session.countDocuments.mockResolvedValue(0);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: [],
        currentPage: 1,
        totalPages: 0,
        totalSessions: 0
      });
    });

    it('should handle database error and return 500 status', async () => {
      const v_errorMessage = 'Database connection failed';
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error(v_errorMessage))
        })
      });

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
    });

    it('should calculate correct skip value for pagination', async () => {
      v_mockReq.query = { page: '3', limit: '5' };
      const v_mockSkip = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([])
      });
      
      Session.find.mockReturnValue({ skip: v_mockSkip });
      Session.countDocuments.mockResolvedValue(20);

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockSkip).toHaveBeenCalledWith(10);
    });

    it('should handle countDocuments error', async () => {
      const v_errorMessage = 'Count failed';
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      Session.countDocuments.mockRejectedValue(new Error(v_errorMessage));

      await f_getAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
    });
  });

  describe('f_getSessionById', () => {
    it('should return a session when found', async () => {
      const v_mockSession = {
        _id: 'session123',
        user_id: 'user123',
        jwt: 'jwt-token-123',
        expiry: new Date('2025-12-31'),
        status: 'active'
      };
      v_mockReq.params = { id: 'session123' };
      
      Session.findById.mockResolvedValue(v_mockSession);

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(Session.findById).toHaveBeenCalledWith('session123');
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockSession);
    });

    it('should return 404 when session is not found', async () => {
      v_mockReq.params = { id: 'nonexistent' };
      
      Session.findById.mockResolvedValue(null);

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(Session.findById).toHaveBeenCalledWith('nonexistent');
      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should handle database error and return 500 status', async () => {
      const v_errorMessage = 'Database error';
      v_mockReq.params = { id: 'session123' };
      
      Session.findById.mockRejectedValue(new Error(v_errorMessage));

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
    });

    it('should handle invalid ObjectId format error', async () => {
      const v_castError = new Error('Cast to ObjectId failed');
      v_castError.name = 'CastError';
      v_mockReq.params = { id: 'invalid-id' };
      
      Session.findById.mockRejectedValue(v_castError);

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Cast to ObjectId failed' });
    });

    it('should return session with all fields', async () => {
      const v_mockSession = {
        _id: 'session456',
        user_id: 'user456',
        jwt: 'jwt-token-456',
        expiry: new Date('2025-06-30'),
        status: 'inactive',
        createdAt: new Date('2025-01-01')
      };
      v_mockReq.params = { id: 'session456' };
      
      Session.findById.mockResolvedValue(v_mockSession);

      await f_getSessionById(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockSession);
      expect(v_mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('f_createSession', () => {
    it('should create a new session successfully', async () => {
      const v_sessionData = {
        user_id: 'user123',
        jwt: 'new-jwt-token',
        expiry: new Date('2025-12-31'),
        status: 'active'
      };
      const v_savedSession = {
        _id: 'newsession123',
        ...v_sessionData
      };
      v_mockReq.body = v_sessionData;
      
      Session.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedSession)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(Session).toHaveBeenCalledWith(v_sessionData);
      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(v_savedSession);
    });

    it('should return 400 when validation fails', async () => {
      const v_validationError = new Error('Validation failed: jwt is required');
      v_mockReq.body = { user_id: 'user123' };
      
      Session.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_validationError)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Validation failed: jwt is required' });
    });

    it('should return 400 when required fields are missing', async () => {
      const v_validationError = new Error('Session validation failed: user_id: Path `user_id` is required');
      v_mockReq.body = { jwt: 'token', expiry: new Date() };
      
      Session.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_validationError)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should create session with default status', async () => {
      const v_sessionData = {
        user_id: 'user123',
        jwt: 'jwt-token',
        expiry: new Date('2025-12-31')
      };
      const v_savedSession = {
        _id: 'session123',
        ...v_sessionData,
        status: 'active'
      };
      v_mockReq.body = v_sessionData;
      
      Session.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedSession)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(v_savedSession);
    });

    it('should handle empty request body', async () => {
      const v_validationError = new Error('Validation failed');
      v_mockReq.body = {};
      
      Session.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(v_validationError)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should create session with inactive status', async () => {
      const v_sessionData = {
        user_id: 'user123',
        jwt: 'jwt-token',
        expiry: new Date('2025-12-31'),
        status: 'inactive'
      };
      const v_savedSession = { _id: 'session123', ...v_sessionData };
      v_mockReq.body = v_sessionData;
      
      Session.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedSession)
      }));

      await f_createSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(v_savedSession);
    });
  });

  describe('f_updateSession', () => {
    it('should update a session successfully', async () => {
      const v_updatedSession = {
        _id: 'session123',
        user_id: 'user123',
        jwt: 'updated-jwt-token',
        expiry: new Date('2025-12-31'),
        status: 'active'
      };
      v_mockReq.params = { id: 'session123' };
      v_mockReq.body = { jwt: 'updated-jwt-token' };
      
      Session.findByIdAndUpdate.mockResolvedValue(v_updatedSession);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        { jwt: 'updated-jwt-token' },
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
    });

    it('should return 404 when session to update is not found', async () => {
      v_mockReq.params = { id: 'nonexistent' };
      v_mockReq.body = { status: 'inactive' };
      
      Session.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should return 400 when validation fails during update', async () => {
      const v_validationError = new Error('Validation failed');
      v_mockReq.params = { id: 'session123' };
      v_mockReq.body = { status: 'invalid-status' };
      
      Session.findByIdAndUpdate.mockRejectedValue(v_validationError);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });

    it('should update session status from active to inactive', async () => {
      const v_updatedSession = {
        _id: 'session123',
        user_id: 'user123',
        jwt: 'jwt-token',
        status: 'inactive'
      };
      v_mockReq.params = { id: 'session123' };
      v_mockReq.body = { status: 'inactive' };
      
      Session.findByIdAndUpdate.mockResolvedValue(v_updatedSession);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        { status: 'inactive' },
        { new: true, runValidators: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedSession);
    });

    it('should update multiple fields at once', async () => {
      const v_updateData = {
        jwt: 'new-jwt-token',
        expiry: new Date('2026-01-01'),
        status: 'inactive'
      };
      const v_updatedSession = {
        _id: 'session123',
        user_id: 'user123',
        ...v_updateData
      };
      v_mockReq.params = { id: 'session123' };
      v_mockReq.body = v_updateData;
      
      Session.findByIdAndUpdate.mockResolvedValue(v_updatedSession);

      await f_updateSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        v_updateData,
        { new: true, runValidators: true }
      );
    });

    it('should use runValidators option', async () => {
      v_mockReq.params = { id: 'session123' };
      v_mockReq.body = { status: 'active' };
      
      Session.findByIdAndUpdate.mockResolvedValue({ _id: 'session123', status: 'active' });

      await f_updateSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        { status: 'active' },
        expect.objectContaining({ runValidators: true })
      );
    });

    it('should return the updated document with new: true option', async () => {
      v_mockReq.params = { id: 'session123' };
      v_mockReq.body = { jwt: 'updated' };
      
      Session.findByIdAndUpdate.mockResolvedValue({ _id: 'session123', jwt: 'updated' });

      await f_updateSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        { jwt: 'updated' },
        expect.objectContaining({ new: true })
      );
    });
  });

  describe('f_deleteSession', () => {
    it('should delete a session successfully', async () => {
      const v_deletedSession = {
        _id: 'session123',
        user_id: 'user123',
        jwt: 'jwt-token',
        status: 'active'
      };
      v_mockReq.params = { id: 'session123' };
      
      Session.findByIdAndDelete.mockResolvedValue(v_deletedSession);

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(Session.findByIdAndDelete).toHaveBeenCalledWith('session123');
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Session deleted successfully' });
    });

    it('should return 404 when session to delete is not found', async () => {
      v_mockReq.params = { id: 'nonexistent' };
      
      Session.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should handle database error during deletion', async () => {
      const v_errorMessage = 'Database error during deletion';
      v_mockReq.params = { id: 'session123' };
      
      Session.findByIdAndDelete.mockRejectedValue(new Error(v_errorMessage));

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
    });

    it('should handle invalid ObjectId during deletion', async () => {
      const v_castError = new Error('Cast to ObjectId failed');
      v_mockReq.params = { id: 'invalid-id-format' };
      
      Session.findByIdAndDelete.mockRejectedValue(v_castError);

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should return success message after deletion', async () => {
      v_mockReq.params = { id: 'session789' };
      
      Session.findByIdAndDelete.mockResolvedValue({ _id: 'session789' });

      await f_deleteSession(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Session deleted successfully' });
      expect(v_mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('f_getActiveUserSessions', () => {
    it('should return active sessions without filters', async () => {
      const v_futureDate = new Date(Date.now() + 86400000);
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user1', status: 'active', expiry: v_futureDate },
        { _id: 'session2', user_id: 'user2', status: 'active', expiry: v_futureDate }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(Session.find).toHaveBeenCalledWith({ status: 'active' });
      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        count: 2
      });
    });

    it('should filter sessions by userId', async () => {
      const v_futureDate = new Date(Date.now() + 86400000);
      v_mockReq.query = { userId: 'user123' };
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user123', status: 'active', expiry: v_futureDate }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(Session.find).toHaveBeenCalledWith({ status: 'active', user_id: 'user123' });
      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: v_mockSessions,
        count: 1
      });
    });

    it('should filter sessions by startDate', async () => {
      const v_futureDate = new Date(Date.now() + 86400000);
      const v_startDate = '2025-01-01';
      v_mockReq.query = { startDate: v_startDate };
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user1', status: 'active', expiry: v_futureDate, createdAt: new Date('2025-01-15') }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(Session.find).toHaveBeenCalledWith({
        status: 'active',
        createdAt: { $gte: new Date(v_startDate) }
      });
    });

    it('should filter sessions by endDate', async () => {
      const v_futureDate = new Date(Date.now() + 86400000);
      const v_endDate = '2025-12-31';
      v_mockReq.query = { endDate: v_endDate };
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user1', status: 'active', expiry: v_futureDate, createdAt: new Date('2025-06-15') }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(Session.find).toHaveBeenCalledWith({
        status: 'active',
        createdAt: { $lte: new Date(v_endDate) }
      });
    });

    it('should filter sessions by date range', async () => {
      const v_futureDate = new Date(Date.now() + 86400000);
      const v_startDate = '2025-01-01';
      const v_endDate = '2025-12-31';
      v_mockReq.query = { startDate: v_startDate, endDate: v_endDate };
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user1', status: 'active', expiry: v_futureDate, createdAt: new Date('2025-06-15') }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(Session.find).toHaveBeenCalledWith({
        status: 'active',
        createdAt: { $gte: new Date(v_startDate), $lte: new Date(v_endDate) }
      });
    });

    it('should filter sessions by userId and date range', async () => {
      const v_futureDate = new Date(Date.now() + 86400000);
      v_mockReq.query = { userId: 'user123', startDate: '2025-01-01', endDate: '2025-12-31' };
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user123', status: 'active', expiry: v_futureDate }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(Session.find).toHaveBeenCalledWith({
        status: 'active',
        user_id: 'user123',
        createdAt: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') }
      });
    });

    it('should return 400 for invalid startDate format', async () => {
      v_mockReq.query = { startDate: 'invalid-date' };
      
      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Invalid start date format' });
    });

    it('should return 400 for invalid endDate format', async () => {
      v_mockReq.query = { endDate: 'invalid-date' };
      
      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Invalid end date format' });
    });

    it('should filter out expired sessions', async () => {
      const v_futureDate = new Date(Date.now() + 86400000);
      const v_pastDate = new Date(Date.now() - 86400000);
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user1', status: 'active', expiry: v_futureDate },
        { _id: 'session2', user_id: 'user2', status: 'active', expiry: v_pastDate }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: [v_mockSessions[0]],
        count: 1
      });
    });

    it('should return empty array when all sessions are expired', async () => {
      const v_pastDate = new Date(Date.now() - 86400000);
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user1', status: 'active', expiry: v_pastDate },
        { _id: 'session2', user_id: 'user2', status: 'active', expiry: v_pastDate }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: [],
        count: 0
      });
    });

    it('should handle database error and return 500 status', async () => {
      const v_errorMessage = 'Database error';
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error(v_errorMessage))
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
      expect(v_consoleErrorSpy).toHaveBeenCalled();
    });

    it('should sort sessions by createdAt in descending order', async () => {
      const v_futureDate = new Date(Date.now() + 86400000);
      const v_mockSort = jest.fn().mockResolvedValue([
        { _id: 'session1', status: 'active', expiry: v_futureDate }
      ]);
      
      Session.find.mockReturnValue({ sort: v_mockSort });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(v_mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should return empty array when no active sessions exist', async () => {
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: [],
        count: 0
      });
    });

    it('should handle sessions with exact current time expiry as expired', async () => {
      const v_currentTime = new Date();
      const v_mockSessions = [
        { _id: 'session1', user_id: 'user1', status: 'active', expiry: v_currentTime }
      ];
      
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(v_mockSessions)
      });

      await f_getActiveUserSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        sessions: [],
        count: 0
      });
    });
  });

  describe('f_logoutAllSessions', () => {
    it('should logout all sessions for a user successfully', async () => {
      v_mockReq.body = { userId: 'user123' };
      
      Session.updateMany.mockResolvedValue({ modifiedCount: 3 });

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(Session.updateMany).toHaveBeenCalledWith(
        { user_id: 'user123', status: 'active' },
        { status: 'inactive' }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'All sessions terminated successfully',
        sessionsTerminated: 3
      });
    });

    it('should return 400 when userId is not provided', async () => {
      v_mockReq.body = {};

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    it('should return 0 sessions terminated when user has no active sessions', async () => {
      v_mockReq.body = { userId: 'userWithNoSessions' };
      
      Session.updateMany.mockResolvedValue({ modifiedCount: 0 });

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'All sessions terminated successfully',
        sessionsTerminated: 0
      });
    });

    it('should handle database error and return 500 status', async () => {
      const v_errorMessage = 'Database error';
      v_mockReq.body = { userId: 'user123' };
      
      Session.updateMany.mockRejectedValue(new Error(v_errorMessage));

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: v_errorMessage });
      expect(v_consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log security audit message', async () => {
      v_mockReq.body = { userId: 'user123' };
      
      Session.updateMany.mockResolvedValue({ modifiedCount: 2 });

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(v_consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('User user123 logged out all sessions at')
      );
    });

    it('should only update active sessions', async () => {
      v_mockReq.body = { userId: 'user456' };
      
      Session.updateMany.mockResolvedValue({ modifiedCount: 5 });

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(Session.updateMany).toHaveBeenCalledWith(
        { user_id: 'user456', status: 'active' },
        { status: 'inactive' }
      );
    });

    it('should handle null userId', async () => {
      v_mockReq.body = { userId: null };

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    it('should handle undefined userId', async () => {
      v_mockReq.body = { userId: undefined };

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    it('should handle empty string userId', async () => {
      v_mockReq.body = { userId: '' };

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    it('should terminate multiple sessions for a user with many active sessions', async () => {
      v_mockReq.body = { userId: 'powerUser' };
      
      Session.updateMany.mockResolvedValue({ modifiedCount: 10 });

      await f_logoutAllSessions(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'All sessions terminated successfully',
        sessionsTerminated: 10
      });
    });
  });
});
