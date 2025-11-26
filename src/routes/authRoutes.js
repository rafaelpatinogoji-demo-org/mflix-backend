const express = require('express');
const {
  f_login,
  f_logout,
  f_refreshToken
} = require('../controllers/authController');

const v_router = express.Router();

v_router.post('/login', f_login);
v_router.post('/logout', f_logout);
v_router.post('/refresh', f_refreshToken);

module.exports = v_router;
