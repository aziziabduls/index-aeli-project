import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface CtaInput {
  title: string;
  body: string;
  button_text?: string;
  button_link?: string;
  status?: string;
}

export class CtaService {
  async getActiveCtaByScope(scope?: string) {
    if (!scope) {
      throw new AppError('Scope query parameter is required', 400);
    }

    const { rows } = await pool.query(
      "SELECT * FROM content.cta_sections WHERE scope = $1 AND status = 'published' LIMIT 1;",
      [scope]
    );

    if (rows.length === 0) {
      throw new AppError('CTA Section not found', 404);
    }
    return rows[0];
  }

  async getAllAdminCta() {
    const { rows } = await pool.query('SELECT * FROM content.cta_sections ORDER BY scope ASC;');
    return rows;
  }

  async updateCta(id: string, data: CtaInput) {
    const { title, body, button_text, button_link, status } = data;

    const { rows } = await pool.query(
      `UPDATE content.cta_sections
       SET title = $1, body = $2, button_text = $3, button_link = $4, status = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *;`,
      [title, body, button_text, button_link, status, id]
    );

    if (rows.length === 0) {
      throw new AppError('CTA Section not found', 404);
    }
    return rows[0];
  }
}

export const ctaService = new CtaService();

