import express from 'express';
import { pool } from '../db.js';
import { CustomRequest } from './auth.middleware.js';

export const auditLoggingMiddleware = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const isAdminRoute = req.path.includes('/admin/');

  if (isWrite && isAdminRoute) {
    res.on('finish', async () => {
      // Only log if response was successful (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const actorId = req.user?.id || null;
        if (!actorId) return;

        // Deduce entity type from route
        let entityType = 'unknown';
        if (req.path.includes('/destinations')) entityType = 'destination';
        else if (req.path.includes('/attractions')) entityType = 'attraction';
        else if (req.path.includes('/programs')) entityType = 'program';
        else if (req.path.includes('/providers')) entityType = 'provider';
        else if (req.path.includes('/categories')) entityType = 'category';
        else if (req.path.includes('/media')) entityType = 'media';
        else if (req.path.includes('/cta')) entityType = 'cta';

        // Deduce action
        let action = 'update';
        if (req.method === 'POST') action = 'create';
        else if (req.method === 'DELETE') action = 'delete';
        else if (req.method === 'PATCH' && req.path.includes('/status')) {
          action = 'publish';
        }

        // Try to get ID from path params
        const parts = req.path.split('/');
        const entityId =
          parts.find((p) =>
            p.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
          ) || null;

        try {
          await pool.query(
            `INSERT INTO audit.audit_logs (actor_id, entity_type, entity_id, action, diff)
             VALUES ($1, $2, $3, $4, $5);`,
            [actorId, entityType, entityId, action, JSON.stringify({ path: req.path, method: req.method })]
          );
        } catch (err) {
          console.error('Failed to write audit log:', err);
        }
      }
    });
  }
  next();
};

