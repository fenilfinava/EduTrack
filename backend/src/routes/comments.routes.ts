import { Router } from 'express';
import * as commentsController from '../controllers/comments.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Comment operations
router.put('/:id', commentsController.updateComment);
router.delete('/:id', commentsController.deleteComment);

export default router;
