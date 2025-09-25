const mongoose = require('mongoose');
const Comment = require('../../src/models/Comment');
const Movie = require('../../src/models/Movie');
const { testRequest, generateObjectId } = require('../utils/testHelpers');
const { validComment, validCommentsList, invalidComment, movieId1, movieId2 } = require('../fixtures/commentFixtures');
const { validMovie } = require('../fixtures/movieFixtures');

describe('Comment Routes', () => {
  let testMovieId1, testMovieId2;

  beforeAll(async () => {
    const movie1 = new Movie({ ...validMovie, title: 'Test Movie 1' });
    const movie2 = new Movie({ ...validMovie, title: 'Test Movie 2' });
    
    await movie1.save();
    await movie2.save();
    
    testMovieId1 = movie1._id.toString();
    testMovieId2 = movie2._id.toString();
  });

  describe('GET /api/comments', () => {
    beforeEach(async () => {
      const commentsWithValidMovieIds = validCommentsList.map((comment, index) => ({
        ...comment,
        movie_id: index === 2 ? testMovieId2 : testMovieId1
      }));
      
      await Comment.insertMany(commentsWithValidMovieIds);
    });

    it('should return a list of comments with pagination', async () => {
      const response = await testRequest.get('/api/comments');
      
      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(3);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalComments).toBe(3);
    });

    it('should return paginated results based on page and limit parameters', async () => {
      const response = await testRequest.get('/api/comments?page=1&limit=2');
      
      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should populate movie data in comments', async () => {
      const response = await testRequest.get('/api/comments');
      
      expect(response.status).toBe(200);
      expect(response.body.comments[0].movie_id).toBeDefined();
    });

    it('should handle errors and return 500 status', async () => {
      jest.spyOn(Comment, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await testRequest.get('/api/comments');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/comments/movie/:movieId', () => {
    beforeEach(async () => {
      const commentsWithValidMovieIds = validCommentsList.map((comment, index) => ({
        ...comment,
        movie_id: index === 2 ? testMovieId2 : testMovieId1
      }));
      
      await Comment.insertMany(commentsWithValidMovieIds);
    });

    it('should return comments for a specific movie', async () => {
      const response = await testRequest.get(`/api/comments/movie/${testMovieId1}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach(comment => {
        expect(comment.movie_id).toBeDefined();
      });
    });

    it('should return empty array if no comments exist for the movie', async () => {
      const nonExistentMovieId = generateObjectId();
      const response = await testRequest.get(`/api/comments/movie/${nonExistentMovieId}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.get('/api/comments/movie/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/comments/:id', () => {
    let commentId;

    beforeEach(async () => {
      const comment = new Comment({
        ...validComment,
        movie_id: testMovieId1
      });
      await comment.save();
      commentId = comment._id.toString();
    });

    it('should return a comment by ID', async () => {
      const response = await testRequest.get(`/api/comments/${commentId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(validComment.name);
      expect(response.body.email).toBe(validComment.email);
      expect(response.body.text).toBe(validComment.text);
    });

    it('should return 404 if comment not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.get(`/api/comments/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Comment not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.get('/api/comments/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/comments', () => {
    it('should create a new comment', async () => {
      const commentData = {
        ...validComment,
        movie_id: testMovieId1
      };
      
      const response = await testRequest.post('/api/comments').send(commentData);
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe(commentData.name);
      expect(response.body.email).toBe(commentData.email);
      expect(response.body.text).toBe(commentData.text);
      expect(response.body.movie_id).toBeDefined();
      
      const savedComment = await Comment.findById(response.body._id);
      expect(savedComment).not.toBeNull();
    });

    it('should return 400 for invalid comment data', async () => {
      const response = await testRequest.post('/api/comments').send(invalidComment);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should accept non-existent movie reference', async () => {
      const commentWithInvalidMovieId = {
        ...validComment,
        movie_id: generateObjectId() // Non-existent movie ID
      };
      
      const response = await testRequest.post('/api/comments').send(commentWithInvalidMovieId);
      
      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });
  });

  describe('PUT /api/comments/:id', () => {
    let commentId;

    beforeEach(async () => {
      const comment = new Comment({
        ...validComment,
        movie_id: testMovieId1
      });
      await comment.save();
      commentId = comment._id.toString();
    });

    it('should update an existing comment', async () => {
      const updatedData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        text: 'Updated comment text'
      };

      const response = await testRequest.put(`/api/comments/${commentId}`).send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.email).toBe(updatedData.email);
      expect(response.body.text).toBe(updatedData.text);
      
      const updatedComment = await Comment.findById(commentId);
      expect(updatedComment.name).toBe(updatedData.name);
    });

    it('should return 404 if comment not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.put(`/api/comments/${nonExistentId}`).send({
        text: 'Updated text'
      });
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Comment not found');
    });

    it('should update movie reference correctly', async () => {
      const updatedData = {
        movie_id: testMovieId2 // Change movie reference
      };

      const response = await testRequest.put(`/api/comments/${commentId}`).send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.movie_id).toBeDefined();
    });
  });

  describe('DELETE /api/comments/:id', () => {
    let commentId;

    beforeEach(async () => {
      const comment = new Comment({
        ...validComment,
        movie_id: testMovieId1
      });
      await comment.save();
      commentId = comment._id.toString();
    });

    it('should delete an existing comment', async () => {
      const response = await testRequest.delete(`/api/comments/${commentId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Comment deleted successfully');
      
      const deletedComment = await Comment.findById(commentId);
      expect(deletedComment).toBeNull();
    });

    it('should return 404 if comment not found', async () => {
      const nonExistentId = generateObjectId();
      const response = await testRequest.delete(`/api/comments/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Comment not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await testRequest.delete('/api/comments/invalidid');
      
      expect(response.status).toBe(500);
      expect(response.body.message).toBeDefined();
    });
  });
});
