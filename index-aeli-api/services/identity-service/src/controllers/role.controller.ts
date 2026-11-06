import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/role.service.js';

export class RoleController {
  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await roleService.getAllRoles();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await roleService.getRoleById(id);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = roleService.getPermissionSets();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, key, group, accessLevel, permissionSets, description, owner, status } = req.body;
      const userEmail = (req as any).user?.email || req.header('x-user-email');
      const data = await roleService.createRole({
        name,
        key,
        group,
        accessLevel,
        permissionSets,
        description,
        owner: owner || userEmail || 'System',
        status
      });
      return res.status(201).json({ success: true, message: 'Role created successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, accessLevel, permissionSets, description, owner, status, group } = req.body;
      const data = await roleService.updateRole(id, {
        name,
        accessLevel,
        permissionSets,
        description,
        owner,
        status,
        group
      });
      return res.json({ success: true, message: 'Role updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async reviewRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await roleService.reviewRole(id);
      return res.json({ success: true, message: 'Role reviewed and activated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async duplicateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await roleService.duplicateRole(id);
      return res.status(201).json({ success: true, message: 'Role duplicated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await roleService.deleteRole(id);
      return res.json({ success: true, message: data.message });
    } catch (err) {
      next(err);
    }
  }

  async importRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { roles } = req.body;
      const data = await roleService.importRoles(roles);
      return res.json({ success: true, message: `Successfully imported ${data.importedCount} roles`, data });
    } catch (err) {
      next(err);
    }
  }
}

export const roleController = new RoleController();

