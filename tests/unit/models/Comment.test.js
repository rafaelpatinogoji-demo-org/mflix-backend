const mongoose = require('mongoose');
const Comment = require('../../../src/models/Comment');

describe('Comment Model Unit Tests', () => {
  describe('Schema Validation', () => {
    it('should create a valid comment with all required fields', () => {
      const v_validComment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      const v_error = v_validComment.validateSync();
      expect(v_error).toBeUndefined();
    });

    it('should fail validation when name is missing', () => {
      const v_invalidComment = new Comment({
        email: 'john@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      const v_error = v_invalidComment.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.name).toBeDefined();
    });

    it('should fail validation when email is missing', () => {
      const v_invalidComment = new Comment({
        name: 'John Doe',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      const v_error = v_invalidComment.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.email).toBeDefined();
    });

    it('should fail validation when movie_id is missing', () => {
      const v_invalidComment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        text: 'Great movie!'
      });

      const v_error = v_invalidComment.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.movie_id).toBeDefined();
    });

    it('should fail validation when text is missing', () => {
      const v_invalidComment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: new mongoose.Types.ObjectId()
      });

      const v_error = v_invalidComment.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.text).toBeDefined();
    });

    it('should fail validation when rating is below minimum (1)', () => {
      const v_invalidComment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        rating: 0
      });

      const v_error = v_invalidComment.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.rating).toBeDefined();
    });

    it('should fail validation when rating is above maximum (10)', () => {
      const v_invalidComment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        rating: 11
      });

      const v_error = v_invalidComment.validateSync();
      expect(v_error).toBeDefined();
      expect(v_error.errors.rating).toBeDefined();
    });

    it('should accept valid rating between 1 and 10', () => {
      const v_validComment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        rating: 8
      });

      const v_error = v_validComment.validateSync();
      expect(v_error).toBeUndefined();
      expect(v_validComment.rating).toBe(8);
    });

    it('should set default values for optional fields', () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment.helpful_votes).toBe(0);
      expect(v_comment.not_helpful_votes).toBe(0);
      expect(v_comment.date).toBeDefined();
    });

    it('should validate movie_id as ObjectId reference', () => {
      const v_validObjectId = new mongoose.Types.ObjectId();
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: v_validObjectId,
        text: 'Great movie!'
      });

      expect(v_comment.movie_id).toEqual(v_validObjectId);
      expect(mongoose.Types.ObjectId.isValid(v_comment.movie_id)).toBe(true);
    });
  });
});
