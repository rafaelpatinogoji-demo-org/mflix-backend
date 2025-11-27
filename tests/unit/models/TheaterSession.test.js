const mongoose = require('mongoose');
const TheaterSession = require('../../../src/models/TheaterSession');

describe('TheaterSession Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(TheaterSession.collection.collectionName).toBe('theater_sessions');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(TheaterSession.schema.paths);
      expect(v_schemaPaths).toContain('theater');
      expect(v_schemaPaths).toContain('movie');
      expect(v_schemaPaths).toContain('showtime');
      expect(v_schemaPaths).toContain('endTime');
      expect(v_schemaPaths).toContain('price');
      expect(v_schemaPaths).toContain('availableSeats');
      expect(v_schemaPaths).toContain('totalSeats');
      expect(v_schemaPaths).toContain('createdAt');
      expect(v_schemaPaths).toContain('_id');
    });
  });

  describe('Required Field Validation', () => {
    it('should require theater field', async () => {
      const v_session = new TheaterSession({
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
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

    it('should require movie field', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
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

    it('should require showtime field', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.showtime).toBeDefined();
      expect(v_error.errors.showtime.kind).toBe('required');
    });

    it('should require endTime field', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.endTime).toBeDefined();
      expect(v_error.errors.endTime.kind).toBe('required');
    });

    it('should require price field', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        availableSeats: 100,
        totalSeats: 100
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

    it('should require availableSeats field', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
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

    it('should require totalSeats field', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
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

    it('should pass validation with all required fields', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
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
    it('should accept valid ObjectId for theater', () => {
      const v_theaterId = new mongoose.Types.ObjectId();
      const v_session = new TheaterSession({
        theater: v_theaterId,
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.theater.toString()).toBe(v_theaterId.toString());
    });

    it('should accept valid ObjectId for movie', () => {
      const v_movieId = new mongoose.Types.ObjectId();
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: v_movieId,
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.movie.toString()).toBe(v_movieId.toString());
    });

    it('should have correct ref for theater', () => {
      const v_theaterPath = TheaterSession.schema.path('theater');
      expect(v_theaterPath.options.ref).toBe('Theater');
    });

    it('should have correct ref for movie', () => {
      const v_moviePath = TheaterSession.schema.path('movie');
      expect(v_moviePath.options.ref).toBe('Movie');
    });

    it('should accept string ObjectId and cast to ObjectId', () => {
      const v_theaterIdStr = new mongoose.Types.ObjectId().toString();
      const v_session = new TheaterSession({
        theater: v_theaterIdStr,
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(mongoose.Types.ObjectId.isValid(v_session.theater)).toBe(true);
    });
  });

  describe('Default Values', () => {
    it('should default createdAt to current date', () => {
      const v_beforeCreate = new Date();
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });
      const v_afterCreate = new Date();

      expect(v_session.createdAt).toBeDefined();
      expect(v_session.createdAt.getTime()).toBeGreaterThanOrEqual(v_beforeCreate.getTime());
      expect(v_session.createdAt.getTime()).toBeLessThanOrEqual(v_afterCreate.getTime());
    });
  });

  describe('Type Validation', () => {
    it('should accept number for price', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 19.99,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.price).toBe(19.99);
    });

    it('should cast string number to number for price', () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: '25.50',
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.price).toBe(25.5);
      expect(typeof v_session.price).toBe('number');
    });

    it('should accept number for availableSeats', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 75,
        totalSeats: 100
      });

      expect(v_session.availableSeats).toBe(75);
    });

    it('should accept number for totalSeats', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 200,
        totalSeats: 200
      });

      expect(v_session.totalSeats).toBe(200);
    });

    it('should accept Date for showtime', () => {
      const v_date = new Date('2024-12-25T19:00:00Z');
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: v_date,
        endTime: new Date('2024-12-25T21:30:00Z'),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.showtime.getTime()).toBe(v_date.getTime());
    });

    it('should accept Date for endTime', () => {
      const v_date = new Date('2024-12-25T21:30:00Z');
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date('2024-12-25T19:00:00Z'),
        endTime: v_date,
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.endTime.getTime()).toBe(v_date.getTime());
    });

    it('should cast string date to Date for showtime', () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: '2024-12-25T19:00:00Z',
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.showtime instanceof Date).toBe(true);
    });

    it('should cast string date to Date for endTime', () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: '2024-12-25T21:30:00Z',
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.endTime instanceof Date).toBe(true);
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid theater session with all fields', async () => {
      const v_sessionData = {
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date('2024-12-25T19:00:00Z'),
        endTime: new Date('2024-12-25T21:30:00Z'),
        price: 18.50,
        availableSeats: 145,
        totalSeats: 150,
        createdAt: new Date()
      };

      const v_session = new TheaterSession(v_sessionData);

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.price).toBe(v_sessionData.price);
      expect(v_session.availableSeats).toBe(v_sessionData.availableSeats);
      expect(v_session.totalSeats).toBe(v_sessionData.totalSeats);
    });

    it('should generate an ObjectId for _id', () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_session._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 0,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.price).toBe(0);
    });

    it('should handle large price', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 999.99,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.price).toBe(999.99);
    });

    it('should handle zero availableSeats', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 0,
        totalSeats: 100
      });

      expect(v_session.availableSeats).toBe(0);
    });

    it('should handle large totalSeats', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 10000,
        totalSeats: 10000
      });

      expect(v_session.totalSeats).toBe(10000);
    });

    it('should handle past showtime', async () => {
      const v_pastDate = new Date('2020-01-01T10:00:00Z');
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: v_pastDate,
        endTime: new Date('2020-01-01T12:30:00Z'),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.showtime.getTime()).toBe(v_pastDate.getTime());
    });

    it('should handle future showtime', async () => {
      const v_futureDate = new Date('2030-12-31T23:59:59Z');
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: v_futureDate,
        endTime: new Date('2031-01-01T02:30:00Z'),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.showtime.getTime()).toBe(v_futureDate.getTime());
    });

    it('should handle showtime and endTime on same day', async () => {
      const v_showtime = new Date('2024-12-25T14:00:00Z');
      const v_endTime = new Date('2024-12-25T16:30:00Z');
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: v_showtime,
        endTime: v_endTime,
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.showtime.getTime()).toBeLessThan(v_session.endTime.getTime());
    });

    it('should handle decimal price with many decimal places', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.999999,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.price).toBe(15.999999);
    });

    it('should handle negative price', async () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: -5.00,
        availableSeats: 100,
        totalSeats: 100
      });

      expect(v_session.price).toBe(-5.00);
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      const v_json = v_session.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.price).toBe(15.00);
    });

    it('should have toObject method', () => {
      const v_session = new TheaterSession({
        theater: new mongoose.Types.ObjectId(),
        movie: new mongoose.Types.ObjectId(),
        showtime: new Date(),
        endTime: new Date(),
        price: 15.00,
        availableSeats: 100,
        totalSeats: 100
      });

      const v_obj = v_session.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.price).toBe(15.00);
    });
  });

  describe('Schema Options', () => {
    it('should not have timestamps option enabled', () => {
      expect(TheaterSession.schema.options.timestamps).toBeFalsy();
    });

    it('should have correct model name', () => {
      expect(TheaterSession.modelName).toBe('TheaterSession');
    });
  });
});
