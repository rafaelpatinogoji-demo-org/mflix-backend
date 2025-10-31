const mongoose = require('mongoose');

const c_commentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  movie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: false
  },
  helpful_votes: {
    type: Number,
    default: 0,
    required: false
  },
  not_helpful_votes: {
    type: Number,
    default: 0,
    required: false
  }
}, {
  collection: 'comments'
});

module.exports = mongoose.model('Comment', c_commentSchema);
