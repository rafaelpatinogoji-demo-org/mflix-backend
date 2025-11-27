const mongoose = require('mongoose');
const Booking = require('../../../src/models/Booking');

describe('Booking Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(Booking.collection.collectionName).toBe('bookings');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(Booking.schema.paths);
      expect(v_schemaPaths).toContain('movie');
      expect(v_schemaPaths).toContain('theater');
      expect(v_schemaPaths).toContain('session');
      expect(v_schemaPaths).toContain('user');
      expect(v_schemaPaths).toContain('bookingDate');
      expect(v_schemaPaths).toContain('status');
      expect(v_schemaPaths).toContain('seats');
      expect(v_schemaPaths).toContain('totalPrice');
      expect(v_schemaPaths).toContain('cancellationReason');
      expect(v_schemaPaths).toContain('cancellationDate');
      expect(v_schemaPaths).toContain('createdAt');
      expect(v_schemaPaths).toContain('updatedAt');
      expect(v_schemaPaths).toContain('_id');
    });

    it('should have timestamps enabled', () => {
      expect(Booking.schema.options.timestamps).toBe(true);
    });
  });

  describe('Required Field Validation', () => {
    it('should require movie field', async () => {
      const v_booking = new Booking({
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.movie).toBeDefined();
      expect(v_error.errors.movie.kind).toBe('required');
    });

    it('should require theater field', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.theater).toBeDefined();
      expect(v_error.errors.theater.kind).toBe('required');
    });

    it('should require session field', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.session).toBeDefined();
      expect(v_error.errors.session.kind).toBe('required');
    });

    it('should require user field', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.user).toBeDefined();
      expect(v_error.errors.user.kind).toBe('required');
    });

    it('should require totalPrice field', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId()
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.totalPrice).toBeDefined();
      expect(v_error.errors.totalPrice.kind).toBe('required');
    });

    it('should pass validation with all required fields', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });
  });

  describe('Reference Validation (ObjectId)', () => {
    it('should accept valid ObjectId for movie', () => {
      const v_movieId = new mongoose.Types.ObjectId();
      const v_booking = new Booking({
        movie: v_movieId,
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      expect(v_booking.movie.toString()).toBe(v_movieId.toString());
    });

    it('should accept valid ObjectId for theater', () => {
      const v_theaterId = new mongoose.Types.ObjectId();
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: v_theaterId,
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      expect(v_booking.theater.toString()).toBe(v_theaterId.toString());
    });

    it('should accept valid ObjectId for session', () => {
      const v_sessionId = new mongoose.Types.ObjectId();
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: v_sessionId,
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      expect(v_booking.session.toString()).toBe(v_sessionId.toString());
    });

    it('should accept valid ObjectId for user', () => {
      const v_userId = new mongoose.Types.ObjectId();
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: v_userId,
        totalPrice: 25.00
      });

      expect(v_booking.user.toString()).toBe(v_userId.toString());
    });

    it('should accept string ObjectId and cast to ObjectId', () => {
      const v_movieIdStr = new mongoose.Types.ObjectId().toString();
      const v_booking = new Booking({
        movie: v_movieIdStr,
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      expect(mongoose.Types.ObjectId.isValid(v_booking.movie)).toBe(true);
    });

    it('should have correct ref for movie', () => {
      const v_moviePath = Booking.schema.path('movie');
      expect(v_moviePath.options.ref).toBe('Movie');
    });

    it('should have correct ref for theater', () => {
      const v_theaterPath = Booking.schema.path('theater');
      expect(v_theaterPath.options.ref).toBe('Theater');
    });

    it('should have correct ref for session', () => {
      const v_sessionPath = Booking.schema.path('session');
      expect(v_sessionPath.options.ref).toBe('Session');
    });

    it('should have correct ref for user', () => {
      const v_userPath = Booking.schema.path('user');
      expect(v_userPath.options.ref).toBe('User');
    });
  });

  describe('Enum Validation - Status', () => {
    it('should accept confirmed status', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        status: 'confirmed'
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_booking.status).toBe('confirmed');
    });

    it('should accept pending status', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        status: 'pending'
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_booking.status).toBe('pending');
    });

    it('should accept cancelled status', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        status: 'cancelled'
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_booking.status).toBe('cancelled');
    });

    it('should accept completed status', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        status: 'completed'
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_booking.status).toBe('completed');
    });

    it('should reject invalid status', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        status: 'invalid_status'
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.status).toBeDefined();
      expect(v_error.errors.status.kind).toBe('enum');
    });

    it('should have all valid enum values', () => {
      const v_statusPath = Booking.schema.path('status');
      expect(v_statusPath.enumValues).toContain('confirmed');
      expect(v_statusPath.enumValues).toContain('pending');
      expect(v_statusPath.enumValues).toContain('cancelled');
      expect(v_statusPath.enumValues).toContain('completed');
      expect(v_statusPath.enumValues).toHaveLength(4);
    });
  });

  describe('Default Values', () => {
    it('should default status to pending', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      expect(v_booking.status).toBe('pending');
    });

    it('should default bookingDate to current date', () => {
      const v_beforeCreate = new Date();
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });
      const v_afterCreate = new Date();

      expect(v_booking.bookingDate).toBeDefined();
      expect(v_booking.bookingDate.getTime()).toBeGreaterThanOrEqual(v_beforeCreate.getTime());
      expect(v_booking.bookingDate.getTime()).toBeLessThanOrEqual(v_afterCreate.getTime());
    });

    it('should default seats to empty array', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      expect(Array.isArray(v_booking.seats)).toBe(true);
      expect(v_booking.seats).toHaveLength(0);
    });
  });

  describe('Array Validation - Seats', () => {
    it('should accept an array of strings for seats', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        seats: ['A1', 'A2', 'A3']
      });

      expect(v_booking.seats).toHaveLength(3);
      expect(v_booking.seats).toContain('A1');
      expect(v_booking.seats).toContain('A2');
      expect(v_booking.seats).toContain('A3');
    });

    it('should accept an empty array for seats', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        seats: []
      });

      expect(v_booking.seats).toHaveLength(0);
    });

    it('should accept a single seat', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        seats: ['B5']
      });

      expect(v_booking.seats).toHaveLength(1);
      expect(v_booking.seats[0]).toBe('B5');
    });

    it('should handle various seat formats', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        seats: ['A1', 'B12', 'VIP-1', 'Row1-Seat5']
      });

      expect(v_booking.seats).toHaveLength(4);
    });
  });

  describe('Type Validation', () => {
    it('should accept number for totalPrice', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 99.99
      });

      expect(v_booking.totalPrice).toBe(99.99);
    });

    it('should cast string number to number for totalPrice', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: '50.00'
      });

      expect(v_booking.totalPrice).toBe(50);
      expect(typeof v_booking.totalPrice).toBe('number');
    });

    it('should accept Date for bookingDate', () => {
      const v_date = new Date('2024-12-25');
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        bookingDate: v_date
      });

      expect(v_booking.bookingDate.getTime()).toBe(v_date.getTime());
    });

    it('should accept string for cancellationReason', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        cancellationReason: 'Customer requested cancellation'
      });

      expect(v_booking.cancellationReason).toBe('Customer requested cancellation');
    });

    it('should accept Date for cancellationDate', () => {
      const v_date = new Date('2024-12-26');
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        cancellationDate: v_date
      });

      expect(v_booking.cancellationDate.getTime()).toBe(v_date.getTime());
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid booking with all fields', async () => {
      const v_bookingData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        bookingDate: new Date(),
        status: 'confirmed',
        seats: ['A1', 'A2'],
        totalPrice: 50.00,
        cancellationReason: null,
        cancellationDate: null
      };

      const v_booking = new Booking(v_bookingData);

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should create a valid cancelled booking', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        status: 'cancelled',
        cancellationReason: 'Show cancelled due to weather',
        cancellationDate: new Date()
      });

      let v_error;
      try {
        await v_booking.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_booking.status).toBe('cancelled');
      expect(v_booking.cancellationReason).toBe('Show cancelled due to weather');
    });

    it('should generate an ObjectId for _id', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      expect(v_booking._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_booking._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero totalPrice', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 0
      });

      expect(v_booking.totalPrice).toBe(0);
    });

    it('should handle large totalPrice', async () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 999999.99
      });

      expect(v_booking.totalPrice).toBe(999999.99);
    });

    it('should handle very long cancellationReason', async () => {
      const v_longReason = 'A'.repeat(1000);
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        cancellationReason: v_longReason
      });

      expect(v_booking.cancellationReason).toBe(v_longReason);
      expect(v_booking.cancellationReason.length).toBe(1000);
    });

    it('should handle large number of seats', async () => {
      const v_seats = Array.from({ length: 100 }, (_, i) => `Seat${i}`);
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 2500.00,
        seats: v_seats
      });

      expect(v_booking.seats).toHaveLength(100);
    });

    it('should handle past bookingDate', async () => {
      const v_pastDate = new Date('2020-01-01');
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        bookingDate: v_pastDate
      });

      expect(v_booking.bookingDate.getTime()).toBe(v_pastDate.getTime());
    });

    it('should handle future bookingDate', async () => {
      const v_futureDate = new Date('2030-12-31');
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00,
        bookingDate: v_futureDate
      });

      expect(v_booking.bookingDate.getTime()).toBe(v_futureDate.getTime());
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      const v_json = v_booking.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.totalPrice).toBe(25.00);
    });

    it('should have toObject method', () => {
      const v_booking = new Booking({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        totalPrice: 25.00
      });

      const v_obj = v_booking.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.totalPrice).toBe(25.00);
    });
  });
});
