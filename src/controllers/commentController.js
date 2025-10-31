const Comment = require('../models/Comment');
const mongoose = require('mongoose');

const f_getAllComments = async (p_req, p_res) => {
  try {
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;

    const v_comments = await Comment.find()
      .populate('movie_id', 'title year')
      .skip(v_skip)
      .limit(v_limit)
      .sort({ date: -1 });

    const v_total = await Comment.countDocuments();

    p_res.json({
      comments: v_comments,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalComments: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

const f_getCommentById = async (p_req, p_res) => {
  try {
    const v_comment = await Comment.findById(p_req.params.id)
      .populate('movie_id', 'title year');
    if (!v_comment) {
      return p_res.status(404).json({ message: 'Comment not found' });
    }
    p_res.json(v_comment);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

const f_createComment = async (p_req, p_res) => {
  try {
    const v_comment = new Comment(p_req.body);
    const v_savedComment = await v_comment.save();
    const v_populatedComment = await Comment.findById(v_savedComment._id)
      .populate('movie_id', 'title year');
    p_res.status(201).json(v_populatedComment);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

const f_updateComment = async (p_req, p_res) => {
  try {
    const v_comment = await Comment.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    ).populate('movie_id', 'title year');
    
    if (!v_comment) {
      return p_res.status(404).json({ message: 'Comment not found' });
    }
    p_res.json(v_comment);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

const f_deleteComment = async (p_req, p_res) => {
  try {
    const v_comment = await Comment.findByIdAndDelete(p_req.params.id);
    if (!v_comment) {
      return p_res.status(404).json({ message: 'Comment not found' });
    }
    p_res.json({ message: 'Comment deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

const f_getCommentsByMovie = async (p_req, p_res) => {
  try {
    const v_comments = await Comment.find({ movie_id: p_req.params.movieId })
      .populate('movie_id', 'title year')
      .sort({ date: -1 });
    p_res.json(v_comments);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get comment statistics for a specific movie
const f_getCommentStatsByMovie = async (p_req, p_res) => {
  try {
    const v_movieId = p_req.params.movieId;
    const v_startDate = p_req.query.startDate;
    const v_endDate = p_req.query.endDate;
    
    // Build date filter if provided
    const v_dateFilter = {};
    if (v_startDate || v_endDate) {
      v_dateFilter.date = {};
      if (v_startDate) v_dateFilter.date.$gte = new Date(v_startDate);
      if (v_endDate) v_dateFilter.date.$lte = new Date(v_endDate);
    }
    
    // Add movie filter
    v_dateFilter.movie_id = v_movieId;
    
    const v_commentStats = await Comment.aggregate([
      { $match: v_dateFilter },
      {
        $group: {
          _id: "$movie_id",
          totalComments: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          commentsByDate: {
            $push: {
              date: "$date",
              rating: "$rating",
              text: "$text"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          movie_id: "$_id",
          totalComments: 1,
          averageRating: { $round: ["$averageRating", 2] },
          commentsByDate: 1
        }
      }
    ]);
    
    // Get movie details
    const v_movie = await mongoose.model('Movie').findById(v_movieId).select('title year genres');
    
    p_res.json({
      movie: v_movie,
      stats: v_commentStats[0] || { totalComments: 0, averageRating: null, commentsByDate: [] }
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get user comment history
const f_getUserCommentHistory = async (p_req, p_res) => {
  try {
    const v_email = p_req.params.email;
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;
    
    const v_comments = await Comment.find({ email: v_email })
      .populate('movie_id', 'title year genres')
      .skip(v_skip)
      .limit(v_limit)
      .sort({ date: -1 });
    
    const v_total = await Comment.countDocuments({ email: v_email });
    
    // Calculate user engagement level
    const v_engagementLevel = v_total > 100 ? 'High' : v_total > 50 ? 'Medium' : 'Low';
    
    p_res.json({
      comments: v_comments,
      user: { email: v_email },
      engagementLevel: v_engagementLevel,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalComments: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get top reviewers
const f_getTopReviewers = async (p_req, p_res) => {
  try {
    const v_limit = parseInt(p_req.query.limit) || 10;
    
    const v_topReviewers = await Comment.aggregate([
      {
        $group: {
          _id: "$email",
          commentCount: { $sum: 1 },
          averageRating: { $avg: "$rating" }
        }
      },
      { $sort: { commentCount: -1 } },
      { $limit: v_limit },
      {
        $project: {
          _id: 0,
          email: "$_id",
          commentCount: 1,
          averageRating: { $round: ["$averageRating", 2] }
        }
      }
    ]);
    
    p_res.json(v_topReviewers);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Update helpful votes for a comment
const f_updateHelpfulVotes = async (p_req, p_res) => {
  try {
    const v_commentId = p_req.params.id;
    const v_voteType = p_req.body.voteType; // 'helpful' or 'not_helpful'
    
    if (!v_voteType || (v_voteType !== 'helpful' && v_voteType !== 'not_helpful')) {
      return p_res.status(400).json({ message: 'Invalid vote type. Must be "helpful" or "not_helpful"' });
    }
    
    const v_update = {};
    if (v_voteType === 'helpful') {
      v_update.$inc = { helpful_votes: 1 };
    } else {
      v_update.$inc = { not_helpful_votes: 1 };
    }
    
    const v_comment = await Comment.findByIdAndUpdate(
      v_commentId,
      v_update,
      { new: true }
    );
    
    if (!v_comment) {
      return p_res.status(404).json({ message: 'Comment not found' });
    }
    
    p_res.json(v_comment);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Get recent comments by genre
const f_getRecentCommentsByGenre = async (p_req, p_res) => {
  try {
    const v_genre = p_req.params.genre;
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;
    
    const v_comments = await Comment.aggregate([
      {
        $lookup: {
          from: 'movies',
          localField: 'movie_id',
          foreignField: '_id',
          as: 'movie'
        }
      },
      { $unwind: '$movie' },
      { $match: { 'movie.genres': v_genre } },
      { $sort: { date: -1 } },
      { $skip: v_skip },
      { $limit: v_limit },
      {
        $project: {
          name: 1,
          email: 1,
          text: 1,
          date: 1,
          rating: 1,
          helpful_votes: 1,
          not_helpful_votes: 1,
          movie: {
            title: '$movie.title',
            year: '$movie.year',
            genres: '$movie.genres'
          }
        }
      }
    ]);
    
    // Get total count for pagination
    const v_movieIds = await mongoose.model('Movie').find({ genres: v_genre }).distinct('_id');
    const v_total = await Comment.countDocuments({ movie_id: { $in: v_movieIds } });
    
    p_res.json({
      comments: v_comments,
      genre: v_genre,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalComments: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

module.exports = {
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
};
