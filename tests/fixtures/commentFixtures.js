const mongoose = require('mongoose');
const { generateObjectId } = require('../utils/testHelpers');

const movieId1 = generateObjectId();
const movieId2 = generateObjectId();

const validComment = {
  name: 'Test User',
  email: 'test@example.com',
  movie_id: movieId1,
  text: 'This is a test comment',
  date: new Date()
};

const validCommentsList = [
  {
    name: 'User One',
    email: 'user1@example.com',
    movie_id: movieId1,
    text: 'First test comment',
    date: new Date('2023-01-01')
  },
  {
    name: 'User Two',
    email: 'user2@example.com',
    movie_id: movieId1,
    text: 'Second test comment',
    date: new Date('2023-01-02')
  },
  {
    name: 'User Three',
    email: 'user3@example.com',
    movie_id: movieId2,
    text: 'Third test comment',
    date: new Date('2023-01-03')
  }
];

const invalidComment = {
  name: 'Invalid Comment',
  email: 'invalid@example.com'
};

module.exports = {
  validComment,
  validCommentsList,
  invalidComment,
  movieId1,
  movieId2
};
