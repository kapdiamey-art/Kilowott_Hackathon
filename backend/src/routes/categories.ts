import { Router, type Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { ActivityEvent } from '../models/ActivityEvent';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).toLowerCase().optional(),
  description: z.string().default(''),
  parentId: z.string().optional(),
  color: z.string().default('#8B5CF6'),
});

// GET /api/categories
router.get('/', async (req: AuthRequest, res: Response) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  // Enrich with live product counts
  const counts = await Product.aggregate([
    { $match: { status: { $ne: 'archived' } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  const enriched = categories.map((c) => ({ ...c, productCount: countMap[c.name] ?? 0 }));
  res.json(enriched);
});

// GET /api/categories/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const cat = await Category.findById(req.params.id).lean();
  if (!cat) throw new AppError(404, `Category ${req.params.id} not found`);
  res.json(cat);
});

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response) => {
  const data = CategorySchema.parse(req.body);
  const slug = data.slug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const existing = await Category.findOne({ slug });
  if (existing) throw new AppError(409, `Category slug "${slug}" already exists`);

  const cat = await Category.create({ ...data, slug, createdBy: req.actor });
  await ActivityEvent.create({
    action: 'category.created',
    entityType: 'category',
    entityId: cat._id,
    entityName: cat.name,
    actor: req.actor!,
    description: `Category "${cat.name}" created`,
  });
  res.status(201).json(cat);
});

// PATCH /api/categories/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const data = CategorySchema.partial().parse(req.body);
  const cat = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!cat) throw new AppError(404, `Category ${req.params.id} not found`);
  await ActivityEvent.create({
    action: 'category.updated',
    entityType: 'category',
    entityId: cat._id,
    entityName: cat.name,
    actor: req.actor!,
    description: `Category "${cat.name}" updated`,
  });
  res.json(cat);
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new AppError(404, `Category ${req.params.id} not found`);
  await Category.deleteOne({ _id: req.params.id });
  await ActivityEvent.create({
    action: 'category.deleted',
    entityType: 'category',
    entityId: cat._id,
    entityName: cat.name,
    actor: req.actor!,
    description: `Category "${cat.name}" deleted`,
  });
  res.status(204).send();
});

export default router;
