import { Router, type Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { DuplicateReview } from '../models/Extras';
import { ActivityEvent } from '../models/ActivityEvent';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

// ── String similarity (Dice coefficient) ─────────────────────────────────────
function diceSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;

  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };

  const setA = bigrams(na);
  const setB = bigrams(nb);
  let intersection = 0;
  setA.forEach((bi) => { if (setB.has(bi)) intersection++; });
  return Math.round((2 * intersection / (setA.size + setB.size)) * 100);
}

// GET /api/duplicates — list reviewed/pending duplicate pairs
router.get('/', async (req: AuthRequest, res: Response) => {
  const status = req.query.status ?? 'pending';
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const filter: Record<string, unknown> = {};
  if (status !== 'all') filter.status = status;

  const [data, total] = await Promise.all([
    DuplicateReview.find(filter).sort({ similarityScore: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    DuplicateReview.countDocuments(filter),
  ]);

  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// POST /api/duplicates/scan — run detection scan across all active products
router.post('/scan', async (req: AuthRequest, res: Response) => {
  const products = await Product.find({ status: { $ne: 'archived' } })
    .select('name sku brand category pricing attributes')
    .lean();

  const threshold = Number(req.query.threshold) || 65;
  const newPairs: {
    productAId: string; productAName: string; productASku: string;
    productBId: string; productBName: string; productBSku: string;
    similarityScore: number; matchedFields: string[];
    evidence: { field: string; valueA: string; valueB: string; score: number }[];
  }[] = [];

  // O(n²) comparison — acceptable for catalogs < 10k products
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i];
      const b = products[j];

      const evidence: { field: string; valueA: string; valueB: string; score: number }[] = [];
      const matched: string[] = [];

      // Exact SKU match
      if (a.sku && b.sku && a.sku === b.sku) {
        evidence.push({ field: 'sku', valueA: a.sku, valueB: b.sku, score: 100 });
        matched.push('sku');
      }

      // Name similarity
      const nameSim = diceSimilarity(a.name, b.name);
      if (nameSim >= 70) {
        evidence.push({ field: 'name', valueA: a.name, valueB: b.name, score: nameSim });
        matched.push('name');
      }

      // Brand match
      if (a.brand && b.brand && a.brand.toLowerCase() === b.brand.toLowerCase()) {
        evidence.push({ field: 'brand', valueA: a.brand, valueB: b.brand, score: 100 });
        matched.push('brand');
      }

      // Category match
      if (a.category && b.category && a.category === b.category) {
        evidence.push({ field: 'category', valueA: a.category, valueB: b.category, score: 100 });
      }

      // Weighted overall similarity
      const overallScore = evidence.length > 0
        ? Math.round(evidence.reduce((acc, e) => acc + e.score, 0) / evidence.length)
        : 0;

      if (overallScore >= threshold && matched.length >= 1) {
        // Check if pair already exists
        const existing = await DuplicateReview.findOne({
          $or: [
            { productAId: a._id, productBId: b._id },
            { productAId: b._id, productBId: a._id },
          ],
        });
        if (!existing) {
          newPairs.push({
            productAId: String(a._id), productAName: a.name, productASku: a.sku,
            productBId: String(b._id), productBName: b.name, productBSku: b.sku,
            similarityScore: overallScore, matchedFields: matched, evidence,
          });
        }
      }
    }
  }

  if (newPairs.length > 0) {
    await DuplicateReview.insertMany(newPairs);
  }

  await ActivityEvent.create({
    action: 'duplicate.reviewed',
    entityType: 'catalog',
    actor: req.actor!,
    description: `Duplicate scan completed — ${newPairs.length} new candidate pair(s) found`,
    metadata: { scanned: products.length, found: newPairs.length, threshold },
  });

  res.json({ scanned: products.length, newPairsFound: newPairs.length, threshold });
});

// GET /api/duplicates/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const pair = await DuplicateReview.findById(req.params.id).lean();
  if (!pair) throw new AppError(404, `Duplicate review ${req.params.id} not found`);

  // Enrich with full product data
  const [productA, productB] = await Promise.all([
    Product.findById(pair.productAId).lean(),
    Product.findById(pair.productBId).lean(),
  ]);

  res.json({ ...pair, productA, productB });
});

// PATCH /api/duplicates/:id/review — dismiss or confirm
const ReviewSchema = z.object({
  status: z.enum(['dismissed', 'confirmed']),
  resolution: z.string().optional(),
});

router.patch('/:id/review', async (req: AuthRequest, res: Response) => {
  const { status, resolution } = ReviewSchema.parse(req.body);
  const pair = await DuplicateReview.findByIdAndUpdate(
    req.params.id,
    { status, resolution, reviewedBy: req.actor, reviewedAt: new Date() },
    { new: true },
  );
  if (!pair) throw new AppError(404, `Duplicate review ${req.params.id} not found`);

  await ActivityEvent.create({
    action: status === 'dismissed' ? 'duplicate.dismissed' : 'duplicate.reviewed',
    entityType: 'duplicate_review',
    entityId: pair._id,
    actor: req.actor!,
    description: `Duplicate pair ${status}: "${pair.productAName}" ↔ "${pair.productBName}"`,
  });

  res.json(pair);
});

export default router;
