const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../../src/config/database', () => jest.fn());
jest.mock('../../src/models/Comment');
jest.mock('../../src/models/Movie');

const Comment = require('../../src/models/Comment');
const { mockComment } = require('../utils/mockFactories');

describe('Comment API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = require('../../app');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/comments', () => {
    it('should return paginated comments', async () => {
      const mockComments = [mockComment(), mockComment({ _id: '507f1f77bcf86cd799439012' })];
      const mockTotal = 25;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);
      Comment.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      const response = await request(app)
        .get('/api/comments?page=1&limit=10')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('comments');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages', 3);
      expect(response.body).toHaveProperty('totalComments', 25);
    });
  });

  describe('GET /api/comments/:id', () => {
    it('should return a single comment', async () => {
      const mockCommentData = mockComment();
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockCommentData)
      };

      Comment.findById = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/comments/507f1f77bcf86cd799439011')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('text');
    });

    it('should return 404 for non-existent comment', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Comment.findById = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/comments/507f1f77bcf86cd799439099')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Comment not found');
    });
  });

  describe('POST /api/comments', () => {
    it('should create a new comment', async () => {
      const commentData = {
        name: 'Test User',
        email: 'test@example.com',
        movie_id: '507f1f77bcf86cd799439012',
        text: 'Test comment',
        rating: 7
      };
      const savedComment = { _id: '507f1f77bcf86cd799439011', ...commentData };
      const populatedComment = mockComment();

      const mockSave = jest.fn().mockResolvedValue(savedComment);
      Comment.mockImplementation(() => ({
        save: mockSave
      }));

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(populatedComment)
      };
      Comment.findById = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app)
        .post('/api/comments')
        .send(commentData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('text');
    });

    it('should return 400 for validation errors', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Validation failed'));
      Comment.mockImplementation(() => ({
        save: mockSave
      }));

      const response = await request(app)
        .post('/api/comments')
        .send({ text: 'Missing required fields' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('should update an existing comment', async () => {
      const updatedComment = mockComment({ text: 'Updated text' });
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(updatedComment)
      };

      Comment.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app)
        .put('/api/comments/507f1f77bcf86cd799439011')
        .send({ text: 'Updated text' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('text', 'Updated text');
    });

    it('should return 404 for non-existent comment', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Comment.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app)
        .put('/api/comments/507f1f77bcf86cd799439099')
        .send({ text: 'Updated text' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Comment not found');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('should delete a comment', async () => {
      const deletedComment = mockComment();
      Comment.findByIdAndDelete = jest.fn().mockResolvedValue(deletedComment);

      const response = await request(app)
        .delete('/api/comments/507f1f77bcf86cd799439011')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Comment deleted successfully');
    });

    it('should return 404 for non-existent comment', async () => {
      Comment.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/comments/507f1f77bcf86cd799439099')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Comment not found');
    });
  });

  describe('GET /api/comments/movie/:movieId', () => {
    it('should return comments for a specific movie', async () => {
      const mockComments = [mockComment(), mockComment()];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/comments/movie/507f1f77bcf86cd799439012')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PATCH /api/comments/:id/vote', () => {
    it('should increment helpful votes', async () => {
      const updatedComment = mockComment({ helpful_votes: 6 });
      Comment.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedComment);

      const response = await request(app)
        .patch('/api/comments/507f1f77bcf86cd799439011/vote')
        .send({ voteType: 'helpful' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('helpful_votes');
    });

    it('should return 400 for invalid vote type', async () => {
      const response = await request(app)
        .patch('/api/comments/507f1f77bcf86cd799439011/vote')
        .send({ voteType: 'invalid' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});
