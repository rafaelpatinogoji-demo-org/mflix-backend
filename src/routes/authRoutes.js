const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  f_login,
  f_logout,
  f_refreshToken
} = require('../controllers/authController');

const v_router = express.Router();

const c_loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { 
    message: 'Too many login attempts, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const c_refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { 
    message: 'Too many token refresh attempts, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

v_router.post('/login', c_loginLimiter, f_login);
v_router.post('/logout', f_logout);
v_router.post('/refresh', c_refreshLimiter, f_refreshToken);

module.exports = v_router;
