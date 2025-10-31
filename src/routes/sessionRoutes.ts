import express, { Router } from 'express';
import {
  f_getAllSessions,
  f_getSessionById,
  f_createSession,
  f_updateSession,
  f_deleteSession
} from '../controllers/sessionController';

const v_router: Router = express.Router();

v_router.get('/', f_getAllSessions);
v_router.get('/:id', f_getSessionById);
v_router.post('/', f_createSession);
v_router.put('/:id', f_updateSession);
v_router.delete('/:id', f_deleteSession);

export default v_router;
