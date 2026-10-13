import { Router, type Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { PublishingJob } from '../models/Extras';
import { ActivityEvent } from '../models/ActivityEvent';
import { env } from '../config/env';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

// ── Readiness check (deterministic, no AI) ────────────────────────────────────
function checkPublishReadiness(p: {
  name?: string; sku?: string; description?: string; pricing?: { price?: number };
  images?: unknown[]; status?: string; seo?: { title?: string; description?: string };
}): { ready: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!p.name) issues.push('Product name is missing');
  if (!p.sku) issues.push('SKU is missing');
  if (!p.description || p.description.length < 50) issues.push('Description is missing or too short (< 50 chars)');
  if (!p.pricing?.price || p.pricing.price <= 0) issues.push('Price is not set');
  if (!p.images || p.images.length === 0) issues.push('At least one image is required');
  if (!p.seo?.title) issues.push('SEO title is missing');
  return { ready: issues.length === 0, issues };
}

// GET /api/publishing/status — integration status
router.get('/status', (_req: AuthRequest, res: Response) => {
  const wooConfigured = !!(env.WOO_SITE_URL && env.WOO_CONSUMER_KEY && env.WOO_CONSUMER_SECRET);
  res.json({
    destinations: [
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        configured: wooConfigured,
        status: wooConfigured ? 'connected' : 'not_configured',
        description: wooConfigured ? `Connected to ${env.WOO_SITE_URL}` : 'Add WooCommerce credentials to enable',
      },
      {
        id: 'simulation',
        name: 'Simulation (Demo)',
        configured: true,
        status: 'active',
        description: 'Simulated publishing for demo/testing — no real store required',
      },
    ],
  });
});

// GET /api/publishing/jobs — list publishing jobs
router.get('/jobs', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.destination) filter.destination = req.query.destination;

  const [data, total] = await Promise.all([
    PublishingJob.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    PublishingJob.countDocuments(filter),
  ]);
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// POST /api/publishing/validate/:productId
router.post('/validate/:productId', async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.productId).lean();
  if (!product) throw new AppError(404, 'Product not found');
  res.json({ productId: req.params.productId, ...checkPublishReadiness(product) });
});

// POST /api/publishing/jobs — create a publishing job
const CreateJobSchema = z.object({
  productId: z.string(),
  destination: z.string().default('simulation'),
});

router.post('/jobs', async (req: AuthRequest, res: Response) => {
  const { productId, destination } = CreateJobSchema.parse(req.body);

  const product = await Product.findById(productId).lean();
  if (!product) throw new AppError(404, 'Product not found');

  const { ready, issues } = checkPublishReadiness(product);
  if (!ready) {
    throw new AppError(422, `Product is not ready to publish: ${issues.join('; ')}`, 'NOT_READY');
  }

  const isSimulated = destination === 'simulation' || !env.WOO_SITE_URL;

  const job = await PublishingJob.create({
    productId,
    productSku: product.sku,
    destination: isSimulated ? 'simulation' : destination,
    status: isSimulated ? 'simulated' : 'queued',
    isSimulated,
    triggeredBy: req.actor!,
    attempts: 1,
    lastAttemptAt: new Date(),
    ...(isSimulated ? { completedAt: new Date() } : {}),
  });

  if (isSimulated) {
    // Mark product as published (simulated)
    await Product.findByIdAndUpdate(productId, { status: 'published' });
  }

  await ActivityEvent.create({
    action: isSimulated ? 'publishing.job_completed' : 'publishing.job_started',
    entityType: 'product',
    entityId: product._id,
    entityName: product.name,
    actor: req.actor!,
    description: isSimulated
      ? `[SIMULATION] "${product.name}" marked as published (simulated — no real store updated)`
      : `Publishing job started for "${product.name}" → ${destination}`,
    metadata: { jobId: job._id, isSimulated },
  });

  res.status(201).json(job);
});

// GET /api/publishing/jobs/:id
router.get('/jobs/:id', async (req: AuthRequest, res: Response) => {
  const job = await PublishingJob.findById(req.params.id).lean();
  if (!job) throw new AppError(404, `Job ${req.params.id} not found`);
  res.json(job);
});

export default router;
