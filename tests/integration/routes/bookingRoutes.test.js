const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bookingRoutes = require('../../../src/routes/bookingRoutes');
const {
  f_createBooking,
  f_getUserBookings,
  f_getMovieAvailability,
  f_cancelBooking,
  f_getBookingStats
} = require('../../../src/controllers/bookingController');

jest.mock('../../../src/controllers/bookingController');

const v_app = express();
v_app.use(express.json());
v_app.use('/api/bookings', bookingRoutes);

describe('Booking Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/bookings - Create Booking Route (2 test cases)', () => {
    test('should call f_createBooking controller with correct parameters', async () => {
      const v_bookingData = {
        movieId: 'movie123',
        theaterId: 'theater123',
        sessionId: 'session123',
        userId: 'user123',
        seats: ['A1', 'A2'],
        totalPrice: 20
      };

      f_createBooking.mockImplementation((p_req, p_res) => {
        p_res.status(201).json({
          message: 'Booking created successfully',
          booking: { _id: 'booking123', ...v_bookingData }
        });
      });

      const v_response = await request(v_app)
        .post('/api/bookings')
        .send(v_bookingData)
        .expect(201);

      expect(f_createBooking).toHaveBeenCalled();
      expect(v_response.body.message).toBe('Booking created successfully');
      expect(v_response.body.booking).toBeDefined();
    });

    test('should return 404 error when movie not found', async () => {
      f_createBooking.mockImplementation((p_req, p_res) => {
        p_res.status(404).json({ message: 'Movie not found' });
      });

      const v_response = await request(v_app)
        .post('/api/bookings')
        .send({
          movieId: 'invalid123',
          theaterId: 'theater123',
          sessionId: 'session123',
          userId: 'user123',
          seats: ['A1'],
          totalPrice: 10
        })
        .expect(404);

      expect(v_response.body.message).toBe('Movie not found');
    });
  });

  describe('GET /api/bookings/user/:userId - Get User Bookings Route (2 test cases)', () => {
    test('should call f_getUserBookings with userId parameter', async () => {
      const v_mockBookings = [
        { _id: 'booking1', user: 'user123', status: 'confirmed' },
        { _id: 'booking2', user: 'user123', status: 'pending' }
      ];

      f_getUserBookings.mockImplementation((p_req, p_res) => {
        p_res.json({
          bookings: v_mockBookings,
          currentPage: 1,
          totalPages: 1,
          totalBookings: 2
        });
      });

      const v_response = await request(v_app)
        .get('/api/bookings/user/user123')
        .expect(200);

      expect(f_getUserBookings).toHaveBeenCalled();
      expect(v_response.body.bookings).toHaveLength(2);
      expect(v_response.body.totalBookings).toBe(2);
    });

    test('should pass query parameters for filtering and pagination', async () => {
      f_getUserBookings.mockImplementation((p_req, p_res) => {
        expect(p_req.params.userId).toBe('user123');
        expect(p_req.query.status).toBe('confirmed');
        expect(p_req.query.page).toBe('2');
        expect(p_req.query.limit).toBe('20');

        p_res.json({
          bookings: [],
          currentPage: 2,
          totalPages: 5,
          totalBookings: 100
        });
      });

      await request(v_app)
        .get('/api/bookings/user/user123')
        .query({ status: 'confirmed', page: 2, limit: 20 })
        .expect(200);

      expect(f_getUserBookings).toHaveBeenCalled();
    });
  });

  describe('GET /api/bookings/availability/:movieId - Get Movie Availability Route (2 test cases)', () => {
    test('should call f_getMovieAvailability with movieId parameter', async () => {
      const v_mockAvailability = {
        movie: { _id: 'movie123', title: 'Test Movie' },
        availability: [
          {
            session: { _id: 'session1' },
            availableSeats: 50,
            totalSeats: 100,
            occupancyRate: 0.5
          }
        ]
      };

      f_getMovieAvailability.mockImplementation((p_req, p_res) => {
        expect(p_req.params.movieId).toBe('movie123');
        p_res.json(v_mockAvailability);
      });

      const v_response = await request(v_app)
        .get('/api/bookings/availability/movie123')
        .expect(200);

      expect(f_getMovieAvailability).toHaveBeenCalled();
      expect(v_response.body.movie).toBeDefined();
      expect(v_response.body.availability).toBeDefined();
    });

    test('should pass date query parameters for filtering', async () => {
      f_getMovieAvailability.mockImplementation((p_req, p_res) => {
        expect(p_req.params.movieId).toBe('movie123');
        expect(p_req.query.date).toBe('2024-01-15');

        p_res.json({
          movie: { _id: 'movie123', title: 'Test Movie' },
          availability: []
        });
      });

      await request(v_app)
        .get('/api/bookings/availability/movie123')
        .query({ date: '2024-01-15' })
        .expect(200);

      expect(f_getMovieAvailability).toHaveBeenCalled();
    });
  });

  describe('PUT /api/bookings/:id/cancel - Cancel Booking Route (2 test cases)', () => {
    test('should call f_cancelBooking with booking id and cancellation reason', async () => {
      f_cancelBooking.mockImplementation((p_req, p_res) => {
        expect(p_req.params.id).toBe('booking123');
        expect(p_req.body.cancellationReason).toBe('User request');

        p_res.json({
          message: 'Booking cancelled successfully',
          booking: {
            _id: 'booking123',
            status: 'cancelled',
            cancellationReason: 'User request'
          }
        });
      });

      const v_response = await request(v_app)
        .put('/api/bookings/booking123/cancel')
        .send({ cancellationReason: 'User request' })
        .expect(200);

      expect(f_cancelBooking).toHaveBeenCalled();
      expect(v_response.body.message).toBe('Booking cancelled successfully');
      expect(v_response.body.booking.status).toBe('cancelled');
    });

    test('should return 400 error when trying to cancel already cancelled booking', async () => {
      f_cancelBooking.mockImplementation((p_req, p_res) => {
        p_res.status(400).json({
          message: 'Booking cannot be cancelled as it is already cancelled'
        });
      });

      const v_response = await request(v_app)
        .put('/api/bookings/booking123/cancel')
        .send({ cancellationReason: 'User request' })
        .expect(400);

      expect(v_response.body.message).toContain('already cancelled');
    });
  });

  describe('GET /api/bookings/stats - Get Booking Statistics Route (2 test cases)', () => {
    test('should call f_getBookingStats without filters', async () => {
      const v_mockStats = {
        summary: {
          totalBookings: 100,
          totalRevenue: 1000,
          confirmedBookings: 80,
          cancelledBookings: 10,
          pendingBookings: 5,
          completedBookings: 5
        },
        occupancyByMovie: [
          {
            _id: 'movie123',
            movieTitle: 'Test Movie',
            bookingCount: 50,
            occupancyRate: 33.33
          }
        ]
      };

      f_getBookingStats.mockImplementation((p_req, p_res) => {
        p_res.json(v_mockStats);
      });

      const v_response = await request(v_app)
        .get('/api/bookings/stats')
        .expect(200);

      expect(f_getBookingStats).toHaveBeenCalled();
      expect(v_response.body.summary).toBeDefined();
      expect(v_response.body.occupancyByMovie).toBeDefined();
    });

    test('should pass query parameters for filtering statistics', async () => {
      f_getBookingStats.mockImplementation((p_req, p_res) => {
        expect(p_req.query.movieId).toBe('movie123');
        expect(p_req.query.startDate).toBe('2024-01-01');
        expect(p_req.query.endDate).toBe('2024-12-31');

        p_res.json({
          summary: {
            totalBookings: 50,
            totalRevenue: 500,
            confirmedBookings: 40,
            cancelledBookings: 5,
            pendingBookings: 3,
            completedBookings: 2
          },
          occupancyByMovie: []
        });
      });

      await request(v_app)
        .get('/api/bookings/stats')
        .query({
          movieId: 'movie123',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect(200);

      expect(f_getBookingStats).toHaveBeenCalled();
    });
  });

  describe('Route Error Handling', () => {
    test('should handle 500 internal server errors', async () => {
      f_createBooking.mockImplementation((p_req, p_res) => {
        p_res.status(500).json({ message: 'Internal server error' });
      });

      const v_response = await request(v_app)
        .post('/api/bookings')
        .send({
          movieId: 'movie123',
          theaterId: 'theater123',
          sessionId: 'session123',
          userId: 'user123',
          seats: ['A1'],
          totalPrice: 10
        })
        .expect(500);

      expect(v_response.body.message).toBe('Internal server error');
    });

    test('should handle 404 not found errors for invalid routes', async () => {
      const v_response = await request(v_app)
        .get('/api/bookings/invalid-route')
        .expect(404);

      expect(v_response.status).toBe(404);
    });
  });
});
