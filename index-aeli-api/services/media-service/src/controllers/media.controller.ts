import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { mediaService } from '../services/media.service.js';

const uploadsDir = path.join(process.cwd(), 'uploads');

export class MediaController {
  async getMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { owner_type, owner_id } = req.query;
      const data = await mediaService.getMediaByOwner(
        owner_type as string | undefined,
        owner_id as string | undefined
      );
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { owner_type, owner_id, caption, order_index } = req.body;
      const data = await mediaService.uploadMedia({
        file: req.file,
        owner_type,
        owner_id,
        caption,
        order_index,
        uploadsDir
      });
      return res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await mediaService.deleteMedia(id, uploadsDir);
      return res.json({ success: true, message: data.message });
    } catch (err) {
      next(err);
    }
  }
}

export const mediaController = new MediaController();

