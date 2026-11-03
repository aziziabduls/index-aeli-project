import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface CategoryInput {
  name: string;
  description?: string;
  color?: string;
  gradient?: string;
}

export class CategoryService {
  async getAllCategories() {
    const { rows } = await pool.query('SELECT * FROM program.categories ORDER BY name ASC;');
    return rows;
  }

  async createCategory(data: CategoryInput) {
    const { name, description, color, gradient } = data;
    if (!name || !name.trim()) {
      throw new AppError('Category name is required', 400);
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO program.categories (name, description, color, gradient)
         VALUES ($1, $2, $3, $4) RETURNING *;`,
        [
          name.trim(),
          description || 'Custom user-defined category specified during program setup.',
          color || 'from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-500/20 bg-sky-500/5',
          gradient || 'from-sky-500 to-blue-600'
        ]
      );
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError('Category with this name already exists', 409);
      }
      throw err;
    }
  }

  async updateCategory(id: string, data: Partial<CategoryInput>) {
    const { name, description, color, gradient } = data;

    const { rows: existing } = await pool.query('SELECT * FROM program.categories WHERE id = $1;', [id]);
    if (existing.length === 0) {
      throw new AppError('Category not found', 404);
    }
    const oldName = existing[0].name;

    let query = 'UPDATE program.categories SET ';
    const params: any[] = [];
    let pIdx = 1;

    if (name && name.trim()) {
      query += `name = $${pIdx++}, `;
      params.push(name.trim());
    }
    if (description !== undefined) {
      query += `description = $${pIdx++}, `;
      params.push(description);
    }
    if (color !== undefined) {
      query += `color = $${pIdx++}, `;
      params.push(color);
    }
    if (gradient !== undefined) {
      query += `gradient = $${pIdx++}, `;
      params.push(gradient);
    }

    if (params.length === 0) {
      throw new AppError('Nothing to update', 400);
    }

    query += `updated_at = NOW() WHERE id = $${pIdx} RETURNING *;`;
    params.push(id);

    try {
      const { rows } = await pool.query(query, params);

      // If category name was renamed, propagate to programs table
      if (name && name.trim() && name.trim() !== oldName) {
        await pool.query('UPDATE program.programs SET category = $1 WHERE category = $2;', [
          name.trim(),
          oldName
        ]);
      }

      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError('Category with this name already exists', 409);
      }
      throw err;
    }
  }

  async deleteCategory(id: string) {
    const { rows } = await pool.query('DELETE FROM program.categories WHERE id = $1 RETURNING *;', [id]);
    if (rows.length === 0) {
      throw new AppError('Category not found', 404);
    }
    return rows[0];
  }
}

export const categoryService = new CategoryService();

