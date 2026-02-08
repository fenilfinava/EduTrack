
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as teamsController from '../controllers/teams.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('admin', 'mentor'), teamsController.createTeam);
router.get('/', teamsController.listTeams);
router.put('/:id', authorize('admin'), teamsController.updateTeam);
router.get('/:id', teamsController.getTeam);
router.post('/:id/members', authorize('admin', 'mentor'), teamsController.addMember);
router.delete('/:id/members/:userId', authorize('admin', 'mentor'), teamsController.removeMember);

export default router;
