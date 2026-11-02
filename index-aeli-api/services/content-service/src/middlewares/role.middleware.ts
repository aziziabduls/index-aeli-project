import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors.js';

export function checkEditorRole(req: Request, res: Response, next: NextFunction) {
  const role = req.header('x-user-role');
  if (role !== 'super_admin' && role !== 'admin' && role !== 'content_editor') {
    return next(new AppError('Forbidden: insufficient permissions', 403));
  }
  next();
}

export function checkAdminRole(req: Request, res: Response, next: NextFunction) {
  const role = req.header('x-user-role');
  if (role !== 'super_admin' && role !== 'admin') {
    return next(new AppError('Forbidden: admin privilege required', 403));
  }
  next();
}

export function checkSuperAdminRole(req: Request, res: Response, next: NextFunction) {
  const role = req.header('x-user-role');
  const email = req.header('x-user-email');
  if (role !== 'super_admin' && email !== 'superadmin@indexaeli.com') {
    return next(new AppError('Forbidden: superadmin privilege required', 403));
  }
  next();
}


