const mongoose = require('mongoose');
const {
  f_createBooking,
  f_getUserBookings,
  f_getMovieAvailability,
  f_cancelBooking,
  f_getBookingStats
} = require('../../../src/controllers/bookingController');
const Booking = require('../../../src/models/Booking');
const Movie = require('../../../src/models/Movie');
const Theater = require('../../../src/models/Theater');
const MovieSession = require('../../../src/models/MovieSession');
const User = require('../../../src/models/User');

jest.mock('../../../src/models/Booking');
jest.mock('../../../src/models/Movie');
jest.mock('../../../src/models/Theater');
jest.mock('../../../src/models/MovieSession');
jest.mock('../../../src/models/User');

describe('Booking Controller - f_createBooking', () => {
  let mockReq;
  let mockRes;
  let mockSession;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {
        movieId: new mongoose.Types.ObjectId(),
        theaterId: new mongoose.Types.ObjectId(),
        sessionId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        seats: ['A1', 'A2'],
        totalPrice: 25.00
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful booking creation', () => {
    it('should create a booking successfully with valid data', async () => {
      const mockMovie = { _id: mockReq.body.movieId, title: 'Test Movie', year: 2024 };
      const mockTheater = { _id: mockReq.body.theaterId, theaterId: 1, location: { city: 'Test City' } };
      const mockMovieSession = {
        _id: mockReq.body.sessionId,
        availableSeats: 10,
        bookedSeats: [],
        totalSeats: 100
      };
      const mockUser = { _id: mockReq.body.userId, name: 'Test User', email: 'test@example.com' };

      Movie.findById.mockResolvedValue(mockMovie);
      Theater.findById.mockResolvedValue(mockTheater);
      MovieSession.findById.mockResolvedValue(mockMovieSession);
      User.findById.mockResolvedValue(mockUser);

      const mockSavedBooking = {
        _id: new mongoose.Types.ObjectId(),
        ...mockReq.body,
        populate: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          ...mockReq.body,
          movie: mockMovie,
          theater: mockTheater,
          session: mockMovieSession,
          user: mockUser
        })
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedBooking)
      }));

      MovieSession.findByIdAndUpdate.mockResolvedValue(mockMovieSession);

      await f_createBooking(mockReq, mockRes);

      expect(Movie.findById).toHaveBeenCalledWith(mockReq.body.movieId);
      expect(Theater.findById).toHaveBeenCalledWith(mockReq.body.theaterId);
      expect(MovieSession.findById).toHaveBeenCalledWith(mockReq.body.sessionId);
      expect(User.findById).toHaveBeenCalledWith(mockReq.body.userId);
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Booking created successfully'
        })
      );
    });
  });

  describe('Reference validation - 404 scenarios', () => {
    it('should return 404 when movie is not found', async () => {
      Movie.findById.mockResolvedValue(null);

      await f_createBooking(mockReq, mockRes);

      expect(Movie.findById).toHaveBeenCalledWith(mockReq.body.movieId);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Movie not found' });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should return 404 when theater is not found', async () => {
      Movie.findById.mockResolvedValue({ _id: mockReq.body.movieId });
      Theater.findById.mockResolvedValue(null);

      await f_createBooking(mockReq, mockRes);

      expect(Theater.findById).toHaveBeenCalledWith(mockReq.body.theaterId);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Theater not found' });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should return 404 when session is not found', async () => {
      Movie.findById.mockResolvedValue({ _id: mockReq.body.movieId });
      Theater.findById.mockResolvedValue({ _id: mockReq.body.theaterId });
      MovieSession.findById.mockResolvedValue(null);

      await f_createBooking(mockReq, mockRes);

      expect(MovieSession.findById).toHaveBeenCalledWith(mockReq.body.sessionId);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Session not found' });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should return 404 when user is not found', async () => {
      Movie.findById.mockResolvedValue({ _id: mockReq.body.movieId });
      Theater.findById.mockResolvedValue({ _id: mockReq.body.theaterId });
      MovieSession.findById.mockResolvedValue({ _id: mockReq.body.sessionId, availableSeats: 10, bookedSeats: [] });
      User.findById.mockResolvedValue(null);

      await f_createBooking(mockReq, mockRes);

      expect(User.findById).toHaveBeenCalledWith(mockReq.body.userId);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });
  });

  describe('Seat availability validation', () => {
    beforeEach(() => {
      Movie.findById.mockResolvedValue({ _id: mockReq.body.movieId });
      Theater.findById.mockResolvedValue({ _id: mockReq.body.theaterId });
      User.findById.mockResolvedValue({ _id: mockReq.body.userId });
    });

    it('should return 400 when insufficient seats are available', async () => {
      const mockSession = {
        _id: mockReq.body.sessionId,
        availableSeats: 1,
        bookedSeats: []
      };
      MovieSession.findById.mockResolvedValue(mockSession);

      await f_createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not enough available seats for this session' });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should return 400 when selected seats are already booked', async () => {
      const mockSession = {
        _id: mockReq.body.sessionId,
        availableSeats: 10,
        bookedSeats: ['A1', 'B1']
      };
      MovieSession.findById.mockResolvedValue(mockSession);

      await f_createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Seats A1 are already booked' });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should return 400 when multiple selected seats are already booked', async () => {
      const mockSession = {
        _id: mockReq.body.sessionId,
        availableSeats: 10,
        bookedSeats: ['A1', 'A2', 'B1']
      };
      MovieSession.findById.mockResolvedValue(mockSession);

      await f_createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Seats A1, A2 are already booked' });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should proceed when seats are available and not booked', async () => {
      const mockMovieSession = {
        _id: mockReq.body.sessionId,
        availableSeats: 10,
        bookedSeats: ['B1', 'B2']
      };
      MovieSession.findById.mockResolvedValue(mockMovieSession);

      const mockSavedBooking = {
        _id: new mongoose.Types.ObjectId(),
        ...mockReq.body,
        populate: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          ...mockReq.body
        })
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedBooking)
      }));

      MovieSession.findByIdAndUpdate.mockResolvedValue(mockMovieSession);

      await f_createBooking(mockReq, mockRes);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Transaction handling', () => {
    beforeEach(() => {
      Movie.findById.mockResolvedValue({ _id: mockReq.body.movieId });
      Theater.findById.mockResolvedValue({ _id: mockReq.body.theaterId });
      MovieSession.findById.mockResolvedValue({
        _id: mockReq.body.sessionId,
        availableSeats: 10,
        bookedSeats: []
      });
      User.findById.mockResolvedValue({ _id: mockReq.body.userId });
    });

    it('should commit transaction on successful booking', async () => {
      const mockSavedBooking = {
        _id: new mongoose.Types.ObjectId(),
        ...mockReq.body,
        populate: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          ...mockReq.body
        })
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedBooking)
      }));

      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_createBooking(mockReq, mockRes);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should rollback transaction when booking save fails', async () => {
      const saveError = new Error('Database save error');
      Booking.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(saveError)
      }));

      await f_createBooking(mockReq, mockRes);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: saveError.message });
    });

    it('should rollback transaction when session update fails', async () => {
      const mockSavedBooking = {
        _id: new mongoose.Types.ObjectId(),
        ...mockReq.body,
        populate: jest.fn().mockResolvedValue({})
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedBooking)
      }));

      const updateError = new Error('Session update failed');
      MovieSession.findByIdAndUpdate.mockRejectedValue(updateError);

      await f_createBooking(mockReq, mockRes);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: updateError.message });
    });

    it('should update session with correct parameters during transaction', async () => {
      const mockSavedBooking = {
        _id: new mongoose.Types.ObjectId(),
        ...mockReq.body,
        populate: jest.fn().mockResolvedValue({})
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedBooking)
      }));

      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_createBooking(mockReq, mockRes);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        mockReq.body.sessionId,
        {
          $inc: { availableSeats: -2 },
          $push: { bookedSeats: { $each: ['A1', 'A2'] } }
        },
        { session: mockSession }
      );
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      Movie.findById.mockRejectedValue(dbError);

      await f_createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: dbError.message });
    });

    it('should handle transaction session creation errors', async () => {
      Movie.findById.mockResolvedValue({ _id: mockReq.body.movieId });
      Theater.findById.mockResolvedValue({ _id: mockReq.body.theaterId });
      MovieSession.findById.mockResolvedValue({
        _id: mockReq.body.sessionId,
        availableSeats: 10,
        bookedSeats: []
      });
      User.findById.mockResolvedValue({ _id: mockReq.body.userId });

      const sessionError = new Error('Failed to start session');
      mongoose.startSession.mockRejectedValue(sessionError);

      await f_createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: sessionError.message });
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      Movie.findById.mockResolvedValue({ _id: mockReq.body.movieId });
      Theater.findById.mockResolvedValue({ _id: mockReq.body.theaterId });
      User.findById.mockResolvedValue({ _id: mockReq.body.userId });
    });

    it('should handle booking with zero available seats', async () => {
      const mockSession = {
        _id: mockReq.body.sessionId,
        availableSeats: 0,
        bookedSeats: []
      };
      MovieSession.findById.mockResolvedValue(mockSession);

      await f_createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not enough available seats for this session' });
    });

    it('should handle booking with exactly enough seats', async () => {
      mockReq.body.seats = ['A1', 'A2'];
      const mockSession = {
        _id: mockReq.body.sessionId,
        availableSeats: 2,
        bookedSeats: []
      };
      MovieSession.findById.mockResolvedValue(mockSession);

      const mockSavedBooking = {
        _id: new mongoose.Types.ObjectId(),
        ...mockReq.body,
        populate: jest.fn().mockResolvedValue({})
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedBooking)
      }));

      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle booking with single seat', async () => {
      mockReq.body.seats = ['A1'];
      const mockMovieSession = {
        _id: mockReq.body.sessionId,
        availableSeats: 10,
        bookedSeats: []
      };
      MovieSession.findById.mockResolvedValue(mockMovieSession);

      const mockSavedBooking = {
        _id: new mongoose.Types.ObjectId(),
        ...mockReq.body,
        populate: jest.fn().mockResolvedValue({})
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedBooking)
      }));

      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_createBooking(mockReq, mockRes);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        mockReq.body.sessionId,
        {
          $inc: { availableSeats: -1 },
          $push: { bookedSeats: { $each: ['A1'] } }
        },
        { session: mockSession }
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});

