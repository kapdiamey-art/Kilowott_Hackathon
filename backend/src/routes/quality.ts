import { Router, type Response } from 'express';
import { Product } from '../models/Product';
import { ActivityEvent } from '../models/ActivityEvent';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ── Scoring weights ──────────────────────────────────────────────────────────
// Total possible = 100 points
const WEIGHTS = {
  name: 10,
  sku: 8,
  brand: 5,
  category: 5,
  description_good: 20,  // ≥ 100 chars
  description_short: 10, // > 0 but < 100 chars (partial)
  shortDescription: 8,
  bulletPoints: 10,       // ≥ 3 bullets
  images: 10,
  price: 8,
  attributes: 5,
  seoTitle: 5,
  seoDescription: 6,
};

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface QualityIssue {
  type: string;
  severity: IssueSeverity;
  message: string;
  field: string;
  fix: string;
}

export interface QualityResult {
  productId: string;
  productName: string;
  productSku: string;
  score: number;
  issues: QualityIssue[];
}

export function scoreProduct(p: {
  _id: unknown; name?: string; sku?: string; brand?: string; category?: string;
  description?: string; shortDescription?: string; bulletPoints?: string[];
  images?: unknown[]; pricing?: { price?: number }; attributes?: unknown[];
  seo?: { title?: string; description?: string };
}): QualityResult {
  const issues: QualityIssue[] = [];
  let score = 0;

  if (p.name) score += WEIGHTS.name;
  else issues.push({ type: 'missing_name', severity: 'critical', message: 'Product name is missing', field: 'name', fix: 'Add a product name' });

  if (p.sku) score += WEIGHTS.sku;
  else issues.push({ type: 'missing_sku', severity: 'critical', message: 'SKU is missing', field: 'sku', fix: 'Add a unique SKU' });

  if (p.brand) score += WEIGHTS.brand;
  else issues.push({ type: 'missing_brand', severity: 'medium', message: 'Brand is not set', field: 'brand', fix: 'Add a brand name' });

  if (p.category && p.category !== 'Uncategorized') score += WEIGHTS.category;
  else issues.push({ type: 'missing_category', severity: 'low', message: 'Product is uncategorized', field: 'category', fix: 'Assign a category' });

  const descLen = p.description?.length ?? 0;
  if (descLen >= 100) score += WEIGHTS.description_good;
  else if (descLen > 0) {
    score += WEIGHTS.description_short;
    issues.push({ type: 'short_description', severity: 'medium', message: `Description is only ${descLen} chars (≥100 recommended)`, field: 'description', fix: 'Expand description or use AI to improve it' });
  } else {
    issues.push({ type: 'missing_description', severity: 'critical', message: 'No product description', field: 'description', fix: 'Write or generate a description with AI' });
  }

  if (p.shortDescription && p.shortDescription.length >= 20) score += WEIGHTS.shortDescription;
  else issues.push({ type: 'missing_short_description', severity: 'low', message: 'Short description missing or too brief', field: 'shortDescription', fix: 'Add a 1–2 sentence summary' });

  if (p.bulletPoints && p.bulletPoints.length >= 3) score += WEIGHTS.bulletPoints;
  else if (p.bulletPoints && p.bulletPoints.length > 0) {
    score += Math.round(WEIGHTS.bulletPoints * p.bulletPoints.length / 3);
    issues.push({ type: 'few_bullet_points', severity: 'medium', message: `Only ${p.bulletPoints.length} bullet point(s) (3+ recommended)`, field: 'bulletPoints', fix: 'Add more feature bullet points' });
  } else {
    issues.push({ type: 'missing_bullet_points', severity: 'medium', message: 'No bullet points / key features', field: 'bulletPoints', fix: 'Add feature highlights or generate with AI' });
  }

  if (p.images && p.images.length > 0) score += WEIGHTS.images;
  else issues.push({ type: 'missing_images', severity: 'high', message: 'No product images', field: 'images', fix: 'Upload at least one product image' });

  if (p.pricing?.price && p.pricing.price > 0) score += WEIGHTS.price;
  else issues.push({ type: 'missing_price', severity: 'critical', message: 'Price is not set or is zero', field: 'pricing.price', fix: 'Set a product price' });

  if (p.attributes && p.attributes.length > 0) score += WEIGHTS.attributes;
  else issues.push({ type: 'missing_attributes', severity: 'low', message: 'No product attributes defined', field: 'attributes', fix: 'Add specifications or generate with AI' });

  if (p.seo?.title && p.seo.title.length > 0) score += WEIGHTS.seoTitle;
  else issues.push({ type: 'missing_seo_title', severity: 'high', message: 'SEO title is missing', field: 'seo.title', fix: 'Add an SEO title or generate with AI' });

  if (p.seo?.description && p.seo.description.length > 0) score += WEIGHTS.seoDescription;
  else issues.push({ type: 'missing_seo_description', severity: 'medium', message: 'SEO meta description is missing', field: 'seo.description', fix: 'Add a meta description' });

  return {
    productId: String(p._id),
    productName: p.name ?? 'Unnamed',
    productSku: p.sku ?? '',
    score: Math.min(100, score),
    issues,
  };
}

