import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const data = await authService.login({ email, password });
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const data = await authService.register({ email, password });
      return res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const data = authService.refreshToken({ refreshToken });
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const data = authService.logout({ refreshToken });
      return res.json({ success: true, message: data.message });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();

