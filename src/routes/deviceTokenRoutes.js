const express = require('express');
const {
  f_getAllDeviceTokens,
  f_createDeviceToken,
  f_updateDeviceToken,
  f_deleteDeviceToken
} = require('../controllers/deviceTokenController');
const { f_authenticateUser, f_validateUserAccess } = require('../middleware/authMiddleware');

const v_router = express.Router();

v_router.get('/', f_authenticateUser, f_validateUserAccess, f_getAllDeviceTokens);
v_router.post('/', f_authenticateUser, f_createDeviceToken);
v_router.put('/:id', f_authenticateUser, f_updateDeviceToken);
v_router.delete('/:id', f_authenticateUser, f_deleteDeviceToken);

module.exports = v_router;
