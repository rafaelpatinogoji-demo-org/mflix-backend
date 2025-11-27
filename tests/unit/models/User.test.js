const mongoose = require('mongoose');
const User = require('../../../src/models/User');

describe('User Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(User.collection.collectionName).toBe('users');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(User.schema.paths);
      expect(v_schemaPaths).toContain('name');
      expect(v_schemaPaths).toContain('email');
      expect(v_schemaPaths).toContain('password');
      expect(v_schemaPaths).toContain('_id');
    });
  });

  describe('Required Field Validation', () => {
    it('should require name field', async () => {
      const v_user = new User({
        email: 'test@example.com',
        password: 'password123'
      });

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.name).toBeDefined();
      expect(v_error.errors.name.kind).toBe('required');
    });

    it('should require email field', async () => {
      const v_user = new User({
        name: 'Test User',
        password: 'password123'
      });

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.email).toBeDefined();
      expect(v_error.errors.email.kind).toBe('required');
    });

    it('should require password field', async () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com'
      });

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.password).toBeDefined();
      expect(v_error.errors.password.kind).toBe('required');
    });

    it('should pass validation with all required fields', async () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should fail validation with no fields', async () => {
      const v_user = new User({});

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.name).toBeDefined();
      expect(v_error.errors.email).toBeDefined();
      expect(v_error.errors.password).toBeDefined();
    });
  });

  describe('Type Validation', () => {
    it('should accept string for name', async () => {
      const v_user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(v_user.name).toBe('John Doe');
      expect(typeof v_user.name).toBe('string');
    });

    it('should accept string for email', async () => {
      const v_user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(v_user.email).toBe('john@example.com');
      expect(typeof v_user.email).toBe('string');
    });

    it('should accept string for password', async () => {
      const v_user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123!'
      });

      expect(v_user.password).toBe('securePassword123!');
      expect(typeof v_user.password).toBe('string');
    });

    it('should cast number to string for name', () => {
      const v_user = new User({
        name: 12345,
        email: 'test@example.com',
        password: 'password123'
      });

      expect(v_user.name).toBe('12345');
      expect(typeof v_user.name).toBe('string');
    });

    it('should cast number to string for email', () => {
      const v_user = new User({
        name: 'Test User',
        email: 12345,
        password: 'password123'
      });

      expect(v_user.email).toBe('12345');
      expect(typeof v_user.email).toBe('string');
    });
  });

  describe('Unique Constraint - Email', () => {
    it('should have unique constraint on email field', () => {
      const v_emailPath = User.schema.path('email');
      expect(v_emailPath.options.unique).toBe(true);
    });

    it('should have index on email field', () => {
      const v_indexes = User.schema.indexes();
      const v_emailIndex = v_indexes.find(index => index[0].email !== undefined);
      expect(v_emailIndex).toBeDefined();
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid user with all fields', async () => {
      const v_userData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'MySecurePassword123!'
      };

      const v_user = new User(v_userData);

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_user.name).toBe(v_userData.name);
      expect(v_user.email).toBe(v_userData.email);
      expect(v_user.password).toBe(v_userData.password);
    });

    it('should generate an ObjectId for _id', () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      expect(v_user._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_user._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long name', async () => {
      const v_longName = 'A'.repeat(500);
      const v_user = new User({
        name: v_longName,
        email: 'test@example.com',
        password: 'password123'
      });

      expect(v_user.name).toBe(v_longName);
      expect(v_user.name.length).toBe(500);
    });

    it('should handle very long email', async () => {
      const v_longEmail = 'a'.repeat(200) + '@example.com';
      const v_user = new User({
        name: 'Test User',
        email: v_longEmail,
        password: 'password123'
      });

      expect(v_user.email).toBe(v_longEmail);
    });

    it('should handle very long password', async () => {
      const v_longPassword = 'P'.repeat(1000);
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: v_longPassword
      });

      expect(v_user.password).toBe(v_longPassword);
      expect(v_user.password.length).toBe(1000);
    });

    it('should handle special characters in name', async () => {
      const v_user = new User({
        name: "John O'Brien-Smith Jr.",
        email: 'test@example.com',
        password: 'password123'
      });

      expect(v_user.name).toBe("John O'Brien-Smith Jr.");
    });

    it('should handle unicode characters in name', async () => {
      const v_user = new User({
        name: '张三 Иван Müller',
        email: 'test@example.com',
        password: 'password123'
      });

      expect(v_user.name).toBe('张三 Иван Müller');
    });

    it('should handle special characters in email', async () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test+tag@sub.example.com',
        password: 'password123'
      });

      expect(v_user.email).toBe('test+tag@sub.example.com');
    });

    it('should handle special characters in password', async () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@$$w0rd!#$%^&*()_+-=[]{}|;:,.<>?'
      });

      expect(v_user.password).toBe('P@$$w0rd!#$%^&*()_+-=[]{}|;:,.<>?');
    });

    it('should handle empty string name validation error', async () => {
      const v_user = new User({
        name: '',
        email: 'test@example.com',
        password: 'password123'
      });

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.name).toBeDefined();
    });

    it('should handle empty string email validation error', async () => {
      const v_user = new User({
        name: 'Test User',
        email: '',
        password: 'password123'
      });

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.email).toBeDefined();
    });

    it('should handle empty string password validation error', async () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: ''
      });

      let v_error;
      try {
        await v_user.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.password).toBeDefined();
    });

    it('should handle whitespace-only name', async () => {
      const v_user = new User({
        name: '   ',
        email: 'test@example.com',
        password: 'password123'
      });

      expect(v_user.name).toBe('   ');
    });

    it('should handle email without @ symbol', async () => {
      const v_user = new User({
        name: 'Test User',
        email: 'invalidemail.com',
        password: 'password123'
      });

      expect(v_user.email).toBe('invalidemail.com');
    });

    it('should handle numeric password', async () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: '123456789'
      });

      expect(v_user.password).toBe('123456789');
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const v_json = v_user.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.name).toBe('Test User');
      expect(v_json.email).toBe('test@example.com');
    });

    it('should have toObject method', () => {
      const v_user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const v_obj = v_user.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.name).toBe('Test User');
      expect(v_obj.email).toBe('test@example.com');
    });
  });

  describe('Schema Options', () => {
    it('should not have timestamps enabled by default', () => {
      expect(User.schema.options.timestamps).toBeFalsy();
    });

    it('should have correct model name', () => {
      expect(User.modelName).toBe('User');
    });
  });
});
