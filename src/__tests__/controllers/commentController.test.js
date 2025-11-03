const {
  f_getAllComments,
  f_getCommentById,
  f_createComment,
  f_updateComment,
  f_deleteComment,
  f_getCommentsByMovie
} = require('../../controllers/commentController');
const Comment = require('../../models/Comment');
const { mockComment } = require('../mocks/mockModels');

jest.mock('../../models/Comment');

describe('CommentController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('f_getAllComments', () => {
    it('should return paginated comments with movie population', async () => {
      const mockComments = [mockComment, { ...mockComment, _id: '507f1f77bcf86cd799439015' }];
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      });
      Comment.countDocuments.mockResolvedValue(25);

      await f_getAllComments(mockReq, mockRes);

      expect(Comment.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        comments: mockComments,
        currentPage: 1,
        totalPages: 3,
        totalComments: 25
      });
    });

    it('should return paginated comments with custom page and limit', async () => {
      mockReq.query = { page: '3', limit: '20' };
      const mockComments = [mockComment];
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      });
      Comment.countDocuments.mockResolvedValue(50);

      await f_getAllComments(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        comments: mockComments,
        currentPage: 3,
        totalPages: 3,
        totalComments: 50
      });
    });

    it('should sort comments by date in descending order', async () => {
      const mockSort = jest.fn().mockResolvedValue([mockComment]);
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: mockSort
      });
      Comment.countDocuments.mockResolvedValue(10);

      await f_getAllComments(mockReq, mockRes);

      expect(mockSort).toHaveBeenCalledWith({ date: -1 });
    });

    it('should handle errors and return 500 status', async () => {
      const errorMessage = 'Database error';
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      await f_getAllComments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_getCommentById', () => {
    it('should return comment with movie population', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439012';
      Comment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockComment)
      });

      await f_getCommentById(mockReq, mockRes);

      expect(Comment.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockRes.json).toHaveBeenCalledWith(mockComment);
    });

    it('should return 404 when comment not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439012';
      Comment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await f_getCommentById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle errors and return 500 status', async () => {
      mockReq.params.id = 'invalid-id';
      const errorMessage = 'Invalid ID format';
      Comment.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      await f_getCommentById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_createComment', () => {
    it('should create comment with movie population and return 201 status', async () => {
      mockReq.body = {
        name: 'New Commenter',
        email: 'newcomment@example.com',
        movie_id: '507f1f77bcf86cd799439013',
        text: 'Amazing film!'
      };
      const savedComment = { ...mockComment, _id: '507f1f77bcf86cd799439020' };
      Comment.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedComment)
      }));
      Comment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(savedComment)
      });

      await f_createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(savedComment);
    });

    it('should return 400 when validation fails', async () => {
      mockReq.body = { text: 'Comment without required fields' };
      const errorMessage = 'Validation error: movie_id is required';
      Comment.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error(errorMessage))
      }));

      await f_createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });

    it('should return 400 when movie_id is invalid', async () => {
      mockReq.body = {
        name: 'Test',
        email: 'test@test.com',
        movie_id: 'invalid-movie-id',
        text: 'Test comment'
      };
      const errorMessage = 'Invalid movie_id';
      Comment.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error(errorMessage))
      }));

      await f_createComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_updateComment', () => {
    it('should update comment and return updated data with population', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439012';
      mockReq.body = { text: 'Updated comment text' };
      const updatedComment = { ...mockComment, text: 'Updated comment text' };
      Comment.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedComment)
      });

      await f_updateComment(mockReq, mockRes);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        mockReq.body,
        { new: true, runValidators: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedComment);
    });

    it('should return 404 when comment not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439012';
      mockReq.body = { text: 'Updated text' };
      Comment.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await f_updateComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should return 400 when validation fails', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439012';
      mockReq.body = { email: 'invalid-email' };
      const errorMessage = 'Validation error';
      Comment.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      await f_updateComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_deleteComment', () => {
    it('should delete comment and return success message', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439012';
      Comment.findByIdAndDelete.mockResolvedValue(mockComment);

      await f_deleteComment(mockReq, mockRes);

      expect(Comment.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
    });

    it('should return 404 when comment not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439012';
      Comment.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle errors and return 500 status', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439012';
      const errorMessage = 'Database error';
      Comment.findByIdAndDelete.mockRejectedValue(new Error(errorMessage));

      await f_deleteComment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('f_getCommentsByMovie', () => {
    it('should return comments filtered by movie_id with population', async () => {
      mockReq.params.movieId = '507f1f77bcf86cd799439013';
      const movieComments = [
        mockComment,
        { ...mockComment, _id: '507f1f77bcf86cd799439016' }
      ];
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(movieComments)
      });

      await f_getCommentsByMovie(mockReq, mockRes);

      expect(Comment.find).toHaveBeenCalledWith({ movie_id: '507f1f77bcf86cd799439013' });
      expect(mockRes.json).toHaveBeenCalledWith(movieComments);
    });

    it('should return empty array when no comments for movie', async () => {
      mockReq.params.movieId = '507f1f77bcf86cd799439013';
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      await f_getCommentsByMovie(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should sort comments by date in descending order', async () => {
      mockReq.params.movieId = '507f1f77bcf86cd799439013';
      const mockSort = jest.fn().mockResolvedValue([mockComment]);
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: mockSort
      });

      await f_getCommentsByMovie(mockReq, mockRes);

      expect(mockSort).toHaveBeenCalledWith({ date: -1 });
    });

    it('should handle errors and return 500 status', async () => {
      mockReq.params.movieId = '507f1f77bcf86cd799439013';
      const errorMessage = 'Database error';
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      await f_getCommentsByMovie(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});
