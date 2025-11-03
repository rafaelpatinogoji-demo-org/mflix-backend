const TheaterSession = require('../../models/TheaterSession');
const Theater = require('../../models/Theater');
const Movie = require('../../models/Movie');
const {
  f_getTheaterSessions,
  f_createTheaterSession,
  f_updateTheaterSession,
  f_deleteTheaterSession
} = require('../../controllers/theaterSessionController');

jest.mock('../../models/TheaterSession');
jest.mock('../../models/Theater');
jest.mock('../../models/Movie');

describe('theaterSessionController', () => {
  let mockReq;
  let mockRes;
  let mockTheaterSession;
  let mockTheater;
  let mockMovie;

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
    mockTheater = {
      _id: '507f1f77bcf86cd799439011',
      theaterId: 'THT001',
      location: 'Test Location'
    };
    mockMovie = {
      _id: '507f1f77bcf86cd799439012',
      title: 'Test Movie',
      year: 2024
    };
    mockTheaterSession = {
      _id: '507f1f77bcf86cd799439013',
      theater: mockTheater._id,
      movie: mockMovie._id,
      showtime: new Date('2025-06-15T19:00:00Z'),
      endTime: new Date('2025-06-15T21:00:00Z'),
      price: 12.99,
      availableSeats: 100,
      totalSeats: 100,
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        theater: mockTheater,
        movie: mockMovie,
        showtime: new Date('2025-06-15T19:00:00Z'),
        endTime: new Date('2025-06-15T21:00:00Z'),
        price: 12.99,
        availableSeats: 100,
        totalSeats: 100
      })
    };
    jest.clearAllMocks();
  });

  describe('f_getTheaterSessions', () => {
    it('should require theaterId parameter', async () => {
      mockReq.query = {};

      await f_getTheaterSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater ID is required'
      });
    });

    it('should filter by theaterId', async () => {
      mockReq.query.theaterId = mockTheater._id;
      Theater.findById.mockResolvedValue(mockTheater);
      TheaterSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockTheaterSession])
      });

      await f_getTheaterSessions(mockReq, mockRes);

      expect(Theater.findById).toHaveBeenCalledWith(mockTheater._id);
      expect(TheaterSession.find).toHaveBeenCalledWith({
        theater: mockTheater._id
      });
    });

    it('should filter by date with start/end of day boundaries', async () => {
      mockReq.query.theaterId = mockTheater._id;
      mockReq.query.date = '2025-06-15';
      Theater.findById.mockResolvedValue(mockTheater);
      TheaterSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockTheaterSession])
      });

      await f_getTheaterSessions(mockReq, mockRes);

      const expectedStartOfDay = new Date('2025-06-15');
      expectedStartOfDay.setHours(0, 0, 0, 0);
      const expectedEndOfDay = new Date('2025-06-15');
      expectedEndOfDay.setHours(23, 59, 59, 999);

      expect(TheaterSession.find).toHaveBeenCalledWith({
        theater: mockTheater._id,
        showtime: {
          $gte: expectedStartOfDay,
          $lte: expectedEndOfDay
        }
      });
    });

    it('should validate date format', async () => {
      mockReq.query.theaterId = mockTheater._id;
      mockReq.query.date = 'invalid-date';

      await f_getTheaterSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid date format'
      });
    });

    it('should filter by movieId when provided', async () => {
      mockReq.query.theaterId = mockTheater._id;
      mockReq.query.movieId = mockMovie._id;
      Theater.findById.mockResolvedValue(mockTheater);
      TheaterSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockTheaterSession])
      });

      await f_getTheaterSessions(mockReq, mockRes);

      expect(TheaterSession.find).toHaveBeenCalledWith({
        theater: mockTheater._id,
        movie: mockMovie._id
      });
    });

    it('should sort by showtime ascending', async () => {
      mockReq.query.theaterId = mockTheater._id;
      Theater.findById.mockResolvedValue(mockTheater);
      TheaterSession.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockTheaterSession])
      });

      await f_getTheaterSessions(mockReq, mockRes);

      const findResult = TheaterSession.find();
      expect(findResult.sort).toHaveBeenCalledWith({ showtime: 1 });
    });

    it('should return 404 if theater not found', async () => {
      mockReq.query.theaterId = 'nonexistent';
      Theater.findById.mockResolvedValue(null);

      await f_getTheaterSessions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater not found'
      });
    });
  });

  describe('f_createTheaterSession', () => {
    it('should validate theater exists', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: '2025-06-15T19:00:00Z',
        endTime: '2025-06-15T21:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue(null);

      await f_createTheaterSession(mockReq, mockRes);

      expect(Theater.findById).toHaveBeenCalledWith(mockTheater._id);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater not found'
      });
    });

    it('should validate movie exists', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: '2025-06-15T19:00:00Z',
        endTime: '2025-06-15T21:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue(mockTheater);
      Movie.findById.mockResolvedValue(null);

      await f_createTheaterSession(mockReq, mockRes);

      expect(Movie.findById).toHaveBeenCalledWith(mockMovie._id);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Movie not found'
      });
    });

    it('should validate date format for showtime', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: 'invalid-date',
        endTime: '2025-06-15T21:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue(mockTheater);
      Movie.findById.mockResolvedValue(mockMovie);

      await f_createTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid date format for showtime or endTime'
      });
    });

    it('should validate date format for endTime', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: '2025-06-15T19:00:00Z',
        endTime: 'invalid-date',
        price: 12.99,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue(mockTheater);
      Movie.findById.mockResolvedValue(mockMovie);

      await f_createTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid date format for showtime or endTime'
      });
    });

    it('should validate showtime < endTime', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: '2025-06-15T21:00:00Z',
        endTime: '2025-06-15T19:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue(mockTheater);
      Movie.findById.mockResolvedValue(mockMovie);

      await f_createTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Showtime must be before end time'
      });
    });

    it('should validate price > 0', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: '2025-06-15T19:00:00Z',
        endTime: '2025-06-15T21:00:00Z',
        price: -5,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue(mockTheater);
      Movie.findById.mockResolvedValue(mockMovie);

      await f_createTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Price must be a positive number'
      });
    });

    it('should validate totalSeats > 0', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: '2025-06-15T19:00:00Z',
        endTime: '2025-06-15T21:00:00Z',
        price: 12.99,
        totalSeats: 0
      };
      Theater.findById.mockResolvedValue(mockTheater);
      Movie.findById.mockResolvedValue(mockMovie);

      await f_createTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Total seats must be a positive number'
      });
    });

    it('should set availableSeats equal to totalSeats', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: '2025-06-15T19:00:00Z',
        endTime: '2025-06-15T21:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue(mockTheater);
      Movie.findById.mockResolvedValue(mockMovie);
      mockTheaterSession.save.mockResolvedValue(mockTheaterSession);
      TheaterSession.mockImplementation((data) => {
        expect(data.availableSeats).toBe(data.totalSeats);
        return mockTheaterSession;
      });

      await f_createTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should populate references in response', async () => {
      mockReq.body = {
        theater: mockTheater._id,
        movie: mockMovie._id,
        showtime: '2025-06-15T19:00:00Z',
        endTime: '2025-06-15T21:00:00Z',
        price: 12.99,
        totalSeats: 100
      };
      Theater.findById.mockResolvedValue(mockTheater);
      Movie.findById.mockResolvedValue(mockMovie);
      mockTheaterSession.save.mockResolvedValue(mockTheaterSession);
      TheaterSession.mockImplementation(() => mockTheaterSession);

      await f_createTheaterSession(mockReq, mockRes);

      expect(mockTheaterSession.populate).toHaveBeenCalledWith([
        { path: 'theater', select: 'theaterId location' },
        { path: 'movie', select: 'title year genres runtime' }
      ]);
    });
  });

  describe('f_updateTheaterSession', () => {
    it('should update showtime with valid date', async () => {
      mockReq.params.id = mockTheaterSession._id;
      mockReq.body = { showtime: '2025-06-16T20:00:00Z' };
      const updatedSession = {
        ...mockTheaterSession,
        showtime: new Date('2025-06-16T20:00:00Z')
      };
      TheaterSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedSession)
      });

      await f_updateTheaterSession(mockReq, mockRes);

      expect(TheaterSession.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTheaterSession._id,
        expect.objectContaining({
          showtime: expect.any(Date)
        }),
        { new: true, runValidators: true }
      );
    });

    it('should update endTime with valid date', async () => {
      mockReq.params.id = mockTheaterSession._id;
      mockReq.body = { endTime: '2025-06-15T22:00:00Z' };
      const updatedSession = {
        ...mockTheaterSession,
        endTime: new Date('2025-06-15T22:00:00Z')
      };
      TheaterSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedSession)
      });

      await f_updateTheaterSession(mockReq, mockRes);

      expect(TheaterSession.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTheaterSession._id,
        expect.objectContaining({
          endTime: expect.any(Date)
        }),
        { new: true, runValidators: true }
      );
    });

    it('should validate date formats', async () => {
      mockReq.params.id = mockTheaterSession._id;
      mockReq.body = { showtime: 'invalid-date' };

      await f_updateTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid date format for showtime'
      });
    });

    it('should update price and totalSeats', async () => {
      mockReq.params.id = mockTheaterSession._id;
      mockReq.body = { price: 15.99, totalSeats: 120 };
      const updatedSession = {
        ...mockTheaterSession,
        price: 15.99,
        totalSeats: 120
      };
      TheaterSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedSession)
      });

      await f_updateTheaterSession(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedSession);
    });

    it('should return 404 for non-existent session', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { price: 15.99 };
      TheaterSession.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await f_updateTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater session not found'
      });
    });
  });

  describe('f_deleteTheaterSession', () => {
    it('should delete session successfully', async () => {
      mockReq.params.id = mockTheaterSession._id;
      TheaterSession.findByIdAndDelete.mockResolvedValue(mockTheaterSession);

      await f_deleteTheaterSession(mockReq, mockRes);

      expect(TheaterSession.findByIdAndDelete).toHaveBeenCalledWith(
        mockTheaterSession._id
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater session deleted successfully'
      });
    });

    it('should return 404 for non-existent session', async () => {
      mockReq.params.id = 'nonexistent';
      TheaterSession.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Theater session not found'
      });
    });

    it('should handle database errors', async () => {
      mockReq.params.id = mockTheaterSession._id;
      TheaterSession.findByIdAndDelete.mockRejectedValue(
        new Error('Database error')
      );

      await f_deleteTheaterSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