describe('Booking Controller - f_getUserBookings', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {
        userId: new mongoose.Types.ObjectId().toString()
      },
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('Successful retrieval', () => {
    it('should retrieve user bookings with default pagination', async () => {
      const mockBookings = [
        { _id: new mongoose.Types.ObjectId(), user: mockReq.params.userId, totalPrice: 25 },
        { _id: new mongoose.Types.ObjectId(), user: mockReq.params.userId, totalPrice: 30 }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBookings)
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(2);

      await f_getUserBookings(mockReq, mockRes);

      expect(Booking.find).toHaveBeenCalledWith({ user: mockReq.params.userId });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockRes.json).toHaveBeenCalledWith({
        bookings: mockBookings,
        currentPage: 1,
        totalPages: 1,
        totalBookings: 2
      });
    });

    it('should retrieve user bookings with custom pagination', async () => {
      mockReq.query.page = '2';
      mockReq.query.limit = '5';

      const mockBookings = [
        { _id: new mongoose.Types.ObjectId(), user: mockReq.params.userId }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBookings)
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(8);

      await f_getUserBookings(mockReq, mockRes);

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(mockRes.json).toHaveBeenCalledWith({
        bookings: mockBookings,
        currentPage: 2,
        totalPages: 2,
        totalBookings: 8
      });
    });
  });

  describe('Filtering', () => {
    it('should filter bookings by status', async () => {
      mockReq.query.status = 'confirmed';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(Booking.find).toHaveBeenCalledWith({
        user: mockReq.params.userId,
        status: 'confirmed'
      });
    });

    it('should filter bookings by start date', async () => {
      mockReq.query.startDate = '2024-01-01';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(Booking.find).toHaveBeenCalledWith({
        user: mockReq.params.userId,
        bookingDate: {
          $gte: new Date('2024-01-01')
        }
      });
    });

    it('should filter bookings by end date', async () => {
      mockReq.query.endDate = '2024-12-31';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(Booking.find).toHaveBeenCalledWith({
        user: mockReq.params.userId,
        bookingDate: {
          $lte: new Date('2024-12-31')
        }
      });
    });

    it('should filter bookings by date range', async () => {
      mockReq.query.startDate = '2024-01-01';
      mockReq.query.endDate = '2024-12-31';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(Booking.find).toHaveBeenCalledWith({
        user: mockReq.params.userId,
        bookingDate: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-12-31')
        }
      });
    });

    it('should filter bookings by status and date range', async () => {
      mockReq.query.status = 'confirmed';
      mockReq.query.startDate = '2024-01-01';
      mockReq.query.endDate = '2024-12-31';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(Booking.find).toHaveBeenCalledWith({
        user: mockReq.params.userId,
        status: 'confirmed',
        bookingDate: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-12-31')
        }
      });
    });
  });

  describe('Sorting', () => {
    it('should sort bookings by default (createdAt descending)', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(mockQuery.sort).toHaveBeenCalledWith('-createdAt');
    });

    it('should sort bookings by custom field', async () => {
      mockReq.query.sort = 'totalPrice';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(mockQuery.sort).toHaveBeenCalledWith('totalPrice');
    });
  });

  describe('Empty results', () => {
    it('should handle empty booking list', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        bookings: [],
        currentPage: 1,
        totalPages: 0,
        totalBookings: 0
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      const dbError = new Error('Database query failed');
      Booking.find.mockImplementation(() => {
        throw dbError;
      });

      await f_getUserBookings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: dbError.message });
    });
  });

  describe('Pagination edge cases', () => {
    it('should handle page number as string', async () => {
      mockReq.query.page = '3';
      mockReq.query.limit = '10';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(25);

      await f_getUserBookings(mockReq, mockRes);

      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(mockRes.json).toHaveBeenCalledWith({
        bookings: [],
        currentPage: 3,
        totalPages: 3,
        totalBookings: 25
      });
    });

    it('should handle invalid page number', async () => {
      mockReq.query.page = 'invalid';

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(mockReq, mockRes);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPage: 1
        })
      );
    });
  });
});

