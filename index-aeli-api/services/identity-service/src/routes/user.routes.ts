import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { accountController } from '../controllers/account.controller.js';
import { requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Current User Profile endpoints (Accessible by all authenticated users)
router.get('/users/me', (req, res, next) => accountController.getMe(req, res, next));
router.put('/users/me', (req, res, next) => accountController.updateMe(req, res, next));

// Admin user & roles management
router.get('/users', requireRole('super_admin', 'admin'), (req, res, next) => userController.getUsers(req, res, next));
router.get('/roles', requireRole('super_admin', 'admin'), (req, res, next) => userController.getRoles(req, res, next));
router.post('/users', requireRole('super_admin'), (req, res, next) => userController.createUser(req, res, next));
router.patch('/users/:id/role', requireRole('super_admin'), (req, res, next) => userController.updateRole(req, res, next));
router.patch('/users/:id', requireRole('super_admin'), (req, res, next) => userController.updateRole(req, res, next));
router.put('/users/:id', requireRole('super_admin'), (req, res, next) => userController.updateRole(req, res, next));
router.delete('/users/:id', requireRole('super_admin'), (req, res, next) => userController.deleteUser(req, res, next));

export default router;
