import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface CreateNotificationParams {
  userId?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'security';
  link?: string;
}

export class NotificationService {
  async getNotifications(userId?: string) {
    const query = `
      SELECT id, user_id, title, message, type, link, is_read, created_at
      FROM identity.notifications
      WHERE user_id IS NULL ${userId ? 'OR user_id = $1' : ''}
      ORDER BY created_at DESC
      LIMIT 50;
    `;
    const params = userId ? [userId] : [];
    const { rows } = await pool.query(query, params);

    const unreadCount = rows.filter((r: any) => !r.is_read).length;

    // Get user preferences if user exists
    let preferences = { email: true, security: true, updates: true, marketing: false };
    if (userId) {
      const userRes = await pool.query(
        `SELECT notification_preferences FROM identity.users WHERE id = $1;`,
        [userId]
      );
      if (userRes.rows[0]?.notification_preferences) {
        preferences = { ...preferences, ...userRes.rows[0].notification_preferences };
      }
    }

    return {
      notifications: rows,
      unread_count: unreadCount,
      preferences
    };
  }

  async markAsRead(notificationId: string) {
    const { rows } = await pool.query(
      `UPDATE identity.notifications
       SET is_read = true
       WHERE id = $1
       RETURNING *;`,
      [notificationId]
    );

    if (rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    return rows[0];
  }

  async markAllAsRead(userId?: string) {
    const query = `
      UPDATE identity.notifications
      SET is_read = true
      WHERE user_id IS NULL ${userId ? 'OR user_id = $1' : ''};
    `;
    const params = userId ? [userId] : [];
    await pool.query(query, params);

    return { success: true, message: 'All notifications marked as read' };
  }

  async deleteNotification(notificationId: string) {
    await pool.query(
      `DELETE FROM identity.notifications WHERE id = $1;`,
      [notificationId]
    );
    return { success: true };
  }

  async updatePreferences(userId: string, preferences: any) {
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { rows } = await pool.query(
      `UPDATE identity.users
       SET notification_preferences = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING notification_preferences;`,
      [JSON.stringify(preferences), userId]
    );

    return rows[0]?.notification_preferences || preferences;
  }
}

export const notificationService = new NotificationService();