describe('Booking Controller - f_getMovieAvailability', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {
        movieId: new mongoose.Types.ObjectId().toString()
      },
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('Successful retrieval', () => {
    it('should retrieve movie availability without date filter', async () => {
      const mockMovie = { _id: mockReq.params.movieId, title: 'Test Movie', year: 2024 };
      const mockSessions = [
        {
          _id: new mongoose.Types.ObjectId(),
          availableSeats: 50,
          totalSeats: 100,
          sessionTime: new Date()
        }
      ];

      Movie.findById.mockResolvedValue(mockMovie);

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockSessions)
      };

      MovieSession.find.mockReturnValue(mockQuery);

      await f_getMovieAvailability(mockReq, mockRes);

      expect(Movie.findById).toHaveBeenCalledWith(mockReq.params.movieId);
      expect(MovieSession.find).toHaveBeenCalledWith({ movie: mockReq.params.movieId });
      expect(mockRes.json).toHaveBeenCalledWith({
        movie: mockMovie,
        availability: expect.arrayContaining([
          expect.objectContaining({
            availableSeats: 50,
            totalSeats: 100,
            occupancyRate: 0.5
          })
        ])
      });
    });

    it('should retrieve movie availability for specific date', async () => {
      mockReq.query.date = '2024-01-15';
      const mockMovie = { _id: mockReq.params.movieId, title: 'Test Movie' };

      Movie.findById.mockResolvedValue(mockMovie);

      const mockQuery = {
        populate: jest.fn().mockResolvedValue([])
      };

      MovieSession.find.mockReturnValue(mockQuery);

      await f_getMovieAvailability(mockReq, mockRes);

      const expectedDate = new Date('2024-01-15');
      const expectedNextDate = new Date(expectedDate);
      expectedNextDate.setDate(expectedNextDate.getDate() + 1);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: mockReq.params.movieId,
        sessionTime: {
          $gte: expectedDate,
          $lt: expectedNextDate
        }
      });
    });

    it('should retrieve movie availability for date range', async () => {
      mockReq.query.startDate = '2024-01-01';
      mockReq.query.endDate = '2024-01-31';
      const mockMovie = { _id: mockReq.params.movieId, title: 'Test Movie' };

      Movie.findById.mockResolvedValue(mockMovie);

      const mockQuery = {
        populate: jest.fn().mockResolvedValue([])
      };

      MovieSession.find.mockReturnValue(mockQuery);

      await f_getMovieAvailability(mockReq, mockRes);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: mockReq.params.movieId,
        sessionTime: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-01-31')
        }
      });
    });
  });

  describe('Movie not found', () => {
    it('should return 404 when movie does not exist', async () => {
      Movie.findById.mockResolvedValue(null);

      await f_getMovieAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Movie not found' });
      expect(MovieSession.find).not.toHaveBeenCalled();
    });
  });

  describe('Occupancy rate calculation', () => {
    it('should calculate occupancy rate correctly', async () => {
      const mockMovie = { _id: mockReq.params.movieId, title: 'Test Movie' };
      const mockSessions = [
        {
          _id: new mongoose.Types.ObjectId(),
          availableSeats: 25,
          totalSeats: 100
        },
        {
          _id: new mongoose.Types.ObjectId(),
          availableSeats: 0,
          totalSeats: 100
        },
        {
          _id: new mongoose.Types.ObjectId(),
          availableSeats: 100,
          totalSeats: 100
        }
      ];

      Movie.findById.mockResolvedValue(mockMovie);

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockSessions)
      };

      MovieSession.find.mockReturnValue(mockQuery);

      await f_getMovieAvailability(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        movie: mockMovie,
        availability: [
          expect.objectContaining({ occupancyRate: 0.75 }),
          expect.objectContaining({ occupancyRate: 1 }),
          expect.objectContaining({ occupancyRate: 0 })
        ]
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      Movie.findById.mockRejectedValue(dbError);

      await f_getMovieAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: dbError.message });
    });
  });
});

