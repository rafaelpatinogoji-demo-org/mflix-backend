jest.mock('../../../src/models/Comment');

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../../../src/models/Comment');
const commentRoutes = require('../../../src/routes/commentRoutes');

const v_app = express();
v_app.use(express.json());
v_app.use('/api/comments', commentRoutes);

describe('Comment Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/comments - Get all comments', () => {
    it('should return paginated comments with 200 status', async () => {
      const v_mockComments = [
        { _id: '1', name: 'User1', text: 'Comment 1', movie_id: { title: 'Movie1', year: 2020 } },
        { _id: '2', name: 'User2', text: 'Comment 2', movie_id: { title: 'Movie2', year: 2021 } }
      ];

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(v_mockComments)
      };

      Comment.find.mockReturnValue(v_mockQuery);
      Comment.countDocuments.mockResolvedValue(20);

      const v_response = await request(v_app)
        .get('/api/comments')
        .expect(200);

      expect(v_response.body).toHaveProperty('comments');
      expect(v_response.body).toHaveProperty('currentPage');
      expect(v_response.body).toHaveProperty('totalPages');
      expect(v_response.body).toHaveProperty('totalComments');
      expect(v_response.body.comments).toEqual(v_mockComments);
    });

    it('should handle pagination query parameters', async () => {
      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      Comment.find.mockReturnValue(v_mockQuery);
      Comment.countDocuments.mockResolvedValue(0);

      const v_response = await request(v_app)
        .get('/api/comments?page=2&limit=5')
        .expect(200);

      expect(v_mockQuery.skip).toHaveBeenCalledWith(5);
      expect(v_mockQuery.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('GET /api/comments/:id - Get comment by ID', () => {
    it('should return a comment with 200 status when found', async () => {
      const v_mockComment = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        text: 'Great movie!',
        movie_id: { title: 'Inception', year: 2010 }
      };

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(v_mockComment)
      };

      Comment.findById.mockReturnValue(v_mockQuery);

      const v_response = await request(v_app)
        .get('/api/comments/507f1f77bcf86cd799439011')
        .expect(200);

      expect(v_response.body).toEqual(v_mockComment);
    });

    it('should return 404 when comment not found', async () => {
      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Comment.findById.mockReturnValue(v_mockQuery);

      const v_response = await request(v_app)
        .get('/api/comments/507f1f77bcf86cd799439011')
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Comment not found');
    });
  });

  describe('POST /api/comments - Create new comment', () => {
    it('should create a new comment with 201 status', async () => {
      const v_commentData = {
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: '507f1f77bcf86cd799439011',
        text: 'Great movie!',
        rating: 9
      };

      const v_savedComment = { _id: 'newid123', ...v_commentData };
      const v_populatedComment = {
        ...v_savedComment,
        movie_id: { _id: '507f1f77bcf86cd799439011', title: 'Inception', year: 2010 }
      };

      const v_mockCommentInstance = {
        save: jest.fn().mockResolvedValue(v_savedComment)
      };

      Comment.mockImplementation(() => v_mockCommentInstance);

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(v_populatedComment)
      };

      Comment.findById.mockReturnValue(v_mockQuery);

      const v_response = await request(v_app)
        .post('/api/comments')
        .send(v_commentData)
        .expect(201);

      expect(v_response.body).toEqual(v_populatedComment);
    });

    it('should return 400 for validation errors', async () => {
      const v_invalidData = { name: 'John Doe' }; // Missing required fields

      const v_error = new Error('Validation failed');
      const v_mockCommentInstance = {
        save: jest.fn().mockRejectedValue(v_error)
      };

      Comment.mockImplementation(() => v_mockCommentInstance);

      const v_response = await request(v_app)
        .post('/api/comments')
        .send(v_invalidData)
        .expect(400);

      expect(v_response.body).toHaveProperty('message', 'Validation failed');
    });
  });

  describe('PUT /api/comments/:id - Update comment', () => {
    it('should update a comment with 200 status', async () => {
      const v_updatedData = { text: 'Updated comment text', rating: 10 };
      const v_updatedComment = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        text: 'Updated comment text',
        rating: 10,
        movie_id: { title: 'Inception', year: 2010 }
      };

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(v_updatedComment)
      };

      Comment.findByIdAndUpdate.mockReturnValue(v_mockQuery);

      const v_response = await request(v_app)
        .put('/api/comments/507f1f77bcf86cd799439011')
        .send(v_updatedData)
        .expect(200);

      expect(v_response.body).toEqual(v_updatedComment);
    });

    it('should return 404 when updating non-existent comment', async () => {
      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Comment.findByIdAndUpdate.mockReturnValue(v_mockQuery);

      const v_response = await request(v_app)
        .put('/api/comments/507f1f77bcf86cd799439011')
        .send({ text: 'Updated text' })
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Comment not found');
    });
  });

  describe('DELETE /api/comments/:id - Delete comment', () => {
    it('should delete a comment with 200 status', async () => {
      const v_deletedComment = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        text: 'Comment to delete'
      };

      Comment.findByIdAndDelete.mockResolvedValue(v_deletedComment);

      const v_response = await request(v_app)
        .delete('/api/comments/507f1f77bcf86cd799439011')
        .expect(200);

      expect(v_response.body).toHaveProperty('message', 'Comment deleted successfully');
    });

    it('should return 404 when deleting non-existent comment', async () => {
      Comment.findByIdAndDelete.mockResolvedValue(null);

      const v_response = await request(v_app)
        .delete('/api/comments/507f1f77bcf86cd799439011')
        .expect(404);

      expect(v_response.body).toHaveProperty('message', 'Comment not found');
    });
  });

  describe('PATCH /api/comments/:id/vote - Update helpful votes', () => {
    it('should increment helpful votes with 200 status', async () => {
      const v_updatedComment = {
        _id: '507f1f77bcf86cd799439011',
        helpful_votes: 5,
        not_helpful_votes: 1
      };

      Comment.findByIdAndUpdate.mockResolvedValue(v_updatedComment);

      const v_response = await request(v_app)
        .patch('/api/comments/507f1f77bcf86cd799439011/vote')
        .send({ voteType: 'helpful' })
        .expect(200);

      expect(v_response.body).toEqual(v_updatedComment);
    });

    it('should return 400 for invalid vote type', async () => {
      const v_response = await request(v_app)
        .patch('/api/comments/507f1f77bcf86cd799439011/vote')
        .send({ voteType: 'invalid' })
        .expect(400);

      expect(v_response.body).toHaveProperty('message');
      expect(v_response.body.message).toContain('Invalid vote type');
    });
  });

  describe('GET /api/comments/movie/:movieId - Get comments by movie', () => {
    it('should return comments for a specific movie with 200 status', async () => {
      const v_mockComments = [
        { _id: '1', text: 'Comment 1', movie_id: { title: 'Inception', year: 2010 } },
        { _id: '2', text: 'Comment 2', movie_id: { title: 'Inception', year: 2010 } }
      ];

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(v_mockComments)
      };

      Comment.find.mockReturnValue(v_mockQuery);

      const v_response = await request(v_app)
        .get('/api/comments/movie/507f1f77bcf86cd799439011')
        .expect(200);

      expect(v_response.body).toEqual(v_mockComments);
      expect(Comment.find).toHaveBeenCalledWith({ movie_id: '507f1f77bcf86cd799439011' });
    });
  });
});
