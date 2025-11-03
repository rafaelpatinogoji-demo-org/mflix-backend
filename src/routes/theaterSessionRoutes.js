const express = require('express');
const {
  f_getTheaterSessions,    // Función para obtener todas las sesiones de teatro
  f_createTheaterSession,  // Función para crear una nueva sesión de teatro
  f_updateTheaterSession,  // Función para actualizar una sesión de teatro existente
  f_deleteTheaterSession   // Función para eliminar una sesión de teatro
} = require('../controllers/theaterSessionController');

const v_router = express.Router();

v_router.get('/', f_getTheaterSessions);        // Ruta GET para obtener todas las sesiones
v_router.post('/', f_createTheaterSession);     // Ruta POST para crear una nueva sesión
v_router.put('/:id', f_updateTheaterSession);   // Ruta PUT para actualizar una sesión por ID
v_router.delete('/:id', f_deleteTheaterSession); // Ruta DELETE para eliminar una sesión por ID

module.exports = v_router;
