import { Router, type Response } from 'express';
import { z } from 'zod';
import { AttributeDefinition } from '../models/Category';
import { ActivityEvent } from '../models/ActivityEvent';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

const AttrSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['text', 'number', 'select', 'boolean', 'multiselect']).default('text'),
  options: z.array(z.string()).default([]),
  required: z.boolean().default(false),
  categoryIds: z.array(z.string()).default([]),
  description: z.string().default(''),
});

// GET /api/attributes
router.get('/', async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.query;
  const filter = categoryId ? { categoryIds: categoryId } : {};
  const attrs = await AttributeDefinition.find(filter).sort({ name: 1 }).lean();
  res.json(attrs);
});

// GET /api/attributes/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const attr = await AttributeDefinition.findById(req.params.id).lean();
  if (!attr) throw new AppError(404, `Attribute ${req.params.id} not found`);
  res.json(attr);
});

// POST /api/attributes
router.post('/', async (req: AuthRequest, res: Response) => {
  const data = AttrSchema.parse(req.body);
  const attr = await AttributeDefinition.create({ ...data, createdBy: req.actor });
  await ActivityEvent.create({
    action: 'attribute.created',
    entityType: 'attribute',
    entityId: attr._id,
    entityName: attr.name,
    actor: req.actor!,
    description: `Attribute "${attr.name}" created (type: ${attr.type})`,
  });
  res.status(201).json(attr);
});

// PATCH /api/attributes/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const data = AttrSchema.partial().parse(req.body);
  const attr = await AttributeDefinition.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!attr) throw new AppError(404, `Attribute ${req.params.id} not found`);
  res.json(attr);
});

// DELETE /api/attributes/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const attr = await AttributeDefinition.findById(req.params.id);
  if (!attr) throw new AppError(404, `Attribute ${req.params.id} not found`);
  await AttributeDefinition.deleteOne({ _id: req.params.id });
  await ActivityEvent.create({
    action: 'attribute.deleted',
    entityType: 'attribute',
    entityId: attr._id,
    entityName: attr.name,
    actor: req.actor!,
    description: `Attribute "${attr.name}" deleted`,
  });
  res.status(204).send();
});

export default router;
