import { Request, Response, NextFunction } from 'express';
import { programService } from '../services/program.service.js';

export class ProgramController {
  async getPrograms(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, destination, price_min, price_max, provider_id } = req.query;
      const data = await programService.getPublishedPrograms({
        category: category as string | undefined,
        destination: destination as string | undefined,
        price_min: price_min as string | undefined,
        price_max: price_max as string | undefined,
        provider_id: provider_id as string | undefined
      });
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getProgramById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await programService.getPublishedProgramById(id);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAdminPrograms(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await programService.getAllAdminPrograms();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAdminProgramById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await programService.getAdminProgramById(id);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createProgram(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await programService.createProgram(req.body);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateProgram(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await programService.updateProgram(id, req.body);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await programService.updateProgramStatus(id, status);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const programController = new ProgramController();