// GET /api/quality/summary
router.get('/summary', async (_req: AuthRequest, res: Response) => {
  const products = await Product.find({ status: { $ne: 'archived' } }).lean();

  const results = products.map(scoreProduct);
  const total = results.length;
  const avgScore = total ? Math.round(results.reduce((a, r) => a + r.score, 0) / total) : 0;

  const bands = {
    excellent: results.filter((r) => r.score >= 90).length,
    good: results.filter((r) => r.score >= 70 && r.score < 90).length,
    fair: results.filter((r) => r.score >= 50 && r.score < 70).length,
    poor: results.filter((r) => r.score < 50).length,
  };

  const allIssues = results.flatMap((r) => r.issues);
  const issueTypeCounts: Record<string, number> = {};
  allIssues.forEach((i) => { issueTypeCounts[i.type] = (issueTypeCounts[i.type] ?? 0) + 1; });

  res.json({ total, avgScore, bands, topIssueTypes: issueTypeCounts });
});

// GET /api/quality/issues?severity=&type=&page=1
router.get('/issues', async (req: AuthRequest, res: Response) => {
  const products = await Product.find({ status: { $ne: 'archived' } }).lean();
  let issues = products.flatMap((p) => {
    const r = scoreProduct(p);
    return r.issues.map((i) => ({
      ...i,
      productId: r.productId,
      productName: r.productName,
      productSku: r.productSku,
    }));
  });

  if (req.query.severity) issues = issues.filter((i) => i.severity === req.query.severity);
  if (req.query.type) issues = issues.filter((i) => i.type === req.query.type);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Number(req.query.limit) || 50);
  const total = issues.length;
  const paginated = issues.slice((page - 1) * limit, page * limit);

  res.json({ data: paginated, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// GET /api/quality/products/:id
router.get('/products/:id', async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json(scoreProduct(product));
});

// POST /api/quality/products/:id/recalculate
router.post('/products/:id/recalculate', async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }

  const result = scoreProduct(product);
  await Product.findByIdAndUpdate(req.params.id, {
    completeness: result.score,
    validationErrors: result.issues.map((i) => i.message),
  });

  await ActivityEvent.create({
    action: 'quality.recalculated',
    entityType: 'product',
    entityId: product._id,
    entityName: product.name,
    actor: req.actor!,
    description: `Quality recalculated for "${product.name}" → ${result.score}%`,
  });

  res.json(result);
});

// POST /api/quality/recalculate — batch all products
router.post('/recalculate', async (req: AuthRequest, res: Response) => {
  const products = await Product.find({ status: { $ne: 'archived' } });
  let updated = 0;
  for (const p of products) {
    const result = scoreProduct(p.toObject());
    await Product.findByIdAndUpdate(p._id, {
      completeness: result.score,
      validationErrors: result.issues.map((i) => i.message),
    });
    updated++;
  }
  res.json({ message: `Recalculated quality for ${updated} products` });
});

export default router;
