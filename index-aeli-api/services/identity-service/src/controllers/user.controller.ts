import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.getAllUsers();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.getRolesWithCounts();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, role } = req.body;
      const data = await userService.createUser({ email, password, role });
      return res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role, status } = req.body;
      const data = await userService.updateUserRoleAndStatus(id, { role, status });
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();

