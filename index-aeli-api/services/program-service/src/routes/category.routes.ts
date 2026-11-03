import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { checkEditorRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/categories', (req, res, next) => categoryController.getCategories(req, res, next));

// Admin routes
router.get('/admin/categories', checkEditorRole, (req, res, next) => categoryController.getAdminCategories(req, res, next));
router.post('/admin/categories', checkEditorRole, (req, res, next) => categoryController.createCategory(req, res, next));
router.put('/admin/categories/:id', checkEditorRole, (req, res, next) => categoryController.updateCategory(req, res, next));
router.delete('/admin/categories/:id', checkEditorRole, (req, res, next) => categoryController.deleteCategory(req, res, next));

export default router;

