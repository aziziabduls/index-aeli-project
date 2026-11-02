import { Request, Response, NextFunction } from 'express';
import { appConfigService } from '../services/app-config.service.js';

export class AppConfigController {
  async getAppConfig(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await appConfigService.getAppConfig();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateAppConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedBy = req.header('x-user-email') || req.header('x-user-id');
      const data = await appConfigService.updateAppConfig(req.body, updatedBy);
      return res.json({
        success: true,
        data,
        message: 'App configuration updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const appConfigController = new AppConfigController();

