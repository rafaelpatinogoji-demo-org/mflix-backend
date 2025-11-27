const mongoose = require('mongoose');
const Comment = require('../../../src/models/Comment');

describe('Comment Model', () => {
  describe('Schema Definition', () => {
    it('should have the correct collection name', () => {
      expect(Comment.collection.collectionName).toBe('comments');
    });

    it('should have all expected fields defined in schema', () => {
      const v_schemaPaths = Object.keys(Comment.schema.paths);
      expect(v_schemaPaths).toContain('name');
      expect(v_schemaPaths).toContain('email');
      expect(v_schemaPaths).toContain('movie_id');
      expect(v_schemaPaths).toContain('text');
      expect(v_schemaPaths).toContain('date');
      expect(v_schemaPaths).toContain('rating');
      expect(v_schemaPaths).toContain('helpful_votes');
      expect(v_schemaPaths).toContain('not_helpful_votes');
      expect(v_schemaPaths).toContain('_id');
    });
  });

  describe('Required Field Validation', () => {
    it('should require name field', async () => {
      const v_comment = new Comment({
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.name).toBeDefined();
      expect(v_error.errors.name.kind).toBe('required');
    });

    it('should require email field', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.email).toBeDefined();
      expect(v_error.errors.email.kind).toBe('required');
    });

    it('should require movie_id field', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        text: 'Great movie!'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.movie_id).toBeDefined();
      expect(v_error.errors.movie_id.kind).toBe('required');
    });

    it('should require text field', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId()
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.text).toBeDefined();
      expect(v_error.errors.text.kind).toBe('required');
    });

    it('should pass validation with all required fields', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should not require rating field', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should not require helpful_votes field', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should not require not_helpful_votes field', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });
  });

  describe('Reference Validation (ObjectId)', () => {
    it('should accept valid ObjectId for movie_id', () => {
      const v_movieId = new mongoose.Types.ObjectId();
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: v_movieId,
        text: 'Great movie!'
      });

      expect(v_comment.movie_id.toString()).toBe(v_movieId.toString());
    });

    it('should have correct ref for movie_id', () => {
      const v_movieIdPath = Comment.schema.path('movie_id');
      expect(v_movieIdPath.options.ref).toBe('Movie');
    });

    it('should accept string ObjectId and cast to ObjectId', () => {
      const v_movieIdStr = new mongoose.Types.ObjectId().toString();
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: v_movieIdStr,
        text: 'Great movie!'
      });

      expect(mongoose.Types.ObjectId.isValid(v_comment.movie_id)).toBe(true);
    });
  });

  describe('Type Validation', () => {
    it('should accept string for name', async () => {
      const v_comment = new Comment({
        name: 'Jane Smith',
        email: 'jane@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Excellent film!'
      });

      expect(v_comment.name).toBe('Jane Smith');
      expect(typeof v_comment.name).toBe('string');
    });

    it('should accept string for email', async () => {
      const v_comment = new Comment({
        name: 'Jane Smith',
        email: 'jane@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Excellent film!'
      });

      expect(v_comment.email).toBe('jane@example.com');
      expect(typeof v_comment.email).toBe('string');
    });

    it('should accept string for text', async () => {
      const v_comment = new Comment({
        name: 'Jane Smith',
        email: 'jane@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'This is a detailed review of the movie.'
      });

      expect(v_comment.text).toBe('This is a detailed review of the movie.');
      expect(typeof v_comment.text).toBe('string');
    });

    it('should accept number for rating', async () => {
      const v_comment = new Comment({
        name: 'Jane Smith',
        email: 'jane@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        rating: 8
      });

      expect(v_comment.rating).toBe(8);
      expect(typeof v_comment.rating).toBe('number');
    });

    it('should accept number for helpful_votes', async () => {
      const v_comment = new Comment({
        name: 'Jane Smith',
        email: 'jane@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        helpful_votes: 25
      });

      expect(v_comment.helpful_votes).toBe(25);
    });

    it('should accept number for not_helpful_votes', async () => {
      const v_comment = new Comment({
        name: 'Jane Smith',
        email: 'jane@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        not_helpful_votes: 5
      });

      expect(v_comment.not_helpful_votes).toBe(5);
    });

    it('should accept Date for date', () => {
      const v_date = new Date('2024-06-15T10:30:00Z');
      const v_comment = new Comment({
        name: 'Jane Smith',
        email: 'jane@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        date: v_date
      });

      expect(v_comment.date.getTime()).toBe(v_date.getTime());
    });

    it('should cast string number to number for rating', () => {
      const v_comment = new Comment({
        name: 'Jane Smith',
        email: 'jane@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        rating: '7'
      });

      expect(v_comment.rating).toBe(7);
      expect(typeof v_comment.rating).toBe('number');
    });
  });

  describe('Min/Max Validation - Rating', () => {
    it('should accept rating at minimum value (1)', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Terrible movie!',
        rating: 1
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_comment.rating).toBe(1);
    });

    it('should accept rating at maximum value (10)', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Perfect movie!',
        rating: 10
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_comment.rating).toBe(10);
    });

    it('should accept rating in middle of range', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Average movie',
        rating: 5
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_comment.rating).toBe(5);
    });

    it('should reject rating below minimum (0)', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Bad movie',
        rating: 0
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.rating).toBeDefined();
      expect(v_error.errors.rating.kind).toBe('min');
    });

    it('should reject rating above maximum (11)', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie',
        rating: 11
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.rating).toBeDefined();
      expect(v_error.errors.rating.kind).toBe('max');
    });

    it('should reject negative rating', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Bad movie',
        rating: -5
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.rating).toBeDefined();
    });

    it('should have correct min value for rating', () => {
      const v_ratingPath = Comment.schema.path('rating');
      expect(v_ratingPath.options.min).toBe(1);
    });

    it('should have correct max value for rating', () => {
      const v_ratingPath = Comment.schema.path('rating');
      expect(v_ratingPath.options.max).toBe(10);
    });
  });

  describe('Default Values', () => {
    it('should default date to current date', () => {
      const v_beforeCreate = new Date();
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });
      const v_afterCreate = new Date();

      expect(v_comment.date).toBeDefined();
      expect(v_comment.date.getTime()).toBeGreaterThanOrEqual(v_beforeCreate.getTime());
      expect(v_comment.date.getTime()).toBeLessThanOrEqual(v_afterCreate.getTime());
    });

    it('should default helpful_votes to 0', () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment.helpful_votes).toBe(0);
    });

    it('should default not_helpful_votes to 0', () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment.not_helpful_votes).toBe(0);
    });
  });

  describe('Complete Document Validation', () => {
    it('should create a valid comment with all fields', async () => {
      const v_commentData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'This is an amazing movie with great acting and stunning visuals!',
        date: new Date('2024-06-15T10:30:00Z'),
        rating: 9,
        helpful_votes: 50,
        not_helpful_votes: 3
      };

      const v_comment = new Comment(v_commentData);

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
      expect(v_comment.name).toBe(v_commentData.name);
      expect(v_comment.email).toBe(v_commentData.email);
      expect(v_comment.text).toBe(v_commentData.text);
      expect(v_comment.rating).toBe(v_commentData.rating);
      expect(v_comment.helpful_votes).toBe(v_commentData.helpful_votes);
      expect(v_comment.not_helpful_votes).toBe(v_commentData.not_helpful_votes);
    });

    it('should create a valid comment with minimal fields', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Good movie'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeUndefined();
    });

    it('should generate an ObjectId for _id', () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment._id).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(v_comment._id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long name', async () => {
      const v_longName = 'A'.repeat(500);
      const v_comment = new Comment({
        name: v_longName,
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment.name).toBe(v_longName);
      expect(v_comment.name.length).toBe(500);
    });

    it('should handle very long email', async () => {
      const v_longEmail = 'a'.repeat(200) + '@example.com';
      const v_comment = new Comment({
        name: 'John Doe',
        email: v_longEmail,
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment.email).toBe(v_longEmail);
    });

    it('should handle very long text', async () => {
      const v_longText = 'B'.repeat(10000);
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: v_longText
      });

      expect(v_comment.text).toBe(v_longText);
      expect(v_comment.text.length).toBe(10000);
    });

    it('should handle special characters in name', async () => {
      const v_comment = new Comment({
        name: "John O'Brien-Smith Jr.",
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment.name).toBe("John O'Brien-Smith Jr.");
    });

    it('should handle unicode characters in name', async () => {
      const v_comment = new Comment({
        name: '张三 Иван Müller',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment.name).toBe('张三 Иван Müller');
    });

    it('should handle unicode characters in text', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: '这是一部很棒的电影！素晴らしい映画です！'
      });

      expect(v_comment.text).toBe('这是一部很棒的电影！素晴らしい映画です！');
    });

    it('should handle special characters in email', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test+tag@sub.example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      expect(v_comment.email).toBe('test+tag@sub.example.com');
    });

    it('should handle decimal rating', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        rating: 7.5
      });

      expect(v_comment.rating).toBe(7.5);
    });

    it('should handle large helpful_votes', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        helpful_votes: 1000000
      });

      expect(v_comment.helpful_votes).toBe(1000000);
    });

    it('should handle large not_helpful_votes', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        not_helpful_votes: 500000
      });

      expect(v_comment.not_helpful_votes).toBe(500000);
    });

    it('should handle past date', async () => {
      const v_pastDate = new Date('2010-01-01T00:00:00Z');
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!',
        date: v_pastDate
      });

      expect(v_comment.date.getTime()).toBe(v_pastDate.getTime());
    });

    it('should handle empty string name validation error', async () => {
      const v_comment = new Comment({
        name: '',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.name).toBeDefined();
    });

    it('should handle empty string text validation error', async () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: ''
      });

      let v_error;
      try {
        await v_comment.validate();
      } catch (p_err) {
        v_error = p_err;
      }

      expect(v_error).toBeDefined();
      expect(v_error.errors.text).toBeDefined();
    });
  });

  describe('Model Methods', () => {
    it('should have toJSON method', () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      const v_json = v_comment.toJSON();
      expect(v_json).toBeDefined();
      expect(v_json.name).toBe('John Doe');
    });

    it('should have toObject method', () => {
      const v_comment = new Comment({
        name: 'John Doe',
        email: 'test@example.com',
        movie_id: new mongoose.Types.ObjectId(),
        text: 'Great movie!'
      });

      const v_obj = v_comment.toObject();
      expect(v_obj).toBeDefined();
      expect(v_obj.name).toBe('John Doe');
    });
  });

  describe('Schema Options', () => {
    it('should not have timestamps option enabled', () => {
      expect(Comment.schema.options.timestamps).toBeFalsy();
    });

    it('should have correct model name', () => {
      expect(Comment.modelName).toBe('Comment');
    });
  });
});
