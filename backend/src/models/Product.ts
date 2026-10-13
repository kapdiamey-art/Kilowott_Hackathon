import { Schema, model, Document } from 'mongoose';

export type ProductStatus = 'draft' | 'in_review' | 'ready' | 'published' | 'archived';
export type SyncStatus = 'not_synced' | 'syncing' | 'synced' | 'conflict' | 'error';
export type EnrichmentStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export interface IAttributeEntry {
  name: string;
  value: string;
  unit?: string;
  required: boolean;
  isAI: boolean;
}

export interface IImageEntry {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ISeoMeta {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

export interface IPricing {
  price: number;
  salePrice?: number;
  currency: string;
  costPrice?: number;
}

export interface IProduct extends Document {
  // PIM-owned
  name: string;
  sku: string;
  brand: string;
  category: string;
  description: string;
  shortDescription: string;
  bulletPoints: string[];
  pricing: IPricing;
  attributes: IAttributeEntry[];
  images: IImageEntry[];
  seo: ISeoMeta;
  tags: string[];
  status: ProductStatus;
  enrichmentStatus: EnrichmentStatus;
  validationErrors: string[];
  completeness: number;
  pimUpdatedAt: Date;
  pimUpdatedBy: string;

  // WooCommerce-owned (read-only mirror)
  wooId?: number;
  wooStatus?: string;
  wooPrice?: string;
  wooSalePrice?: string;
  wooStockStatus?: string;
  wooStockQuantity?: number;
  wooPermalink?: string;
  wooLastFetchedAt?: Date;

  // Sync metadata
  syncStatus: SyncStatus;
  lastSyncedAt?: Date;
  syncError?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttributeSchema = new Schema<IAttributeEntry>(
  { name: String, value: String, unit: String, required: Boolean, isAI: { type: Boolean, default: false } },
  { _id: false },
);

const ImageSchema = new Schema<IImageEntry>(
  { id: String, url: String, alt: String, isPrimary: { type: Boolean, default: false } },
  { _id: false },
);

const SeoSchema = new Schema<ISeoMeta>(
  { title: String, description: String, keywords: [String], slug: String },
  { _id: false },
);

const PricingSchema = new Schema<IPricing>(
  { price: Number, salePrice: Number, currency: { type: String, default: 'USD' }, costPrice: Number },
  { _id: false },
);

const ProductSchema = new Schema<IProduct>(
  {
    // PIM-owned
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    brand: { type: String, default: '' },
    category: { type: String, default: 'Uncategorized' },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    bulletPoints: [{ type: String }],
    pricing: { type: PricingSchema, default: () => ({ price: 0, currency: 'USD' }) },
    attributes: [AttributeSchema],
    images: [ImageSchema],
    seo: { type: SeoSchema, default: () => ({ title: '', description: '', keywords: [], slug: '' }) },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'in_review', 'ready', 'published', 'archived'], default: 'draft' },
    enrichmentStatus: { type: String, enum: ['not_started', 'in_progress', 'completed', 'failed'], default: 'not_started' },
    validationErrors: [{ type: String }],
    completeness: { type: Number, default: 0, min: 0, max: 100 },
    pimUpdatedAt: { type: Date, default: Date.now },
    pimUpdatedBy: { type: String, default: 'system' },

    // WooCommerce-owned (read-only mirror)
    wooId: { type: Number, sparse: true },
    wooStatus: String,
    wooPrice: String,
    wooSalePrice: String,
    wooStockStatus: String,
    wooStockQuantity: Number,
    wooPermalink: String,
    wooLastFetchedAt: Date,

    // Sync
    syncStatus: { type: String, enum: ['not_synced', 'syncing', 'synced', 'conflict', 'error'], default: 'not_synced' },
    lastSyncedAt: Date,
    syncError: String,

    // Optimistic locking
    version: { type: Number, default: 1 },
  },
  { timestamps: true, versionKey: false },
);

ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ status: 1 });
ProductSchema.index({ syncStatus: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ updatedAt: -1 });

export const Product = model<IProduct>('Product', ProductSchema);
