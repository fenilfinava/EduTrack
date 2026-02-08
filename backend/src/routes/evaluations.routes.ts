
import { Router } from 'express';
import * as evaluationsController from '../controllers/evaluations.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List evaluations (filtered by role)
router.get('/', evaluationsController.getEvaluations);

// Create/Update evaluation (Mentor only)
router.post('/', authorize('mentor'), evaluationsController.createEvaluation);

// Get specific student's evaluations
router.get('/student/:studentId', evaluationsController.getStudentEvaluation);

export default router;
