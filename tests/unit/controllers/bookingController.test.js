const mongoose = require('mongoose');

jest.mock('../../../src/models/Booking');
jest.mock('../../../src/models/Movie');
jest.mock('../../../src/models/Theater');
jest.mock('../../../src/models/MovieSession');
jest.mock('../../../src/models/User');

const v_originalObjectId = mongoose.Types.ObjectId;
mongoose.Types.ObjectId = jest.fn((p_id) => {
  return { toString: () => p_id, _id: p_id };
});

const Booking = require('../../../src/models/Booking');
const Movie = require('../../../src/models/Movie');
const Theater = require('../../../src/models/Theater');
const MovieSession = require('../../../src/models/MovieSession');
const User = require('../../../src/models/User');

const {
  f_createBooking,
  f_getUserBookings,
  f_getMovieAvailability,
  f_cancelBooking,
  f_getBookingStats
} = require('../../../src/controllers/bookingController');

const v_mockRequest = (p_body = {}, p_params = {}, p_query = {}) => ({
  body: p_body,
  params: p_params,
  query: p_query
});

const v_mockResponse = () => {
  const v_res = {};
  v_res.status = jest.fn().mockReturnValue(v_res);
  v_res.json = jest.fn().mockReturnValue(v_res);
  return v_res;
};

const v_mockTransactionSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn()
};

