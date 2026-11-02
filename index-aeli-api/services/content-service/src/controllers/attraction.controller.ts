import { Request, Response, NextFunction } from 'express';
import { attractionService } from '../services/attraction.service.js';

export class AttractionController {
  async getAllAttractions(req: Request, res: Response, next: NextFunction) {
    try {
      const { destination_id } = req.query;
      const data = await attractionService.getAllPublishedAttractions(destination_id as string | undefined);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAttractionByIdOrSlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { idOrSlug } = req.params;
      const data = await attractionService.getPublishedAttractionByIdOrSlug(idOrSlug);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAdminAttractions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attractionService.getAllAdminAttractions();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createAttraction(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attractionService.createAttraction(req.body);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateAttraction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await attractionService.updateAttraction(id, req.body);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await attractionService.updateAttractionStatus(id, status);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteAttraction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await attractionService.deleteAttraction(id);
      return res.json({ success: true, message: data.message });
    } catch (err) {
      next(err);
    }
  }
}

export const attractionController = new AttractionController();

