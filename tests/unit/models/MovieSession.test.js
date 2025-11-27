const mongoose = require('mongoose');
const MovieSession = require('../../../src/models/MovieSession');

describe('MovieSession Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(MovieSession.collection.collectionName).toBe('movie_sessions');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(MovieSession.schema.paths);
      expect(v_schemaPaths).toContain('movie');
      expect(v_schemaPaths).toContain('theater');
      expect(v_schemaPaths).toContain('sessionTime');
      expect(v_schemaPaths).toContain('price');
      expect(v_schemaPaths).toContain('totalSeats');
      expect(v_schemaPaths).toContain('availableSeats');
      expect(v_schemaPaths).toContain('bookedSeats');
      expect(v_schemaPaths).toContain('status');
      expect(v_schemaPaths).toContain('createdAt');
      expect(v_schemaPaths).toContain('updatedAt');
      expect(v_schemaPaths).toContain('_id');
    });

    it('should have timestamps enabled', () => {
      expect(MovieSession.schema.options.timestamps).toBe(true);
    });
  });

  describe('Required Field Validation', () => {
    it('should require movie field', async () => {
      const v_session = new MovieSession({
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.movie).toBeDefined();
      expect(v_error.errors.movie.kind).toBe('required');
    });

    it('should require theater field', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.theater).toBeDefined();
      expect(v_error.errors.theater.kind).toBe('required');
    });

    it('should require sessionTime field', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.sessionTime).toBeDefined();
      expect(v_error.errors.sessionTime.kind).toBe('required');
    });

    it('should require price field', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        totalSeats: 100,
        availableSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.price).toBeDefined();
      expect(v_error.errors.price.kind).toBe('required');
    });

    it('should require totalSeats field', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        availableSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.totalSeats).toBeDefined();
      expect(v_error.errors.totalSeats.kind).toBe('required');
    });

    it('should require availableSeats field', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.availableSeats).toBeDefined();
      expect(v_error.errors.availableSeats.kind).toBe('required');
    });

    it('should pass validation with all required fields', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });
  });

  describe('Reference Validation (ObjectId)', () => {
    it('should accept valid ObjectId for movie', () => {
      const v_movieId = new mongoose.Types.ObjectId();
      const v_session = new MovieSession({
        movie: v_movieId,
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.movie.toString()).toBe(v_movieId.toString());
    });

    it('should accept valid ObjectId for theater', () => {
      const v_theaterId = new mongoose.Types.ObjectId();
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: v_theaterId,
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.theater.toString()).toBe(v_theaterId.toString());
    });

    it('should have correct ref for movie', () => {
      const v_moviePath = MovieSession.schema.path('movie');
      expect(v_moviePath.options.ref).toBe('Movie');
    });

    it('should have correct ref for theater', () => {
      const v_theaterPath = MovieSession.schema.path('theater');
      expect(v_theaterPath.options.ref).toBe('Theater');
    });

    it('should accept string ObjectId and cast to ObjectId', () => {
      const v_movieIdStr = new mongoose.Types.ObjectId().toString();
      const v_session = new MovieSession({
        movie: v_movieIdStr,
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(mongoose.Types.ObjectId.isValid(v_session.movie)).toBe(true);
    });
  });

  describe('Enum Validation - Status', () => {
    it('should accept scheduled status', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100,
        status: 'scheduled'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.status).toBe('scheduled');
    });

    it('should accept cancelled status', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100,
        status: 'cancelled'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.status).toBe('cancelled');
    });

    it('should accept completed status', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100,
        status: 'completed'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.status).toBe('completed');
    });

    it('should reject invalid status', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100,
        status: 'invalid_status'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.status).toBeDefined();
      expect(v_error.errors.status.kind).toBe('enum');
    });

    it('should have all valid enum values', () => {
      const v_statusPath = MovieSession.schema.path('status');
      expect(v_statusPath.enumValues).toContain('scheduled');
      expect(v_statusPath.enumValues).toContain('cancelled');
      expect(v_statusPath.enumValues).toContain('completed');
      expect(v_statusPath.enumValues).toHaveLength(3);
    });
  });

  describe('Default Values', () => {
    it('should default status to scheduled', () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.status).toBe('scheduled');
    });

    it('should default bookedSeats to empty array', () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(Array.isArray(v_session.bookedSeats)).toBe(true);
      expect(v_session.bookedSeats).toHaveLength(0);
    });
  });

  describe('Array Validation - BookedSeats', () => {
    it('should accept an array of strings for bookedSeats', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 97,
        bookedSeats: ['A1', 'A2', 'A3']
      });

      expect(v_session.bookedSeats).toHaveLength(3);
      expect(v_session.bookedSeats).toContain('A1');
      expect(v_session.bookedSeats).toContain('A2');
      expect(v_session.bookedSeats).toContain('A3');
    });

    it('should accept an empty array for bookedSeats', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100,
        bookedSeats: []
      });

      expect(v_session.bookedSeats).toHaveLength(0);
    });

    it('should accept a single booked seat', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 99,
        bookedSeats: ['B5']
      });

      expect(v_session.bookedSeats).toHaveLength(1);
      expect(v_session.bookedSeats[0]).toBe('B5');
    });

    it('should handle various seat formats', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 96,
        bookedSeats: ['A1', 'B12', 'VIP-1', 'Row1-Seat5']
      });

      expect(v_session.bookedSeats).toHaveLength(4);
    });
  });

  describe('Type Validation', () => {
    it('should accept number for price', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 19.99,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.price).toBe(19.99);
    });

    it('should cast string number to number for price', () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: '25.50',
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.price).toBe(25.5);
      expect(typeof v_session.price).toBe('number');
    });

    it('should accept number for totalSeats', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 200,
        availableSeats: 200
      });

      expect(v_session.totalSeats).toBe(200);
    });

    it('should accept number for availableSeats', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 50
      });

      expect(v_session.availableSeats).toBe(50);
    });

    it('should accept Date for sessionTime', () => {
      const v_date = new Date('2024-12-25T19:00:00Z');
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: v_date,
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.sessionTime.getTime()).toBe(v_date.getTime());
    });

    it('should cast string date to Date for sessionTime', () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: '2024-12-25T19:00:00Z',
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.sessionTime instanceof Date).toBe(true);
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid movie session with all fields', async () => {
      const v_sessionData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date('2024-12-25T19:00:00Z'),
        price: 18.50,
        totalSeats: 150,
        availableSeats: 145,
        bookedSeats: ['A1', 'A2', 'A3', 'A4', 'A5'],
        status: 'scheduled'
      };

      const v_session = new MovieSession(v_sessionData);

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.price).toBe(v_sessionData.price);
      expect(v_session.totalSeats).toBe(v_sessionData.totalSeats);
      expect(v_session.availableSeats).toBe(v_sessionData.availableSeats);
      expect(v_session.bookedSeats).toHaveLength(5);
    });

    it('should create a valid cancelled session', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100,
        status: 'cancelled'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.status).toBe('cancelled');
    });

    it('should generate an ObjectId for _id', () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_session._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 0,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.price).toBe(0);
    });

    it('should handle large price', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 999.99,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.price).toBe(999.99);
    });

    it('should handle zero availableSeats', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 0
      });

      expect(v_session.availableSeats).toBe(0);
    });

    it('should handle large totalSeats', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 10000,
        availableSeats: 10000
      });

      expect(v_session.totalSeats).toBe(10000);
    });

    it('should handle past sessionTime', async () => {
      const v_pastDate = new Date('2020-01-01T10:00:00Z');
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: v_pastDate,
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.sessionTime.getTime()).toBe(v_pastDate.getTime());
    });

    it('should handle future sessionTime', async () => {
      const v_futureDate = new Date('2030-12-31T23:59:59Z');
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: v_futureDate,
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.sessionTime.getTime()).toBe(v_futureDate.getTime());
    });

    it('should handle large number of booked seats', async () => {
      const v_bookedSeats = Array.from({ length: 500 }, (_, i) => `Seat${i}`);
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 500,
        availableSeats: 0,
        bookedSeats: v_bookedSeats
      });

      expect(v_session.bookedSeats).toHaveLength(500);
    });

    it('should handle decimal price with many decimal places', async () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.999999,
        totalSeats: 100,
        availableSeats: 100
      });

      expect(v_session.price).toBe(15.999999);
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      const v_json = v_session.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.price).toBe(15.00);
    });

    it('should have toObject method', () => {
      const v_session = new MovieSession({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        sessionTime: new Date(),
        price: 15.00,
        totalSeats: 100,
        availableSeats: 100
      });

      const v_obj = v_session.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.price).toBe(15.00);
    });
  });

  describe('Schema Options', () => {
    it('should have timestamps enabled', () => {
      expect(MovieSession.schema.options.timestamps).toBe(true);
    });

    it('should have correct model name', () => {
      expect(MovieSession.modelName).toBe('MovieSession');
    });
  });
});
