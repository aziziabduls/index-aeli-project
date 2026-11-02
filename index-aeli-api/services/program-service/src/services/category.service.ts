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
}

export const categoryService = new CategoryService();

