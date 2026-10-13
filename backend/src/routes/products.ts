import { Router, type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import {
  listProducts, getProductById, createProduct,
  updateProduct, softDeleteProduct, getProductHistory, getDashboardStats,
} from '../services/productService';
import {
  CreateProductSchema, UpdateProductSchema, ProductQuerySchema,
} from '../validators/productSchema';
import { Product } from '../models/Product';

const router = Router();
router.use(authMiddleware);

// GET /api/products?page=1&limit=20&status=draft&search=...
router.get('/', async (req: AuthRequest, res: Response) => {
  const query = ProductQuerySchema.parse(req.query);
  const result = await listProducts(query);
  res.json(result);
});

// GET /api/products/stats
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  const stats = await getDashboardStats();
  res.json(stats);
});

// GET /api/products/export/csv  — WooCommerce-compatible CSV download
router.get('/export/csv', async (req: AuthRequest, res: Response) => {
  const { status, category } = req.query as { status?: string; category?: string };

  const filter: Record<string, unknown> = { status: { $ne: 'archived' } };
  if (status) filter['status'] = status;
  if (category) filter['category'] = category;

  const products = await Product.find(filter).sort({ updatedAt: -1 }).limit(10000);

  // Build WooCommerce-compatible CSV
  const headers = [
    'ID', 'Type', 'SKU', 'Name', 'Published', 'Is featured?',
    'Visibility in catalog', 'Short description', 'Description',
    'Tax status', 'Tax class', 'In stock?', 'Backorders allowed?',
    'Sold individually?', 'Regular price', 'Sale price',
    'Categories', 'Tags', 'Shipping class', 'Images',
    'Attribute 1 name', 'Attribute 1 value(s)',
    'Attribute 2 name', 'Attribute 2 value(s)',
    'Attribute 3 name', 'Attribute 3 value(s)',
    'Brand', 'Meta: SEO title', 'Meta: SEO description', 'Completeness %',
  ];

  const escapeCsv = (val: string | number | undefined | null): string => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = products.map((p) => {
    const attrs = p.attributes ?? [];
    return [
      escapeCsv(p.wooId ?? ''),
      escapeCsv('simple'),
      escapeCsv(p.sku),
      escapeCsv(p.name),
      escapeCsv(p.status === 'published' ? '1' : '0'),
      escapeCsv('0'),
      escapeCsv('visible'),
      escapeCsv(p.shortDescription),
      escapeCsv(p.description),
      escapeCsv('taxable'),
      escapeCsv(''),
      escapeCsv('1'),
      escapeCsv('0'),
      escapeCsv('0'),
      escapeCsv(p.pricing?.price ?? ''),
      escapeCsv(p.pricing?.salePrice ?? ''),
      escapeCsv(p.category),
      escapeCsv((p.tags ?? []).join(', ')),
      escapeCsv(''),
      escapeCsv((p.images ?? []).map((img) => img.url).join('|')),
      escapeCsv(attrs[0]?.name ?? ''),
      escapeCsv(attrs[0]?.value ?? ''),
      escapeCsv(attrs[1]?.name ?? ''),
      escapeCsv(attrs[1]?.value ?? ''),
      escapeCsv(attrs[2]?.name ?? ''),
      escapeCsv(attrs[2]?.value ?? ''),
      escapeCsv(p.brand),
      escapeCsv(p.seo?.title ?? ''),
      escapeCsv(p.seo?.description ?? ''),
      escapeCsv(p.completeness ?? 0),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = `productshelf-export-${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
});

// GET /api/products/export/json  — JSON export
router.get('/export/json', async (req: AuthRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  const filter: Record<string, unknown> = { status: { $ne: 'archived' } };
  if (status) filter['status'] = status;

  const products = await Product.find(filter).sort({ updatedAt: -1 }).limit(10000);
  const filename = `productshelf-export-${new Date().toISOString().split('T')[0]}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json({ exported: products.length, timestamp: new Date().toISOString(), products });
});

// GET /api/products/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const product = await getProductById(req.params.id);
  res.json(product);
});

// GET /api/products/:id/history
router.get('/:id/history', async (req: AuthRequest, res: Response) => {
  const history = await getProductHistory(req.params.id);
  res.json(history);
});

// POST /api/products
router.post('/', async (req: AuthRequest, res: Response) => {
  const data = CreateProductSchema.parse(req.body);
  const product = await createProduct(data, req.actor!);
  res.status(201).json(product);
});

// PATCH /api/products/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const data = UpdateProductSchema.parse(req.body);
  const product = await updateProduct(req.params.id, data, req.actor!, req.ip ?? undefined);
  res.json(product);
});

// DELETE /api/products/:id  — soft delete (sets status = archived)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await softDeleteProduct(req.params.id, req.actor!);
  res.status(204).send();
});

export default router;
