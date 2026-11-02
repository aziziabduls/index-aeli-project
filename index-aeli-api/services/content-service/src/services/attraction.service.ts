import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface AttractionInput {
  id?: string;
  destination_id: string;
  name: string;
  location_label: string;
  description: string;
  about?: string;
  historical_background?: string;
  operational_hours?: string;
  latitude?: number | null;
  longitude?: number | null;
  entrance_access_info?: string;
  facilities?: string[];
  image?: string;
  gallery?: string[];
}

export class AttractionService {
  async getAllPublishedAttractions(destination_id?: string) {
    let query = `
      SELECT a.*, d.name as destination_name, d.slug as destination_slug 
      FROM content.attractions a
      JOIN content.destinations d ON a.destination_id = d.id
      WHERE a.status = 'published'
    `;
    const params: any[] = [];
    if (destination_id) {
      const isUuid = destination_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      if (isUuid) {
        query += ' AND a.destination_id = $1';
      } else {
        query += ' AND d.slug = $1';
      }
      params.push(destination_id);
    }
    query += ' ORDER BY a.name ASC;';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async getPublishedAttractionByIdOrSlug(idOrSlug: string) {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const query = isUuid
      ? "SELECT * FROM content.attractions WHERE id = $1 AND status = 'published';"
      : "SELECT * FROM content.attractions WHERE slug = $1 AND status = 'published';";

    const { rows } = await pool.query(query, [idOrSlug]);
    if (rows.length === 0) {
      throw new AppError('Attraction not found', 404);
    }
    return rows[0];
  }

  async getAllAdminAttractions() {
    const query = `
      SELECT a.*, d.name as destination_name, d.slug as destination_slug
      FROM content.attractions a
      LEFT JOIN content.destinations d ON a.destination_id = d.id
      ORDER BY a.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async createAttraction(data: AttractionInput) {
    const { id, destination_id, name, location_label, description, about, historical_background, operational_hours, latitude, longitude, entrance_access_info, facilities, image, gallery } = data;

    if (!destination_id || !name || !location_label || !description) {
      throw new AppError('destination_id, name, location_label, and description are required', 400);
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
      const { rows } = await pool.query(
        `INSERT INTO content.attractions (id, destination_id, name, slug, location_label, description, about, historical_background, operational_hours, latitude, longitude, entrance_access_info, facilities, status, image, gallery)
         VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', $14, $15) RETURNING *;`,
        [id || null, destination_id, name, slug, location_label, description, about || '', historical_background || '', operational_hours || '', latitude || null, longitude || null, entrance_access_info || '', facilities || [], image || '', gallery || []]
      );
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError('Attraction name/slug already exists', 409);
      }
      throw err;
    }
  }

  async updateAttraction(id: string, data: AttractionInput) {
    const { name, location_label, description, about, historical_background, operational_hours, latitude, longitude, entrance_access_info, facilities, image, gallery } = data;

    const { rows } = await pool.query(
      `UPDATE content.attractions
       SET name = $1, location_label = $2, description = $3, about = $4, historical_background = $5, operational_hours = $6, latitude = $7, longitude = $8, entrance_access_info = $9, facilities = $10, updated_at = NOW(), image = $11, gallery = $12
       WHERE id = $13 RETURNING *;`,
      [name, location_label, description, about, historical_background, operational_hours, latitude, longitude, entrance_access_info, facilities, image, gallery, id]
    );

    if (rows.length === 0) {
      throw new AppError('Attraction not found', 404);
    }
    return rows[0];
  }

  async updateAttractionStatus(id: string, status: string) {
    const { rows } = await pool.query(
      'UPDATE content.attractions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;',
      [status, id]
    );

    if (rows.length === 0) {
      throw new AppError('Attraction not found', 404);
    }
    return rows[0];
  }

  async deleteAttraction(id: string) {
    const { rowCount } = await pool.query('DELETE FROM content.attractions WHERE id = $1;', [id]);
    if (rowCount === 0) {
      throw new AppError('Attraction not found', 404);
    }
    return { message: 'Attraction deleted successfully' };
  }
}

export const attractionService = new AttractionService();

