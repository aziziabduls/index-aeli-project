import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface UpdateMeParams {
  name?: string;
  phone?: string;
  bio?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}

export class AccountService {
  async getMe(userId: string) {
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { rows: userRows } = await pool.query(
      `SELECT id, email, name, phone, bio, role, status, notification_preferences, created_at, updated_at
       FROM identity.users
       WHERE id = $1;`,
      [userId]
    );

    if (userRows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userRows[0];

    // Count user contributions
    const [destCountRes, attrCountRes, progCountRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as count FROM content.destinations WHERE created_by = $1;`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT COUNT(*)::int as count FROM content.attractions WHERE created_by = $1;`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT COUNT(*)::int as count FROM program.programs WHERE created_by = $1;`, [userId]).catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    // Fetch recent audit logs for this user
    let recentActivities = [];
    try {
      const { rows: auditRows } = await pool.query(
        `SELECT id, entity_type, action, created_at
         FROM audit.audit_logs
         WHERE actor_id = $1
         ORDER BY created_at DESC
         LIMIT 6;`,
        [userId]
      );
      recentActivities = auditRows;
    } catch {
      recentActivities = [];
    }

    return {
      ...user,
      stats: {
        destinations: destCountRes.rows[0]?.count || 0,
        attractions: attrCountRes.rows[0]?.count || 0,
        programs: progCountRes.rows[0]?.count || 0
      },
      recent_activities: recentActivities
    };
  }

  async updateMe(userId: string, data: UpdateMeParams) {
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { rows: userRows } = await pool.query(
      `SELECT id, email, password_hash FROM identity.users WHERE id = $1;`,
      [userId]
    );

    if (userRows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userRows[0];

    // Check if password change is requested
    if (data.new_password) {
      if (!data.current_password) {
        throw new AppError('Current password is required to set a new password', 400);
      }
      const match = await bcrypt.compare(data.current_password, user.password_hash);
      if (!match) {
        throw new AppError('Incorrect current password', 400);
      }
      if (data.new_password.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400);
      }
      const newHash = await bcrypt.hash(data.new_password, 10);
      await pool.query(
        `UPDATE identity.users SET password_hash = $1, updated_at = NOW() WHERE id = $2;`,
        [newHash, userId]
      );
    }

    // Check email change
    if (data.email && data.email !== user.email) {
      const { rows: existing } = await pool.query(
        `SELECT id FROM identity.users WHERE email = $1 AND id != $2;`,
        [data.email, userId]
      );
      if (existing.length > 0) {
        throw new AppError('Email is already in use by another account', 409);
      }
    }

    // Update details
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [userId];
    let counter = 2;

    if (data.name !== undefined) {
      updates.push(`name = $${counter}`);
      values.push(data.name);
      counter++;
    }

    if (data.phone !== undefined) {
      updates.push(`phone = $${counter}`);
      values.push(data.phone);
      counter++;
    }

    if (data.bio !== undefined) {
      updates.push(`bio = $${counter}`);
      values.push(data.bio);
      counter++;
    }

    if (data.email !== undefined) {
      updates.push(`email = $${counter}`);
      values.push(data.email);
      counter++;
    }

    const query = `
      UPDATE identity.users
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, email, name, phone, bio, role, status, notification_preferences, created_at, updated_at;
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

export const accountService = new AccountService();

