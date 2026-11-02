import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface GetDestinationsFilter {
  is_popular?: string;
  search?: string;
}

export interface DestinationInput {
  id?: string;
  name: string;
  description: string;
  overview?: string;
  best_time_to_visit?: string;
  is_popular?: boolean;
  image?: string;
  gallery?: string[];
  capital?: string;
  population?: string;
  language?: string;
  timezone?: string;
  weather_temperature?: string;
  weather_condition?: string;
}

export class DestinationService {
  async getPublishedDestinations(filter: GetDestinationsFilter) {
    let query = `
      SELECT d.*, COALESCE(COUNT(a.id)::int, 0) as attraction_count
      FROM content.destinations d
      LEFT JOIN content.attractions a ON d.id = a.destination_id
      WHERE d.status = 'published'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filter.is_popular === 'true') {
      query += ` AND d.is_popular = true`;
    }

    if (filter.search) {
      query += ` AND (d.name ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`;
      params.push(`%${filter.search}%`);
      paramIndex++;
    }

    query += ` GROUP BY d.id ORDER BY d.is_popular DESC, attraction_count DESC;`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async getPublishedDestinationByIdOrSlug(idOrSlug: string) {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const query = isUuid
      ? `SELECT d.*, COALESCE(COUNT(a.id)::int, 0) as attraction_count
         FROM content.destinations d
         LEFT JOIN content.attractions a ON d.id = a.destination_id
         WHERE d.id = $1 AND d.status = 'published'
         GROUP BY d.id;`
      : `SELECT d.*, COALESCE(COUNT(a.id)::int, 0) as attraction_count
         FROM content.destinations d
         LEFT JOIN content.attractions a ON d.id = a.destination_id
         WHERE d.slug = $1 AND d.status = 'published'
         GROUP BY d.id;`;

    const { rows } = await pool.query(query, [idOrSlug]);
    if (rows.length === 0) {
      throw new AppError('Destination not found', 404);
    }
    return rows[0];
  }

  async getAttractionsForDestination(idOrSlug: string) {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const query = isUuid
      ? "SELECT id FROM content.destinations WHERE id = $1 AND status = 'published';"
      : "SELECT id FROM content.destinations WHERE slug = $1 AND status = 'published';";

    const destRes = await pool.query(query, [idOrSlug]);
    if (destRes.rows.length === 0) {
      throw new AppError('Destination not found', 404);
    }

    const destId = destRes.rows[0].id;
    const { rows } = await pool.query(
      "SELECT * FROM content.attractions WHERE destination_id = $1 AND status = 'published' ORDER BY name ASC;",
      [destId]
    );
    return rows;
  }

  async getInternalDestinationById(id: string) {
    const { rows } = await pool.query('SELECT id, name, slug FROM content.destinations WHERE id = $1;', [id]);
    if (rows.length === 0) {
      throw new AppError('Destination not found', 404);
    }
    return rows[0];
  }

  async getAllAdminDestinations() {
    const { rows } = await pool.query('SELECT * FROM content.destinations ORDER BY created_at DESC;');
    return rows;
  }

  async createDestination(data: DestinationInput, userId: string | null) {
    const { name, description, overview, best_time_to_visit, is_popular, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition, id } = data;

    if (!name || !description) {
      throw new AppError('Name and description are required', 400);
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
      const { rows } = await pool.query(
        `INSERT INTO content.destinations (id, name, slug, description, overview, best_time_to_visit, is_popular, status, created_by, updated_by, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition)
         VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, 'draft', $8, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *;`,
        [id || null, name, slug, description, overview || '', best_time_to_visit || '', is_popular || false, userId, image || '', gallery || [], capital || '', population || '', language || '', timezone || '', weather_temperature || '', weather_condition || '']
      );
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError('Destination name/slug already exists', 409);
      }
      throw err;
    }
  }

  async updateDestination(id: string, data: DestinationInput, userId: string | null) {
    const { name, description, overview, best_time_to_visit, is_popular, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition } = data;

    const { rows } = await pool.query(
      `UPDATE content.destinations
       SET name = $1, description = $2, overview = $3, best_time_to_visit = $4, is_popular = $5, updated_by = $6, updated_at = NOW(), image = $7, gallery = $8, capital = $9, population = $10, language = $11, timezone = $12, weather_temperature = $13, weather_condition = $14
       WHERE id = $15 RETURNING *;`,
      [name, description, overview, best_time_to_visit, is_popular, userId, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition, id]
    );

    if (rows.length === 0) {
      throw new AppError('Destination not found', 404);
    }
    return rows[0];
  }

  async updateDestinationStatus(id: string, status: string) {
    if (!['draft', 'review', 'published', 'archived'].includes(status)) {
      throw new AppError('Invalid status value', 400);
    }

    const { rows } = await pool.query(
      'UPDATE content.destinations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;',
      [status, id]
    );

    if (rows.length === 0) {
      throw new AppError('Destination not found', 404);
    }
    return rows[0];
  }

  async deleteDestination(id: string) {
    const { rowCount } = await pool.query('DELETE FROM content.destinations WHERE id = $1;', [id]);
    if (rowCount === 0) {
      throw new AppError('Destination not found', 404);
    }
    return { message: 'Destination deleted successfully' };
  }
}

export const destinationService = new DestinationService();

