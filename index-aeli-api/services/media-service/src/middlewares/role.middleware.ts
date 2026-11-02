import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors.js';

export function checkEditorRole(req: Request, res: Response, next: NextFunction) {
  const role = req.header('x-user-role');
  if (role !== 'super_admin' && role !== 'admin' && role !== 'content_editor') {
    return next(new AppError('Forbidden: insufficient permissions', 403));
  }
  next();
}

