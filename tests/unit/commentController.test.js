const {
  f_getAllComments,
  f_getCommentById,
  f_createComment,
  f_updateComment,
  f_deleteComment,
  f_getCommentsByMovie,
  f_getCommentStatsByMovie,
  f_getUserCommentHistory,
  f_getTopReviewers,
  f_updateHelpfulVotes,
  f_getRecentCommentsByGenre
} = require('../../src/controllers/commentController');

const { mockComment, mockMovie, mockRequest, mockResponse } = require('../utils/mockFactories');

jest.mock('../../src/models/Comment', () => {
  const mockComment = jest.fn().mockImplementation(() => ({
    save: jest.fn()
  }));
  
  mockComment.find = jest.fn();
  mockComment.findById = jest.fn();
  mockComment.findByIdAndUpdate = jest.fn();
  mockComment.findByIdAndDelete = jest.fn();
  mockComment.countDocuments = jest.fn();
  mockComment.aggregate = jest.fn();
  
  return mockComment;
});

jest.mock('mongoose');

const Comment = require('../../src/models/Comment');
const mongoose = require('mongoose');

describe('Comment Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
  });

  describe('f_getAllComments', () => {
    it('should return paginated comments with default pagination', async () => {
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

      req.query = {};

      await f_getAllComments(req, res);

      expect(Comment.find).toHaveBeenCalled();
      expect(mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
      expect(res.json).toHaveBeenCalledWith({
        comments: mockComments,
        currentPage: 1,
        totalPages: 3,
        totalComments: mockTotal
      });
    });

    it('should return paginated comments with custom pagination', async () => {
      const mockComments = [mockComment()];
      const mockTotal = 50;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);
      Comment.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.query = { page: '2', limit: '20' };

      await f_getAllComments(req, res);

      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(res.json).toHaveBeenCalledWith({
        comments: mockComments,
        currentPage: 2,
        totalPages: 3,
        totalComments: mockTotal
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Comment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error)
      });

      await f_getAllComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getCommentById', () => {
    it('should return a comment when found', async () => {
      const mockCommentData = mockComment();
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockCommentData)
      };

      Comment.findById = jest.fn().mockReturnValue(mockQuery);
      req.params = { id: '507f1f77bcf86cd799439011' };

      await f_getCommentById(req, res);

      expect(Comment.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(res.json).toHaveBeenCalledWith(mockCommentData);
    });

    it('should return 404 when comment not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Comment.findById = jest.fn().mockReturnValue(mockQuery);
      req.params = { id: '507f1f77bcf86cd799439011' };

      await f_getCommentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Comment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });
      req.params = { id: '507f1f77bcf86cd799439011' };

      await f_getCommentById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_createComment', () => {
    it('should create and return a new comment', async () => {
      const commentData = {
        name: 'John Doe',
        email: 'john@example.com',
        movie_id: '507f1f77bcf86cd799439012',
        text: 'Great movie!',
        rating: 8
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

      req.body = commentData;

      await f_createComment(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(Comment.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(populatedComment);
    });

    it('should return 400 for validation errors', async () => {
      const error = new Error('Validation failed');
      const mockSave = jest.fn().mockRejectedValue(error);
      Comment.mockImplementation(() => ({
        save: mockSave
      }));

      req.body = { text: 'Missing required fields' };

      await f_createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });
  });

  describe('f_updateComment', () => {
    it('should update and return the comment', async () => {
      const updatedComment = mockComment({ text: 'Updated text' });
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(updatedComment)
      };

      Comment.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { text: 'Updated text' };

      await f_updateComment(req, res);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { text: 'Updated text' },
        { new: true, runValidators: true }
      );
      expect(mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(res.json).toHaveBeenCalledWith(updatedComment);
    });

    it('should return 404 when comment not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Comment.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { text: 'Updated text' };

      await f_updateComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should return 400 for validation errors', async () => {
      const error = new Error('Validation failed');
      Comment.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { rating: 15 };

      await f_updateComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });
  });

  describe('f_deleteComment', () => {
    it('should delete the comment and return success message', async () => {
      const deletedComment = mockComment();
      Comment.findByIdAndDelete = jest.fn().mockResolvedValue(deletedComment);
      req.params = { id: '507f1f77bcf86cd799439011' };

      await f_deleteComment(req, res);

      expect(Comment.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
    });

    it('should return 404 when comment not found', async () => {
      Comment.findByIdAndDelete = jest.fn().mockResolvedValue(null);
      req.params = { id: '507f1f77bcf86cd799439011' };

      await f_deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Comment.findByIdAndDelete = jest.fn().mockRejectedValue(error);
      req.params = { id: '507f1f77bcf86cd799439011' };

      await f_deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getCommentsByMovie', () => {
    it('should return comments for a specific movie', async () => {
      const mockComments = [mockComment(), mockComment({ _id: '507f1f77bcf86cd799439013' })];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);
      req.params = { movieId: '507f1f77bcf86cd799439012' };

      await f_getCommentsByMovie(req, res);

      expect(Comment.find).toHaveBeenCalledWith({ movie_id: '507f1f77bcf86cd799439012' });
      expect(mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
      expect(res.json).toHaveBeenCalledWith(mockComments);
    });

    it('should return empty array when no comments found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);
      req.params = { movieId: '507f1f77bcf86cd799439012' };

      await f_getCommentsByMovie(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Comment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error)
      });
      req.params = { movieId: '507f1f77bcf86cd799439012' };

      await f_getCommentsByMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getCommentStatsByMovie', () => {
    it('should return comment statistics for a movie', async () => {
      const mockStats = [{
        totalComments: 10,
        averageRating: 7.5,
        commentsByDate: []
      }];
      const mockMovieData = mockMovie();

      Comment.aggregate = jest.fn().mockResolvedValue(mockStats);
      
      const mockMovieModel = {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockMovieData)
        })
      };
      mongoose.model = jest.fn().mockReturnValue(mockMovieModel);

      req.params = { movieId: '507f1f77bcf86cd799439012' };
      req.query = {};

      await f_getCommentStatsByMovie(req, res);

      expect(Comment.aggregate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        movie: mockMovieData,
        stats: mockStats[0]
      });
    });

    it('should return empty stats when no comments found', async () => {
      Comment.aggregate = jest.fn().mockResolvedValue([]);
      
      const mockMovieModel = {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockMovie())
        })
      };
      mongoose.model = jest.fn().mockReturnValue(mockMovieModel);

      req.params = { movieId: '507f1f77bcf86cd799439012' };
      req.query = {};

      await f_getCommentStatsByMovie(req, res);

      expect(res.json).toHaveBeenCalledWith({
        movie: expect.any(Object),
        stats: { totalComments: 0, averageRating: null, commentsByDate: [] }
      });
    });

    it('should filter by date range', async () => {
      const mockStats = [{ totalComments: 5, averageRating: 8 }];
      Comment.aggregate = jest.fn().mockResolvedValue(mockStats);
      
      const mockMovieModel = {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockMovie())
        })
      };
      mongoose.model = jest.fn().mockReturnValue(mockMovieModel);

      req.params = { movieId: '507f1f77bcf86cd799439012' };
      req.query = { startDate: '2023-01-01', endDate: '2023-12-31' };

      await f_getCommentStatsByMovie(req, res);

      const aggregateCall = Comment.aggregate.mock.calls[0][0];
      expect(aggregateCall[0].$match.date).toBeDefined();
      expect(aggregateCall[0].$match.date.$gte).toBeInstanceOf(Date);
      expect(aggregateCall[0].$match.date.$lte).toBeInstanceOf(Date);
    });

    it('should handle errors', async () => {
      const error = new Error('Aggregation error');
      Comment.aggregate = jest.fn().mockRejectedValue(error);
      req.params = { movieId: '507f1f77bcf86cd799439012' };
      req.query = {};

      await f_getCommentStatsByMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });
  });

  describe('f_getUserCommentHistory', () => {
    it('should return user comment history with High engagement', async () => {
      const mockComments = [mockComment(), mockComment()];
      const mockTotal = 150;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);
      Comment.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.params = { email: 'john@example.com' };
      req.query = {};

      await f_getUserCommentHistory(req, res);

      expect(Comment.find).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year genres');
      expect(res.json).toHaveBeenCalledWith({
        comments: mockComments,
        user: { email: 'john@example.com' },
        engagementLevel: 'High',
        currentPage: 1,
        totalPages: 15,
        totalComments: mockTotal
      });
    });

    it('should return Medium engagement level', async () => {
      const mockComments = [mockComment()];
      const mockTotal = 75;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);
      Comment.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.params = { email: 'user@example.com' };
      req.query = {};

      await f_getUserCommentHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ engagementLevel: 'Medium' })
      );
    });

    it('should return Low engagement level', async () => {
      const mockComments = [mockComment()];
      const mockTotal = 10;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);
      Comment.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.params = { email: 'newuser@example.com' };
      req.query = {};

      await f_getUserCommentHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ engagementLevel: 'Low' })
      );
    });

    it('should handle pagination', async () => {
      const mockComments = [mockComment()];
      const mockTotal = 50;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockComments)
      };

      Comment.find = jest.fn().mockReturnValue(mockQuery);
      Comment.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.params = { email: 'user@example.com' };
      req.query = { page: '3', limit: '5' };

      await f_getUserCommentHistory(req, res);

      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Comment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error)
      });
      req.params = { email: 'user@example.com' };
      req.query = {};

      await f_getUserCommentHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getTopReviewers', () => {
    it('should return top reviewers with default limit', async () => {
      const mockReviewers = [
        { email: 'user1@example.com', commentCount: 50, averageRating: 8.5 },
        { email: 'user2@example.com', commentCount: 45, averageRating: 7.8 }
      ];

      Comment.aggregate = jest.fn().mockResolvedValue(mockReviewers);
      req.query = {};

      await f_getTopReviewers(req, res);

      expect(Comment.aggregate).toHaveBeenCalled();
      const aggregateCall = Comment.aggregate.mock.calls[0][0];
      expect(aggregateCall).toContainEqual({ $sort: { commentCount: -1 } });
      expect(aggregateCall).toContainEqual({ $limit: 10 });
      expect(res.json).toHaveBeenCalledWith(mockReviewers);
    });

    it('should return top reviewers with custom limit', async () => {
      const mockReviewers = [
        { email: 'user1@example.com', commentCount: 50, averageRating: 8.5 }
      ];

      Comment.aggregate = jest.fn().mockResolvedValue(mockReviewers);
      req.query = { limit: '5' };

      await f_getTopReviewers(req, res);

      const aggregateCall = Comment.aggregate.mock.calls[0][0];
      expect(aggregateCall).toContainEqual({ $limit: 5 });
      expect(res.json).toHaveBeenCalledWith(mockReviewers);
    });

    it('should handle empty results', async () => {
      Comment.aggregate = jest.fn().mockResolvedValue([]);
      req.query = {};

      await f_getTopReviewers(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle errors', async () => {
      const error = new Error('Aggregation error');
      Comment.aggregate = jest.fn().mockRejectedValue(error);
      req.query = {};

      await f_getTopReviewers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });
  });

  describe('f_updateHelpfulVotes', () => {
    it('should increment helpful votes', async () => {
      const updatedComment = mockComment({ helpful_votes: 6 });
      Comment.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedComment);

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { voteType: 'helpful' };

      await f_updateHelpfulVotes(req, res);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $inc: { helpful_votes: 1 } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedComment);
    });

    it('should increment not_helpful votes', async () => {
      const updatedComment = mockComment({ not_helpful_votes: 2 });
      Comment.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedComment);

      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { voteType: 'not_helpful' };

      await f_updateHelpfulVotes(req, res);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $inc: { not_helpful_votes: 1 } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedComment);
    });

    it('should return 400 for invalid vote type', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { voteType: 'invalid' };

      await f_updateHelpfulVotes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid vote type. Must be "helpful" or "not_helpful"'
      });
    });

    it('should return 400 when voteType is missing', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {};

      await f_updateHelpfulVotes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid vote type. Must be "helpful" or "not_helpful"'
      });
    });

    it('should return 404 when comment not found', async () => {
      Comment.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { voteType: 'helpful' };

      await f_updateHelpfulVotes(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Comment.findByIdAndUpdate = jest.fn().mockRejectedValue(error);
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { voteType: 'helpful' };

      await f_updateHelpfulVotes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getRecentCommentsByGenre', () => {
    it('should return comments filtered by genre', async () => {
      const mockComments = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          text: 'Great action movie!',
          date: new Date('2023-01-01'),
          rating: 8,
          movie: {
            title: 'Inception',
            year: 2010,
            genres: ['Action', 'Sci-Fi']
          }
        }
      ];
      const mockMovieIds = ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];
      const mockTotal = 25;

      Comment.aggregate = jest.fn().mockResolvedValue(mockComments);

      const mockMovieModel = {
        find: jest.fn().mockReturnValue({
          distinct: jest.fn().mockResolvedValue(mockMovieIds)
        })
      };
      mongoose.model = jest.fn().mockReturnValue(mockMovieModel);
      Comment.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.params = { genre: 'Action' };
      req.query = {};

      await f_getRecentCommentsByGenre(req, res);

      expect(Comment.aggregate).toHaveBeenCalled();
      const aggregateCall = Comment.aggregate.mock.calls[0][0];
      expect(aggregateCall).toContainEqual({
        $lookup: {
          from: 'movies',
          localField: 'movie_id',
          foreignField: '_id',
          as: 'movie'
        }
      });
      expect(aggregateCall).toContainEqual({ $unwind: '$movie' });
      expect(aggregateCall).toContainEqual({ $match: { 'movie.genres': 'Action' } });
      expect(aggregateCall).toContainEqual({ $sort: { date: -1 } });
      expect(res.json).toHaveBeenCalledWith({
        comments: mockComments,
        genre: 'Action',
        currentPage: 1,
        totalPages: 3,
        totalComments: mockTotal
      });
    });

    it('should handle pagination', async () => {
      const mockComments = [mockComment()];
      const mockMovieIds = ['507f1f77bcf86cd799439012'];
      const mockTotal = 50;

      Comment.aggregate = jest.fn().mockResolvedValue(mockComments);

      const mockMovieModel = {
        find: jest.fn().mockReturnValue({
          distinct: jest.fn().mockResolvedValue(mockMovieIds)
        })
      };
      mongoose.model = jest.fn().mockReturnValue(mockMovieModel);
      Comment.countDocuments = jest.fn().mockResolvedValue(mockTotal);

      req.params = { genre: 'Comedy' };
      req.query = { page: '2', limit: '20' };

      await f_getRecentCommentsByGenre(req, res);

      const aggregateCall = Comment.aggregate.mock.calls[0][0];
      expect(aggregateCall).toContainEqual({ $skip: 20 });
      expect(aggregateCall).toContainEqual({ $limit: 20 });
    });

    it('should return empty results for genre with no comments', async () => {
      Comment.aggregate = jest.fn().mockResolvedValue([]);

      const mockMovieModel = {
        find: jest.fn().mockReturnValue({
          distinct: jest.fn().mockResolvedValue([])
        })
      };
      mongoose.model = jest.fn().mockReturnValue(mockMovieModel);
      Comment.countDocuments = jest.fn().mockResolvedValue(0);

      req.params = { genre: 'Documentary' };
      req.query = {};

      await f_getRecentCommentsByGenre(req, res);

      expect(res.json).toHaveBeenCalledWith({
        comments: [],
        genre: 'Documentary',
        currentPage: 1,
        totalPages: 0,
        totalComments: 0
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Aggregation error');
      Comment.aggregate = jest.fn().mockRejectedValue(error);
      req.params = { genre: 'Action' };
      req.query = {};

      await f_getRecentCommentsByGenre(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Aggregation error' });
    });
  });
});
