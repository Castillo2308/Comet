import express from 'express';
import { requireAuth } from '../lib/auth.js';
import * as notificationsController from '../controllers/notificationsController.js';

const router = express.Router();

// Get user's notifications
router.get('/', requireAuth, notificationsController.getNotifications);

// Get unread notifications count
router.get('/unread/count', requireAuth, notificationsController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', requireAuth, notificationsController.markAsRead);

// Mark all notifications as read
router.put('/read/all', requireAuth, notificationsController.markAllAsRead);

// Delete a notification
router.delete('/:id', requireAuth, notificationsController.deleteNotification);

// Delete all notifications
router.delete('/all', requireAuth, notificationsController.deleteAllNotifications);

export default router;
