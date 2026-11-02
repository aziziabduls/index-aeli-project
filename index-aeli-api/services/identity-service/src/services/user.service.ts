import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface CreateUserParams {
  email?: string;
  password?: string;
  role?: string;
}

export interface UpdateUserParams {
  role?: string;
  status?: string;
}

export class UserService {
  async getAllUsers() {
    const { rows } = await pool.query(
      'SELECT id, email, role, status, created_at, updated_at FROM identity.users ORDER BY created_at DESC;'
    );
    return rows;
  }

  async getRolesWithCounts() {
    const { rows: counts } = await pool.query(
      'SELECT role, COUNT(*)::int as count FROM identity.users GROUP BY role;'
    );

    const countMap = counts.reduce((acc: any, row: any) => {
      acc[row.role] = row.count;
      return acc;
    }, {});

    return [
      {
        role: 'Super Admin',
        group: 'System roles',
        accessLevel: 'Full',
        users: countMap['super_admin'] || 0,
        permissionSets: ['Users', 'Roles', 'Settings', 'Billing', 'Reports', 'Integrations', 'Audit Logs'],
        lastReview: 'Jun 30, 2026',
        owner: 'System',
        status: 'Active'
      },
      {
        role: 'Admin',
        group: 'System roles',
        accessLevel: 'Full',
        users: countMap['admin'] || 0,
        permissionSets: ['Users', 'Settings', 'Reports', 'Billing', 'Integrations'],
        lastReview: 'Jun 30, 2026',
        owner: 'System',
        status: 'Active'
      },
      {
        role: 'Content Editor',
        group: 'System roles',
        accessLevel: 'Scoped',
        users: countMap['content_editor'] || 0,
        permissionSets: ['Content', 'Publish', 'Media'],
        lastReview: 'Jun 30, 2026',
        owner: 'System',
        status: 'Active'
      },
      {
        role: 'Viewer',
        group: 'System roles',
        accessLevel: 'Read only',
        users: countMap['viewer'] || 0,
        permissionSets: ['Reports', 'Dashboards'],
        lastReview: 'Jun 30, 2026',
        owner: 'System',
        status: 'Active'
      }
    ];
  }

  async createUser({ email, password, role }: CreateUserParams) {
    if (!email || !password || !role) {
      throw new AppError('Email, password, and role are required', 400);
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        'INSERT INTO identity.users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, status, created_at;',
        [email, hash, role]
      );
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError('Email already exists', 409);
      }
      throw err;
    }
  }

  async updateUserRoleAndStatus(id: string, { role, status }: UpdateUserParams) {
    let query = 'UPDATE identity.users SET ';
    const params: any[] = [];
    let paramIndex = 1;

    if (role) {
      query += `role = $${paramIndex++}, `;
      params.push(role);
    }
    if (status) {
      query += `status = $${paramIndex++}, `;
      params.push(status);
    }

    if (params.length === 0) {
      throw new AppError('Nothing to update', 400);
    }

    query += `updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, email, role, status, updated_at;`;
    params.push(id);

    const { rows } = await pool.query(query, params);
    if (rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return rows[0];
  }
}

export const userService = new UserService();

