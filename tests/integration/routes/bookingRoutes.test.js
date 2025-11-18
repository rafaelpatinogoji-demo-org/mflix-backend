const request = require('supertest');
const express = require('express');
const bookingRoutes = require('../../../src/routes/bookingRoutes');
const {
  f_createBooking,
  f_getUserBookings,
  f_getMovieAvailability,
  f_cancelBooking,
  f_getBookingStats
} = require('../../../src/controllers/bookingController');

jest.mock('../../../src/controllers/bookingController');

describe('Booking Routes Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/bookings', bookingRoutes);

    jest.clearAllMocks();
  });

  describe('POST /bookings - Create booking', () => {
    it('should call f_createBooking controller with correct parameters', async () => {
      f_createBooking.mockImplementation((req, res) => {
        res.status(201).json({ message: 'Booking created successfully' });
      });

      const bookingData = {
        movieId: '507f1f77bcf86cd799439011',
        theaterId: '507f1f77bcf86cd799439012',
        sessionId: '507f1f77bcf86cd799439013',
        userId: '507f1f77bcf86cd799439014',
        seats: ['A1', 'A2'],
        totalPrice: 25.00
      };

      const response = await request(app)
        .post('/bookings')
        .send(bookingData)
        .expect(201);

      expect(f_createBooking).toHaveBeenCalledTimes(1);
      const callArgs = f_createBooking.mock.calls[0];
      expect(callArgs[0].body).toEqual(bookingData);
      expect(response.body).toEqual({ message: 'Booking created successfully' });
    });

    it('should handle missing required fields', async () => {
      f_createBooking.mockImplementation((req, res) => {
        res.status(400).json({ message: 'Missing required fields' });
      });

      const response = await request(app)
        .post('/bookings')
        .send({})
        .expect(400);

      expect(f_createBooking).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({ message: 'Missing required fields' });
    });

    it('should handle controller errors', async () => {
      f_createBooking.mockImplementation((req, res) => {
        res.status(500).json({ message: 'Internal server error' });
      });

      const response = await request(app)
        .post('/bookings')
        .send({
          movieId: '507f1f77bcf86cd799439011',
          theaterId: '507f1f77bcf86cd799439012',
          sessionId: '507f1f77bcf86cd799439013',
          userId: '507f1f77bcf86cd799439014',
          seats: ['A1'],
          totalPrice: 12.50
        })
        .expect(500);

      expect(response.body).toEqual({ message: 'Internal server error' });
    });

    it('should accept JSON content type', async () => {
      f_createBooking.mockImplementation((req, res) => {
        res.status(201).json({ message: 'Success' });
      });

      await request(app)
        .post('/bookings')
        .set('Content-Type', 'application/json')
        .send({
          movieId: '507f1f77bcf86cd799439011',
          theaterId: '507f1f77bcf86cd799439012',
          sessionId: '507f1f77bcf86cd799439013',
          userId: '507f1f77bcf86cd799439014',
          seats: ['A1'],
          totalPrice: 12.50
        })
        .expect(201);

      expect(f_createBooking).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /bookings/user/:userId - Get user bookings', () => {
    it('should call f_getUserBookings with userId parameter', async () => {
      const userId = '507f1f77bcf86cd799439011';
      f_getUserBookings.mockImplementation((req, res) => {
        res.json({
          bookings: [],
          currentPage: 1,
          totalPages: 0,
          totalBookings: 0
        });
      });

      const response = await request(app)
        .get(`/bookings/user/${userId}`)
        .expect(200);

      expect(f_getUserBookings).toHaveBeenCalledTimes(1);
      const callArgs = f_getUserBookings.mock.calls[0];
      expect(callArgs[0].params.userId).toBe(userId);
      expect(response.body).toHaveProperty('bookings');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalBookings');
    });

    it('should pass query parameters to controller', async () => {
      const userId = '507f1f77bcf86cd799439011';
      f_getUserBookings.mockImplementation((req, res) => {
        res.json({ bookings: [] });
      });

      await request(app)
        .get(`/bookings/user/${userId}`)
        .query({ status: 'confirmed', page: '2', limit: '5' })
        .expect(200);

      expect(f_getUserBookings).toHaveBeenCalledTimes(1);
      const callArgs = f_getUserBookings.mock.calls[0];
      expect(callArgs[0].params.userId).toBe(userId);
      expect(callArgs[0].query.status).toBe('confirmed');
      expect(callArgs[0].query.page).toBe('2');
      expect(callArgs[0].query.limit).toBe('5');
    });

    it('should handle date range query parameters', async () => {
      const userId = '507f1f77bcf86cd799439011';
      f_getUserBookings.mockImplementation((req, res) => {
        res.json({ bookings: [] });
      });

      await request(app)
        .get(`/bookings/user/${userId}`)
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .expect(200);

      expect(f_getUserBookings).toHaveBeenCalledTimes(1);
      const callArgs = f_getUserBookings.mock.calls[0];
      expect(callArgs[0].query.startDate).toBe('2024-01-01');
      expect(callArgs[0].query.endDate).toBe('2024-12-31');
    });

    it('should handle controller errors', async () => {
      const userId = '507f1f77bcf86cd799439011';
      f_getUserBookings.mockImplementation((req, res) => {
        res.status(500).json({ message: 'Database error' });
      });

      const response = await request(app)
        .get(`/bookings/user/${userId}`)
        .expect(500);

      expect(response.body).toEqual({ message: 'Database error' });
    });
  });

  describe('GET /bookings/availability/:movieId - Get movie availability', () => {
    it('should call f_getMovieAvailability with movieId parameter', async () => {
      const movieId = '507f1f77bcf86cd799439011';
      f_getMovieAvailability.mockImplementation((req, res) => {
        res.json({
          movie: { _id: movieId, title: 'Test Movie' },
          availability: []
        });
      });

      const response = await request(app)
        .get(`/bookings/availability/${movieId}`)
        .expect(200);

      expect(f_getMovieAvailability).toHaveBeenCalledTimes(1);
      const callArgs = f_getMovieAvailability.mock.calls[0];
      expect(callArgs[0].params.movieId).toBe(movieId);
      expect(response.body).toHaveProperty('movie');
      expect(response.body).toHaveProperty('availability');
    });

    it('should pass date query parameter to controller', async () => {
      const movieId = '507f1f77bcf86cd799439011';
      f_getMovieAvailability.mockImplementation((req, res) => {
        res.json({ movie: {}, availability: [] });
      });

      await request(app)
        .get(`/bookings/availability/${movieId}`)
        .query({ date: '2024-01-15' })
        .expect(200);

      expect(f_getMovieAvailability).toHaveBeenCalledTimes(1);
      const callArgs = f_getMovieAvailability.mock.calls[0];
      expect(callArgs[0].params.movieId).toBe(movieId);
      expect(callArgs[0].query.date).toBe('2024-01-15');
    });

    it('should pass date range query parameters to controller', async () => {
      const movieId = '507f1f77bcf86cd799439011';
      f_getMovieAvailability.mockImplementation((req, res) => {
        res.json({ movie: {}, availability: [] });
      });

      await request(app)
        .get(`/bookings/availability/${movieId}`)
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(200);

      expect(f_getMovieAvailability).toHaveBeenCalledTimes(1);
      const callArgs = f_getMovieAvailability.mock.calls[0];
      expect(callArgs[0].query.startDate).toBe('2024-01-01');
      expect(callArgs[0].query.endDate).toBe('2024-01-31');
    });

    it('should handle movie not found', async () => {
      const movieId = '507f1f77bcf86cd799439011';
      f_getMovieAvailability.mockImplementation((req, res) => {
        res.status(404).json({ message: 'Movie not found' });
      });

      const response = await request(app)
        .get(`/bookings/availability/${movieId}`)
        .expect(404);

      expect(response.body).toEqual({ message: 'Movie not found' });
    });
  });

  describe('PUT /bookings/:id/cancel - Cancel booking', () => {
    it('should call f_cancelBooking with booking id', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      f_cancelBooking.mockImplementation((req, res) => {
        res.json({
          message: 'Booking cancelled successfully',
          booking: { _id: bookingId, status: 'cancelled' }
        });
      });

      const response = await request(app)
        .put(`/bookings/${bookingId}/cancel`)
        .send({ cancellationReason: 'User requested' })
        .expect(200);

      expect(f_cancelBooking).toHaveBeenCalledTimes(1);
      const callArgs = f_cancelBooking.mock.calls[0];
      expect(callArgs[0].params.id).toBe(bookingId);
      expect(callArgs[0].body.cancellationReason).toBe('User requested');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('booking');
    });

    it('should handle booking not found', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      f_cancelBooking.mockImplementation((req, res) => {
        res.status(404).json({ message: 'Booking not found' });
      });

      const response = await request(app)
        .put(`/bookings/${bookingId}/cancel`)
        .send({ cancellationReason: 'User requested' })
        .expect(404);

      expect(response.body).toEqual({ message: 'Booking not found' });
    });

    it('should handle already cancelled booking', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      f_cancelBooking.mockImplementation((req, res) => {
        res.status(400).json({ message: 'Booking cannot be cancelled as it is already cancelled' });
      });

      const response = await request(app)
        .put(`/bookings/${bookingId}/cancel`)
        .send({ cancellationReason: 'User requested' })
        .expect(400);

      expect(response.body).toEqual({ message: 'Booking cannot be cancelled as it is already cancelled' });
    });

    it('should accept cancellation without reason', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      f_cancelBooking.mockImplementation((req, res) => {
        res.json({ message: 'Booking cancelled successfully' });
      });

      await request(app)
        .put(`/bookings/${bookingId}/cancel`)
        .send({})
        .expect(200);

      expect(f_cancelBooking).toHaveBeenCalledTimes(1);
      const callArgs = f_cancelBooking.mock.calls[0];
      expect(callArgs[0].body).toEqual({});
    });
  });

  describe('GET /bookings/stats - Get booking statistics', () => {
    it('should call f_getBookingStats without filters', async () => {
      f_getBookingStats.mockImplementation((req, res) => {
        res.json({
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

      const response = await request(app)
        .get('/bookings/stats')
        .expect(200);

      expect(f_getBookingStats).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('occupancyByMovie');
    });

    it('should pass movieId query parameter to controller', async () => {
      const movieId = '507f1f77bcf86cd799439011';
      f_getBookingStats.mockImplementation((req, res) => {
        res.json({ summary: {}, occupancyByMovie: [] });
      });

      await request(app)
        .get('/bookings/stats')
        .query({ movieId })
        .expect(200);

      expect(f_getBookingStats).toHaveBeenCalledTimes(1);
      const callArgs = f_getBookingStats.mock.calls[0];
      expect(callArgs[0].query.movieId).toBe(movieId);
    });

    it('should pass theaterId query parameter to controller', async () => {
      const theaterId = '507f1f77bcf86cd799439011';
      f_getBookingStats.mockImplementation((req, res) => {
        res.json({ summary: {}, occupancyByMovie: [] });
      });

      await request(app)
        .get('/bookings/stats')
        .query({ theaterId })
        .expect(200);

      expect(f_getBookingStats).toHaveBeenCalledTimes(1);
      const callArgs = f_getBookingStats.mock.calls[0];
      expect(callArgs[0].query.theaterId).toBe(theaterId);
    });

    it('should pass date range query parameters to controller', async () => {
      f_getBookingStats.mockImplementation((req, res) => {
        res.json({ summary: {}, occupancyByMovie: [] });
      });

      await request(app)
        .get('/bookings/stats')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
        .expect(200);

      expect(f_getBookingStats).toHaveBeenCalledTimes(1);
      const callArgs = f_getBookingStats.mock.calls[0];
      expect(callArgs[0].query.startDate).toBe('2024-01-01');
      expect(callArgs[0].query.endDate).toBe('2024-12-31');
    });

    it('should pass multiple filters to controller', async () => {
      const movieId = '507f1f77bcf86cd799439011';
      const theaterId = '507f1f77bcf86cd799439012';
      f_getBookingStats.mockImplementation((req, res) => {
        res.json({ summary: {}, occupancyByMovie: [] });
      });

      await request(app)
        .get('/bookings/stats')
        .query({
          movieId,
          theaterId,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect(200);

      expect(f_getBookingStats).toHaveBeenCalledTimes(1);
      const callArgs = f_getBookingStats.mock.calls[0];
      expect(callArgs[0].query.movieId).toBe(movieId);
      expect(callArgs[0].query.theaterId).toBe(theaterId);
      expect(callArgs[0].query.startDate).toBe('2024-01-01');
      expect(callArgs[0].query.endDate).toBe('2024-12-31');
    });

    it('should handle controller errors', async () => {
      f_getBookingStats.mockImplementation((req, res) => {
        res.status(500).json({ message: 'Aggregation failed' });
      });

      const response = await request(app)
        .get('/bookings/stats')
        .expect(500);

      expect(response.body).toEqual({ message: 'Aggregation failed' });
    });
  });

  describe('Route configuration validation', () => {
    it('should have POST route configured for creating bookings', async () => {
      f_createBooking.mockImplementation((req, res) => {
        res.status(201).json({ message: 'Success' });
      });

      await request(app)
        .post('/bookings')
        .send({
          movieId: '507f1f77bcf86cd799439011',
          theaterId: '507f1f77bcf86cd799439012',
          sessionId: '507f1f77bcf86cd799439013',
          userId: '507f1f77bcf86cd799439014',
          seats: ['A1'],
          totalPrice: 12.50
        })
        .expect(201);

      expect(f_createBooking).toHaveBeenCalled();
    });

    it('should have GET route configured for user bookings', async () => {
      f_getUserBookings.mockImplementation((req, res) => {
        res.json({ bookings: [] });
      });

      await request(app)
        .get('/bookings/user/507f1f77bcf86cd799439011')
        .expect(200);

      expect(f_getUserBookings).toHaveBeenCalled();
    });

    it('should have GET route configured for movie availability', async () => {
      f_getMovieAvailability.mockImplementation((req, res) => {
        res.json({ movie: {}, availability: [] });
      });

      await request(app)
        .get('/bookings/availability/507f1f77bcf86cd799439011')
        .expect(200);

      expect(f_getMovieAvailability).toHaveBeenCalled();
    });

    it('should have PUT route configured for cancelling bookings', async () => {
      f_cancelBooking.mockImplementation((req, res) => {
        res.json({ message: 'Cancelled' });
      });

      await request(app)
        .put('/bookings/507f1f77bcf86cd799439011/cancel')
        .send({})
        .expect(200);

      expect(f_cancelBooking).toHaveBeenCalled();
    });

    it('should have GET route configured for booking stats', async () => {
      f_getBookingStats.mockImplementation((req, res) => {
        res.json({ summary: {}, occupancyByMovie: [] });
      });

      await request(app)
        .get('/bookings/stats')
        .expect(200);

      expect(f_getBookingStats).toHaveBeenCalled();
    });

    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/bookings/nonexistent')
        .expect(404);
    });

    it('should not accept GET method on POST-only routes', async () => {
      await request(app)
        .get('/bookings')
        .expect(404);
    });

    it('should not accept POST method on GET-only routes', async () => {
      await request(app)
        .post('/bookings/stats')
        .send({})
        .expect(404);
    });
  });

  describe('Request/Response handling', () => {
    it('should handle large request bodies', async () => {
      f_createBooking.mockImplementation((req, res) => {
        res.status(201).json({ message: 'Success' });
      });

      const largeSeatsArray = Array.from({ length: 50 }, (_, i) => `A${i + 1}`);

      await request(app)
        .post('/bookings')
        .send({
          movieId: '507f1f77bcf86cd799439011',
          theaterId: '507f1f77bcf86cd799439012',
          sessionId: '507f1f77bcf86cd799439013',
          userId: '507f1f77bcf86cd799439014',
          seats: largeSeatsArray,
          totalPrice: 625.00
        })
        .expect(201);

      expect(f_createBooking).toHaveBeenCalled();
    });

    it('should handle special characters in query parameters', async () => {
      f_getUserBookings.mockImplementation((req, res) => {
        res.json({ bookings: [] });
      });

      await request(app)
        .get('/bookings/user/507f1f77bcf86cd799439011')
        .query({ sort: '-createdAt' })
        .expect(200);

      expect(f_getUserBookings).toHaveBeenCalledTimes(1);
      const callArgs = f_getUserBookings.mock.calls[0];
      expect(callArgs[0].query.sort).toBe('-createdAt');
    });

    it('should handle empty request body for PUT requests', async () => {
      f_cancelBooking.mockImplementation((req, res) => {
        res.json({ message: 'Cancelled' });
      });

      await request(app)
        .put('/bookings/507f1f77bcf86cd799439011/cancel')
        .expect(200);

      expect(f_cancelBooking).toHaveBeenCalled();
    });
  });
});
