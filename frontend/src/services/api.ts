/**
 * api.ts — typed fetch client for the ProductShelf backend.
 *
 * All requests go to VITE_API_URL (default: http://localhost:4000).
 * Credentials (JWT cookie) are always included.
 * On 401, the caller should redirect to /login.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // send/receive httpOnly cookie
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? 'Request failed', body.code);
  }

  return body as T;
}

const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined });
const patch = <T>(path: string, data: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
const del = (path: string) => request<void>(path, { method: 'DELETE' });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User { id: string; name: string; email: string; role: string; }
export interface AuthResponse { user: User; }

export interface Product {
  _id: string; id?: string;
  name: string; sku: string; brand: string; category: string;
  status: string; description: string; shortDescription: string;
  bulletPoints: string[];
  pricing: { price: number; salePrice?: number; currency: string; costPrice?: number };
  attributes: { name: string; value: string; unit?: string; required: boolean; isAI: boolean }[];
  images: { id: string; url: string; alt: string; isPrimary: boolean }[];
  seo: { title: string; description: string; keywords: string[]; slug: string };
  tags: string[];
  completeness: number;
  syncStatus: string;
  wooId?: number;
  createdAt: string; updatedAt: string;
}

/** Ensures all array fields are always defined — prevents "reading length of undefined" crashes */
export function normalizeProduct(p: Partial<Product>): Product {
  return {
    _id: p._id ?? '', id: p.id, name: p.name ?? '', sku: p.sku ?? '',
    brand: p.brand ?? '', category: p.category ?? '', status: p.status ?? 'draft',
    description: p.description ?? '', shortDescription: p.shortDescription ?? '',
    bulletPoints: p.bulletPoints ?? [],
    pricing: p.pricing ?? { price: 0, currency: 'USD' },
    attributes: p.attributes ?? [],
    images: p.images ?? [],
    seo: p.seo ?? { title: '', description: '', keywords: [], slug: '' },
    tags: p.tags ?? [],
    completeness: p.completeness ?? 0,
    syncStatus: p.syncStatus ?? 'not_synced',
    wooId: p.wooId,
    createdAt: p.createdAt ?? '', updatedAt: p.updatedAt ?? '',
  } as Product;
}

export interface Pagination { page: number; limit: number; total: number; pages: number; }

export interface ProductListResponse {
  data: Product[];
  pagination: Pagination;
}

export interface DashboardStats {
  total: number; published: number; needsAttention: number; avgCompleteness: number;
  categoryData: { name: string; count: number }[];
  qualityBands: { name: string; count: number }[];
  statusBreakdown: { draft: number; in_review: number; ready: number; published: number };
}


export interface Category {
  _id: string; name: string; slug: string; description: string;
  parentId?: string; color: string; productCount: number;
}

export interface AttributeDefinition {
  _id: string; name: string; type: string; options: string[];
  required: boolean; categoryIds: string[]; description: string;
}

export interface ActivityEvent {
  _id: string; action: string; entityType: string; entityId?: string;
  entityName?: string; actor: string; description: string;
  metadata?: Record<string, unknown>; timestamp: string;
}

export interface QualityIssue {
  type: string; severity: string; message: string; field: string; fix: string;
  productId: string; productName: string; productSku: string;
}

export interface QualityResult {
  productId: string; productName: string; productSku: string;
  score: number; issues: QualityIssue[];
}

export interface QualitySummary {
  total: number; avgScore: number;
  bands: { excellent: number; good: number; fair: number; poor: number };
  topIssueTypes: Record<string, number>;
}

export interface DuplicatePair {
  _id: string;
  productAId: string; productAName: string; productASku: string;
  productBId: string; productBName: string; productBSku: string;
  similarityScore: number; matchedFields: string[];
  evidence: { field: string; valueA: string; valueB: string; score: number }[];
  status: 'pending' | 'dismissed' | 'confirmed' | 'merged';
  reviewedBy?: string; reviewedAt?: string;
}