describe('Booking Controller - f_cancelBooking', () => {
  let mockReq;
  let mockRes;
  let mockSession;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {
        id: new mongoose.Types.ObjectId().toString()
      },
      body: {
        cancellationReason: 'User requested cancellation'
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful cancellation', () => {
    it('should cancel a pending booking successfully', async () => {
      const mockBooking = {
        _id: mockReq.params.id,
        status: 'pending',
        seats: ['A1', 'A2'],
        session: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: mockReq.params.id,
          status: 'cancelled',
          populate: jest.fn().mockResolvedValue({
            _id: mockReq.params.id,
            status: 'cancelled'
          })
        })
      };

      Booking.findById.mockResolvedValue(mockBooking);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(mockReq, mockRes);

      expect(Booking.findById).toHaveBeenCalledWith(mockReq.params.id);
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockBooking.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Booking cancelled successfully'
        })
      );
    });

    it('should cancel a confirmed booking successfully', async () => {
      const mockBooking = {
        _id: mockReq.params.id,
        status: 'confirmed',
        seats: ['A1'],
        session: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: mockReq.params.id,
          status: 'cancelled',
          populate: jest.fn().mockResolvedValue({})
        })
      };

      Booking.findById.mockResolvedValue(mockBooking);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(mockReq, mockRes);

      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Booking cancelled successfully'
        })
      );
    });
  });

  describe('Booking not found', () => {
    it('should return 404 when booking does not exist', async () => {
      Booking.findById.mockResolvedValue(null);

      await f_cancelBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Booking not found' });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });
  });

  describe('Cancellation validation', () => {
    it('should not cancel an already cancelled booking', async () => {
      const mockBooking = {
        _id: mockReq.params.id,
        status: 'cancelled'
      };

      Booking.findById.mockResolvedValue(mockBooking);

      await f_cancelBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Booking cannot be cancelled as it is already cancelled'
      });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('should not cancel a completed booking', async () => {
      const mockBooking = {
        _id: mockReq.params.id,
        status: 'completed'
      };

      Booking.findById.mockResolvedValue(mockBooking);

      await f_cancelBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Booking cannot be cancelled as it is already completed'
      });
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });
  });

  describe('Transaction handling', () => {
    it('should commit transaction on successful cancellation', async () => {
      const mockBooking = {
        _id: mockReq.params.id,
        status: 'pending',
        seats: ['A1', 'A2'],
        session: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: mockReq.params.id,
          populate: jest.fn().mockResolvedValue({})
        })
      };

      Booking.findById.mockResolvedValue(mockBooking);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(mockReq, mockRes);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should rollback transaction when save fails', async () => {
      const mockBooking = {
        _id: mockReq.params.id,
        status: 'pending',
        seats: ['A1'],
        session: new mongoose.Types.ObjectId(),
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      Booking.findById.mockResolvedValue(mockBooking);

      await f_cancelBooking(mockReq, mockRes);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should rollback transaction when session update fails', async () => {
      const mockBooking = {
        _id: mockReq.params.id,
        status: 'pending',
        seats: ['A1', 'A2'],
        session: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: mockReq.params.id,
          populate: jest.fn().mockResolvedValue({})
        })
      };

      Booking.findById.mockResolvedValue(mockBooking);
      MovieSession.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      await f_cancelBooking(mockReq, mockRes);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should restore seats correctly during cancellation', async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const mockBooking = {
        _id: mockReq.params.id,
        status: 'pending',
        seats: ['A1', 'A2', 'A3'],
        session: sessionId,
        save: jest.fn().mockResolvedValue({
          _id: mockReq.params.id,
          populate: jest.fn().mockResolvedValue({})
        })
      };

      Booking.findById.mockResolvedValue(mockBooking);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(mockReq, mockRes);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        sessionId,
        {
          $inc: { availableSeats: 3 },
          $pull: { bookedSeats: { $in: ['A1', 'A2', 'A3'] } }
        },
        { session: mockSession }
      );
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      Booking.findById.mockRejectedValue(dbError);

      await f_cancelBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: dbError.message });
    });
  });
});

