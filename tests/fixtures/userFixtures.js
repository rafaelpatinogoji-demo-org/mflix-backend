const mongoose = require('mongoose');

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const validUsersList = [
  {
    name: 'User One',
    email: 'user1@example.com',
    password: 'password123'
  },
  {
    name: 'User Two',
    email: 'user2@example.com',
    password: 'password456'
  },
  {
    name: 'User Three',
    email: 'user3@example.com',
    password: 'password789'
  }
];

const invalidUser = {
  name: 'Invalid User',
  email: 'invalid-email'
};

module.exports = {
  validUser,
  validUsersList,
  invalidUser
};
