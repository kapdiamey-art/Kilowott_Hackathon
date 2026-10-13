// ─── Core product types ──────────────────────────────────────────────────────

export type ProductStatus = 'draft' | 'in_review' | 'ready' | 'published';

export type ProductCategory =
  | 'Electronics'
  | 'Home & Living'
  | 'Fashion'
  | 'Beauty'
  | 'Sports'
  | 'Toys'
  | 'Food & Grocery'
  | 'Automotive'
  | 'Books'
  | 'Uncategorized';

export interface ProductAttribute {
  name: string;
  value: string;
  required: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

export interface PricingInfo {
  price: number;
  salePrice?: number;
  currency: string;
  costPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: ProductCategory;
  status: ProductStatus;
  description: string;
  shortDescription: string;
  bulletPoints: string[];
  pricing: PricingInfo;
  attributes: ProductAttribute[];
  images: ProductImage[];
  seo: SeoMeta;
  tags: string[];
  completeness: number; // 0-100
  wooId?: number;
  syncStatus: 'not_synced' | 'synced' | 'conflict' | 'error';
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// ─── Category & attribute types ────────────────────────────────────────────

export interface AttributeDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiselect';
  options?: string[];
  required: boolean;
  categoryIds: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  productCount: number;
  color: string;
}

// ─── Quality issue types ─────────────────────────────────────────────────────

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IssueType =
  | 'missing_description'
  | 'missing_image'
  | 'missing_attribute'
  | 'invalid_value'
  | 'missing_seo'
  | 'short_description'
  | 'missing_bullet_points'
  | 'missing_price';

export interface QualityIssue {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  field?: string;
}

// ─── Activity log types ────────────────────────────────────────────────────

export type ActivityAction =
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'ai_suggestion_generated'
  | 'ai_suggestion_approved'
  | 'ai_suggestion_rejected'
  | 'product_published'
  | 'quality_fix_applied'
  | 'product_imported'
  | 'sync_completed';

export interface ActivityEvent {
  id: string;
  action: ActivityAction;
  productId?: string;
  productName?: string;
  description: string;
  actor: string; // 'You' | 'AI Agent' | 'System'
  timestamp: string; // ISO date
  metadata?: Record<string, unknown>;
}

// ─── AI types ─────────────────────────────────────────────────────────────

export type AiTaskType =
  | 'improve_description'
  | 'generate_title'
  | 'create_bullet_points'
  | 'generate_seo'
  | 'suggest_attributes';

export type AiTone = 'professional' | 'friendly' | 'luxury' | 'technical' | 'casual';

export interface AiSuggestion {
  taskType: AiTaskType;
  productId: string;
  before: string | string[];
  after: string | string[];
  reasoning: string;
  confidence: number; // 0-100
  isDemo: boolean;
}

// ─── Duplicate types ─────────────────────────────────────────────────────

export type DuplicateReviewStatus = 'pending' | 'dismissed' | 'merged';

export interface DuplicatePair {
  id: string;
  productA: Pick<Product, 'id' | 'name' | 'sku' | 'category' | 'brand' | 'pricing'>;
  productB: Pick<Product, 'id' | 'name' | 'sku' | 'category' | 'brand' | 'pricing'>;
  similarityScore: number; // 0-100
  matchedFields: string[];
  status: DuplicateReviewStatus;
}

// ─── Publish types ─────────────────────────────────────────────────────────

export type PublishChannel = 'WooCommerce' | 'Shopify' | 'Amazon' | 'Google Shopping';
export type PublishReadiness = 'ready' | 'needs_review' | 'blocked';

export interface PublishItem {
  productId: string;
  channel: PublishChannel;
  readiness: PublishReadiness;
  issues: string[];
  lastPublished?: string;
}

// ─── Settings types ───────────────────────────────────────────────────────

export interface WorkspaceSettings {
  workspaceName: string;
  defaultCurrency: string;
  defaultLanguage: string;
  defaultCategory: ProductCategory;
  autoEnrichOnCreate: boolean;
  requireApprovalForAi: boolean;
  scheduledSyncEnabled: boolean;
  scheduledSyncCron: string;
  aiProviderConfigured: boolean;
  wooCommerceConnected: boolean;
}
