import { Request, Response, NextFunction } from 'express';
import { destinationService } from '../services/destination.service.js';

export class DestinationController {
  async getDestinations(req: Request, res: Response, next: NextFunction) {
    try {
      const { is_popular, search } = req.query;
      const data = await destinationService.getPublishedDestinations({
        is_popular: is_popular as string | undefined,
        search: search as string | undefined
      });
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getDestinationByIdOrSlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { idOrSlug } = req.params;
      const data = await destinationService.getPublishedDestinationByIdOrSlug(idOrSlug);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAttractionsForDestination(req: Request, res: Response, next: NextFunction) {
    try {
      const { idOrSlug } = req.params;
      const data = await destinationService.getAttractionsForDestination(idOrSlug);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getInternalDestination(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await destinationService.getInternalDestinationById(id);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAdminDestinations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await destinationService.getAllAdminDestinations();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createDestination(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.header('x-user-id') || null;
      const data = await destinationService.createDestination(req.body, userId);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateDestination(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.header('x-user-id') || null;
      const data = await destinationService.updateDestination(id, req.body, userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await destinationService.updateDestinationStatus(id, status);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteDestination(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await destinationService.deleteDestination(id);
      return res.json({ success: true, message: data.message });
    } catch (err) {
      next(err);
    }
  }
}

export const destinationController = new DestinationController();

