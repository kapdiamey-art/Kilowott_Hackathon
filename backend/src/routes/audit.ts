import { Router, type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { getAuditTrail } from '../services/auditService';
import { AuditLog } from '../models/AuditLog';
import { Types } from 'mongoose';

const router = Router();
router.use(authMiddleware);

// GET /api/audit?limit=50
router.get('/', async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const logs = await AuditLog.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
  res.json(logs);
});

// GET /api/audit/:entityId
router.get('/:entityId', async (req: AuthRequest, res: Response) => {
  const id = new Types.ObjectId(req.params.entityId);
  const logs = await getAuditTrail(id);
  res.json(logs);
});

export default router;
