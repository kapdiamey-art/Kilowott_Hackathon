import { z } from 'zod';

const AttributeSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
  unit: z.string().optional(),
  required: z.boolean().default(false),
  isAI: z.boolean().default(false),
});

const ImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  alt: z.string().default(''),
  isPrimary: z.boolean().default(false),
});

const SeoSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  keywords: z.array(z.string()).default([]),
  slug: z.string().default(''),
});

const PricingSchema = z.object({
  price: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  costPrice: z.number().min(0).optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(100),
  brand: z.string().default(''),
  category: z.string().default('Uncategorized'),
  description: z.string().default(''),
  shortDescription: z.string().default(''),
  bulletPoints: z.array(z.string()).default([]),
  pricing: PricingSchema.default({ price: 0, currency: 'USD' }),
  attributes: z.array(AttributeSchema).default([]),
  images: z.array(ImageSchema).default([]),
  seo: SeoSchema.default({}),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'in_review', 'ready', 'published', 'archived']).default('draft'),
});

export const UpdateProductSchema = CreateProductSchema.partial().omit({
  // Woo-owned fields should never come through PATCH /products/:id
});

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['draft', 'in_review', 'ready', 'published', 'archived']).optional(),
  syncStatus: z.enum(['not_synced', 'syncing', 'synced', 'conflict', 'error']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'updatedAt', 'completeness', 'createdAt', 'pricing.price']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQueryInput = z.infer<typeof ProductQuerySchema>;
