import { Router } from 'express';
import * as milestonesController from '../controllers/milestones.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Milestone operations
router.put('/:id', authorize('mentor', 'admin'), milestonesController.updateMilestone);
router.delete('/:id', authorize('admin'), milestonesController.deleteMilestone);

export default router;
