const MovieSession = require('../../models/MovieSession');
const Movie = require('../../models/Movie');
const Theater = require('../../models/Theater');
const {
  f_createMovieSession,
  f_getAllMovieSessions,
  f_getMovieSessionById,
  f_updateMovieSession,
  f_deleteMovieSession,
  f_getSessionsByMovie
} = require('../../controllers/movieSessionController');

jest.mock('../../models/MovieSession');
jest.mock('../../models/Movie');
jest.mock('../../models/Theater');

describe('movieSessionController', () => {
  let mockReq;
  let mockRes;
  let mockMovieSession;
  let mockMovie;
  let mockTheater;

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
    mockMovie = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Test Movie',
      year: 2024
    };
    mockTheater = {
      _id: '507f1f77bcf86cd799439012',
      theaterId: 'THT001',
      location: 'Test Location'
    };
    mockMovieSession = {
      _id: '507f1f77bcf86cd799439013',
      movie: mockMovie._id,
      theater: mockTheater._id,
      sessionTime: new Date('2025-06-15T19:00:00Z'),
      price: 12.99,
      totalSeats: 100,
      availableSeats: 100,
      bookedSeats: [],
      status: 'scheduled',
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        movie: mockMovie,
        theater: mockTheater,
        sessionTime: new Date('2025-06-15T19:00:00Z'),
        price: 12.99,
        totalSeats: 100,
        availableSeats: 100
      })
    };
    jest.clearAllMocks();
  });

  describe('f_createMovieSession', () => {
    it('should validate movie exists', async () => {
      mockReq.body = {
        movieId: mockMovie._id,
        theaterId: mockTheater._id,
        sessionTime: '2025-06-15T19:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Movie.findById.mockResolvedValue(null);

      await f_createMovieSession(mockReq, mockRes);

      expect(Movie.findById).toHaveBeenCalledWith(mockMovie._id);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should validate theater exists', async () => {
      mockReq.body = {
        movieId: mockMovie._id,
        theaterId: mockTheater._id,
        sessionTime: '2025-06-15T19:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Movie.findById.mockResolvedValue(mockMovie);
      Theater.findById.mockResolvedValue(null);

      await f_createMovieSession(mockReq, mockRes);

      expect(Theater.findById).toHaveBeenCalledWith(mockTheater._id);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Theater not found' });
    });

    it('should create session with availableSeats equal to totalSeats', async () => {
      mockReq.body = {
        movieId: mockMovie._id,
        theaterId: mockTheater._id,
        sessionTime: '2025-06-15T19:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Movie.findById.mockResolvedValue(mockMovie);
      Theater.findById.mockResolvedValue(mockTheater);
      mockMovieSession.save.mockResolvedValue(mockMovieSession);
      MovieSession.mockImplementation(() => mockMovieSession);

      await f_createMovieSession(mockReq, mockRes);

      expect(mockMovieSession.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should populate movie and theater references', async () => {
      mockReq.body = {
        movieId: mockMovie._id,
        theaterId: mockTheater._id,
        sessionTime: '2025-06-15T19:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Movie.findById.mockResolvedValue(mockMovie);
      Theater.findById.mockResolvedValue(mockTheater);
      mockMovieSession.save.mockResolvedValue(mockMovieSession);
      MovieSession.mockImplementation(() => mockMovieSession);

      await f_createMovieSession(mockReq, mockRes);

      expect(mockMovieSession.populate).toHaveBeenCalledWith([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' }
      ]);
    });

    it('should handle Date parsing for sessionTime', async () => {
      mockReq.body = {
        movieId: mockMovie._id,
        theaterId: mockTheater._id,
        sessionTime: '2025-06-15T19:00:00.000Z',
        price: 12.99,
        totalSeats: 100
      };
      Movie.findById.mockResolvedValue(mockMovie);
      Theater.findById.mockResolvedValue(mockTheater);
      MovieSession.mockImplementation((data) => {
        expect(data.sessionTime).toBeInstanceOf(Date);
        return mockMovieSession;
      });
      mockMovieSession.save.mockResolvedValue(mockMovieSession);

      await f_createMovieSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('f_getAllMovieSessions', () => {
    it('should return paginated sessions', async () => {
      const mockSessions = [mockMovieSession];
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });
      MovieSession.countDocuments.mockResolvedValue(1);

      await f_getAllMovieSessions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        sessions: mockSessions,
        currentPage: 1,
        totalPages: 1,
        totalSessions: 1
      });
    });

    it('should populate movie and theater details', async () => {
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMovieSession])
      });
      MovieSession.countDocuments.mockResolvedValue(1);

      await f_getAllMovieSessions(mockReq, mockRes);

      const findResult = MovieSession.find();
      expect(findResult.populate).toHaveBeenCalledWith([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' }
      ]);
    });

    it('should handle custom pagination', async () => {
      mockReq.query = { page: '2', limit: '5' };
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMovieSession])
      });
      MovieSession.countDocuments.mockResolvedValue(10);

      await f_getAllMovieSessions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        sessions: [mockMovieSession],
        currentPage: 2,
        totalPages: 2,
        totalSessions: 10
      });
    });
  });

  describe('f_getMovieSessionById', () => {
    it('should return session with populated references', async () => {
      mockReq.params.id = mockMovieSession._id;
      MovieSession.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMovieSession)
      });

      await f_getMovieSessionById(mockReq, mockRes);

      expect(MovieSession.findById).toHaveBeenCalledWith(mockMovieSession._id);
      expect(mockRes.json).toHaveBeenCalledWith(mockMovieSession);
    });

    it('should return 404 for non-existent session', async () => {
      mockReq.params.id = 'nonexistent';
      MovieSession.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await f_getMovieSessionById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Movie session not found' });
    });
  });

  describe('f_updateMovieSession', () => {
    it('should update session fields', async () => {
      mockReq.params.id = mockMovieSession._id;
      mockReq.body = { price: 14.99 };
      const updatedSession = { ...mockMovieSession, price: 14.99 };
      MovieSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedSession)
      });

      await f_updateMovieSession(mockReq, mockRes);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        mockMovieSession._id,
        mockReq.body,
        { new: true, runValidators: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Movie session updated successfully',
        session: updatedSession
      });
    });

    it('should run validators', async () => {
      mockReq.params.id = mockMovieSession._id;
      mockReq.body = { price: -10 };
      MovieSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Validation failed'))
      });

      await f_updateMovieSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });

    it('should return 404 for non-existent session', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { price: 14.99 };
      MovieSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await f_updateMovieSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('f_deleteMovieSession', () => {
    it('should delete session successfully', async () => {
      mockReq.params.id = mockMovieSession._id;
      MovieSession.findByIdAndDelete.mockResolvedValue(mockMovieSession);

      await f_deleteMovieSession(mockReq, mockRes);

      expect(MovieSession.findByIdAndDelete).toHaveBeenCalledWith(mockMovieSession._id);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Movie session deleted successfully'
      });
    });

    it('should return 404 for non-existent session', async () => {
      mockReq.params.id = 'nonexistent';
      MovieSession.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteMovieSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('f_getSessionsByMovie', () => {
    it('should filter by movieId', async () => {
      mockReq.params.movieId = mockMovie._id;
      Movie.findById.mockResolvedValue(mockMovie);
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMovieSession])
      });
      MovieSession.countDocuments.mockResolvedValue(1);

      await f_getSessionsByMovie(mockReq, mockRes);

      expect(Movie.findById).toHaveBeenCalledWith(mockMovie._id);
      expect(MovieSession.find).toHaveBeenCalledWith({ movie: mockMovie._id });
    });

    it('should filter by specific date with 24-hour window', async () => {
      mockReq.params.movieId = mockMovie._id;
      mockReq.query.date = '2025-06-15';
      Movie.findById.mockResolvedValue(mockMovie);
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMovieSession])
      });
      MovieSession.countDocuments.mockResolvedValue(1);

      await f_getSessionsByMovie(mockReq, mockRes);

      const expectedStart = new Date('2025-06-15');
      const expectedEnd = new Date('2025-06-15');
      expectedEnd.setDate(expectedEnd.getDate() + 1);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: mockMovie._id,
        sessionTime: {
          $gte: expectedStart,
          $lt: expectedEnd
        }
      });
    });

    it('should filter by date range', async () => {
      mockReq.params.movieId = mockMovie._id;
      mockReq.query.startDate = '2025-06-01';
      mockReq.query.endDate = '2025-06-30';
      Movie.findById.mockResolvedValue(mockMovie);
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMovieSession])
      });
      MovieSession.countDocuments.mockResolvedValue(1);

      await f_getSessionsByMovie(mockReq, mockRes);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: mockMovie._id,
        sessionTime: {
          $gte: new Date('2025-06-01'),
          $lte: new Date('2025-06-30')
        }
      });
    });

    it('should handle missing movie (404)', async () => {
      mockReq.params.movieId = 'nonexistent';
      Movie.findById.mockResolvedValue(null);

      await f_getSessionsByMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should calculate date boundaries correctly', async () => {
      mockReq.params.movieId = mockMovie._id;
      mockReq.query.date = '2025-06-15T00:00:00Z';
      Movie.findById.mockResolvedValue(mockMovie);
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMovieSession])
      });
      MovieSession.countDocuments.mockResolvedValue(1);

      await f_getSessionsByMovie(mockReq, mockRes);

      const findCall = MovieSession.find.mock.calls[0][0];
      const nextDay = new Date(findCall.sessionTime.$lt);
      const currentDay = new Date(findCall.sessionTime.$gte);
      expect(nextDay.getTime() - currentDay.getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });
});
