
import { Router } from 'express';
import * as auditController from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Only admins can view audit logs
router.get('/', authorize('admin'), auditController.getAuditLogs);
router.get('/metrics', authorize('admin'), auditController.getSystemStats);

export default router;
