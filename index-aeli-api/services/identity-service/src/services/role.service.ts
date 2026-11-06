import { pool } from '../db.js';
import { AppError } from '../errors.js';

export const AVAILABLE_PERMISSION_SETS = [
  { id: 'Users', name: 'Users', module: 'Identity', description: 'Manage team accounts, assign roles, and control access permissions.' },
  { id: 'Roles', name: 'Roles', module: 'Identity', description: 'Define access tiers, permission scopes, and review matrices.' },
  { id: 'Destinations', name: 'Destinations', module: 'Content', description: 'Create and edit travel regional destinations and geographic profiles.' },
  { id: 'Attractions', name: 'Attractions', module: 'Content', description: 'Manage physical landmarks, sightseeing sights, and operational schedules.' },
  { id: 'Programs', name: 'Programs', module: 'Program', description: 'Configure experiential tour catalog, itineraries, rundowns, and pricing.' },
  { id: 'Providers', name: 'Providers', module: 'Program', description: 'Manage travel agency operator contracts, legal entities, and contact info.' },
  { id: 'Categories', name: 'Categories', module: 'Program', description: 'Organize catalog taxonomy, category color palettes, and tags.' },
  { id: 'Media', name: 'Media', module: 'Media', description: 'Upload static images, banner galleries, and media asset registry.' },
  { id: 'Billing', name: 'Billing', module: 'Identity', description: 'Manage organization subscription plan, payment methods, and invoices.' },
  { id: 'Payout', name: 'Payout', module: 'Identity', description: 'Manage bank disbursement accounts, withdrawal schedules, and balances.' },
  { id: 'Reports', name: 'Reports', module: 'Analytics', description: 'View business intelligence reports, booking statistics, and traveler traffic.' },
  { id: 'Settings', name: 'Settings', module: 'Content', description: 'Configure global portal branding, tax percentages, and contact details.' },
  { id: 'Audit Logs', name: 'Audit Logs', module: 'Audit', description: 'Inspect security audit trails and system modification history.' },
];

export interface CreateRoleParams {
  name: string;
  key?: string;
  group?: string;
  accessLevel?: string;
  permissionSets?: string[];
  description?: string;
  owner?: string;
  status?: string;
}

export interface UpdateRoleParams {
  name?: string;
  accessLevel?: string;
  permissionSets?: string[];
  description?: string;
  owner?: string;
  status?: string;
  group?: string;
}

function formatDate(dateVal: any): string {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(dateVal);
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_');
}

