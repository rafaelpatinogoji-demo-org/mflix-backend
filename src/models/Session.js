const mongoose = require('mongoose');

const c_sessionSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  jwt: {
    type: String,
    required: true
  },
  expiry: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'sessions'
});

module.exports = mongoose.model('Session', c_sessionSchema);
