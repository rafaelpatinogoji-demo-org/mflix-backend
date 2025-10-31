import express, { Router } from 'express';
import {
  f_getAllUsers,
  f_getUserById,
  f_createUser,
  f_updateUser,
  f_deleteUser
} from '../controllers/userController';

const v_router: Router = express.Router();

v_router.get('/', f_getAllUsers);
v_router.get('/:id', f_getUserById);
v_router.post('/', f_createUser);
v_router.put('/:id', f_updateUser);
v_router.delete('/:id', f_deleteUser);

export default v_router;
