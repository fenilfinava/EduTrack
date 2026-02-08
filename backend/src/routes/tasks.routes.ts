import { Router } from 'express';
import * as tasksController from '../controllers/tasks.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task operations
router.get('/:id', tasksController.getTask);
router.put('/:id', tasksController.updateTask);
router.patch('/:id/status', tasksController.updateTaskStatus);
router.delete('/:id', tasksController.deleteTask);

// Comments
import * as commentsController from '../controllers/comments.controller';
router.get('/:id/comments', commentsController.listComments);
router.post('/:id/comments', commentsController.createComment);

export default router;