export class RoleService {
  async getAllRoles() {
    const { rows } = await pool.query(`
      SELECT r.id, r.name, r.key, r.group_name, r.access_level, r.permission_sets,
             r.description, r.owner, r.status, r.is_system, r.last_review, r.created_at, r.updated_at,
             COALESCE(u.user_count, 0)::int AS users
      FROM identity.roles r
      LEFT JOIN (
        SELECT role, COUNT(*)::int AS user_count
        FROM identity.users
        GROUP BY role
      ) u ON r.key = u.role
      ORDER BY r.is_system DESC, r.created_at ASC;
    `);

    return rows.map((row) => ({
      id: row.id,
      role: row.name,
      key: row.key,
      group: row.group_name,
      accessLevel: row.access_level,
      users: row.users,
      permissionSets: row.permission_sets || [],
      lastReview: formatDate(row.last_review),
      rawLastReview: row.last_review,
      owner: row.owner,
      status: row.status,
      isSystem: row.is_system,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getRoleById(id: string) {
    const { rows } = await pool.query(
      `SELECT r.id, r.name, r.key, r.group_name, r.access_level, r.permission_sets,
              r.description, r.owner, r.status, r.is_system, r.last_review, r.created_at, r.updated_at,
              COALESCE(u.user_count, 0)::int AS users
       FROM identity.roles r
       LEFT JOIN (
         SELECT role, COUNT(*)::int AS user_count
         FROM identity.users
         GROUP BY role
       ) u ON r.key = u.role
       WHERE r.id = $1;`,
      [id]
    );

    if (rows.length === 0) {
      throw new AppError('Role not found', 404);
    }

    const role = rows[0];

    // Fetch members assigned to this role
    const { rows: members } = await pool.query(
      `SELECT id, email, name, role, status, created_at
       FROM identity.users
       WHERE role = $1
       ORDER BY created_at DESC;`,
      [role.key]
    );

    return {
      id: role.id,
      role: role.name,
      key: role.key,
      group: role.group_name,
      accessLevel: role.access_level,
      users: role.users,
      permissionSets: role.permission_sets || [],
      lastReview: formatDate(role.last_review),
      rawLastReview: role.last_review,
      owner: role.owner,
      status: role.status,
      isSystem: role.is_system,
      description: role.description,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      members
    };
  }

  async createRole(params: CreateRoleParams) {
    if (!params.name || !params.name.trim()) {
      throw new AppError('Role name is required', 400);
    }

    const name = params.name.trim();
    let key = params.key ? slugify(params.key) : slugify(name);
    if (!key) {
      key = `role_${Date.now()}`;
    }

    // Check conflict
    const existing = await pool.query(
      'SELECT id FROM identity.roles WHERE LOWER(name) = LOWER($1) OR key = $2;',
      [name, key]
    );
    if (existing.rows.length > 0) {
      throw new AppError('A role with this name or identifier already exists', 409);
    }

    const groupName = params.group || 'Custom roles';
    const accessLevel = params.accessLevel || 'Scoped';
    const permissionSets = params.permissionSets || [];
    const description = params.description || null;
    const owner = params.owner || 'System';
    const status = params.status || 'Active';

    const { rows } = await pool.query(
      `INSERT INTO identity.roles (name, key, group_name, access_level, permission_sets, description, owner, status, is_system, last_review)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
       RETURNING *;`,
      [name, key, groupName, accessLevel, permissionSets, description, owner, status]
    );

    return rows[0];
  }

  async updateRole(id: string, params: UpdateRoleParams) {
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM identity.roles WHERE id = $1;',
      [id]
    );
    if (existingRows.length === 0) {
      throw new AppError('Role not found', 404);
    }

    const existing = existingRows[0];
    const isSystem = existing.is_system;

    let name = existing.name;
    if (params.name && params.name.trim() !== '') {
      if (isSystem && params.name.trim() !== existing.name) {
        throw new AppError('System role names cannot be renamed', 400);
      }
      name = params.name.trim();
    }

    const accessLevel = params.accessLevel !== undefined ? params.accessLevel : existing.access_level;
    const permissionSets = params.permissionSets !== undefined ? params.permissionSets : existing.permission_sets;
    const description = params.description !== undefined ? params.description : existing.description;
    const owner = params.owner !== undefined ? params.owner : existing.owner;
    const status = params.status !== undefined ? params.status : existing.status;
    const groupName = isSystem
      ? existing.group_name
      : params.group !== undefined
        ? params.group
        : existing.group_name;

    const { rows } = await pool.query(
      `UPDATE identity.roles
       SET name = $1, access_level = $2, permission_sets = $3, description = $4,
           owner = $5, status = $6, group_name = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *;`,
      [name, accessLevel, permissionSets, description, owner, status, groupName, id]
    );

    return rows[0];
  }

  async reviewRole(id: string) {
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM identity.roles WHERE id = $1;',
      [id]
    );
    if (existingRows.length === 0) {
      throw new AppError('Role not found', 404);
    }

    const existing = existingRows[0];
    const groupName = existing.is_system ? 'System roles' : 'Custom roles';

    const { rows } = await pool.query(
      `UPDATE identity.roles
       SET status = 'Active', group_name = $1, last_review = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *;`,
      [groupName, id]
    );

    return rows[0];
  }

  async duplicateRole(id: string) {
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM identity.roles WHERE id = $1;',
      [id]
    );
    if (existingRows.length === 0) {
      throw new AppError('Role not found', 404);
    }

    const existing = existingRows[0];
    const baseName = `${existing.name} (Copy)`;
    let targetName = baseName;
    let targetKey = `${existing.key}_copy_${Math.floor(1000 + Math.random() * 9000)}`;

    const { rows } = await pool.query(
      `INSERT INTO identity.roles (name, key, group_name, access_level, permission_sets, description, owner, status, is_system, last_review)
       VALUES ($1, $2, 'Custom roles', $3, $4, $5, 'System', 'Active', false, NOW())
       RETURNING *;`,
      [
        targetName,
        targetKey,
        existing.access_level,
        existing.permission_sets || [],
        `Duplicated from ${existing.name}. ${existing.description || ''}`.trim()
      ]
    );

    return rows[0];
  }

  async deleteRole(id: string) {
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM identity.roles WHERE id = $1;',
      [id]
    );
    if (existingRows.length === 0) {
      throw new AppError('Role not found', 404);
    }

    const role = existingRows[0];
    if (role.is_system) {
      throw new AppError('System roles cannot be deleted', 403);
    }

    // Check if any users have this role
    const { rows: userCount } = await pool.query(
      'SELECT COUNT(*)::int as count FROM identity.users WHERE role = $1;',
      [role.key]
    );
    if (userCount[0].count > 0) {
      throw new AppError(
        `Cannot delete role '${role.name}' because ${userCount[0].count} member(s) are currently assigned to it. Please reassign them first in User Access.`,
        400
      );
    }

    await pool.query('DELETE FROM identity.roles WHERE id = $1;', [id]);
    return { success: true, message: `Role '${role.name}' deleted successfully.` };
  }

  async importRoles(rolesList: any[]) {
    if (!Array.isArray(rolesList) || rolesList.length === 0) {
      throw new AppError('Import payload must be a non-empty array of role objects', 400);
    }

    const imported = [];
    for (const item of rolesList) {
      const name = item.role || item.name;
      if (!name) continue;

      const key = item.key || slugify(name);
      const groupName = item.group || 'Custom roles';
      const accessLevel = item.accessLevel || 'Scoped';
      const permissionSets = Array.isArray(item.permissionSets) ? item.permissionSets : [];
      const description = item.description || `Imported role configuration`;
      const owner = item.owner || 'System';
      const status = item.status === 'Needs review' ? 'Needs review' : 'Active';

      const { rows } = await pool.query(
        `INSERT INTO identity.roles (name, key, group_name, access_level, permission_sets, description, owner, status, is_system, last_review)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
         ON CONFLICT (key) DO UPDATE
         SET name = EXCLUDED.name,
             access_level = EXCLUDED.access_level,
             permission_sets = EXCLUDED.permission_sets,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             updated_at = NOW()
         RETURNING *;`,
        [name, key, groupName, accessLevel, permissionSets, description, owner, status]
      );
      imported.push(rows[0]);
    }

    return { importedCount: imported.length, roles: imported };
  }

  getPermissionSets() {
    return AVAILABLE_PERMISSION_SETS;
  }
}

export const roleService = new RoleService();

