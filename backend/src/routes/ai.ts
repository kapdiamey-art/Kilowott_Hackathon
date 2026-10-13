import { Router, type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { runEnrichmentAgent, applyAgentResult, rejectAgentTask } from '../services/agentService';
import { runAiTask, isAiConfigured, type TaskType } from '../services/aiService';
import { AgentTask } from '../models/AgentTask';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const EnrichSchema = z.object({
  productId: z.string().min(1),
  taskType: z.enum(['improve_description', 'generate_title', 'create_bullet_points', 'generate_seo', 'suggest_attributes']),
  requireApproval: z.boolean().default(true),
});

// GET /api/ai/status
router.get('/status', (_req: AuthRequest, res: Response) => {
  res.json({ configured: isAiConfigured() });
});

// POST /api/ai/enrich — start an agentic enrichment task
router.post('/enrich', async (req: AuthRequest, res: Response) => {
  const { productId, taskType, requireApproval } = EnrichSchema.parse(req.body);
  const task = await runEnrichmentAgent({
    productId,
    taskType: taskType as TaskType,
    actor: req.actor!,
    requireApproval,
  });
  res.status(202).json(task);
});

// GET /api/ai/tasks — list agent tasks (pending, awaiting_approval, etc.)
router.get('/tasks', async (req: AuthRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const filter = status ? { status } : {};
  const tasks = await AgentTask.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  res.json(tasks);
});

// GET /api/ai/tasks/:id
router.get('/tasks/:id', async (req: AuthRequest, res: Response) => {
  const task = await AgentTask.findById(req.params.id).lean();
  if (!task) throw new AppError(404, `Task ${req.params.id} not found`);
  res.json(task);
});

// POST /api/ai/tasks/:id/approve
router.post('/tasks/:id/approve', async (req: AuthRequest, res: Response) => {
  await applyAgentResult(req.params.id, req.actor!);
  res.json({ message: 'Task approved and applied' });
});

// POST /api/ai/tasks/:id/reject
router.post('/tasks/:id/reject', async (req: AuthRequest, res: Response) => {
  await rejectAgentTask(req.params.id, req.actor!);
  res.json({ message: 'Task rejected' });
});

export default router;
