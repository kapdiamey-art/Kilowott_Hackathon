/**
 * ProductService — the single abstraction layer between UI and data.
 * Currently backed by localStorage + seed data.
 * Replace the private methods here to connect to a real REST API.
 */

import type {
  Product, Category, AttributeDefinition, QualityIssue,
  ActivityEvent, ActivityAction, DuplicatePair, PublishItem,
  WorkspaceSettings, IssueType, IssueSeverity,
} from '../types';
import {
  SEED_PRODUCTS, SEED_CATEGORIES, SEED_ATTRIBUTES,
  SEED_ACTIVITY, SEED_DUPLICATES, SEED_PUBLISH_ITEMS, DEFAULT_SETTINGS,
} from '../data/seed';

// ─── localStorage keys ────────────────────────────────────────────────────

const KEYS = {
  products: 'ps_products_v1',
  categories: 'ps_categories_v1',
  attributes: 'ps_attributes_v1',
  activity: 'ps_activity_v1',
  duplicates: 'ps_duplicates_v1',
  publish: 'ps_publish_v1',
  settings: 'ps_settings_v1',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Completeness calculator ────────────────────────────────────────────────

export function calcCompleteness(p: Partial<Product>): number {
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
  const score = checks.reduce((acc, [val, weight]) => acc + (val ? weight : 0), 0);
  return Math.min(100, score);
}

// ─── Quality issue detector ─────────────────────────────────────────────────

function detectIssues(products: Product[]): QualityIssue[] {
  const issues: QualityIssue[] = [];

  const push = (
    p: Product, type: IssueType, severity: IssueSeverity, message: string, field?: string,
  ) => {
    issues.push({
      id: `qi-${p.id}-${type}-${field ?? 'x'}`,
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      type,
      severity,
      message,
      field,
    });
  };

  for (const p of products) {
    if (!p.description || p.description.length < 20) push(p, 'missing_description', 'critical', 'Product has no description or description is too short.', 'description');
    else if (p.description.length < 100) push(p, 'short_description', 'medium', 'Description is under 100 characters — too brief for SEO.', 'description');

    if (!p.images || p.images.length === 0) push(p, 'missing_image', 'high', 'No product images uploaded.', 'images');

    if (!p.bulletPoints || p.bulletPoints.length === 0) push(p, 'missing_bullet_points', 'medium', 'No bullet points / key features listed.', 'bulletPoints');

    if (!p.pricing?.price) push(p, 'missing_price', 'critical', 'Product has no price set.', 'pricing.price');

    if (!p.seo?.title) push(p, 'missing_seo', 'high', 'SEO title is missing.', 'seo.title');
    if (!p.seo?.description) push(p, 'missing_seo', 'medium', 'SEO meta description is missing.', 'seo.description');

    const requiredAttrs = p.attributes.filter((a) => a.required && !a.value);
    if (requiredAttrs.length > 0) {
      push(p, 'missing_attribute', 'high', `Missing required attributes: ${requiredAttrs.map((a) => a.name).join(', ')}.`, 'attributes');
    }
  }

  return issues;
}

// ─── ProductService ────────────────────────────────────────────────────────

class ProductServiceClass {
  // Initialize localStorage with seed data if empty
  initialize() {
    if (!localStorage.getItem(KEYS.products)) write(KEYS.products, SEED_PRODUCTS);
    if (!localStorage.getItem(KEYS.categories)) write(KEYS.categories, SEED_CATEGORIES);
    if (!localStorage.getItem(KEYS.attributes)) write(KEYS.attributes, SEED_ATTRIBUTES);
    if (!localStorage.getItem(KEYS.activity)) write(KEYS.activity, SEED_ACTIVITY);
    if (!localStorage.getItem(KEYS.duplicates)) write(KEYS.duplicates, SEED_DUPLICATES);
    if (!localStorage.getItem(KEYS.publish)) write(KEYS.publish, SEED_PUBLISH_ITEMS);
    if (!localStorage.getItem(KEYS.settings)) write(KEYS.settings, DEFAULT_SETTINGS);
  }

  reset() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    this.initialize();
  }

  // ─── Products ────────────────────────────────────────────────────────────

  getProducts(): Product[] {
    return read<Product[]>(KEYS.products, SEED_PRODUCTS);
  }

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  createProduct(data: Partial<Product>): Product {
    const products = this.getProducts();
    const now = new Date().toISOString();
    const product: Product = {
      id: `prod-${uid()}`,
      name: '',
      sku: '',
      brand: '',
      category: 'Uncategorized',
      status: 'draft',
      description: '',
      shortDescription: '',
      bulletPoints: [],
      pricing: { price: 0, currency: 'USD' },
      attributes: [],
      images: [],
      seo: { title: '', description: '', keywords: [], slug: '' },
      tags: [],
      completeness: 0,
      syncStatus: 'not_synced',
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    product.completeness = calcCompleteness(product);
    const updated = [product, ...products];
    write(KEYS.products, updated);
    this.addActivity('product_created', { productId: product.id, productName: product.name, description: `Product "${product.name || 'Untitled'}" created as draft.` });
    return product;
  }

  updateProduct(id: string, data: Partial<Product>): Product {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Product ${id} not found`);
    const updated: Product = {
      ...products[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    updated.completeness = calcCompleteness(updated);
    products[idx] = updated;
    write(KEYS.products, products);
    return updated;
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    write(KEYS.products, products);
  }

  // ─── Categories ──────────────────────────────────────────────────────────

  getCategories(): Category[] {
    return read<Category[]>(KEYS.categories, SEED_CATEGORIES);
  }

  createCategory(data: Partial<Category>): Category {
    const cats = this.getCategories();
    const cat: Category = {
      id: `cat-${uid()}`,
      name: '',
      slug: '',
      productCount: 0,
      color: '#6366f1',
      ...data,
    };
    write(KEYS.categories, [cat, ...cats]);
    return cat;
  }

  updateCategory(id: string, data: Partial<Category>): Category {
    const cats = this.getCategories();
    const idx = cats.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Category ${id} not found`);
    cats[idx] = { ...cats[idx], ...data, id };
    write(KEYS.categories, cats);
    return cats[idx];
  }

  deleteCategory(id: string): void {
    write(KEYS.categories, this.getCategories().filter((c) => c.id !== id));
  }

  // ─── Attributes ───────────────────────────────────────────────────────────

  getAttributes(): AttributeDefinition[] {
    return read<AttributeDefinition[]>(KEYS.attributes, SEED_ATTRIBUTES);
  }

  createAttribute(data: Partial<AttributeDefinition>): AttributeDefinition {
    const attrs = this.getAttributes();
    const attr: AttributeDefinition = {
      id: `attr-${uid()}`,
      name: '',
      type: 'text',
      required: false,
      categoryIds: [],
      ...data,
    };
    write(KEYS.attributes, [attr, ...attrs]);
    return attr;
  }

  updateAttribute(id: string, data: Partial<AttributeDefinition>): AttributeDefinition {
    const attrs = this.getAttributes();
    const idx = attrs.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Attribute ${id} not found`);
    attrs[idx] = { ...attrs[idx], ...data, id };
    write(KEYS.attributes, attrs);
    return attrs[idx];
  }

  deleteAttribute(id: string): void {
    write(KEYS.attributes, this.getAttributes().filter((a) => a.id !== id));
  }

  // ─── Quality issues ───────────────────────────────────────────────────────

  getQualityIssues(): QualityIssue[] {
    return detectIssues(this.getProducts());
  }

  getQualityScore(): number {
    const products = this.getProducts();
    if (products.length === 0) return 100;
    const avg = products.reduce((acc, p) => acc + p.completeness, 0) / products.length;
    return Math.round(avg);
  }

  // ─── Activity log ─────────────────────────────────────────────────────────

  getActivity(): ActivityEvent[] {
    return read<ActivityEvent[]>(KEYS.activity, SEED_ACTIVITY);
  }

  addActivity(action: ActivityAction, data: Partial<ActivityEvent> & { description: string }): void {
    const events = this.getActivity();
    const event: ActivityEvent = {
      id: `act-${uid()}`,
      action,
      actor: data.actor ?? 'You',
      timestamp: new Date().toISOString(),
      ...data,
    };
    write(KEYS.activity, [event, ...events.slice(0, 99)]);
  }

  // ─── Duplicates ───────────────────────────────────────────────────────────

  getDuplicates(): DuplicatePair[] {
    return read<DuplicatePair[]>(KEYS.duplicates, SEED_DUPLICATES);
  }

  updateDuplicateStatus(id: string, status: DuplicatePair['status']): void {
    const dups = this.getDuplicates();
    const idx = dups.findIndex((d) => d.id === id);
    if (idx !== -1) {
      dups[idx].status = status;
      write(KEYS.duplicates, dups);
    }
  }

  // ─── Publish ─────────────────────────────────────────────────────────────

  getPublishItems(): PublishItem[] {
    return read<PublishItem[]>(KEYS.publish, SEED_PUBLISH_ITEMS);
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  getSettings(): WorkspaceSettings {
    return read<WorkspaceSettings>(KEYS.settings, DEFAULT_SETTINGS);
  }

  updateSettings(data: Partial<WorkspaceSettings>): WorkspaceSettings {
    const current = this.getSettings();
    const updated = { ...current, ...data };
    write(KEYS.settings, updated);
    return updated;
  }

  // ─── Dashboard stats ──────────────────────────────────────────────────────

  getDashboardStats() {
    const products = this.getProducts();
    const published = products.filter((p) => p.status === 'published').length;
    const needsAttention = products.filter((p) => p.completeness < 60 || p.status === 'draft').length;
    const avgCompleteness = products.length
      ? Math.round(products.reduce((acc, p) => acc + p.completeness, 0) / products.length)
      : 0;

    // chart data — category distribution
    const categoryMap: Record<string, number> = {};
    products.forEach((p) => {
      categoryMap[p.category] = (categoryMap[p.category] ?? 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    // quality chart — last 7 days mock (completeness histogram)
    const qualityBands = {
      'Excellent (90-100)': products.filter((p) => p.completeness >= 90).length,
      'Good (70-89)': products.filter((p) => p.completeness >= 70 && p.completeness < 90).length,
      'Fair (50-69)': products.filter((p) => p.completeness >= 50 && p.completeness < 70).length,
      'Poor (<50)': products.filter((p) => p.completeness < 50).length,
    };

    return {
      total: products.length,
      published,
      needsAttention,
      avgCompleteness,
      categoryData,
      qualityBands: Object.entries(qualityBands).map(([name, count]) => ({ name, count })),
      statusBreakdown: {
        draft: products.filter((p) => p.status === 'draft').length,
        in_review: products.filter((p) => p.status === 'in_review').length,
        ready: products.filter((p) => p.status === 'ready').length,
        published,
      },
    };
  }
}

export const ProductService = new ProductServiceClass();
