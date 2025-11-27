const mongoose = require('mongoose');
const Session = require('../../../src/models/Session');

describe('Session Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(Session.collection.collectionName).toBe('sessions');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(Session.schema.paths);
      expect(v_schemaPaths).toContain('user_id');
      expect(v_schemaPaths).toContain('jwt');
      expect(v_schemaPaths).toContain('expiry');
      expect(v_schemaPaths).toContain('status');
      expect(v_schemaPaths).toContain('createdAt');
      expect(v_schemaPaths).toContain('_id');
    });
  });

  describe('Required Field Validation', () => {
    it('should require user_id field', async () => {
      const v_session = new Session({
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.user_id).toBeDefined();
      expect(v_error.errors.user_id.kind).toBe('required');
    });

    it('should require jwt field', async () => {
      const v_session = new Session({
        user_id: 'user123',
        expiry: new Date()
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.jwt).toBeDefined();
      expect(v_error.errors.jwt.kind).toBe('required');
    });

    it('should require expiry field', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.expiry).toBeDefined();
      expect(v_error.errors.expiry.kind).toBe('required');
    });

    it('should pass validation with all required fields', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should fail validation with no fields', async () => {
      const v_session = new Session({});

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.user_id).toBeDefined();
      expect(v_error.errors.jwt).toBeDefined();
      expect(v_error.errors.expiry).toBeDefined();
    });
  });

  describe('Type Validation', () => {
    it('should accept string for user_id', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      expect(v_session.user_id).toBe('user123');
      expect(typeof v_session.user_id).toBe('string');
    });

    it('should accept string for jwt', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        expiry: new Date()
      });

      expect(v_session.jwt).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
      expect(typeof v_session.jwt).toBe('string');
    });

    it('should accept Date for expiry', () => {
      const v_date = new Date('2024-12-31T23:59:59Z');
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: v_date
      });

      expect(v_session.expiry.getTime()).toBe(v_date.getTime());
    });

    it('should cast string date to Date for expiry', () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: '2024-12-31T23:59:59Z'
      });

      expect(v_session.expiry instanceof Date).toBe(true);
    });

    it('should cast number to string for user_id', () => {
      const v_session = new Session({
        user_id: 12345,
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      expect(v_session.user_id).toBe('12345');
      expect(typeof v_session.user_id).toBe('string');
    });
  });

  describe('Enum Validation - Status', () => {
    it('should accept active status', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date(),
        status: 'active'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.status).toBe('active');
    });

    it('should accept inactive status', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date(),
        status: 'inactive'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.status).toBe('inactive');
    });

    it('should reject invalid status', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date(),
        status: 'expired'
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
      const v_statusPath = Session.schema.path('status');
      expect(v_statusPath.enumValues).toContain('active');
      expect(v_statusPath.enumValues).toContain('inactive');
      expect(v_statusPath.enumValues).toHaveLength(2);
    });
  });

  describe('Default Values', () => {
    it('should default status to active', () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      expect(v_session.status).toBe('active');
    });

    it('should default createdAt to current date', () => {
      const v_beforeCreate = new Date();
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });
      const v_afterCreate = new Date();

      expect(v_session.createdAt).toBeDefined();
      expect(v_session.createdAt.getTime()).toBeGreaterThanOrEqual(v_beforeCreate.getTime());
      expect(v_session.createdAt.getTime()).toBeLessThanOrEqual(v_afterCreate.getTime());
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid session with all fields', async () => {
      const v_sessionData = {
        user_id: 'user456',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        expiry: new Date('2024-12-31T23:59:59Z'),
        status: 'active',
        createdAt: new Date()
      };

      const v_session = new Session(v_sessionData);

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.user_id).toBe(v_sessionData.user_id);
      expect(v_session.jwt).toBe(v_sessionData.jwt);
      expect(v_session.status).toBe(v_sessionData.status);
    });

    it('should create a valid inactive session', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date(),
        status: 'inactive'
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_session.status).toBe('inactive');
    });

    it('should generate an ObjectId for _id', () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      expect(v_session._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_session._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long user_id', async () => {
      const v_longUserId = 'user_' + 'A'.repeat(500);
      const v_session = new Session({
        user_id: v_longUserId,
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      expect(v_session.user_id).toBe(v_longUserId);
      expect(v_session.user_id.length).toBe(505);
    });

    it('should handle very long jwt', async () => {
      const v_longJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'A'.repeat(2000);
      const v_session = new Session({
        user_id: 'user123',
        jwt: v_longJwt,
        expiry: new Date()
      });

      expect(v_session.jwt).toBe(v_longJwt);
    });

    it('should handle past expiry date', async () => {
      const v_pastDate = new Date('2020-01-01T00:00:00Z');
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: v_pastDate
      });

      expect(v_session.expiry.getTime()).toBe(v_pastDate.getTime());
    });

    it('should handle future expiry date', async () => {
      const v_futureDate = new Date('2050-12-31T23:59:59Z');
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: v_futureDate
      });

      expect(v_session.expiry.getTime()).toBe(v_futureDate.getTime());
    });

    it('should handle special characters in user_id', async () => {
      const v_session = new Session({
        user_id: 'user@example.com_123-456',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      expect(v_session.user_id).toBe('user@example.com_123-456');
    });

    it('should handle ObjectId string as user_id', async () => {
      const v_objectIdStr = new mongoose.Types.ObjectId().toString();
      const v_session = new Session({
        user_id: v_objectIdStr,
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      expect(v_session.user_id).toBe(v_objectIdStr);
    });

    it('should handle empty string user_id validation error', async () => {
      const v_session = new Session({
        user_id: '',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.user_id).toBeDefined();
    });

    it('should handle empty string jwt validation error', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: '',
        expiry: new Date()
      });

      let v_error;
      try {
        await v_session.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.jwt).toBeDefined();
    });

    it('should handle jwt with special characters', async () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        expiry: new Date()
      });

      expect(v_session.jwt).toContain('.');
      expect(v_session.jwt).toContain('_');
    });

    it('should handle unicode in user_id', async () => {
      const v_session = new Session({
        user_id: '用户123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      expect(v_session.user_id).toBe('用户123');
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      const v_json = v_session.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.user_id).toBe('user123');
    });

    it('should have toObject method', () => {
      const v_session = new Session({
        user_id: 'user123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: new Date()
      });

      const v_obj = v_session.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.user_id).toBe('user123');
    });
  });

  describe('Schema Options', () => {
    it('should not have timestamps option enabled', () => {
      expect(Session.schema.options.timestamps).toBeFalsy();
    });

    it('should have correct model name', () => {
      expect(Session.modelName).toBe('Session');
    });
  });
});
