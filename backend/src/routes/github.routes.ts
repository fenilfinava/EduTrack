import { Router } from 'express';
import * as githubController from '../controllers/github.controller';
import * as githubWebhookController from '../controllers/githubWebhook.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Webhook (public, no auth)
router.post('/webhook', githubWebhookController.handleWebhook);

// All other routes require authentication
router.use(authenticate);

// GitHub operations
router.post('/sync/:projectId', githubController.syncGitHubData);
router.get('/commits/:projectId', githubController.getCommits);
router.get('/pull-requests/:projectId', githubController.getPullRequests);
router.get('/contributors/:projectId', githubController.getContributors);

export default router;
