const express = require('express');
const {
  f_getAllSessions,
  f_getSessionById,
  f_createSession,
  f_updateSession,
  f_deleteSession,
  f_getActiveUserSessions,
  f_logoutAllSessions
} = require('../controllers/sessionController');

const v_router = express.Router();

v_router.get('/', f_getAllSessions);
v_router.get('/active', f_getActiveUserSessions);
v_router.get('/:id', f_getSessionById);
v_router.post('/', f_createSession);
v_router.post('/logout-all', f_logoutAllSessions);
v_router.put('/:id', f_updateSession);
v_router.delete('/:id', f_deleteSession);

module.exports = v_router;
