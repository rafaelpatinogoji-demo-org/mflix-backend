const Session = require('../../models/Session');
const {
  f_getAllSessions,
  f_getSessionById,
  f_createSession,
  f_updateSession,
  f_deleteSession,
  f_getActiveUserSessions,
  f_logoutAllSessions
} = require('../../controllers/sessionController');

jest.mock('../../models/Session');

describe('sessionController', () => {
  let mockReq;
  let mockRes;
  let mockSession;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockSession = {
      _id: '507f1f77bcf86cd799439011',
      user_id: 'user123',
      jwt: 'token123',
      status: 'active',
      expiry: new Date('2025-12-31T23:59:59Z'),
      createdAt: new Date('2025-01-01T00:00:00Z'),
      save: jest.fn()
    };
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('f_getAllSessions', () => {
    it('should return paginated sessions with default pagination', async () => {
      const mockSessions = [mockSession];
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });
      Session.countDocuments.mockResolvedValue(1);

      await f_getAllSessions(mockReq, mockRes);

      expect(Session.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        sessions: mockSessions,
        currentPage: 1,
        totalPages: 1,
        totalSessions: 1
      });
    });

    it('should handle custom page and limit parameters', async () => {
      mockReq.query = { page: '2', limit: '5' };
      const mockSessions = [mockSession];
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });
      Session.countDocuments.mockResolvedValue(10);

      await f_getAllSessions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        sessions: mockSessions,
        currentPage: 2,
        totalPages: 2,
        totalSessions: 10
      });
    });

    it('should calculate totalPages correctly', async () => {
      mockReq.query = { page: '1', limit: '10' };
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockSession])
      });
      Session.countDocuments.mockResolvedValue(25);

      await f_getAllSessions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        sessions: [mockSession],
        currentPage: 1,
        totalPages: 3,
        totalSessions: 25
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      Session.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(error)
      });

      await f_getAllSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getSessionById', () => {
    it('should return session when found', async () => {
      mockReq.params.id = mockSession._id;
      Session.findById.mockResolvedValue(mockSession);

      await f_getSessionById(mockReq, mockRes);

      expect(Session.findById).toHaveBeenCalledWith(mockSession._id);
      expect(mockRes.json).toHaveBeenCalledWith(mockSession);
    });

    it('should return 404 when session not found', async () => {
      mockReq.params.id = 'nonexistent';
      Session.findById.mockResolvedValue(null);

      await f_getSessionById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should handle invalid ObjectId format', async () => {
      mockReq.params.id = 'invalid-id';
      Session.findById.mockRejectedValue(new Error('Invalid ObjectId'));

      await f_getSessionById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid ObjectId' });
    });
  });

  describe('f_createSession', () => {
    it('should create session with valid data', async () => {
      mockReq.body = { user_id: 'user123', jwt: 'token123' };
      mockSession.save.mockResolvedValue(mockSession);
      Session.mockImplementation(() => mockSession);

      await f_createSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockSession);
    });

    it('should handle validation errors', async () => {
      mockReq.body = { user_id: 'user123' };
      const error = new Error('jwt is required');
      Session.mockImplementation(() => {
        return {
          save: jest.fn().mockRejectedValue(error)
        };
      });

      await f_createSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'jwt is required' });
    });

    it('should handle duplicate entries', async () => {
      mockReq.body = { user_id: 'user123', jwt: 'duplicate-token' };
      const error = new Error('E11000 duplicate key error');
      Session.mockImplementation(() => {
        return {
          save: jest.fn().mockRejectedValue(error)
        };
      });

      await f_createSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('f_updateSession', () => {
    it('should update session with valid data', async () => {
      mockReq.params.id = mockSession._id;
      mockReq.body = { jwt: 'new-token' };
      const updatedSession = { ...mockSession, jwt: 'new-token' };
      Session.findByIdAndUpdate.mockResolvedValue(updatedSession);

      await f_updateSession(mockReq, mockRes);

      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSession._id,
        mockReq.body,
        { new: true, runValidators: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedSession);
    });

    it('should return 404 for non-existent session', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { jwt: 'new-token' };
      Session.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should run validators on update', async () => {
      mockReq.params.id = mockSession._id;
      mockReq.body = { jwt: '' };
      Session.findByIdAndUpdate.mockRejectedValue(new Error('Validation failed'));

      await f_updateSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('f_deleteSession', () => {
    it('should delete session successfully', async () => {
      mockReq.params.id = mockSession._id;
      Session.findByIdAndDelete.mockResolvedValue(mockSession);

      await f_deleteSession(mockReq, mockRes);

      expect(Session.findByIdAndDelete).toHaveBeenCalledWith(mockSession._id);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Session deleted successfully' });
    });

    it('should return 404 for non-existent session', async () => {
      mockReq.params.id = 'nonexistent';
      Session.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should handle database errors', async () => {
      mockReq.params.id = mockSession._id;
      Session.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      await f_deleteSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('f_getActiveUserSessions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-06-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should filter sessions by status=active', async () => {
      const activeSessions = [
        { ...mockSession, expiry: new Date('2025-12-31T23:59:59Z') }
      ];
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(activeSessions)
      });

      await f_getActiveUserSessions(mockReq, mockRes);

      expect(Session.find).toHaveBeenCalledWith({ status: 'active' });
      expect(mockRes.json).toHaveBeenCalledWith({
        sessions: activeSessions,
        count: 1
      });
    });

    it('should filter by userId when provided', async () => {
      mockReq.query.userId = 'user123';
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockSession])
      });

      await f_getActiveUserSessions(mockReq, mockRes);

      expect(Session.find).toHaveBeenCalledWith({
        status: 'active',
        user_id: 'user123'
      });
    });

    it('should filter by date range', async () => {
      mockReq.query.startDate = '2025-01-01';
      mockReq.query.endDate = '2025-12-31';
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockSession])
      });

      await f_getActiveUserSessions(mockReq, mockRes);

      expect(Session.find).toHaveBeenCalledWith({
        status: 'active',
        createdAt: {
          $gte: new Date('2025-01-01'),
          $lte: new Date('2025-12-31')
        }
      });
    });

    it('should validate date format and return 400 for invalid startDate', async () => {
      mockReq.query.startDate = 'invalid-date';

      await f_getActiveUserSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid start date format'
      });
    });

    it('should validate date format and return 400 for invalid endDate', async () => {
      mockReq.query.endDate = 'invalid-date';

      await f_getActiveUserSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid end date format'
      });
    });

    it('should filter out expired sessions', async () => {
      const expiredSession = {
        ...mockSession,
        expiry: new Date('2025-01-01T00:00:00Z')
      };
      const activeSession = {
        ...mockSession,
        _id: 'active-session',
        expiry: new Date('2025-12-31T23:59:59Z')
      };
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([expiredSession, activeSession])
      });

      await f_getActiveUserSessions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        sessions: [activeSession],
        count: 1
      });
    });

    it('should handle missing expiry field gracefully', async () => {
      const sessionWithoutExpiry = { ...mockSession };
      delete sessionWithoutExpiry.expiry;
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([sessionWithoutExpiry])
      });

      await f_getActiveUserSessions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        sessions: [],
        count: 0
      });
    });

    it('should sort by createdAt descending', async () => {
      Session.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockSession])
      });

      await f_getActiveUserSessions(mockReq, mockRes);

      const findResult = Session.find();
      expect(findResult.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('f_logoutAllSessions', () => {
    it('should require userId parameter', async () => {
      mockReq.body = {};

      await f_logoutAllSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User ID is required'
      });
    });

    it('should update all active sessions to inactive', async () => {
      mockReq.body.userId = 'user123';
      Session.updateMany.mockResolvedValue({ modifiedCount: 3 });

      await f_logoutAllSessions(mockReq, mockRes);

      expect(Session.updateMany).toHaveBeenCalledWith(
        { user_id: 'user123', status: 'active' },
        { status: 'inactive' }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'All sessions terminated successfully',
        sessionsTerminated: 3
      });
    });

    it('should return count of sessions terminated', async () => {
      mockReq.body.userId = 'user123';
      Session.updateMany.mockResolvedValue({ modifiedCount: 5 });

      await f_logoutAllSessions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'All sessions terminated successfully',
        sessionsTerminated: 5
      });
    });

    it('should log security audit message', async () => {
      mockReq.body.userId = 'user123';
      Session.updateMany.mockResolvedValue({ modifiedCount: 2 });
      const consoleSpy = jest.spyOn(console, 'log');

      await f_logoutAllSessions(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('User user123 logged out all sessions');
    });

    it('should handle database errors', async () => {
      mockReq.body.userId = 'user123';
      Session.updateMany.mockRejectedValue(new Error('Database error'));

      await f_logoutAllSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });
});
