const express = require('express');
const {
  f_getTheaterSessions,
  f_createTheaterSession,
  f_updateTheaterSession,
  f_deleteTheaterSession
} = require('../controllers/theaterSessionController');

const v_router = express.Router();

v_router.get('/', f_getTheaterSessions);
v_router.post('/', f_createTheaterSession);
v_router.put('/:id', f_updateTheaterSession);
v_router.delete('/:id', f_deleteTheaterSession);

module.exports = v_router;