export interface PublishingJob {
  _id: string; productId: string; productSku: string; destination: string;
  status: string; isSimulated: boolean; triggeredBy: string;
  attempts: number; completedAt?: string; error?: string;
  createdAt: string; updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  register: (data: { name: string; email: string; password: string }) =>
    post<AuthResponse>('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    post<AuthResponse>('/api/auth/login', data),
  logout: () => post<void>('/api/auth/logout'),
  me: () => get<{ user: User }>('/api/auth/me'),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = {
  list: async (params?: {
    search?: string; status?: string; category?: string;
    page?: number; limit?: number; sort?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    const res = await get<ProductListResponse>(`/api/products?${qs}`);
    return { ...res, data: (res.data ?? []).map(normalizeProduct) };
  },
  get: async (id: string) => normalizeProduct(await get<Product>(`/api/products/${id}`)),
  create: (data: Partial<Product>) => post<Product>('/api/products', data),
  update: (id: string, data: Partial<Product>) => patch<Product>(`/api/products/${id}`, data),
  delete: (id: string) => del(`/api/products/${id}`),
  stats: () => get<DashboardStats>('/api/products/stats'),
};


// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = {
  list: () => get<Category[]>('/api/categories'),
  get: (id: string) => get<Category>(`/api/categories/${id}`),
  create: (data: Partial<Category>) => post<Category>('/api/categories', data),
  update: (id: string, data: Partial<Category>) => patch<Category>(`/api/categories/${id}`, data),
  delete: (id: string) => del(`/api/categories/${id}`),
};

// ─── Attributes ───────────────────────────────────────────────────────────────

export const attributes = {
  list: (categoryId?: string) =>
    get<AttributeDefinition[]>(`/api/attributes${categoryId ? `?categoryId=${categoryId}` : ''}`),
  create: (data: Partial<AttributeDefinition>) => post<AttributeDefinition>('/api/attributes', data),
  update: (id: string, data: Partial<AttributeDefinition>) => patch<AttributeDefinition>(`/api/attributes/${id}`, data),
  delete: (id: string) => del(`/api/attributes/${id}`),
};

// ─── Quality ──────────────────────────────────────────────────────────────────

export const quality = {
  summary: () => get<QualitySummary>('/api/quality/summary'),
  issues: (params?: { severity?: string; type?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    return get<{ data: QualityIssue[]; pagination: Pagination }>(`/api/quality/issues?${qs}`);
  },
  forProduct: (id: string) => get<QualityResult>(`/api/quality/products/${id}`),
  recalculate: (id: string) => post<QualityResult>(`/api/quality/products/${id}/recalculate`),
  recalculateAll: () => post<{ message: string }>('/api/quality/recalculate'),
};

// ─── Duplicates ───────────────────────────────────────────────────────────────

export const duplicates = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    return get<{ data: DuplicatePair[]; pagination: Pagination }>(`/api/duplicates?${qs}`);
  },
  scan: (threshold = 65) => post<{ scanned: number; newPairsFound: number }>(`/api/duplicates/scan?threshold=${threshold}`),
  get: (id: string) => get<DuplicatePair & { productA: Product; productB: Product }>(`/api/duplicates/${id}`),
  review: (id: string, data: { status: 'dismissed' | 'confirmed'; resolution?: string }) =>
    patch<DuplicatePair>(`/api/duplicates/${id}/review`, data),
};

// ─── Activity ─────────────────────────────────────────────────────────────────

export const activity = {
  list: (params?: { action?: string; actor?: string; entityType?: string; page?: number; limit?: number; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    return get<{ data: ActivityEvent[]; pagination: Pagination }>(`/api/activity?${qs}`);
  },
};

// ─── Publishing ───────────────────────────────────────────────────────────────

export const publishing = {
  status: () => get<{ destinations: unknown[] }>('/api/publishing/status'),
  jobs: (params?: { status?: string; destination?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    return get<{ data: PublishingJob[]; pagination: Pagination }>(`/api/publishing/jobs?${qs}`);
  },
  validate: (productId: string) => post<{ ready: boolean; issues: string[] }>(`/api/publishing/validate/${productId}`),
  publish: (productId: string, destination = 'simulation') =>
    post<PublishingJob>('/api/publishing/jobs', { productId, destination }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────

export const ai = {
  enrich: (productId: string, taskType: string) =>
    post<unknown>('/api/ai/enrich', { productId, taskType }),
  getTasks: (productId?: string) =>
    get<unknown>(`/api/ai/tasks${productId ? `?productId=${productId}` : ''}`),
  approve: (taskId: string) => post<unknown>(`/api/ai/tasks/${taskId}/approve`),
  reject: (taskId: string) => post<unknown>(`/api/ai/tasks/${taskId}/reject`),
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const health = () => get<{ status: string; environment: string; timestamp: string }>('/api/health');
