import { pool } from '../db.js';
import { AppError } from '../errors.js';
import { destinationResolverService } from './destination-resolver.service.js';

export interface GetProgramsFilter {
  category?: string;
  destination?: string;
  price_min?: string;
  price_max?: string;
  provider_id?: string;
}

export interface ItineraryStopInput {
  location_name: string;
  unique_feature?: string;
  activity_challenge?: string;
}

export interface RundownItemInput {
  time_label: string;
  duration_minutes?: number | null;
  session_activity: string;
  location?: string;
  facilitator_notes?: string;
}

export interface ProgramInput {
  id?: string;
  provider_id: string;
  destination_id?: string | null;
  attraction_id?: string | null;
  name: string;
  category: string;
  location_label: string;
  short_description: string;
  overview?: string;
  highlights?: string[];
  price_min?: number | null;
  price_max?: number | null;
  price_unit?: string;
  price_note?: string;
  duration_label: string;
  max_guest_min?: number | null;
  max_guest_max?: number | null;
  min_quota?: number | null;
  max_quota?: number | null;
  meeting_point?: string;
  date_availability?: string | null;
  available_dates?: string[] | null;
  itinerary?: ItineraryStopInput[];
  rundown?: RundownItemInput[];
  included?: string[];
  excluded?: string[];
  image?: string;
  gallery?: string[];
}

