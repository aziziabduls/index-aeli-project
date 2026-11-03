import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service.js';

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getAllCategories();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAdminCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.getAllCategories();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.createCategory(req.body);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await categoryService.updateCategory(id, req.body);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await categoryService.deleteCategory(id);
      return res.json({ success: true, message: 'Category deleted successfully', data });
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();

