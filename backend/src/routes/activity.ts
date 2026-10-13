import { Router, type Response } from 'express';
import { ActivityEvent } from '../models/ActivityEvent';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/activity?page=1&limit=50&action=&actor=&from=&to=
router.get('/', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  // Build filter
  const filter: Record<string, unknown> = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.actor) filter.actor = req.query.actor;
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.from || req.query.to) {
    filter.timestamp = {
      ...(req.query.from ? { $gte: new Date(String(req.query.from)) } : {}),
      ...(req.query.to ? { $lte: new Date(String(req.query.to)) } : {}),
    };
  }

  const [events, total] = await Promise.all([
    ActivityEvent.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    ActivityEvent.countDocuments(filter),
  ]);

  res.json({
    data: events,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/activity/summary — counts per action type
router.get('/summary', async (_req: AuthRequest, res: Response) => {
  const summary = await ActivityEvent.aggregate([
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json(summary);
});

export default router;