describe('Booking Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.startSession = jest.fn().mockResolvedValue(v_mockTransactionSession);
  });

  describe('f_createBooking', () => {
    const v_validBookingData = {
      movieId: '507f1f77bcf86cd799439011',
      theaterId: '507f1f77bcf86cd799439012',
      sessionId: '507f1f77bcf86cd799439013',
      userId: '507f1f77bcf86cd799439014',
      seats: ['A1', 'A2'],
      totalPrice: 25.00
    };

    const v_mockMovie = { _id: v_validBookingData.movieId, title: 'Test Movie', year: 2024 };
    const v_mockTheater = { _id: v_validBookingData.theaterId, theaterId: 1, location: { address: { city: 'Test City' } } };
    const v_mockSession = {
      _id: v_validBookingData.sessionId,
      availableSeats: 100,
      bookedSeats: ['B1', 'B2'],
      totalSeats: 150
    };
    const v_mockUser = { _id: v_validBookingData.userId, name: 'Test User', email: 'test@example.com' };

    it('should create a booking successfully', async () => {
      const v_req = v_mockRequest(v_validBookingData);
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(v_mockSession);
      User.findById.mockResolvedValue(v_mockUser);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      const v_savedBooking = {
        _id: 'booking123',
        ...v_validBookingData,
        populate: jest.fn().mockResolvedValue({
          _id: 'booking123',
          movie: v_mockMovie,
          theater: v_mockTheater,
          session: v_mockSession,
          user: v_mockUser,
          seats: v_validBookingData.seats,
          totalPrice: v_validBookingData.totalPrice
        })
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedBooking)
      }));

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(201);
      expect(v_res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Booking created successfully'
      }));
      expect(v_mockTransactionSession.commitTransaction).toHaveBeenCalled();
      expect(v_mockTransactionSession.endSession).toHaveBeenCalled();
    });

    it('should return 404 when movie is not found', async () => {
      const v_req = v_mockRequest(v_validBookingData);
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(null);

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should return 404 when theater is not found', async () => {
      const v_req = v_mockRequest(v_validBookingData);
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(null);

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Theater not found' });
    });

    it('should return 404 when session is not found', async () => {
      const v_req = v_mockRequest(v_validBookingData);
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(null);

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    it('should return 404 when user is not found', async () => {
      const v_req = v_mockRequest(v_validBookingData);
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(v_mockSession);
      User.findById.mockResolvedValue(null);

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 400 when not enough available seats', async () => {
      const v_req = v_mockRequest({
        ...v_validBookingData,
        seats: ['A1', 'A2', 'A3', 'A4', 'A5']
      });
      const v_res = v_mockResponse();

      const v_limitedSession = { ...v_mockSession, availableSeats: 2 };

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(v_limitedSession);
      User.findById.mockResolvedValue(v_mockUser);

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Not enough available seats for this session' });
    });

    it('should return 400 when selected seats are already booked', async () => {
      const v_req = v_mockRequest({
        ...v_validBookingData,
        seats: ['B1', 'A2']
      });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(v_mockSession);
      User.findById.mockResolvedValue(v_mockUser);

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Seats B1 are already booked' });
    });

    it('should return 400 when multiple selected seats are already booked', async () => {
      const v_req = v_mockRequest({
        ...v_validBookingData,
        seats: ['B1', 'B2']
      });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(v_mockSession);
      User.findById.mockResolvedValue(v_mockUser);

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Seats B1, B2 are already booked' });
    });

    it('should abort transaction and return 400 when booking save fails', async () => {
      const v_req = v_mockRequest(v_validBookingData);
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(v_mockSession);
      User.findById.mockResolvedValue(v_mockUser);

      Booking.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database save error'))
      }));

      await f_createBooking(v_req, v_res);

      expect(v_mockTransactionSession.abortTransaction).toHaveBeenCalled();
      expect(v_mockTransactionSession.endSession).toHaveBeenCalled();
      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database save error' });
    });

    it('should return 500 when an unexpected error occurs', async () => {
      const v_req = v_mockRequest(v_validBookingData);
      const v_res = v_mockResponse();

      Movie.findById.mockRejectedValue(new Error('Database connection error'));

      await f_createBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database connection error' });
    });

    it('should update session availability after successful booking', async () => {
      const v_req = v_mockRequest(v_validBookingData);
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(v_mockSession);
      User.findById.mockResolvedValue(v_mockUser);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      const v_savedBooking = {
        _id: 'booking123',
        populate: jest.fn().mockResolvedValue({})
      };

      Booking.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(v_savedBooking)
      }));

      await f_createBooking(v_req, v_res);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        v_validBookingData.sessionId,
        {
          $inc: { availableSeats: -2 },
          $push: { bookedSeats: { $each: ['A1', 'A2'] } }
        },
        { session: v_mockTransactionSession }
      );
    });
  });

  describe('f_getUserBookings', () => {
    const v_mockBookings = [
      {
        _id: 'booking1',
        movie: { title: 'Movie 1', year: 2024 },
        theater: { theaterId: 1, location: {} },
        session: {},
        user: { name: 'User 1', email: 'user1@example.com' },
        status: 'confirmed',
        seats: ['A1'],
        totalPrice: 15
      },
      {
        _id: 'booking2',
        movie: { title: 'Movie 2', year: 2024 },
        theater: { theaterId: 2, location: {} },
        session: {},
        user: { name: 'User 1', email: 'user1@example.com' },
        status: 'pending',
        seats: ['B1', 'B2'],
        totalPrice: 30
      }
    ];

    const v_mockPopulateChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(v_mockBookings)
    };

    it('should return user bookings with default pagination', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, {});
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(2);

      await f_getUserBookings(v_req, v_res);

      expect(Booking.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(v_res.json).toHaveBeenCalledWith({
        bookings: v_mockBookings,
        currentPage: 1,
        totalPages: 1,
        totalBookings: 2
      });
    });

    it('should filter bookings by status', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, { status: 'confirmed' });
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(1);

      await f_getUserBookings(v_req, v_res);

      expect(Booking.find).toHaveBeenCalledWith({ user: 'user123', status: 'confirmed' });
    });

    it('should filter bookings by start date only', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, { startDate: '2024-01-01' });
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(2);

      await f_getUserBookings(v_req, v_res);

      expect(Booking.find).toHaveBeenCalledWith({
        user: 'user123',
        bookingDate: { $gte: new Date('2024-01-01') }
      });
    });

    it('should filter bookings by end date only', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, { endDate: '2024-12-31' });
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(2);

      await f_getUserBookings(v_req, v_res);

      expect(Booking.find).toHaveBeenCalledWith({
        user: 'user123',
        bookingDate: { $lte: new Date('2024-12-31') }
      });
    });

    it('should filter bookings by date range', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, { startDate: '2024-01-01', endDate: '2024-12-31' });
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(2);

      await f_getUserBookings(v_req, v_res);

      expect(Booking.find).toHaveBeenCalledWith({
        user: 'user123',
        bookingDate: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-12-31')
        }
      });
    });

    it('should apply custom pagination', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, { page: '2', limit: '5' });
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(12);

      await f_getUserBookings(v_req, v_res);

      expect(v_mockPopulateChain.skip).toHaveBeenCalledWith(5);
      expect(v_mockPopulateChain.limit).toHaveBeenCalledWith(5);
      expect(v_res.json).toHaveBeenCalledWith(expect.objectContaining({
        currentPage: 2,
        totalPages: 3,
        totalBookings: 12
      }));
    });

    it('should apply custom sorting', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, { sort: 'totalPrice' });
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(2);

      await f_getUserBookings(v_req, v_res);

      expect(v_mockPopulateChain.sort).toHaveBeenCalledWith('totalPrice');
    });

    it('should use default sorting when not specified', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, {});
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(2);

      await f_getUserBookings(v_req, v_res);

      expect(v_mockPopulateChain.sort).toHaveBeenCalledWith('-createdAt');
    });

    it('should return 500 when an error occurs', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, {});
      const v_res = v_mockResponse();

      Booking.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await f_getUserBookings(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });

    it('should combine status and date filters', async () => {
      const v_req = v_mockRequest({}, { userId: 'user123' }, { status: 'confirmed', startDate: '2024-01-01' });
      const v_res = v_mockResponse();

      Booking.find.mockReturnValue(v_mockPopulateChain);
      Booking.countDocuments.mockResolvedValue(1);

      await f_getUserBookings(v_req, v_res);

      expect(Booking.find).toHaveBeenCalledWith({
        user: 'user123',
        status: 'confirmed',
        bookingDate: { $gte: new Date('2024-01-01') }
      });
    });
  });

  describe('f_getMovieAvailability', () => {
    const v_mockMovie = { _id: 'movie123', title: 'Test Movie', year: 2024 };
    const v_mockSessions = [
      {
        _id: 'session1',
        theater: { theaterId: 1, location: {} },
        movie: v_mockMovie,
        availableSeats: 80,
        totalSeats: 100,
        sessionTime: new Date('2024-06-15T14:00:00Z')
      },
      {
        _id: 'session2',
        theater: { theaterId: 2, location: {} },
        movie: v_mockMovie,
        availableSeats: 50,
        totalSeats: 100,
        sessionTime: new Date('2024-06-15T18:00:00Z')
      }
    ];

    const v_mockPopulateChain = {
      populate: jest.fn().mockResolvedValue(v_mockSessions)
    };

    it('should return movie availability without date filter', async () => {
      const v_req = v_mockRequest({}, { movieId: 'movie123' }, {});
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      MovieSession.find.mockReturnValue(v_mockPopulateChain);

      await f_getMovieAvailability(v_req, v_res);

      expect(Movie.findById).toHaveBeenCalledWith('movie123');
      expect(MovieSession.find).toHaveBeenCalledWith({ movie: 'movie123' });
      expect(v_res.json).toHaveBeenCalled();
      const v_response = v_res.json.mock.calls[0][0];
      expect(v_response.movie).toEqual(v_mockMovie);
      expect(v_response.availability).toHaveLength(2);
      expect(v_response.availability[0].availableSeats).toBe(80);
      expect(v_response.availability[0].totalSeats).toBe(100);
      expect(v_response.availability[0].occupancyRate).toBeCloseTo(0.2, 5);
      expect(v_response.availability[1].availableSeats).toBe(50);
      expect(v_response.availability[1].totalSeats).toBe(100);
      expect(v_response.availability[1].occupancyRate).toBeCloseTo(0.5, 5);
    });

    it('should return 404 when movie is not found', async () => {
      const v_req = v_mockRequest({}, { movieId: 'nonexistent' }, {});
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(null);

      await f_getMovieAvailability(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    it('should filter sessions by specific date', async () => {
      const v_req = v_mockRequest({}, { movieId: 'movie123' }, { date: '2024-06-15' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      MovieSession.find.mockReturnValue(v_mockPopulateChain);

      await f_getMovieAvailability(v_req, v_res);

      const v_expectedDate = new Date('2024-06-15');
      const v_nextDate = new Date('2024-06-15');
      v_nextDate.setDate(v_nextDate.getDate() + 1);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: 'movie123',
        sessionTime: {
          $gte: v_expectedDate,
          $lt: v_nextDate
        }
      });
    });

    it('should filter sessions by start date only', async () => {
      const v_req = v_mockRequest({}, { movieId: 'movie123' }, { startDate: '2024-06-01' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      MovieSession.find.mockReturnValue(v_mockPopulateChain);

      await f_getMovieAvailability(v_req, v_res);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: 'movie123',
        sessionTime: { $gte: new Date('2024-06-01') }
      });
    });

    it('should filter sessions by end date only', async () => {
      const v_req = v_mockRequest({}, { movieId: 'movie123' }, { endDate: '2024-06-30' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      MovieSession.find.mockReturnValue(v_mockPopulateChain);

      await f_getMovieAvailability(v_req, v_res);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: 'movie123',
        sessionTime: { $lte: new Date('2024-06-30') }
      });
    });

    it('should filter sessions by date range', async () => {
      const v_req = v_mockRequest({}, { movieId: 'movie123' }, { startDate: '2024-06-01', endDate: '2024-06-30' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      MovieSession.find.mockReturnValue(v_mockPopulateChain);

      await f_getMovieAvailability(v_req, v_res);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: 'movie123',
        sessionTime: {
          $gte: new Date('2024-06-01'),
          $lte: new Date('2024-06-30')
        }
      });
    });

    it('should return 500 when an error occurs', async () => {
      const v_req = v_mockRequest({}, { movieId: 'movie123' }, {});
      const v_res = v_mockResponse();

      Movie.findById.mockRejectedValue(new Error('Database error'));

      await f_getMovieAvailability(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });

    it('should calculate correct occupancy rate', async () => {
      const v_req = v_mockRequest({}, { movieId: 'movie123' }, {});
      const v_res = v_mockResponse();

      const v_fullSession = [{
        _id: 'session1',
        theater: { theaterId: 1, location: {} },
        movie: v_mockMovie,
        availableSeats: 0,
        totalSeats: 100,
        sessionTime: new Date()
      }];

      Movie.findById.mockResolvedValue(v_mockMovie);
      MovieSession.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(v_fullSession)
      });

      await f_getMovieAvailability(v_req, v_res);

      expect(v_res.json).toHaveBeenCalledWith({
        movie: v_mockMovie,
        availability: expect.arrayContaining([
          expect.objectContaining({
            occupancyRate: 1
          })
        ])
      });
    });

    it('should prioritize specific date over date range', async () => {
      const v_req = v_mockRequest({}, { movieId: 'movie123' }, { date: '2024-06-15', startDate: '2024-06-01', endDate: '2024-06-30' });
      const v_res = v_mockResponse();

      Movie.findById.mockResolvedValue(v_mockMovie);
      MovieSession.find.mockReturnValue(v_mockPopulateChain);

      await f_getMovieAvailability(v_req, v_res);

      const v_expectedDate = new Date('2024-06-15');
      const v_nextDate = new Date('2024-06-15');
      v_nextDate.setDate(v_nextDate.getDate() + 1);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: 'movie123',
        sessionTime: {
          $gte: v_expectedDate,
          $lt: v_nextDate
        }
      });
    });
  });

  describe('f_cancelBooking', () => {
    const v_mockBooking = {
      _id: 'booking123',
      movie: 'movie123',
      theater: 'theater123',
      session: 'session123',
      user: 'user123',
      status: 'confirmed',
      seats: ['A1', 'A2'],
      totalPrice: 25,
      save: jest.fn(),
      populate: jest.fn()
    };

    it('should cancel a booking successfully', async () => {
      const v_req = v_mockRequest({ cancellationReason: 'Changed plans' }, { id: 'booking123' });
      const v_res = v_mockResponse();

      const v_bookingInstance = {
        ...v_mockBooking,
        save: jest.fn().mockResolvedValue({
          ...v_mockBooking,
          status: 'cancelled',
          cancellationReason: 'Changed plans',
          cancellationDate: expect.any(Date),
          populate: jest.fn().mockResolvedValue({
            ...v_mockBooking,
            status: 'cancelled'
          })
        }),
        populate: jest.fn().mockResolvedValue({
          ...v_mockBooking,
          status: 'cancelled'
        })
      };

      Booking.findById.mockResolvedValue(v_bookingInstance);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(v_req, v_res);

      expect(v_bookingInstance.status).toBe('cancelled');
      expect(v_bookingInstance.cancellationReason).toBe('Changed plans');
      expect(v_mockTransactionSession.commitTransaction).toHaveBeenCalled();
      expect(v_res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Booking cancelled successfully'
      }));
    });

    it('should return 404 when booking is not found', async () => {
      const v_req = v_mockRequest({}, { id: 'nonexistent' });
      const v_res = v_mockResponse();

      Booking.findById.mockResolvedValue(null);

      await f_cancelBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(404);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Booking not found' });
    });

    it('should return 400 when booking is already cancelled', async () => {
      const v_req = v_mockRequest({}, { id: 'booking123' });
      const v_res = v_mockResponse();

      Booking.findById.mockResolvedValue({ ...v_mockBooking, status: 'cancelled' });

      await f_cancelBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Booking cannot be cancelled as it is already cancelled' });
    });

    it('should return 400 when booking is already completed', async () => {
      const v_req = v_mockRequest({}, { id: 'booking123' });
      const v_res = v_mockResponse();

      Booking.findById.mockResolvedValue({ ...v_mockBooking, status: 'completed' });

      await f_cancelBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Booking cannot be cancelled as it is already completed' });
    });

    it('should restore session capacity after cancellation', async () => {
      const v_req = v_mockRequest({ cancellationReason: 'Changed plans' }, { id: 'booking123' });
      const v_res = v_mockResponse();

      const v_bookingInstance = {
        ...v_mockBooking,
        save: jest.fn().mockResolvedValue({
          ...v_mockBooking,
          status: 'cancelled',
          populate: jest.fn().mockResolvedValue({})
        }),
        populate: jest.fn().mockResolvedValue({})
      };

      Booking.findById.mockResolvedValue(v_bookingInstance);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(v_req, v_res);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        {
          $inc: { availableSeats: 2 },
          $pull: { bookedSeats: { $in: ['A1', 'A2'] } }
        },
        { session: v_mockTransactionSession }
      );
    });

    it('should abort transaction when save fails', async () => {
      const v_req = v_mockRequest({ cancellationReason: 'Changed plans' }, { id: 'booking123' });
      const v_res = v_mockResponse();

      const v_bookingInstance = {
        ...v_mockBooking,
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      Booking.findById.mockResolvedValue(v_bookingInstance);

      await f_cancelBooking(v_req, v_res);

      expect(v_mockTransactionSession.abortTransaction).toHaveBeenCalled();
      expect(v_mockTransactionSession.endSession).toHaveBeenCalled();
      expect(v_res.status).toHaveBeenCalledWith(400);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Save failed' });
    });

    it('should return 500 when an unexpected error occurs', async () => {
      const v_req = v_mockRequest({}, { id: 'booking123' });
      const v_res = v_mockResponse();

      Booking.findById.mockRejectedValue(new Error('Database connection error'));

      await f_cancelBooking(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Database connection error' });
    });

    it('should set cancellation date when cancelling', async () => {
      const v_req = v_mockRequest({ cancellationReason: 'Changed plans' }, { id: 'booking123' });
      const v_res = v_mockResponse();

      const v_bookingInstance = {
        ...v_mockBooking,
        save: jest.fn().mockResolvedValue({
          ...v_mockBooking,
          status: 'cancelled',
          populate: jest.fn().mockResolvedValue({})
        }),
        populate: jest.fn().mockResolvedValue({})
      };

      Booking.findById.mockResolvedValue(v_bookingInstance);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(v_req, v_res);

      expect(v_bookingInstance.cancellationDate).toBeInstanceOf(Date);
    });

    it('should cancel pending booking successfully', async () => {
      const v_req = v_mockRequest({ cancellationReason: 'No longer needed' }, { id: 'booking123' });
      const v_res = v_mockResponse();

      const v_pendingBooking = {
        ...v_mockBooking,
        status: 'pending',
        save: jest.fn().mockResolvedValue({
          ...v_mockBooking,
          status: 'cancelled',
          populate: jest.fn().mockResolvedValue({})
        }),
        populate: jest.fn().mockResolvedValue({})
      };

      Booking.findById.mockResolvedValue(v_pendingBooking);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(v_req, v_res);

      expect(v_pendingBooking.status).toBe('cancelled');
      expect(v_res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Booking cancelled successfully'
      }));
    });
  });

  describe('f_getBookingStats', () => {
    const v_mockStats = [{
      _id: null,
      totalBookings: 100,
      totalRevenue: 2500,
      confirmedBookings: 60,
      cancelledBookings: 10,
      pendingBookings: 20,
      completedBookings: 10
    }];

    const v_mockOccupancyByMovie = [
      {
        _id: 'movie1',
        movieTitle: 'Movie 1',
        bookingCount: 50,
        occupancyRate: 33.33
      },
      {
        _id: 'movie2',
        movieTitle: 'Movie 2',
        bookingCount: 30,
        occupancyRate: 20
      }
    ];

    beforeEach(() => {
      Booking.aggregate = jest.fn();
    });

    it('should return booking statistics without filters', async () => {
      const v_req = v_mockRequest({}, {}, {});
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancyByMovie);

      await f_getBookingStats(v_req, v_res);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      expect(v_res.json).toHaveBeenCalledWith({
        summary: v_mockStats[0],
        occupancyByMovie: v_mockOccupancyByMovie
      });
    });

    it('should filter statistics by movieId', async () => {
      const v_req = v_mockRequest({}, {}, { movieId: '507f1f77bcf86cd799439011' });
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancyByMovie);

      await f_getBookingStats(v_req, v_res);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      const v_firstCallArgs = Booking.aggregate.mock.calls[0][0];
      expect(v_firstCallArgs[0].$match).toHaveProperty('movie');
    });

    it('should filter statistics by theaterId', async () => {
      const v_req = v_mockRequest({}, {}, { theaterId: '507f1f77bcf86cd799439012' });
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancyByMovie);

      await f_getBookingStats(v_req, v_res);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      const v_firstCallArgs = Booking.aggregate.mock.calls[0][0];
      expect(v_firstCallArgs[0].$match).toHaveProperty('theater');
    });

    it('should filter statistics by start date only', async () => {
      const v_req = v_mockRequest({}, {}, { startDate: '2024-01-01' });
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancyByMovie);

      await f_getBookingStats(v_req, v_res);

      expect(Booking.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              bookingDate: expect.objectContaining({
                $gte: new Date('2024-01-01')
              })
            })
          })
        ])
      );
    });

    it('should filter statistics by end date only', async () => {
      const v_req = v_mockRequest({}, {}, { endDate: '2024-12-31' });
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancyByMovie);

      await f_getBookingStats(v_req, v_res);

      expect(Booking.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              bookingDate: expect.objectContaining({
                $lte: new Date('2024-12-31')
              })
            })
          })
        ])
      );
    });

    it('should filter statistics by date range', async () => {
      const v_req = v_mockRequest({}, {}, { startDate: '2024-01-01', endDate: '2024-12-31' });
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancyByMovie);

      await f_getBookingStats(v_req, v_res);

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

    it('should return default values when no bookings exist', async () => {
      const v_req = v_mockRequest({}, {}, {});
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await f_getBookingStats(v_req, v_res);

      expect(v_res.json).toHaveBeenCalledWith({
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

    it('should return 500 when an error occurs', async () => {
      const v_req = v_mockRequest({}, {}, {});
      const v_res = v_mockResponse();

      Booking.aggregate.mockRejectedValue(new Error('Aggregation error'));

      await f_getBookingStats(v_req, v_res);

      expect(v_res.status).toHaveBeenCalledWith(500);
      expect(v_res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });

    it('should combine multiple filters', async () => {
      const v_req = v_mockRequest({}, {}, {
        movieId: '507f1f77bcf86cd799439011',
        theaterId: '507f1f77bcf86cd799439012',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      });
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancyByMovie);

      await f_getBookingStats(v_req, v_res);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      const v_firstCallArgs = Booking.aggregate.mock.calls[0][0];
      expect(v_firstCallArgs[0].$match).toHaveProperty('movie');
      expect(v_firstCallArgs[0].$match).toHaveProperty('theater');
      expect(v_firstCallArgs[0].$match).toHaveProperty('bookingDate');
      expect(v_firstCallArgs[0].$match.bookingDate.$gte).toEqual(new Date('2024-01-01'));
      expect(v_firstCallArgs[0].$match.bookingDate.$lte).toEqual(new Date('2024-12-31'));
    });

    it('should execute both aggregation pipelines', async () => {
      const v_req = v_mockRequest({}, {}, {});
      const v_res = v_mockResponse();

      Booking.aggregate
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancyByMovie);

      await f_getBookingStats(v_req, v_res);

      expect(Booking.aggregate).toHaveBeenCalledTimes(2);
      
      const v_firstCall = Booking.aggregate.mock.calls[0][0];
      expect(v_firstCall).toEqual(expect.arrayContaining([
        expect.objectContaining({ $match: expect.any(Object) }),
        expect.objectContaining({ $group: expect.any(Object) })
      ]));

      const v_secondCall = Booking.aggregate.mock.calls[1][0];
      expect(v_secondCall).toEqual(expect.arrayContaining([
        expect.objectContaining({ $match: expect.any(Object) }),
        expect.objectContaining({ $group: expect.any(Object) }),
        expect.objectContaining({ $lookup: expect.any(Object) }),
        expect.objectContaining({ $unwind: expect.any(String) }),
        expect.objectContaining({ $project: expect.any(Object) }),
        expect.objectContaining({ $sort: expect.any(Object) })
      ]));
    });
  });
});
