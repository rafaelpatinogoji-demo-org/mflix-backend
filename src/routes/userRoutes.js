const express = require('express');
const {
  f_getAllUsers,
  f_getUserById,
  f_createUser,
  f_updateUser,
  f_deleteUser
} = require('../controllers/userController');

const v_router = express.Router();

// Obtiene todos los usuarios
v_router.get('/', f_getAllUsers);
// Obtiene un usuario por su ID
v_router.get('/:id', f_getUserById);
// Crea un nuevo usuario
v_router.post('/', f_createUser);
// Actualiza un usuario existente por su ID
v_router.put('/:id', f_updateUser);
// Elimina un usuario por su ID
v_router.delete('/:id', f_deleteUser);

module.exports = v_router;