describe('Booking Controller - f_getBookingStats', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    if (!Booking.aggregate) {
      Booking.aggregate = jest.fn();
    }
  });

  describe('Successful statistics retrieval', () => {
    it('should retrieve booking statistics without filters', async () => {
      const mockStats = [
        {
          _id: null,
          totalBookings: 100,
          totalRevenue: 2500,
          confirmedBookings: 70,
          cancelledBookings: 20,
          pendingBookings: 5,
          completedBookings: 5
        }
      ];

      const mockOccupancy = [
        {
          _id: new mongoose.Types.ObjectId(),
          movieTitle: 'Test Movie',
          bookingCount: 50,
          occupancyRate: 33.33
        }
      ];

      Booking.aggregate.mockResolvedValueOnce(mockStats).mockResolvedValueOnce(mockOccupancy);

      await f_getBookingStats(mockReq, mockRes);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        summary: mockStats[0],
        occupancyByMovie: mockOccupancy
      });
    });

    it('should retrieve booking statistics with movie filter', async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      mockReq.query.movieId = movieId;

      Booking.aggregate.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await f_getBookingStats(mockReq, mockRes);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      const firstCall = Booking.aggregate.mock.calls[0][0];
      const matchStage = firstCall.find(stage => stage.$match);
      expect(matchStage).toBeDefined();
      expect(matchStage.$match.movie).toBeDefined();
    });

    it('should retrieve booking statistics with theater filter', async () => {
      const theaterId = new mongoose.Types.ObjectId().toString();
      mockReq.query.theaterId = theaterId;

      Booking.aggregate.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await f_getBookingStats(mockReq, mockRes);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      const firstCall = Booking.aggregate.mock.calls[0][0];
      const matchStage = firstCall.find(stage => stage.$match);
      expect(matchStage).toBeDefined();
      expect(matchStage.$match.theater).toBeDefined();
    });

    it('should retrieve booking statistics with date range filter', async () => {
      mockReq.query.startDate = '2024-01-01';
      mockReq.query.endDate = '2024-12-31';

      Booking.aggregate.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await f_getBookingStats(mockReq, mockRes);

      expect(Booking.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              bookingDate: {
                $gte: new Date('2024-01-01'),
                $lte: new Date('2024-12-31')
              }
            })
          })
        ])
      );
    });
  });

  describe('Empty statistics', () => {
    it('should return default values when no bookings exist', async () => {
      Booking.aggregate.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await f_getBookingStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        summary: {
          totalBookings: 0,
          totalRevenue: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          pendingBookings: 0,
          completedBookings: 0
        },
        occupancyByMovie: []
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      const dbError = new Error('Aggregation failed');
      Booking.aggregate.mockRejectedValue(dbError);

      await f_getBookingStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: dbError.message });
    });
  });

  describe('Complex filtering', () => {
    it('should handle multiple filters simultaneously', async () => {
      const movieId = new mongoose.Types.ObjectId().toString();
      const theaterId = new mongoose.Types.ObjectId().toString();
      mockReq.query.movieId = movieId;
      mockReq.query.theaterId = theaterId;
      mockReq.query.startDate = '2024-01-01';
      mockReq.query.endDate = '2024-12-31';

      Booking.aggregate.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await f_getBookingStats(mockReq, mockRes);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      const firstCall = Booking.aggregate.mock.calls[0][0];
      const matchStage = firstCall.find(stage => stage.$match);
      expect(matchStage).toBeDefined();
      expect(matchStage.$match.movie).toBeDefined();
      expect(matchStage.$match.theater).toBeDefined();
      expect(matchStage.$match.bookingDate).toBeDefined();
    });
  });
});
