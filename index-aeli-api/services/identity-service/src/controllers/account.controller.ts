import { Request, Response, NextFunction } from 'express';
import { accountService } from '../services/account.service.js';

export class AccountController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || req.header('x-user-id');
      const data = await accountService.getMe(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || req.header('x-user-id');
      const { name, phone, bio, email, current_password, new_password } = req.body;
      const data = await accountService.updateMe(userId, {
        name,
        phone,
        bio,
        email,
        current_password,
        new_password
      });
      return res.json({ success: true, message: 'Profile updated successfully', data });
    } catch (err) {
      next(err);
    }
  }
}

export const accountController = new AccountController();

