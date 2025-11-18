jest.mock('../../../src/models/Comment');

const Comment = require('../../../src/models/Comment');
const mongoose = require('mongoose');
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
} = require('../../../src/controllers/commentController');

describe('Comment Controller Unit Tests', () => {
  let v_mockReq;
  let v_mockRes;

  beforeEach(() => {
    v_mockReq = {
      params: {},
      query: {},
      body: {}
    };
    v_mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('f_getAllComments - Get all comments with pagination', () => {
    it('should return paginated comments with default pagination', async () => {
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

      await f_getAllComments(v_mockReq, v_mockRes);

      expect(Comment.find).toHaveBeenCalled();
      expect(v_mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(v_mockQuery.skip).toHaveBeenCalledWith(0);
      expect(v_mockQuery.limit).toHaveBeenCalledWith(10);
      expect(v_mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
      expect(v_mockRes.json).toHaveBeenCalledWith({
        comments: v_mockComments,
        currentPage: 1,
        totalPages: 2,
        totalComments: 20
      });
    });

    it('should return paginated comments with custom page and limit', async () => {
      v_mockReq.query = { page: '2', limit: '5' };

      const v_mockComments = [{ _id: '1', name: 'User1', text: 'Comment 1' }];
      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(v_mockComments)
      };

      Comment.find.mockReturnValue(v_mockQuery);
      Comment.countDocuments.mockResolvedValue(15);

      await f_getAllComments(v_mockReq, v_mockRes);

      expect(v_mockQuery.skip).toHaveBeenCalledWith(5);
      expect(v_mockQuery.limit).toHaveBeenCalledWith(5);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        comments: v_mockComments,
        currentPage: 2,
        totalPages: 3,
        totalComments: 15
      });
    });

    it('should handle database errors in f_getAllComments', async () => {
      const v_error = new Error('Database error');
      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(v_error)
      });

      await f_getAllComments(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getCommentById - Get comment by ID', () => {
    it('should return a comment when found', async () => {
      const v_mockComment = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        text: 'Great movie!',
        movie_id: { title: 'Inception', year: 2010 }
      };

      v_mockReq.params.id = '507f1f77bcf86cd799439011';

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(v_mockComment)
      };

      Comment.findById.mockReturnValue(v_mockQuery);

      await f_getCommentById(v_mockReq, v_mockRes);

      expect(Comment.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(v_mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockComment);
    });

    it('should return 404 when comment not found', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Comment.findById.mockReturnValue(v_mockQuery);

      await f_getCommentById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle database errors in f_getCommentById', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      const v_error = new Error('Database error');

      Comment.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(v_error)
      });

      await f_getCommentById(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_createComment - Create new comment', () => {
    it('should create a new comment successfully', async () => {
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

      v_mockReq.body = v_commentData;

      const v_mockCommentInstance = {
        save: jest.fn().mockResolvedValue(v_savedComment)
      };

      Comment.mockImplementation(() => v_mockCommentInstance);

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(v_populatedComment)
      };

      Comment.findById.mockReturnValue(v_mockQuery);

      await f_createComment(v_mockReq, v_mockRes);

      expect(v_mockCommentInstance.save).toHaveBeenCalled();
      expect(Comment.findById).toHaveBeenCalledWith('newid123');
      expect(v_mockRes.status).toHaveBeenCalledWith(201);
      expect(v_mockRes.json).toHaveBeenCalledWith(v_populatedComment);
    });

    it('should handle validation errors in f_createComment', async () => {
      v_mockReq.body = { name: 'John Doe' }; // Missing required fields

      const v_error = new Error('Validation failed');
      const v_mockCommentInstance = {
        save: jest.fn().mockRejectedValue(v_error)
      };

      Comment.mockImplementation(() => v_mockCommentInstance);

      await f_createComment(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });
  });

  describe('f_updateComment - Update existing comment', () => {
    it('should update a comment successfully', async () => {
      const v_updatedData = { text: 'Updated comment text', rating: 10 };
      const v_updatedComment = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        text: 'Updated comment text',
        rating: 10,
        movie_id: { title: 'Inception', year: 2010 }
      };

      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      v_mockReq.body = v_updatedData;

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(v_updatedComment)
      };

      Comment.findByIdAndUpdate.mockReturnValue(v_mockQuery);

      await f_updateComment(v_mockReq, v_mockRes);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        v_updatedData,
        { new: true, runValidators: true }
      );
      expect(v_mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedComment);
    });

    it('should return 404 when updating non-existent comment', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      v_mockReq.body = { text: 'Updated text' };

      const v_mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Comment.findByIdAndUpdate.mockReturnValue(v_mockQuery);

      await f_updateComment(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle validation errors in f_updateComment', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      v_mockReq.body = { rating: 15 }; // Invalid rating

      const v_error = new Error('Validation failed');
      Comment.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockRejectedValue(v_error)
      });

      await f_updateComment(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });
  });

  describe('f_deleteComment - Delete comment', () => {
    it('should delete a comment successfully', async () => {
      const v_deletedComment = {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        text: 'Comment to delete'
      };

      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      Comment.findByIdAndDelete.mockResolvedValue(v_deletedComment);

      await f_deleteComment(v_mockReq, v_mockRes);

      expect(Comment.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' });
    });

    it('should return 404 when deleting non-existent comment', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      Comment.findByIdAndDelete.mockResolvedValue(null);

      await f_deleteComment(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle database errors in f_deleteComment', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      const v_error = new Error('Database error');
      Comment.findByIdAndDelete.mockRejectedValue(v_error);

      await f_deleteComment(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getCommentsByMovie - Get comments by movie ID', () => {
    it('should return all comments for a specific movie', async () => {
      const v_movieId = '507f1f77bcf86cd799439011';
      const v_mockComments = [
        { _id: '1', text: 'Comment 1', movie_id: { title: 'Inception', year: 2010 } },
        { _id: '2', text: 'Comment 2', movie_id: { title: 'Inception', year: 2010 } }
      ];

      v_mockReq.params.movieId = v_movieId;

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(v_mockComments)
      };

      Comment.find.mockReturnValue(v_mockQuery);

      await f_getCommentsByMovie(v_mockReq, v_mockRes);

      expect(Comment.find).toHaveBeenCalledWith({ movie_id: v_movieId });
      expect(v_mockQuery.populate).toHaveBeenCalledWith('movie_id', 'title year');
      expect(v_mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockComments);
    });

    it('should handle database errors in f_getCommentsByMovie', async () => {
      v_mockReq.params.movieId = '507f1f77bcf86cd799439011';
      const v_error = new Error('Database error');

      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(v_error)
      });

      await f_getCommentsByMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getCommentStatsByMovie - Get comment statistics', () => {
    it('should return comment statistics for a movie', async () => {
      const v_movieId = '507f1f77bcf86cd799439011';
      const v_mockStats = [{
        movie_id: v_movieId,
        totalComments: 10,
        averageRating: 8.5,
        commentsByDate: []
      }];

      const v_mockMovie = {
        _id: v_movieId,
        title: 'Inception',
        year: 2010,
        genres: ['Action', 'Sci-Fi']
      };

      v_mockReq.params.movieId = v_movieId;

      Comment.aggregate.mockResolvedValue(v_mockStats);

      const v_mockMovieModel = {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(v_mockMovie)
        })
      };

      jest.spyOn(mongoose, 'model').mockReturnValue(v_mockMovieModel);

      await f_getCommentStatsByMovie(v_mockReq, v_mockRes);

      expect(Comment.aggregate).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith({
        movie: v_mockMovie,
        stats: v_mockStats[0]
      });
    });

    it('should handle date filters in f_getCommentStatsByMovie', async () => {
      const v_movieId = '507f1f77bcf86cd799439011';
      v_mockReq.params.movieId = v_movieId;
      v_mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      Comment.aggregate.mockResolvedValue([]);

      const v_mockMovieModel = {
        findById: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ title: 'Test Movie' })
        })
      };

      jest.spyOn(mongoose, 'model').mockReturnValue(v_mockMovieModel);

      await f_getCommentStatsByMovie(v_mockReq, v_mockRes);

      expect(Comment.aggregate).toHaveBeenCalled();
      const v_aggregateCall = Comment.aggregate.mock.calls[0][0];
      expect(v_aggregateCall[0].$match.date).toBeDefined();
    });

    it('should handle database errors in f_getCommentStatsByMovie', async () => {
      v_mockReq.params.movieId = '507f1f77bcf86cd799439011';
      const v_error = new Error('Database error');
      Comment.aggregate.mockRejectedValue(v_error);

      await f_getCommentStatsByMovie(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getUserCommentHistory - Get user comment history', () => {
    it('should return user comment history with pagination', async () => {
      const v_email = 'john@example.com';
      const v_mockComments = [
        { _id: '1', text: 'Comment 1', email: v_email },
        { _id: '2', text: 'Comment 2', email: v_email }
      ];

      v_mockReq.params.email = v_email;

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(v_mockComments)
      };

      Comment.find.mockReturnValue(v_mockQuery);
      Comment.countDocuments.mockResolvedValue(25);

      await f_getUserCommentHistory(v_mockReq, v_mockRes);

      expect(Comment.find).toHaveBeenCalledWith({ email: v_email });
      expect(v_mockRes.json).toHaveBeenCalledWith({
        comments: v_mockComments,
        user: { email: v_email },
        engagementLevel: 'Low',
        currentPage: 1,
        totalPages: 3,
        totalComments: 25
      });
    });

    it('should calculate correct engagement level for high activity users', async () => {
      v_mockReq.params.email = 'active@example.com';

      const v_mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      Comment.find.mockReturnValue(v_mockQuery);
      Comment.countDocuments.mockResolvedValue(150);

      await f_getUserCommentHistory(v_mockReq, v_mockRes);

      expect(v_mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          engagementLevel: 'High',
          totalComments: 150
        })
      );
    });

    it('should handle database errors in f_getUserCommentHistory', async () => {
      v_mockReq.params.email = 'john@example.com';
      const v_error = new Error('Database error');

      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(v_error)
      });

      await f_getUserCommentHistory(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getTopReviewers - Get top reviewers', () => {
    it('should return top reviewers with default limit', async () => {
      const v_mockReviewers = [
        { email: 'user1@example.com', commentCount: 50, averageRating: 8.5 },
        { email: 'user2@example.com', commentCount: 40, averageRating: 7.8 }
      ];

      Comment.aggregate.mockResolvedValue(v_mockReviewers);

      await f_getTopReviewers(v_mockReq, v_mockRes);

      expect(Comment.aggregate).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith(v_mockReviewers);
    });

    it('should handle custom limit in f_getTopReviewers', async () => {
      v_mockReq.query.limit = '5';
      Comment.aggregate.mockResolvedValue([]);

      await f_getTopReviewers(v_mockReq, v_mockRes);

      const v_aggregateCall = Comment.aggregate.mock.calls[0][0];
      expect(v_aggregateCall.find(stage => stage.$limit)?.$limit).toBe(5);
    });

    it('should handle database errors in f_getTopReviewers', async () => {
      const v_error = new Error('Database error');
      Comment.aggregate.mockRejectedValue(v_error);

      await f_getTopReviewers(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_updateHelpfulVotes - Update helpful votes', () => {
    it('should increment helpful votes successfully', async () => {
      const v_commentId = '507f1f77bcf86cd799439011';
      const v_updatedComment = {
        _id: v_commentId,
        helpful_votes: 5,
        not_helpful_votes: 1
      };

      v_mockReq.params.id = v_commentId;
      v_mockReq.body = { voteType: 'helpful' };

      Comment.findByIdAndUpdate.mockResolvedValue(v_updatedComment);

      await f_updateHelpfulVotes(v_mockReq, v_mockRes);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        v_commentId,
        { $inc: { helpful_votes: 1 } },
        { new: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedComment);
    });

    it('should increment not_helpful votes successfully', async () => {
      const v_commentId = '507f1f77bcf86cd799439011';
      const v_updatedComment = {
        _id: v_commentId,
        helpful_votes: 3,
        not_helpful_votes: 2
      };

      v_mockReq.params.id = v_commentId;
      v_mockReq.body = { voteType: 'not_helpful' };

      Comment.findByIdAndUpdate.mockResolvedValue(v_updatedComment);

      await f_updateHelpfulVotes(v_mockReq, v_mockRes);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        v_commentId,
        { $inc: { not_helpful_votes: 1 } },
        { new: true }
      );
      expect(v_mockRes.json).toHaveBeenCalledWith(v_updatedComment);
    });

    it('should return 400 for invalid vote type', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      v_mockReq.body = { voteType: 'invalid' };

      await f_updateHelpfulVotes(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(400);
      expect(v_mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid vote type. Must be "helpful" or "not_helpful"'
      });
    });

    it('should return 404 when comment not found for voting', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      v_mockReq.body = { voteType: 'helpful' };

      Comment.findByIdAndUpdate.mockResolvedValue(null);

      await f_updateHelpfulVotes(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(404);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Comment not found' });
    });

    it('should handle database errors in f_updateHelpfulVotes', async () => {
      v_mockReq.params.id = '507f1f77bcf86cd799439011';
      v_mockReq.body = { voteType: 'helpful' };
      const v_error = new Error('Database error');

      Comment.findByIdAndUpdate.mockRejectedValue(v_error);

      await f_updateHelpfulVotes(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('f_getRecentCommentsByGenre - Get comments by genre', () => {
    it('should return comments filtered by genre', async () => {
      const v_genre = 'Action';
      const v_mockComments = [
        { _id: '1', text: 'Great action!', movie: { title: 'Action Movie', genres: ['Action'] } }
      ];

      v_mockReq.params.genre = v_genre;

      Comment.aggregate.mockResolvedValue(v_mockComments);

      const v_mockMovieModel = {
        find: jest.fn().mockReturnValue({
          distinct: jest.fn().mockResolvedValue(['movieid1', 'movieid2'])
        })
      };

      jest.spyOn(mongoose, 'model').mockReturnValue(v_mockMovieModel);
      Comment.countDocuments.mockResolvedValue(15);

      await f_getRecentCommentsByGenre(v_mockReq, v_mockRes);

      expect(Comment.aggregate).toHaveBeenCalled();
      expect(v_mockRes.json).toHaveBeenCalledWith({
        comments: v_mockComments,
        genre: v_genre,
        currentPage: 1,
        totalPages: 2,
        totalComments: 15
      });
    });

    it('should handle pagination in f_getRecentCommentsByGenre', async () => {
      v_mockReq.params.genre = 'Drama';
      v_mockReq.query = { page: '2', limit: '5' };

      Comment.aggregate.mockResolvedValue([]);

      const v_mockMovieModel = {
        find: jest.fn().mockReturnValue({
          distinct: jest.fn().mockResolvedValue([])
        })
      };

      jest.spyOn(mongoose, 'model').mockReturnValue(v_mockMovieModel);
      Comment.countDocuments.mockResolvedValue(0);

      await f_getRecentCommentsByGenre(v_mockReq, v_mockRes);

      const v_aggregateCall = Comment.aggregate.mock.calls[0][0];
      const v_skipStage = v_aggregateCall.find(stage => stage.$skip);
      const v_limitStage = v_aggregateCall.find(stage => stage.$limit);

      expect(v_skipStage.$skip).toBe(5);
      expect(v_limitStage.$limit).toBe(5);
    });

    it('should handle database errors in f_getRecentCommentsByGenre', async () => {
      v_mockReq.params.genre = 'Action';
      const v_error = new Error('Database error');

      Comment.aggregate.mockRejectedValue(v_error);

      await f_getRecentCommentsByGenre(v_mockReq, v_mockRes);

      expect(v_mockRes.status).toHaveBeenCalledWith(500);
      expect(v_mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });
});
