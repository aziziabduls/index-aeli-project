import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors.js';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.header('x-user-role');
    if (!role || !allowedRoles.includes(role)) {
      return next(new AppError(`Forbidden: ${allowedRoles.join('/')} only`, 403));
    }
    next();
  };
}

