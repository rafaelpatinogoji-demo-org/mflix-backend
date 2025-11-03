const express = require('express');
const {
  f_getAllTheaters,
  f_getTheaterById,
  f_createTheater,
  f_updateTheater,
  f_deleteTheater,
  f_getNearbyTheaters
} = require('../controllers/theaterController');

const v_router = express.Router();

// Obtiene todos los teatros
v_router.get('/', f_getAllTheaters);
// Obtiene teatros cercanos basado en ubicación
v_router.get('/nearby', f_getNearbyTheaters);
// Obtiene un teatro específico por su ID
v_router.get('/:id', f_getTheaterById);
// Crea un nuevo teatro
v_router.post('/', f_createTheater);
// Actualiza un teatro existente por su ID
v_router.put('/:id', f_updateTheater);
// Elimina un teatro por su ID
v_router.delete('/:id', f_deleteTheater);

module.exports = v_router;
