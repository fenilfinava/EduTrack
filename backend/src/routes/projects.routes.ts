import { Router } from 'express';
import * as projectsController from '../controllers/projects.controller';
import * as tasksController from '../controllers/tasks.controller';
import * as milestonesController from '../controllers/milestones.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and create projects
router.get('/', projectsController.listProjects);
router.post('/', authorize('admin', 'student'), projectsController.createProject);

// Project operations
router.get('/:id', projectsController.getProjectById);
router.put('/:id', authorize('mentor', 'admin'), projectsController.updateProject);
router.delete('/:id', authorize('admin'), projectsController.deleteProject);

// Member management
router.post('/:id/members', authorize('mentor', 'admin'), projectsController.addProjectMember);
router.delete('/:id/members/:userId', authorize('mentor', 'admin'), projectsController.removeProjectMember);

// Task management within projects
router.get('/:id/tasks', tasksController.listTasks);
router.post('/:id/tasks', tasksController.createTask);

// Milestone management within projects
router.get('/:id/milestones', milestonesController.listMilestones);
router.post('/:id/milestones', milestonesController.createMilestone);

export default router;

