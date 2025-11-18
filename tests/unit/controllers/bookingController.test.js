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

describe('Booking Controller Tests', () => {
  let v_mockReq;
  let v_mockRes;
  let v_mockSession;

  beforeEach(() => {
    jest.clearAllMocks();

    v_mockReq = {
      body: {},
      params: {},
      query: {}
    };

    v_mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    v_mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };

    mongoose.startSession = jest.fn().mockResolvedValue(v_mockSession);
  });

  describe('f_createBooking - Create Booking Tests (12 test cases)', () => {
    test('should create booking successfully with valid data', async () => {
      const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
      const v_mockTheater = { _id: 'theater123', theaterId: 'T1' };
      const v_mockSessionData = {
        _id: 'session123',
        availableSeats: 10,
        bookedSeats: []
      };
      const v_mockUser = { _id: 'user123', name: 'Test User' };
      
      const v_populatedBooking = {
        _id: 'booking123',
        movie: v_mockMovie,
        theater: v_mockTheater,
        session: v_mockSessionData,
        user: v_mockUser,
        seats: ['A1', 'A2'],
        totalPrice: 20
      };

      const v_mockBooking = {
        _id: 'booking123',
        movie: 'movie123',
        theater: 'theater123',
        session: 'session123',
        user: 'user123',
        seats: ['A1', 'A2'],
        totalPrice: 20,
        save: jest.fn(),
        populate: jest.fn()
      };
      
      v_mockBooking.save.mockResolvedValue(v_mockBooking);
      v_mockBooking.populate.mockResolvedValue(v_populatedBooking);

      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1', 'A2'],
        totalPrice: 20
      };

      Movie.findById.mockResolvedValue(v_mockMovie);
      Theater.findById.mockResolvedValue(v_mockTheater);
      MovieSession.findById.mockResolvedValue(v_mockSessionData);
      User.findById.mockResolvedValue(v_mockUser);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});
      Booking.mockImplementation(() => v_mockBooking);

      await f_createBooking(v_mockReq, v_mockRes);

      expect(Movie.findById).toHaveBeenCalledWith('movie123');
      expect(Theater.findById).toHaveBeenCalledWith('theater123');
      expect(MovieSession.findById).toHaveBeenCalledWith('session123');
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Booking created successfully'
        })
      );
    });

    test('should return 404 when movie not found', async () => {
      v_mockReq.body = {
        movieId: 'invalid123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1'],
        totalPrice: 10
      };

      Movie.findById.mockResolvedValue(null);

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    test('should return 404 when theater not found', async () => {
      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'invalid123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1'],
        totalPrice: 10
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue(null);

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Theater not found' });
    });

    test('should return 404 when session not found', async () => {
      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'invalid123',
        userId: 'user123',
        seats: ['A1'],
        totalPrice: 10
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      MovieSession.findById.mockResolvedValue(null);

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });

    test('should return 404 when user not found', async () => {
      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'invalid123',
        seats: ['A1'],
        totalPrice: 10
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      MovieSession.findById.mockResolvedValue({ _id: 'session123', availableSeats: 10 });
      User.findById.mockResolvedValue(null);

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    test('should return 400 when not enough available seats', async () => {
      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1', 'A2', 'A3'],
        totalPrice: 30
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      MovieSession.findById.mockResolvedValue({
        _id: 'session123',
        availableSeats: 2,
        bookedSeats: []
      });
      User.findById.mockResolvedValue({ _id: 'user123' });

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Not enough available seats for this session'
      });
    });

    test('should return 400 when selected seats are already booked', async () => {
      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1', 'A2'],
        totalPrice: 20
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      MovieSession.findById.mockResolvedValue({
        _id: 'session123',
        availableSeats: 10,
        bookedSeats: ['A1', 'B1']
      });
      User.findById.mockResolvedValue({ _id: 'user123' });

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Seats A1 are already booked'
      });
    });

    test('should rollback transaction on booking save error', async () => {
      const v_mockBooking = {
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1'],
        totalPrice: 10
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      MovieSession.findById.mockResolvedValue({
        _id: 'session123',
        availableSeats: 10,
        bookedSeats: []
      });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Booking.mockImplementation(() => v_mockBooking);

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockSession.abortTransaction).toHaveBeenCalled();
      expect(v_mockSession.endSession).toHaveBeenCalled();
      expect(v_mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should update session with correct seat information', async () => {
      const v_mockBooking = {
        save: jest.fn().mockResolvedValue({}),
        populate: jest.fn().mockResolvedValue({
          _id: 'booking123',
          movie: { title: 'Test' },
          theater: { theaterId: 'T1' },
          session: {},
          user: { name: 'User' }
        })
      };

      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1', 'A2', 'A3'],
        totalPrice: 30
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      MovieSession.findById.mockResolvedValue({
        _id: 'session123',
        availableSeats: 10,
        bookedSeats: []
      });
      User.findById.mockResolvedValue({ _id: 'user123' });
      MovieSession.findByIdAndUpdate.mockResolvedValue({});
      Booking.mockImplementation(() => v_mockBooking);

      await f_createBooking(v_mockReq, v_mockRes);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        {
          $inc: { availableSeats: -3 },
          $push: { bookedSeats: { $each: ['A1', 'A2', 'A3'] } }
        },
        { session: v_mockSession }
      );
    });

    test('should handle database connection errors', async () => {
      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1'],
        totalPrice: 10
      };

      Movie.findById.mockRejectedValue(new Error('Database connection failed'));

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Database connection failed'
      });
    });

    test('should handle multiple unavailable seats correctly', async () => {
      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1', 'A2', 'A3'],
        totalPrice: 30
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      MovieSession.findById.mockResolvedValue({
        _id: 'session123',
        availableSeats: 10,
        bookedSeats: ['A1', 'A3', 'B1']
      });
      User.findById.mockResolvedValue({ _id: 'user123' });

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Seats A1, A3 are already booked'
      });
    });

    test('should populate all references in response', async () => {
      const v_populatedBooking = {
        _id: 'booking123',
        movie: { _id: 'movie123', title: 'Test Movie', year: 2024 },
        theater: { _id: 'theater123', theaterId: 'T1', location: 'NYC' },
        session: { _id: 'session123', sessionTime: new Date() },
        user: { _id: 'user123', name: 'Test User', email: 'test@test.com' },
        seats: ['A1'],
        totalPrice: 10
      };

      const v_mockBooking = {
        _id: 'booking123',
        movie: 'movie123',
        theater: 'theater123',
        session: 'session123',
        user: 'user123',
        seats: ['A1'],
        totalPrice: 10,
        save: jest.fn(),
        populate: jest.fn()
      };
      
      v_mockBooking.save.mockResolvedValue(v_mockBooking);
      v_mockBooking.populate.mockResolvedValue(v_populatedBooking);

      v_mockReq.body = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1'],
        totalPrice: 10
      };

      Movie.findById.mockResolvedValue({ _id: 'movie123' });
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      MovieSession.findById.mockResolvedValue({
        _id: 'session123',
        availableSeats: 10,
        bookedSeats: []
      });
      User.findById.mockResolvedValue({ _id: 'user123' });
      MovieSession.findByIdAndUpdate.mockResolvedValue({});
      Booking.mockImplementation(() => v_mockBooking);

      await f_createBooking(v_mockReq, v_mockRes);

      expect(v_mockBooking.populate).toHaveBeenCalled();
      expect(v_mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('f_getUserBookings - Get User Bookings Tests (8 test cases)', () => {
    test('should get user bookings with default pagination', async () => {
      const v_mockBookings = [
        { _id: 'booking1', user: 'user123', status: 'confirmed' },
        { _id: 'booking2', user: 'user123', status: 'pending' }
      ];

      v_mockReq.params.userId = 'user123';

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(v_mockBookings)
      };

      Booking.find.mockReturnValue(v_mockQuery);
      Booking.countDocuments.mockResolvedValue(2);

      await f_getUserBookings(v_mockReq, v_mockRes);

      expect(Booking.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(v_mockQuery.skip).toHaveBeenCalledWith(0);
      expect(v_mockQuery.limit).toHaveBeenCalledWith(10);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        bookings: v_mockBookings,
        currentPage: 1,
        totalPages: 1,
        totalBookings: 2
      });
    });

    test('should filter bookings by status', async () => {
      v_mockReq.params.userId = 'user123';
      v_mockReq.query.status = 'confirmed';

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(v_mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(v_mockReq, v_mockRes);

      expect(Booking.find).toHaveBeenCalledWith({
        user: 'user123',
        status: 'confirmed'
      });
    });

    test('should filter bookings by date range', async () => {
      v_mockReq.params.userId = 'user123';
      v_mockReq.query.startDate = '2024-01-01';
      v_mockReq.query.endDate = '2024-12-31';

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(v_mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(v_mockReq, v_mockRes);

      expect(Booking.find).toHaveBeenCalledWith({
        user: 'user123',
        bookingDate: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-12-31')
        }
      });
    });

    test('should handle custom pagination parameters', async () => {
      v_mockReq.params.userId = 'user123';
      v_mockReq.query.page = '3';
      v_mockReq.query.limit = '20';

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(v_mockQuery);
      Booking.countDocuments.mockResolvedValue(100);

      await f_getUserBookings(v_mockReq, v_mockRes);

      expect(v_mockQuery.skip).toHaveBeenCalledWith(40);
      expect(v_mockQuery.limit).toHaveBeenCalledWith(20);
      expect(v_mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPage: 3,
          totalPages: 5,
          totalBookings: 100
        })
      );
    });

    test('should apply custom sorting', async () => {
      v_mockReq.params.userId = 'user123';
      v_mockReq.query.sort = 'bookingDate';

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(v_mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(v_mockReq, v_mockRes);

      expect(v_mockQuery.sort).toHaveBeenCalledWith('bookingDate');
    });

    test('should populate all booking references', async () => {
      v_mockReq.params.userId = 'user123';

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(v_mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(v_mockReq, v_mockRes);

      expect(v_mockQuery.populate).toHaveBeenCalledWith([
        { path: 'movie', select: 'title year' },
        { path: 'theater', select: 'theaterId location' },
        { path: 'session' },
        { path: 'user', select: 'name email' }
      ]);
    });

    test('should handle database errors', async () => {
      v_mockReq.params.userId = 'user123';

      Booking.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await f_getUserBookings(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });

    test('should filter by start date only', async () => {
      v_mockReq.params.userId = 'user123';
      v_mockReq.query.startDate = '2024-01-01';

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(v_mockQuery);
      Booking.countDocuments.mockResolvedValue(0);

      await f_getUserBookings(v_mockReq, v_mockRes);

      expect(Booking.find).toHaveBeenCalledWith({
        user: 'user123',
        bookingDate: {
          $gte: new Date('2024-01-01')
        }
      });
    });
  });

  describe('f_getMovieAvailability - Get Movie Availability Tests (5 test cases)', () => {
    test('should get movie availability for specific date', async () => {
      const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
      const v_mockSessions = [
        {
          _id: 'session1',
          availableSeats: 50,
          totalSeats: 100,
          theater: { theaterId: 'T1' },
          movie: v_mockMovie
        }
      ];

      v_mockReq.params.movieId = 'movie123';
      v_mockReq.query.date = '2024-01-15';

      Movie.findById.mockResolvedValue(v_mockMovie);

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(v_mockSessions)
      };

      MovieSession.find.mockReturnValue(v_mockQuery);

      await f_getMovieAvailability(v_mockReq, v_mockRes);

      expect(Movie.findById).toHaveBeenCalledWith('movie123');
      expect(v_mockRes.json).toHaveBeenCalledWith({
        movie: v_mockMovie,
        availability: expect.arrayContaining([
          expect.objectContaining({
            availableSeats: 50,
            totalSeats: 100,
            occupancyRate: 0.5
          })
        ])
      });
    });

    test('should return 404 when movie not found', async () => {
      v_mockReq.params.movieId = 'invalid123';

      Movie.findById.mockResolvedValue(null);

      await f_getMovieAvailability(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Movie not found' });
    });

    test('should filter sessions by date range', async () => {
      const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };

      v_mockReq.params.movieId = 'movie123';
      v_mockReq.query.startDate = '2024-01-01';
      v_mockReq.query.endDate = '2024-01-31';

      Movie.findById.mockResolvedValue(v_mockMovie);

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue([])
      };

      MovieSession.find.mockReturnValue(v_mockQuery);

      await f_getMovieAvailability(v_mockReq, v_mockRes);

      expect(MovieSession.find).toHaveBeenCalledWith({
        movie: 'movie123',
        sessionTime: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-01-31')
        }
      });
    });

    test('should calculate occupancy rate correctly', async () => {
      const v_mockMovie = { _id: 'movie123', title: 'Test Movie' };
      const v_mockSessions = [
        {
          _id: 'session1',
          availableSeats: 25,
          totalSeats: 100,
          theater: { theaterId: 'T1' },
          movie: v_mockMovie
        },
        {
          _id: 'session2',
          availableSeats: 0,
          totalSeats: 100,
          theater: { theaterId: 'T2' },
          movie: v_mockMovie
        }
      ];

      v_mockReq.params.movieId = 'movie123';

      Movie.findById.mockResolvedValue(v_mockMovie);

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(v_mockSessions)
      };

      MovieSession.find.mockReturnValue(v_mockQuery);

      await f_getMovieAvailability(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        movie: v_mockMovie,
        availability: [
          expect.objectContaining({ occupancyRate: 0.75 }),
          expect.objectContaining({ occupancyRate: 1 })
        ]
      });
    });

    test('should handle database errors', async () => {
      v_mockReq.params.movieId = 'movie123';

      Movie.findById.mockRejectedValue(new Error('Database error'));

      await f_getMovieAvailability(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  describe('f_cancelBooking - Cancel Booking Tests (6 test cases)', () => {
    test('should cancel booking successfully', async () => {
      const v_populatedBooking = {
        _id: 'booking123',
        status: 'cancelled',
        movie: { title: 'Test' },
        theater: { theaterId: 'T1' },
        session: {},
        user: { name: 'User' },
        cancellationReason: 'User request',
        cancellationDate: expect.any(Date)
      };

      const v_mockBooking = {
        _id: 'booking123',
        status: 'confirmed',
        session: 'session123',
        seats: ['A1', 'A2'],
        save: jest.fn().mockImplementation(function() {
          this.status = 'cancelled';
          this.cancellationReason = 'User request';
          this.cancellationDate = new Date();
          return Promise.resolve(this);
        }),
        populate: jest.fn().mockResolvedValue(v_populatedBooking)
      };

      v_mockReq.params.id = 'booking123';
      v_mockReq.body.cancellationReason = 'User request';

      Booking.findById.mockResolvedValue(v_mockBooking);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(v_mockReq, v_mockRes);

      expect(v_mockBooking.status).toBe('cancelled');
      expect(v_mockBooking.cancellationReason).toBe('User request');
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Booking cancelled successfully'
        })
      );
    });

    test('should return 404 when booking not found', async () => {
      v_mockReq.params.id = 'invalid123';

      Booking.findById.mockResolvedValue(null);

      await f_cancelBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Booking not found' });
    });

    test('should not cancel already cancelled booking', async () => {
      const v_mockBooking = {
        _id: 'booking123',
        status: 'cancelled'
      };

      v_mockReq.params.id = 'booking123';

      Booking.findById.mockResolvedValue(v_mockBooking);

      await f_cancelBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Booking cannot be cancelled as it is already cancelled'
      });
    });

    test('should not cancel completed booking', async () => {
      const v_mockBooking = {
        _id: 'booking123',
        status: 'completed'
      };

      v_mockReq.params.id = 'booking123';

      Booking.findById.mockResolvedValue(v_mockBooking);

      await f_cancelBooking(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Booking cannot be cancelled as it is already completed'
      });
    });

    test('should restore session capacity correctly', async () => {
      const v_mockBooking = {
        _id: 'booking123',
        status: 'confirmed',
        session: 'session123',
        seats: ['A1', 'A2', 'A3'],
        save: jest.fn().mockResolvedValue({}),
        populate: jest.fn().mockResolvedValue({})
      };

      v_mockReq.params.id = 'booking123';
      v_mockReq.body.cancellationReason = 'User request';

      Booking.findById.mockResolvedValue(v_mockBooking);
      MovieSession.findByIdAndUpdate.mockResolvedValue({});

      await f_cancelBooking(v_mockReq, v_mockRes);

      expect(MovieSession.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        {
          $inc: { availableSeats: 3 },
          $pull: { bookedSeats: { $in: ['A1', 'A2', 'A3'] } }
        },
        { session: v_mockSession }
      );
    });

    test('should rollback transaction on error', async () => {
      const v_mockBooking = {
        _id: 'booking123',
        status: 'confirmed',
        session: 'session123',
        seats: ['A1'],
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      v_mockReq.params.id = 'booking123';
      v_mockReq.body.cancellationReason = 'User request';

      Booking.findById.mockResolvedValue(v_mockBooking);

      await f_cancelBooking(v_mockReq, v_mockRes);

      expect(v_mockSession.abortTransaction).toHaveBeenCalled();
      expect(v_mockSession.endSession).toHaveBeenCalled();
      expect(v_mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('f_getBookingStats - Get Booking Statistics Tests (4 test cases)', () => {
    test('should get booking statistics without filters', async () => {
      const v_mockStats = [
        {
          _id: null,
          totalBookings: 100,
          totalRevenue: 1000,
          confirmedBookings: 80,
          cancelledBookings: 10,
          pendingBookings: 5,
          completedBookings: 5
        }
      ];

      const v_mockOccupancy = [
        {
          _id: 'movie123',
          movieTitle: 'Test Movie',
          bookingCount: 50,
          occupancyRate: 33.33
        }
      ];

      Booking.aggregate = jest.fn()
        .mockResolvedValueOnce(v_mockStats)
        .mockResolvedValueOnce(v_mockOccupancy);

      await f_getBookingStats(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
        summary: v_mockStats[0],
        occupancyByMovie: v_mockOccupancy
      });
    });

    test('should filter statistics by movie', async () => {
      v_mockReq.query.movieId = 'movie123';

      const v_mockObjectId = new mongoose.Types.ObjectId();
      const v_originalObjectId = mongoose.Types.ObjectId;
      mongoose.Types.ObjectId = jest.fn().mockReturnValue(v_mockObjectId);

      Booking.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await f_getBookingStats(v_mockReq, v_mockRes);

      mongoose.Types.ObjectId = v_originalObjectId;

      expect(v_mockRes.json).toHaveBeenCalledWith({
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

    test('should filter statistics by date range', async () => {
      v_mockReq.query.startDate = '2024-01-01';
      v_mockReq.query.endDate = '2024-12-31';

      Booking.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await f_getBookingStats(v_mockReq, v_mockRes);

      expect(Booking.aggregate).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.any(Object),
          occupancyByMovie: expect.any(Array)
        })
      );
    });

    test('should return default stats when no bookings found', async () => {
      Booking.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await f_getBookingStats(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith({
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
});
