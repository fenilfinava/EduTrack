import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
// Admin and Mentor routes
router.get('/', authorize('admin', 'mentor'), usersController.listUsers);
router.post('/', authorize('admin'), usersController.createUser);
router.put('/:id/role', authorize('admin'), usersController.updateUserRole);
router.put('/:id/status', authorize('admin'), usersController.updateUserStatus);

// User routes (can access own profile)
router.get('/:id', usersController.getUserById);
router.put('/:id', usersController.updateProfile);

export default router;
