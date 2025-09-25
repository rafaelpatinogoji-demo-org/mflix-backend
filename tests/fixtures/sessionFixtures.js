const mongoose = require('mongoose');

const validSession = {
  user_id: 'user123',
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
};

const validSessionsList = [
  {
    user_id: 'user123',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  },
  {
    user_id: 'user456',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NDMyMSIsIm5hbWUiOiJKYW5lIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.mRzQWqrzoT9bBQnObbzUOXJV8mQT7GvpqvJ9NmYMFVs'
  },
  {
    user_id: 'user789',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NSIsIm5hbWUiOiJCb2IgU21pdGgiLCJpYXQiOjE1MTYyMzkwMjJ9.7fYCe1SxHBHaLxTZmbdkOjfRR9R9zX1xKB3EtXIKFso'
  }
];

const invalidSession = {
  user_id: 'user123'
};

module.exports = {
  validSession,
  validSessionsList,
  invalidSession
};
