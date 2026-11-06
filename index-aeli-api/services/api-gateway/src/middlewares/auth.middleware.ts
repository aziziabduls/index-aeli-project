import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey123!';

export interface CustomRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired', code: 'SESSION_EXPIRED' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const protectAdminRoutes = (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  // Allow public bookings, payments & webhook callbacks from traveler portal & payment gateway
  if (
    req.path.startsWith('/api/v1/payments') ||
    req.path.startsWith('/payments') ||
    (req.method === 'POST' && (req.path === '/api/v1/bookings' || req.path === '/api/v1/transactions' || req.path === '/api/v1/registrations'))
  ) {
    return next();
  }


  const isProtectedPath =
    req.path.startsWith('/api/v1/admin/') ||
    req.path.startsWith('/api/v1/users') ||
    req.path.startsWith('/api/v1/roles') ||
    req.path.startsWith('/api/v1/billing') ||
    req.path.startsWith('/api/v1/notifications') ||
    req.path.startsWith('/api/v1/payout') ||
    req.path.startsWith('/api/v1/transactions') ||
    req.path.startsWith('/api/v1/registrations');

  if (isProtectedPath && !req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
  next();
};

