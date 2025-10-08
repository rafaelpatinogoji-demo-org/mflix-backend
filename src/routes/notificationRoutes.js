const express = require('express');
const {
  f_getAllNotifications,
  f_getNotificationById,
  f_createNotification,
  f_markAsRead,
  f_markAllAsRead,
  f_deleteNotification,
  f_getUnreadCount
} = require('../controllers/notificationController');
const { f_authenticateUser, f_validateUserAccess } = require('../middleware/authMiddleware');

const v_router = express.Router();

v_router.get('/', f_authenticateUser, f_validateUserAccess, f_getAllNotifications);
v_router.get('/unread-count', f_authenticateUser, f_validateUserAccess, f_getUnreadCount);
v_router.get('/:id', f_authenticateUser, f_getNotificationById);
v_router.post('/', f_authenticateUser, f_createNotification);
v_router.put('/:id/read', f_authenticateUser, f_markAsRead);
v_router.put('/mark-all-read', f_authenticateUser, f_validateUserAccess, f_markAllAsRead);
v_router.delete('/:id', f_authenticateUser, f_deleteNotification);

module.exports = v_router;
