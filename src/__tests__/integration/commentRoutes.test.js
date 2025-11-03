const request = require('supertest');
const express = require('express');
const commentRoutes = require('../../routes/commentRoutes');
const Comment = require('../../models/Comment');
const { mockComment } = require('../mocks/mockModels');

jest.mock('../../models/Comment');
jest.mock('../../config/database', () => jest.fn());

const app = express();
app.use(express.json());
app.use('/api/comments', commentRoutes);

describe('Comment Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/comments', () => {
    it('should return paginated comments with movie population', async () => {
      const mockComments = [mockComment, { ...mockComment, _id: '507f1f77bcf86cd799439015' }];
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      });
      Comment.countDocuments.mockResolvedValue(25);

      const response = await request(app).get('/api/comments');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages', 3);
      expect(response.body).toHaveProperty('totalComments', 25);
    });

    it('should handle pagination query parameters', async () => {
      const mockComments = [mockComment];
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      });
      Comment.countDocuments.mockResolvedValue(100);

      const response = await request(app).get('/api/comments?page=5&limit=20');

      expect(response.status).toBe(200);
      expect(response.body.currentPage).toBe(5);
      expect(response.body.totalPages).toBe(5);
    });

    it('should handle database errors', async () => {
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app).get('/api/comments');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Database error');
    });
  });

  describe('GET /api/comments/:id', () => {
    it('should return comment by id with movie population', async () => {
      Comment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockComment)
      });

      const response = await request(app).get('/api/comments/507f1f77bcf86cd799439012');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', mockComment._id);
      expect(response.body).toHaveProperty('text', mockComment.text);
      expect(response.body).toHaveProperty('movie_id');
    });

    it('should return 404 when comment not found', async () => {
      Comment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app).get('/api/comments/507f1f77bcf86cd799439012');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Comment not found');
    });

    it('should handle invalid id format', async () => {
      Comment.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Invalid ID format'))
      });

      const response = await request(app).get('/api/comments/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/comments/movie/:movieId', () => {
    it('should return comments filtered by movie_id', async () => {
      const movieComments = [mockComment, { ...mockComment, _id: '507f1f77bcf86cd799439016' }];
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(movieComments)
      });

      const response = await request(app).get('/api/comments/movie/507f1f77bcf86cd799439013');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should return empty array when no comments for movie', async () => {
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      const response = await request(app).get('/api/comments/movie/507f1f77bcf86cd799439013');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle database errors', async () => {
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app).get('/api/comments/movie/507f1f77bcf86cd799439013');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/comments', () => {
    it('should create a new comment', async () => {
      const newComment = {
        name: 'New Commenter',
        email: 'newcomment@example.com',
        movie_id: '507f1f77bcf86cd799439013',
        text: 'Great movie!'
      };
      const savedComment = { ...mockComment, _id: '507f1f77bcf86cd799439020' };
      Comment.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedComment)
      }));
      Comment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(savedComment)
      });

      const response = await request(app)
        .post('/api/comments')
        .send(newComment);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('text');
    });

    it('should return 400 when required fields are missing', async () => {
      Comment.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Validation error: movie_id is required'))
      }));

      const response = await request(app)
        .post('/api/comments')
        .send({ text: 'Comment without movie_id' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when movie_id is invalid', async () => {
      Comment.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Invalid movie_id'))
      }));

      const response = await request(app)
        .post('/api/comments')
        .send({
          name: 'Test',
          email: 'test@test.com',
          movie_id: 'invalid',
          text: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('should update comment', async () => {
      const updatedData = { text: 'Updated comment text' };
      const updatedComment = { ...mockComment, ...updatedData };
      Comment.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedComment)
      });

      const response = await request(app)
        .put('/api/comments/507f1f77bcf86cd799439012')
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('text', 'Updated comment text');
    });

    it('should return 404 when comment not found', async () => {
      Comment.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .put('/api/comments/507f1f77bcf86cd799439012')
        .send({ text: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Comment not found');
    });

    it('should return 400 when validation fails', async () => {
      Comment.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Validation error'))
      });

      const response = await request(app)
        .put('/api/comments/507f1f77bcf86cd799439012')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('should delete comment', async () => {
      Comment.findByIdAndDelete.mockResolvedValue(mockComment);

      const response = await request(app).delete('/api/comments/507f1f77bcf86cd799439012');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Comment deleted successfully');
    });

    it('should return 404 when comment not found', async () => {
      Comment.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/comments/507f1f77bcf86cd799439012');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Comment not found');
    });

    it('should handle database errors', async () => {
      Comment.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/comments/507f1f77bcf86cd799439012');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });
});
