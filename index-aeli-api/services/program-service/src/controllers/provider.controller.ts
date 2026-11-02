import { Request, Response, NextFunction } from 'express';
import { providerService } from '../services/provider.service.js';

export class ProviderController {
  async getProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await providerService.getAllProviders();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await providerService.createProvider(req.body);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await providerService.updateProvider(id, req.body);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const providerController = new ProviderController();