export class ProgramService {
  async getPublishedPrograms(filter: GetProgramsFilter) {
    const { category, destination, price_min, price_max, provider_id } = filter;

    let query = `
      SELECT p.*, pr.legal_name as provider_name
      FROM program.programs p
      LEFT JOIN program.providers pr ON p.provider_id = pr.id
      WHERE p.status = 'published'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND p.category ILIKE $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (provider_id) {
      query += ` AND p.provider_id = $${paramIndex}`;
      params.push(provider_id);
      paramIndex++;
    }

    if (price_min) {
      query += ` AND p.price_min >= $${paramIndex}`;
      params.push(parseFloat(price_min));
      paramIndex++;
    }

    if (price_max) {
      query += ` AND p.price_min <= $${paramIndex}`;
      params.push(parseFloat(price_max));
      paramIndex++;
    }

    query += ` ORDER BY p.rating DESC, p.created_at DESC;`;

    const { rows } = await pool.query(query, params);

    // Resolve Destinations dynamically for each program
    const resolvedRows = [];
    for (const row of rows) {
      const dest = await destinationResolverService.resolveDestination(row.destination_id);

      // Fetch related Itineraries
      const itinRes = await pool.query(
        'SELECT id, order_index, location_name, unique_feature, activity_challenge FROM program.itinerary_stops WHERE program_id = $1 ORDER BY order_index ASC;',
        [row.id]
      );

      // Fetch related Rundowns
      const rundownRes = await pool.query(
        'SELECT id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes FROM program.rundown_items WHERE program_id = $1 ORDER BY order_index ASC;',
        [row.id]
      );

      // Fetch Includes/Excludes
      const incExcRes = await pool.query(
        'SELECT id, type, description FROM program.include_exclude_items WHERE program_id = $1;',
        [row.id]
      );

      resolvedRows.push({
        ...row,
        min_quota: row.min_quota ?? row.max_guest_min ?? null,
        max_quota: row.max_quota ?? row.max_guest_max ?? null,
        max_guest_min: row.max_guest_min ?? row.min_quota ?? null,
        max_guest_max: row.max_guest_max ?? row.max_quota ?? null,
        date_availability: row.date_availability ?? 'all_days',
        available_dates: row.available_dates ?? [],
        destination: dest || null,
        itinerary: itinRes.rows,
        rundown: rundownRes.rows,
        included: incExcRes.rows.filter(item => item.type === 'include').map(item => item.description),
        excluded: incExcRes.rows.filter(item => item.type === 'exclude').map(item => item.description)
      });
    }

    // Apply destination slug/id filter in application layer if requested
    let finalRows = resolvedRows;
    if (destination) {
      finalRows = resolvedRows.filter(r =>
        r.destination_id === destination ||
        (r.destination && r.destination.slug === destination)
      );
    }

    return finalRows;
  }

  async getPublishedProgramById(id: string) {
    const progRes = await pool.query(
      `SELECT p.*, pr.legal_name as provider_name
       FROM program.programs p
       LEFT JOIN program.providers pr ON p.provider_id = pr.id
       WHERE p.id = $1 AND p.status = 'published';`,
      [id]
    );

    if (progRes.rows.length === 0) {
      throw new AppError('Program not found', 404);
    }

    const program = progRes.rows[0];

    const itinRes = await pool.query(
      'SELECT id, order_index, location_name, unique_feature, activity_challenge FROM program.itinerary_stops WHERE program_id = $1 ORDER BY order_index ASC;',
      [id]
    );

    const rundownRes = await pool.query(
      'SELECT id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes FROM program.rundown_items WHERE program_id = $1 ORDER BY order_index ASC;',
      [id]
    );

    const incExcRes = await pool.query(
      'SELECT id, type, description FROM program.include_exclude_items WHERE program_id = $1;',
      [id]
    );

    const dest = await destinationResolverService.resolveDestination(program.destination_id);

    return {
      ...program,
      min_quota: program.min_quota ?? program.max_guest_min ?? null,
      max_quota: program.max_quota ?? program.max_guest_max ?? null,
      max_guest_min: program.max_guest_min ?? program.min_quota ?? null,
      max_guest_max: program.max_guest_max ?? program.max_quota ?? null,
      date_availability: program.date_availability ?? 'all_days',
      available_dates: program.available_dates ?? [],
      destination: dest || null,
      itinerary: itinRes.rows,
      rundown: rundownRes.rows,
      included: incExcRes.rows.filter(item => item.type === 'include').map(item => item.description),
      excluded: incExcRes.rows.filter(item => item.type === 'exclude').map(item => item.description)
    };
  }

  async getAllAdminPrograms() {
    const { rows } = await pool.query('SELECT * FROM program.programs ORDER BY created_at DESC;');
    return rows.map(r => ({
      ...r,
      min_quota: r.min_quota ?? r.max_guest_min ?? null,
      max_quota: r.max_quota ?? r.max_guest_max ?? null,
      max_guest_min: r.max_guest_min ?? r.min_quota ?? null,
      max_guest_max: r.max_guest_max ?? r.max_quota ?? null,
      date_availability: r.date_availability ?? 'all_days',
      available_dates: r.available_dates ?? [],
    }));
  }

  async getAdminProgramById(id: string) {
    const progRes = await pool.query(
      `SELECT p.*, pr.legal_name as provider_name
       FROM program.programs p
       LEFT JOIN program.providers pr ON p.provider_id = pr.id
       WHERE p.id = $1;`,
      [id]
    );

    if (progRes.rows.length === 0) {
      throw new AppError('Program not found', 404);
    }

    const program = progRes.rows[0];

    const itinRes = await pool.query(
      'SELECT id, order_index, location_name, unique_feature, activity_challenge FROM program.itinerary_stops WHERE program_id = $1 ORDER BY order_index ASC;',
      [id]
    );

    const rundownRes = await pool.query(
      'SELECT id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes FROM program.rundown_items WHERE program_id = $1 ORDER BY order_index ASC;',
      [id]
    );

    const incExcRes = await pool.query(
      'SELECT id, type, description FROM program.include_exclude_items WHERE program_id = $1;',
      [id]
    );

    return {
      ...program,
      min_quota: program.min_quota ?? program.max_guest_min ?? null,
      max_quota: program.max_quota ?? program.max_guest_max ?? null,
      max_guest_min: program.max_guest_min ?? program.min_quota ?? null,
      max_guest_max: program.max_guest_max ?? program.max_quota ?? null,
      date_availability: program.date_availability ?? 'all_days',
      available_dates: program.available_dates ?? [],
      itinerary: itinRes.rows,
      rundown: rundownRes.rows,
      included: incExcRes.rows.filter(item => item.type === 'include').map(item => item.description),
      excluded: incExcRes.rows.filter(item => item.type === 'exclude').map(item => item.description)
    };
  }

  async createProgram(data: ProgramInput, userId: string | null = null) {
    const {
      id, provider_id, destination_id, attraction_id, name, category, location_label,
      short_description, overview, highlights, price_min, price_max,
      price_unit, price_note, duration_label, max_guest_min, max_guest_max,
      min_quota, max_quota,
      meeting_point, date_availability, available_dates, itinerary, rundown, included, excluded, image, gallery
    } = data;

    if (!provider_id || !name || !category || !location_label || !short_description || !duration_label) {
      throw new AppError('Required fields are missing', 400);
    }

    const guestMin = min_quota !== undefined && min_quota !== null
      ? Number(min_quota)
      : (max_guest_min !== undefined && max_guest_min !== null ? Number(max_guest_min) : null);
    const guestMax = max_quota !== undefined && max_quota !== null
      ? Number(max_quota)
      : (max_guest_max !== undefined && max_guest_max !== null ? Number(max_guest_max) : null);
    const availability = date_availability?.trim() || 'all_days';
    const datesList = Array.isArray(available_dates) ? available_dates : [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const progRes = await client.query(
        `INSERT INTO program.programs (
           id, provider_id, destination_id, attraction_id, name, category, location_label,
           short_description, overview, highlights, price_min, price_max,
           price_unit, price_note, duration_label, max_guest_min, max_guest_max,
           min_quota, max_quota,
           meeting_point, status, image, gallery, date_availability, available_dates, created_by, updated_by
         ) VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $16, $17, $18, 'draft', $19, $20, $21, $22, $23, $23) RETURNING *;`,
        [
          id || null, provider_id, destination_id || null, attraction_id || null, name, category, location_label,
          short_description, overview || '', highlights || [], price_min || null, price_max || null,
          price_unit || '', price_note || '', duration_label, guestMin, guestMax,
          meeting_point || '', image || '', gallery || [], availability, datesList, userId
        ]
      );

      const program = {
        ...progRes.rows[0],
        min_quota: progRes.rows[0].min_quota ?? progRes.rows[0].max_guest_min ?? null,
        max_quota: progRes.rows[0].max_quota ?? progRes.rows[0].max_guest_max ?? null,
        max_guest_min: progRes.rows[0].max_guest_min ?? progRes.rows[0].min_quota ?? null,
        max_guest_max: progRes.rows[0].max_guest_max ?? progRes.rows[0].max_quota ?? null,
        date_availability: progRes.rows[0].date_availability ?? 'all_days',
        available_dates: progRes.rows[0].available_dates ?? [],
      };

      // Save nested Itinerary Stops
      if (itinerary && Array.isArray(itinerary)) {
        let orderIdx = 0;
        for (const item of itinerary) {
          await client.query(
            `INSERT INTO program.itinerary_stops (program_id, order_index, location_name, unique_feature, activity_challenge)
             VALUES ($1, $2, $3, $4, $5);`,
            [program.id, orderIdx++, item.location_name, item.unique_feature || '', item.activity_challenge || '']
          );
        }
      }

      // Save nested Rundowns
      if (rundown && Array.isArray(rundown)) {
        let orderIdx = 0;
        for (const item of rundown) {
          await client.query(
            `INSERT INTO program.rundown_items (program_id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7);`,
            [program.id, orderIdx++, item.time_label, item.duration_minutes || null, item.session_activity, item.location || '', item.facilitator_notes || '']
          );
        }
      }

      // Save nested Includes/Excludes
      if (included && Array.isArray(included)) {
        for (const desc of included) {
          await client.query(
            `INSERT INTO program.include_exclude_items (program_id, type, description)
             VALUES ($1, 'include', $2);`,
            [program.id, desc]
          );
        }
      }

      if (excluded && Array.isArray(excluded)) {
        for (const desc of excluded) {
          await client.query(
            `INSERT INTO program.include_exclude_items (program_id, type, description)
             VALUES ($1, 'exclude', $2);`,
            [program.id, desc]
          );
        }
      }

      await client.query('COMMIT');
      return program;
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateProgram(id: string, data: ProgramInput, userId: string | null = null) {
    const {
      provider_id, destination_id, attraction_id, name, category, location_label,
      short_description, overview, highlights, price_min, price_max,
      price_unit, price_note, duration_label, max_guest_min, max_guest_max,
      min_quota, max_quota,
      meeting_point, date_availability, available_dates, itinerary, rundown, included, excluded, image, gallery
    } = data;

    const guestMin = min_quota !== undefined && min_quota !== null
      ? Number(min_quota)
      : (max_guest_min !== undefined && max_guest_min !== null ? Number(max_guest_min) : null);
    const guestMax = max_quota !== undefined && max_quota !== null
      ? Number(max_quota)
      : (max_guest_max !== undefined && max_guest_max !== null ? Number(max_guest_max) : null);
    const availability = date_availability !== undefined && date_availability !== null ? date_availability.trim() : null;
    const datesList = available_dates !== undefined && available_dates !== null
      ? (Array.isArray(available_dates) ? available_dates : [])
      : null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const progRes = await client.query(
        `UPDATE program.programs
         SET provider_id = $1, destination_id = $2, attraction_id = $3, name = $4, category = $5, location_label = $6,
             short_description = $7, overview = $8, highlights = $9, price_min = $10, price_max = $11,
             price_unit = $12, price_note = $13, duration_label = $14,
             max_guest_min = $15, max_guest_max = $16, min_quota = $15, max_quota = $16,
             meeting_point = $17, updated_at = NOW(), image = $18, gallery = $19,
             date_availability = COALESCE($20, date_availability, 'all_days'),
             available_dates = COALESCE($21, available_dates, '{}'),
             updated_by = COALESCE($23, updated_by)
         WHERE id = $22 RETURNING *;`,
        [
          provider_id, destination_id || null, attraction_id || null, name, category, location_label,
          short_description, overview, highlights, price_min, price_max,
          price_unit, price_note, duration_label, guestMin, guestMax,
          meeting_point, image, gallery, availability, datesList, id, userId
        ]
      );

      if (progRes.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Program not found', 404);
      }

      const program = {
        ...progRes.rows[0],
        min_quota: progRes.rows[0].min_quota ?? progRes.rows[0].max_guest_min ?? null,
        max_quota: progRes.rows[0].max_quota ?? progRes.rows[0].max_guest_max ?? null,
        max_guest_min: progRes.rows[0].max_guest_min ?? progRes.rows[0].min_quota ?? null,
        max_guest_max: progRes.rows[0].max_guest_max ?? progRes.rows[0].max_quota ?? null,
        date_availability: progRes.rows[0].date_availability ?? 'all_days',
        available_dates: progRes.rows[0].available_dates ?? [],
      };

      // Replace nested Itinerary Stops
      await client.query('DELETE FROM program.itinerary_stops WHERE program_id = $1;', [id]);
      if (itinerary && Array.isArray(itinerary)) {
        let orderIdx = 0;
        for (const item of itinerary) {
          await client.query(
            `INSERT INTO program.itinerary_stops (program_id, order_index, location_name, unique_feature, activity_challenge)
             VALUES ($1, $2, $3, $4, $5);`,
            [id, orderIdx++, item.location_name, item.unique_feature || '', item.activity_challenge || '']
          );
        }
      }

      // Replace nested Rundowns
      await client.query('DELETE FROM program.rundown_items WHERE program_id = $1;', [id]);
      if (rundown && Array.isArray(rundown)) {
        let orderIdx = 0;
        for (const item of rundown) {
          await client.query(
            `INSERT INTO program.rundown_items (program_id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7);`,
            [id, orderIdx++, item.time_label, item.duration_minutes || null, item.session_activity, item.location || '', item.facilitator_notes || '']
          );
        }
      }

      // Replace Includes/Excludes
      await client.query('DELETE FROM program.include_exclude_items WHERE program_id = $1;', [id]);
      if (included && Array.isArray(included)) {
        for (const desc of included) {
          await client.query(
            `INSERT INTO program.include_exclude_items (program_id, type, description)
             VALUES ($1, 'include', $2);`,
            [id, desc]
          );
        }
      }

      if (excluded && Array.isArray(excluded)) {
        for (const desc of excluded) {
          await client.query(
            `INSERT INTO program.include_exclude_items (program_id, type, description)
             VALUES ($1, 'exclude', $2);`,
            [id, desc]
          );
        }
      }

      await client.query('COMMIT');
      return program;
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateProgramStatus(id: string, status: string) {
    if (!['draft', 'review', 'published', 'archived'].includes(status)) {
      throw new AppError('Invalid status value', 400);
    }

    const { rows } = await pool.query(
      'UPDATE program.programs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;',
      [status, id]
    );

    if (rows.length === 0) {
      throw new AppError('Program not found', 404);
    }
    return rows[0];
  }
}

export const programService = new ProgramService();

