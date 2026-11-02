import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface ProviderInput {
  legal_name: string;
  display_name?: string;
  contact_info?: Record<string, any>;
  status?: string;
}

export class ProviderService {
  async getAllProviders() {
    const { rows } = await pool.query('SELECT * FROM program.providers ORDER BY legal_name ASC;');
    return rows;
  }

  async createProvider(data: ProviderInput) {
    const { legal_name, display_name, contact_info } = data;
    if (!legal_name) {
      throw new AppError('legal_name is required', 400);
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO program.providers (legal_name, display_name, contact_info, status)
         VALUES ($1, $2, $3, 'active') RETURNING *;`,
        [legal_name, display_name || legal_name, JSON.stringify(contact_info || {})]
      );
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError('Provider with this name already exists', 409);
      }
      throw err;
    }
  }

  async updateProvider(id: string, data: ProviderInput) {
    const { legal_name, display_name, contact_info, status } = data;

    const { rows } = await pool.query(
      `UPDATE program.providers
       SET legal_name = $1, display_name = $2, contact_info = $3, status = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *;`,
      [legal_name, display_name, JSON.stringify(contact_info || {}), status || 'active', id]
    );

    if (rows.length === 0) {
      throw new AppError('Provider not found', 404);
    }
    return rows[0];
  }
}

export const providerService = new ProviderService();

