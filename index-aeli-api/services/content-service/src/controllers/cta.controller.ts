import { Request, Response, NextFunction } from 'express';
import { ctaService } from '../services/cta.service.js';

export class CtaController {
  async getCta(req: Request, res: Response, next: NextFunction) {
    try {
      const { scope } = req.query;
      const data = await ctaService.getActiveCtaByScope(scope as string | undefined);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAdminCta(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ctaService.getAllAdminCta();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateCta(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await ctaService.updateCta(id, req.body);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const ctaController = new CtaController();

