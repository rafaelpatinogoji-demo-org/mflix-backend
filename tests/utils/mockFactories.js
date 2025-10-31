const mongoose = require('mongoose');

const mockComment = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
  name: 'John Doe',
  email: 'john@example.com',
  movie_id: {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
    title: 'Inception',
    year: 2010
  },
  text: 'Great movie!',
  date: new Date('2023-01-01'),
  rating: 8,
  helpful_votes: 5,
  not_helpful_votes: 1,
  ...overrides
});

const mockMovie = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
  title: 'Inception',
  year: 2010,
  genres: ['Action', 'Sci-Fi'],
  plot: 'A thief who steals corporate secrets...',
  runtime: 148,
  ...overrides
});

const mockEmbeddedMovie = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
  title: 'The Matrix',
  year: 1999,
  genres: ['Action', 'Sci-Fi'],
  plot: 'A computer hacker learns...',
  runtime: 136,
  rated: 'R',
  cast: ['Keanu Reeves', 'Laurence Fishburne'],
  plot_embedding: [0.1, 0.2, 0.3],
  num_mflix_comments: 42,
  ...overrides
});

const mockRequest = (params = {}, query = {}, body = {}) => ({
  params,
  query,
  body
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

module.exports = {
  mockComment,
  mockMovie,
  mockEmbeddedMovie,
  mockRequest,
  mockResponse
};
