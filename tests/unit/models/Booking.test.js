const mongoose = require('mongoose');
const Booking = require('../../../src/models/Booking');

describe('Booking Model Tests', () => {
  describe('Schema Validation Tests (15 test cases)', () => {
    test('should create a valid booking with all required fields', () => {
      const v_validBooking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1', 'A2'],
        totalPrice: 20
      });

      const v_error = v_validBooking.validateSync();
      expect(v_error).toBeUndefined();
    });

    test('should fail validation when movie is missing', () => {
      const v_booking = new Booking({
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.movie).toBeDefined();
      expect(v_error.errors.movie.kind).toBe('required');
    });

    test('should fail validation when theater is missing', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.theater).toBeDefined();
      expect(v_error.errors.theater.kind).toBe('required');
    });

    test('should fail validation when session is missing', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.session).toBeDefined();
      expect(v_error.errors.session.kind).toBe('required');
    });

    test('should fail validation when user is missing', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.user).toBeDefined();
      expect(v_error.errors.user.kind).toBe('required');
    });

    test('should fail validation when totalPrice is missing', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1']
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.totalPrice).toBeDefined();
      expect(v_error.errors.totalPrice.kind).toBe('required');
    });

    test('should set default status to pending', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10
      });

      expect(v_booking.status).toBe('pending');
    });

    test('should accept valid status enum values', () => {
      const v_validStatuses = ['confirmed', 'pending', 'cancelled', 'completed'];

      v_validStatuses.forEach(v_status => {
        const v_booking = new Booking({
          movie: new mongoose.Types.ObjectId(),
          theater: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          seats: ['A1'],
          totalPrice: 10,
          status: v_status
        });

        const v_error = v_booking.validateSync();
        expect(v_error).toBeUndefined();
        expect(v_booking.status).toBe(v_status);
      });
    });

    test('should fail validation with invalid status enum value', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10,
        status: 'invalid_status'
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.status).toBeDefined();
      expect(v_error.errors.status.kind).toBe('enum');
    });

    test('should set default bookingDate to current date', () => {
      const v_beforeCreate = new Date();
      
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10
      });

      const v_afterCreate = new Date();

      expect(v_booking.bookingDate).toBeDefined();
      expect(v_booking.bookingDate.getTime()).toBeGreaterThanOrEqual(v_beforeCreate.getTime());
      expect(v_booking.bookingDate.getTime()).toBeLessThanOrEqual(v_afterCreate.getTime());
    });

    test('should accept seats as array of strings', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1', 'A2', 'A3', 'B1'],
        totalPrice: 40
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeUndefined();
      expect(v_booking.seats).toEqual(['A1', 'A2', 'A3', 'B1']);
      expect(v_booking.seats.length).toBe(4);
    });

    test('should accept empty seats array', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: [],
        totalPrice: 0
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeUndefined();
      expect(v_booking.seats).toEqual([]);
    });

    test('should store cancellationReason when provided', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10,
        status: 'cancelled',
        cancellationReason: 'User requested cancellation'
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeUndefined();
      expect(v_booking.cancellationReason).toBe('User requested cancellation');
    });

    test('should store cancellationDate when provided', () => {
      const v_cancellationDate = new Date('2024-01-15');
      
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10,
        status: 'cancelled',
        cancellationDate: v_cancellationDate
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeUndefined();
      expect(v_booking.cancellationDate).toEqual(v_cancellationDate);
    });

    test('should validate ObjectId types for references', () => {
      const v_movieId = new mongoose.Types.ObjectId();
      const v_theaterId = new mongoose.Types.ObjectId();
      const v_sessionId = new mongoose.Types.ObjectId();
      const v_userId = new mongoose.Types.ObjectId();

      const v_booking = new Booking({
        movie: v_movieId,
        theater: v_theaterId,
        session: v_sessionId,
        user: v_userId,
        seats: ['A1'],
        totalPrice: 10
      });

      const v_error = v_booking.validateSync();
      expect(v_error).toBeUndefined();
      expect(v_booking.movie).toEqual(v_movieId);
      expect(v_booking.theater).toEqual(v_theaterId);
      expect(v_booking.session).toEqual(v_sessionId);
      expect(v_booking.user).toEqual(v_userId);
    });
  });

  describe('Schema Structure Tests', () => {
    test('should have correct collection name', () => {
      expect(Booking.collection.name).toBe('bookings');
    });

    test('should have timestamps enabled', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        seats: ['A1'],
        totalPrice: 10
      });

      expect(v_booking.schema.options.timestamps).toBe(true);
    });
  });
});
