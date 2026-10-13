import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';
import type { ProductStatus, IssueSeverity, AiTaskType } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function statusLabel(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    ready: 'Ready',
    published: 'Published',
  };
  return map[status] ?? status;
}

export function statusClass(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    draft: 'badge-draft',
    in_review: 'badge-review',
    ready: 'badge-ready',
    published: 'badge-published',
  };
  return `badge ${map[status] ?? ''}`;
}

export function severityClass(severity: IssueSeverity): string {
  const map: Record<IssueSeverity, string> = {
    critical: 'bg-red-50 text-red-700 border border-red-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    low: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  };
  return `badge ${map[severity] ?? ''}`;
}

export function completenessColor(score: number): string {
  if (score >= 80) return 'text-teal-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

export function completenessBarColor(score: number): string {
  if (score >= 80) return 'bg-teal-500';
  if (score >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

export function taskTypeLabel(t: AiTaskType): string {
  const map: Record<AiTaskType, string> = {
    improve_description: 'Improve Description',
    generate_title: 'Generate Title',
    create_bullet_points: 'Create Bullet Points',
    generate_seo: 'Generate SEO Metadata',
    suggest_attributes: 'Suggest Attributes',
  };
  return map[t] ?? t;
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
