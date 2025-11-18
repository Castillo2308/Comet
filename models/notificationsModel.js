import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

// Create a notification for a user
export async function createNotification(userCedula, title, message, type, relatedId = null) {
  try {
    const result = await sql`
      INSERT INTO notifications (user_cedula, title, message, type, related_id)
      VALUES (${userCedula}, ${title}, ${message}, ${type}, ${relatedId})
      RETURNING *;
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Create notifications for all users
export async function createNotificationForAllUsers(title, message, type, relatedId = null) {
  try {
    // Get all users
    const users = await sql`SELECT cedula FROM users;`;
    
    // Create notification for each user
    const notifications = [];
    for (const user of users) {
      const notification = await createNotification(user.cedula, title, message, type, relatedId);
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating notifications for all users:', error);
    throw error;
  }
}

// Get notifications for a user
export async function getUserNotifications(userCedula) {
  try {
    const result = await sql`
      SELECT * FROM notifications
      WHERE user_cedula = ${userCedula}
      ORDER BY created_at DESC;
    `;
    return result;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
}

// Get unread notifications count for a user
export async function getUnreadNotificationsCount(userCedula) {
  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_cedula = ${userCedula} AND read = false;
    `;
    return result[0].count;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const result = await sql`
      UPDATE notifications
      SET read = true
      WHERE id = ${notificationId}
      RETURNING *;
    `;
    return result[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userCedula) {
  try {
    const result = await sql`
      UPDATE notifications
      SET read = true
      WHERE user_cedula = ${userCedula}
      RETURNING *;
    `;
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete a notification
export async function deleteNotification(notificationId) {
  try {
    await sql`
      DELETE FROM notifications
      WHERE id = ${notificationId};
    `;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Delete all notifications for a user
export async function deleteAllNotifications(userCedula) {
  try {
    await sql`
      DELETE FROM notifications
      WHERE user_cedula = ${userCedula};
    `;
    return true;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}
