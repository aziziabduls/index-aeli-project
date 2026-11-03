import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface CreateUserParams {
  email?: string;
  password?: string;
  role?: string;
}

export interface UpdateUserParams {
  email?: string;
  password?: string;
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

  async updateUserRoleAndStatus(id: string, { email, password, role, status }: UpdateUserParams) {
    let query = 'UPDATE identity.users SET ';
    const params: any[] = [];
    let paramIndex = 1;

    if (email) {
      query += `email = $${paramIndex++}, `;
      params.push(email);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += `password_hash = $${paramIndex++}, `;
      params.push(hash);
    }
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

    try {
      const { rows } = await pool.query(query, params);
      if (rows.length === 0) {
        throw new AppError('User not found', 404);
      }
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError('Email already in use by another user', 409);
      }
      throw err;
    }
  }

  async deleteUserPermanently(userId: string, requestingUserId?: string) {
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    if (requestingUserId && userId === requestingUserId) {
      throw new AppError('You cannot delete your own account', 400);
    }

    // 1. Check if user exists
    const { rows: existingUsers } = await pool.query(
      'SELECT id, email, role FROM identity.users WHERE id = $1;',
      [userId]
    );

    if (existingUsers.length === 0) {
      throw new AppError('User not found', 404);
    }

    const targetUser = existingUsers[0];
    if (targetUser.email.toLowerCase() === 'superadmin@indexaeli.com') {
      throw new AppError('Root superadmin account cannot be deleted', 403);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Find destinations created by this user
      const { rows: userDests } = await client.query(
        `SELECT id FROM content.destinations 
         WHERE created_by = $1
            OR id IN (SELECT entity_id FROM audit.audit_logs WHERE actor_id = $1 AND entity_type = 'destination' AND entity_id IS NOT NULL)`,
        [userId]
      );
      const destIds: string[] = userDests.map((r: any) => r.id);

      // 2. Find attractions created by this user or under user's destinations
      const { rows: userAttrs } = await client.query(
        `SELECT id FROM content.attractions 
         WHERE created_by = $1 
            OR ($2::uuid[] IS NOT NULL AND destination_id = ANY($2::uuid[]))
            OR id IN (SELECT entity_id FROM audit.audit_logs WHERE actor_id = $1 AND entity_type = 'attraction' AND entity_id IS NOT NULL)`,
        [userId, destIds.length > 0 ? destIds : null]
      );
      const attrIds: string[] = userAttrs.map((r: any) => r.id);

      // 3. Find programs created by this user or linked to user's destinations/attractions
      const { rows: userProgs } = await client.query(
        `SELECT id FROM program.programs 
         WHERE created_by = $1 
            OR ($2::uuid[] IS NOT NULL AND destination_id = ANY($2::uuid[]))
            OR ($3::uuid[] IS NOT NULL AND attraction_id = ANY($3::uuid[]))
            OR id IN (SELECT entity_id FROM audit.audit_logs WHERE actor_id = $1 AND entity_type = 'program' AND entity_id IS NOT NULL)`,
        [userId, destIds.length > 0 ? destIds : null, attrIds.length > 0 ? attrIds : null]
      );
      const progIds: string[] = userProgs.map((r: any) => r.id);

      // 4. Delete media assets belonging to those programs, attractions, destinations
      const allOwnerIds = [...destIds, ...attrIds, ...progIds];
      if (allOwnerIds.length > 0) {
        await client.query(
          `DELETE FROM media.media_assets WHERE owner_id = ANY($1::uuid[])`,
          [allOwnerIds]
        );
      }

      // 5. Delete programs (itinerary_stops, rundown_items, include_exclude_items cascade automatically via FK)
      if (progIds.length > 0) {
        await client.query(
          `DELETE FROM program.programs WHERE id = ANY($1::uuid[])`,
          [progIds]
        );
      }

      // 6. Delete attractions
      if (attrIds.length > 0) {
        await client.query(
          `DELETE FROM content.attractions WHERE id = ANY($1::uuid[])`,
          [attrIds]
        );
      }

      // 7. Delete destinations
      if (destIds.length > 0) {
        await client.query(
          `DELETE FROM content.destinations WHERE id = ANY($1::uuid[])`,
          [destIds]
        );
      }

      // 8. Delete user audit logs
      await client.query(
        `DELETE FROM audit.audit_logs WHERE actor_id = $1`,
        [userId]
      );

      // 9. Delete user from identity.users
      const { rows: deletedUser } = await client.query(
        `DELETE FROM identity.users WHERE id = $1 RETURNING id, email, role;`,
        [userId]
      );

      await client.query('COMMIT');

      return {
        user: deletedUser[0],
        deletedContent: {
          destinationsCount: destIds.length,
          attractionsCount: attrIds.length,
          programsCount: progIds.length,
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const userService = new UserService();

