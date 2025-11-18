import * as notificationsModel from '../models/notificationsModel.js';

// Get user's notifications
export async function getNotifications(req, res) {
  try {
    const { cedula } = req.user;
    const notifications = await notificationsModel.getUserNotifications(cedula);
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
}

// Get unread notifications count
export async function getUnreadCount(req, res) {
  try {
    const { cedula } = req.user;
    const count = await notificationsModel.getUnreadNotificationsCount(cedula);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}

// Mark notification as read
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await notificationsModel.markNotificationAsRead(id);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

// Mark all notifications as read
export async function markAllAsRead(req, res) {
  try {
    const { cedula } = req.user;
    await notificationsModel.markAllNotificationsAsRead(cedula);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
}

// Delete a notification
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    await notificationsModel.deleteNotification(id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}

// Delete all notifications
export async function deleteAllNotifications(req, res) {
  try {
    const { cedula } = req.user;
    await notificationsModel.deleteAllNotifications(cedula);
    res.json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
}
