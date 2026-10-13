import { Product } from '../models/Product';
import type { IProduct } from '../models/Product';
import { filterToPimOwned } from '../utils/fieldPolicy';
import { recordChange } from './auditService';
import { AppError } from '../middleware/errorHandler';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput } from '../validators/productSchema';

// ─── Completeness calculation ────────────────────────────────────────────────

export function calcCompleteness(p: Partial<IProduct>): number {
  const checks: Array<[unknown, number]> = [
    [p.name, 10],
    [p.sku, 8],
    [p.brand, 5],
    [p.category, 5],
    [p.description && p.description.length > 50, 20],
    [p.shortDescription && p.shortDescription.length > 20, 10],
    [p.bulletPoints && p.bulletPoints.length >= 3, 10],
    [p.images && p.images.length > 0, 10],
    [p.pricing?.price, 5],
    [p.attributes && p.attributes.length > 0, 5],
    [p.seo?.title, 5],
    [p.seo?.description, 5],
    [p.tags && p.tags.length > 0, 2],
  ];
  return Math.min(100, checks.reduce((acc, [val, w]) => acc + (val ? w : 0), 0));
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function listProducts(query: ProductQueryInput) {
  const filter: Record<string, unknown> = { status: { $ne: 'archived' } };

  if (query.status) filter['status'] = query.status;
  if (query.syncStatus) filter['syncStatus'] = query.syncStatus;
  if (query.category) filter['category'] = query.category;
  if (query.search) {
    filter['$or'] = [
      { name: { $regex: query.search, $options: 'i' } },
      { sku: { $regex: query.search, $options: 'i' } },
    ];
  }

  const sortField = query.sort === 'completeness' ? 'completeness' : query.sort;
  const sortOrder = query.order === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    data: products,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProductById(id: string) {
  const product = await Product.findById(id).lean();
  if (!product) throw new AppError(404, `Product ${id} not found`);
  return product;
}

export async function createProduct(data: CreateProductInput, actor: string) {
  const completeness = calcCompleteness(data as Partial<IProduct>);
  const product = await Product.create({
    ...data,
    completeness,
    pimUpdatedAt: new Date(),
    pimUpdatedBy: actor,
  });

  await recordChange({
    entityType: 'product',
    entityId: product._id,
    action: 'product.created',
    actor,
    after: product.toObject(),
  });

  return product;
}

export async function updateProduct(id: string, data: UpdateProductInput, actor: string, ip?: string) {
  const existing = await Product.findById(id);
  if (!existing) throw new AppError(404, `Product ${id} not found`);
  if (existing.status === 'archived') throw new AppError(400, 'Cannot update an archived product');

  // Enforce field ownership — reject WooCommerce-owned fields
  const { safe, rejected } = filterToPimOwned(data as Record<string, unknown>);
  if (rejected.length > 0) {
    throw new AppError(
      400,
      `The following fields are WooCommerce-owned and cannot be updated via PIM: ${rejected.join(', ')}`,
      'WOO_OWNED_FIELD',
    );
  }

  const before = existing.toObject();
  const completeness = calcCompleteness({ ...existing.toObject(), ...safe } as Partial<IProduct>);

  const updated = await Product.findByIdAndUpdate(
    id,
    {
      ...safe,
      completeness,
      pimUpdatedAt: new Date(),
      pimUpdatedBy: actor,
      $inc: { version: 1 },
    },
    { new: true, runValidators: true },
  );

  await recordChange({
    entityType: 'product',
    entityId: existing._id,
    action: 'product.updated',
    actor,
    before,
    after: updated?.toObject(),
    ip,
  });

  return updated!;
}

export async function approveProduct(id: string, actor: string) {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, `Product ${id} not found`);

  const before = product.toObject();
  product.status = 'ready';
  product.pimUpdatedAt = new Date();
  product.pimUpdatedBy = actor;
  await product.save();

  await recordChange({
    entityType: 'product',
    entityId: product._id,
    action: 'product.approved',
    actor,
    before,
    after: product.toObject(),
  });

  return product;
}

export async function softDeleteProduct(id: string, actor: string) {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, `Product ${id} not found`);

  const before = product.toObject();
  product.status = 'archived';
  product.pimUpdatedAt = new Date();
  product.pimUpdatedBy = actor;
  await product.save();

  await recordChange({
    entityType: 'product',
    entityId: product._id,
    action: 'product.deleted',
    actor,
    before,
  });
}

export async function getProductHistory(id: string) {
  const { getAuditTrail } = await import('./auditService');
  const { Types } = await import('mongoose');
  return getAuditTrail(new Types.ObjectId(id));
}

export async function getDashboardStats() {
  const [total, published, needsAttention, avgResult, categoryDist, statusDist] = await Promise.all([
    Product.countDocuments({ status: { $ne: 'archived' } }),
    Product.countDocuments({ status: 'published' }),
    Product.countDocuments({ $or: [{ completeness: { $lt: 60 } }, { status: 'draft' }], status: { $ne: 'archived' } }),
    Product.aggregate([{ $match: { status: { $ne: 'archived' } } }, { $group: { _id: null, avg: { $avg: '$completeness' } } }]),
    Product.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Product.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  // Build quality bands (0-20, 21-40, 41-60, 61-80, 81-100)
  const bands = [
    { name: '0–20%', min: 0, max: 20 },
    { name: '21–40%', min: 21, max: 40 },
    { name: '41–60%', min: 41, max: 60 },
    { name: '61–80%', min: 61, max: 80 },
    { name: '81–100%', min: 81, max: 100 },
  ];
  const qualityBands = await Promise.all(
    bands.map(async (b) => ({
      name: b.name,
      count: await Product.countDocuments({
        status: { $ne: 'archived' },
        completeness: { $gte: b.min, $lte: b.max },
      }),
    }))
  );

  const statusBreakdown = { draft: 0, in_review: 0, ready: 0, published: 0 } as Record<string, number>;
  statusDist.forEach((s: { _id: string; count: number }) => {
    if (s._id in statusBreakdown) statusBreakdown[s._id] = s.count;
  });

  return {
    total,
    published,
    needsAttention,
    avgCompleteness: Math.round(avgResult[0]?.avg ?? 0),
    categoryData: categoryDist.map((d) => ({ name: d._id ?? 'Uncategorized', count: d.count })),
    qualityBands,
    statusBreakdown,
  };
}

