import { Router, type Request, type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { webhookVerify } from '../middleware/webhookVerify';
import { pushProduct, runFullSync, handleWebhook } from '../services/syncService';
import { SyncJob } from '../models/SyncJob';
import { WooConnection } from '../models/WooConnection';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// ─── Authenticated routes ────────────────────────────────────────────────────

// GET /api/sync/jobs — recent sync jobs
router.get('/jobs', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const jobs = await SyncJob.find().sort({ startedAt: -1 }).limit(20).lean();
  res.json(jobs);
});

// GET /api/sync/jobs/:id
router.get('/jobs/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const job = await SyncJob.findById(req.params.id).lean();
  if (!job) throw new AppError(404, `Sync job ${req.params.id} not found`);
  res.json(job);
});

// POST /api/sync/full — trigger a full catalog sync
router.post('/full', authMiddleware, async (req: AuthRequest, res: Response) => {
  const job = await runFullSync('manual');
  res.status(202).json(job);
});

// POST /api/sync/products/:id — push a single product to Woo
router.post('/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await pushProduct(req.params.id, req.actor!);
  res.json({ message: 'Product synced to WooCommerce' });
});

// ─── WooCommerce connection management ─────────────────────────────────────

const WooConnectionSchema = z.object({
  siteUrl: z.string().url('Must be a valid URL (e.g. https://mystore.com)'),
  consumerKey: z.string().min(1),
  consumerSecret: z.string().min(1),
  webhookSecret: z.string().optional(),
});

// GET /api/sync/connection
router.get('/connection', authMiddleware, async (_req, res: Response) => {
  const conn = await WooConnection.findOne().select('-consumerKey -consumerSecret -webhookSecret').lean();
  res.json(conn ?? null);
});

// POST /api/sync/connection
router.post('/connection', authMiddleware, async (req: AuthRequest, res: Response) => {
  const data = WooConnectionSchema.parse(req.body);
  await WooConnection.deleteMany({});
  const conn = await WooConnection.create({ ...data, isVerified: false });
  res.status(201).json({ id: conn.id, siteUrl: conn.siteUrl, isVerified: false });
});

// POST /api/sync/connection/test
router.post('/connection/test', authMiddleware, async (_req, res: Response) => {
  const conn = await WooConnection.findOne();
  if (!conn) throw new AppError(404, 'No WooCommerce connection configured');
  try {
    const WooCommerceRestApi = (await import('@woocommerce/woocommerce-rest-api')).default;
    const api = new WooCommerceRestApi({
      url: conn.siteUrl,
      consumerKey: conn.getConsumerKey(),
      consumerSecret: conn.getConsumerSecret(),
      version: 'wc/v3',
    });
    await api.get('system_status');
    conn.isVerified = true;
    conn.lastTestedAt = new Date();
    await conn.save();
    res.json({ ok: true, siteUrl: conn.siteUrl });
  } catch (err) {
    conn.isVerified = false;
    await conn.save();
    throw new AppError(502, `WooCommerce connection test failed: ${(err as Error).message}`, 'WOO_TEST_FAILED');
  }
});

// ─── Unauthenticated webhook endpoint ────────────────────────────────────────

// POST /api/sync/webhook (verified by HMAC, no JWT required)
router.post('/webhook', webhookVerify, async (req: Request, res: Response) => {
  const topic = req.headers['x-wc-webhook-topic'] as string;
  if (!topic) { res.status(400).json({ error: 'Missing x-wc-webhook-topic header' }); return; }

  // Ack immediately — process async
  res.status(200).json({ received: true });
  await handleWebhook(topic, req.body as Record<string, unknown>);
});

export default router;
