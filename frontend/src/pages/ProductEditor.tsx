import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, X, Plus, Trash2, Sparkles, Check, AlertCircle,
  Package, ChevronDown, ChevronUp, Info, RefreshCw,
} from 'lucide-react';
import { products as productsApi, ai as aiApi, type Product } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { CompletenessBar } from '../components/ui/CompletenessBar';
import { toast } from '../components/ui/Toast';
import { statusLabel, slugify, formatCurrency } from '../lib/utils';
import type { ProductCategory, ProductStatus } from '../types';

const CATEGORIES: ProductCategory[] = [
  'Electronics', 'Home & Living', 'Fashion', 'Beauty', 'Sports', 'Toys', 'Food & Grocery', 'Uncategorized',
];
const STATUSES: ProductStatus[] = ['draft', 'in_review', 'ready', 'published'];

const EMPTY: Partial<Product> = {
  name: '', sku: '', brand: '', category: 'Electronics', status: 'draft',
  description: '', shortDescription: '', bulletPoints: [],
  pricing: { price: 0, currency: 'USD' },
  attributes: [], images: [],
  seo: { title: '', description: '', keywords: [], slug: '' },
  tags: [],
};

type Section = 'basic' | 'descriptions' | 'pricing' | 'attributes' | 'seo';

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      className="flex items-center justify-between w-full py-3 text-sm font-semibold text-zinc-900 hover:text-violet-700 transition-colors"
      onClick={onToggle}
    >
      {title}
      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );
}

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState<Partial<Product>>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    basic: true, descriptions: true, pricing: true, attributes: true, seo: false,
  });

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      productsApi.get(id)
        .then((p) => setForm(p))
        .catch(() => { toast.error('Product not found'); navigate('/app/products'); })
        .finally(() => setLoading(false));
    }
  }, [id, isNew, navigate]);

  // Simple completeness calculation for live indicator
  const completeness = (() => {
    const checks: Array<[unknown, number]> = [
      [form.name, 10], [form.sku, 8], [form.brand, 5], [form.category, 5],
      [form.description && form.description.length > 50, 20],
      [form.shortDescription && form.shortDescription.length > 20, 10],
      [form.bulletPoints && form.bulletPoints.length >= 3, 10],
      [form.images && form.images.length > 0, 10],
      [form.pricing?.price, 5],
      [form.attributes && form.attributes.length > 0, 5],
      [form.seo?.title, 5], [form.seo?.description, 5],
      [form.tags && form.tags.length > 0, 2],
    ];
    return Math.min(100, checks.reduce((acc, [val, w]) => acc + (val ? w : 0), 0));
  })();

  const set = useCallback(<K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'name' && !prev.seo?.title) {
        updated.seo = { ...updated.seo!, title: value as string };
      }
      return updated;
    });
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Product name is required.';
    if (!form.sku?.trim()) errs.sku = 'SKU is required.';
    if (!form.pricing?.price || form.pricing.price <= 0) errs.price = 'A valid price is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix validation errors.'); return; }
    setSaving(true);
    try {
      if (isNew) {
        const created = await productsApi.create(form);
        toast.success('Product created');
        navigate(`/app/products/${created._id}`);
      } else {
        await productsApi.update(id!, form);
        toast.success('Product saved');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleAiEnrich = async (taskType: string) => {
    if (!id || isNew) { toast.error('Save the product first before using AI enrichment.'); return; }
    setEnriching(true);
    try {
      await aiApi.enrich(id, taskType);
      toast.success('AI enrichment task queued — check AI Assistant to review suggestions.');
    } catch {
      toast.error('AI enrichment failed');
    } finally {
      setEnriching(false);
    }
  };

  const toggleSection = (s: Section) => setOpenSections((o) => ({ ...o, [s]: !o[s] }));

  const addBulletPoint = () => setForm((f) => ({ ...f, bulletPoints: [...(f.bulletPoints ?? []), ''] }));
  const removeBulletPoint = (i: number) => setForm((f) => ({ ...f, bulletPoints: (f.bulletPoints ?? []).filter((_, idx) => idx !== i) }));
  const updateBulletPoint = (i: number, v: string) =>
    setForm((f) => { const bp = [...(f.bulletPoints ?? [])]; bp[i] = v; return { ...f, bulletPoints: bp }; });

  const addAttribute = () =>
    setForm((f) => ({ ...f, attributes: [...(f.attributes ?? []), { name: '', value: '', unit: '', required: false, isAI: false }] }));
  const removeAttribute = (i: number) =>
    setForm((f) => ({ ...f, attributes: (f.attributes ?? []).filter((_, idx) => idx !== i) }));
  const updateAttribute = (i: number, field: string, v: string | boolean) =>
    setForm((f) => {
      const attrs = [...(f.attributes ?? [])];
      attrs[i] = { ...attrs[i], [field]: v };
      return { ...f, attributes: attrs };
    });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <RefreshCw size={24} className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button className="btn-ghost p-2" onClick={() => navigate('/app/products')}>
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-zinc-900">
            {isNew ? 'New Product' : (form.name || 'Untitled Product')}
          </h2>
          {!isNew && (
            <p className="text-xs text-zinc-400 mt-0.5">
              SKU: {form.sku || '—'} · Last updated: {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : '—'}
            </p>
          )}
        </div>
        <CompletenessBar score={completeness} size="md" className="w-32" showLabel />
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic info */}
          <div className="card p-5">
            <SectionHeader title="Basic Information" open={openSections.basic} onToggle={() => toggleSection('basic')} />
            {openSections.basic && (
              <div className="space-y-4">
                <div>
                  <label className="label">Product Name *</label>
                  <input
                    className={`input ${errors.name ? 'border-red-400' : ''}`}
                    value={form.name ?? ''}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Sony WH-1000XM5 Headphones"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">SKU *</label>
                    <input
                      className={`input font-mono ${errors.sku ? 'border-red-400' : ''}`}
                      value={form.sku ?? ''}
                      onChange={(e) => set('sku', e.target.value.toUpperCase())}
                      placeholder="SONY-WH1000XM5"
                    />
                    {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
                  </div>
                  <div>
                    <label className="label">Brand</label>
                    <input className="input" value={form.brand ?? ''} onChange={(e) => set('brand', e.target.value)} placeholder="Sony" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={form.category ?? 'Electronics'} onChange={(e) => set('category', e.target.value as any)}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status ?? 'draft'} onChange={(e) => set('status', e.target.value as any)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Tags (comma separated)</label>
                  <input
                    className="input"
                    value={(form.tags ?? []).join(', ')}
                    onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                    placeholder="noise-cancelling, wireless, premium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Descriptions */}
          <div className="card p-5">
            <SectionHeader title="Descriptions & Content" open={openSections.descriptions} onToggle={() => toggleSection('descriptions')} />
            {openSections.descriptions && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Full Description</label>
                    <button
                      className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1"
                      onClick={() => handleAiEnrich('improve_description')}
                      disabled={enriching || isNew}
                    >
                      <Sparkles size={11} />
                      {enriching ? 'Enriching…' : 'AI Improve'}
                    </button>
                  </div>
                  <textarea
                    className="input min-h-[120px] resize-y"
                    value={form.description ?? ''}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Write a compelling product description…"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">{(form.description ?? '').length} chars (aim for 150+)</p>
                </div>
                <div>
                  <label className="label">Short Description</label>
                  <textarea
                    className="input min-h-[60px] resize-y"
                    value={form.shortDescription ?? ''}
                    onChange={(e) => set('shortDescription', e.target.value)}
                    placeholder="Brief one-liner for product cards…"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Bullet Points / Key Features</label>
                    <button className="text-xs text-violet-600 hover:text-violet-800" onClick={addBulletPoint}>
                      <Plus size={12} />
                    </button>
                  </div>
                  {(form.bulletPoints ?? []).map((bp, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <span className="text-zinc-400 mt-2 text-xs">•</span>
                      <input
                        className="input flex-1"
                        value={bp}
                        onChange={(e) => updateBulletPoint(i, e.target.value)}
                        placeholder={`Feature ${i + 1}…`}
                      />
                      <button className="btn-ghost p-1.5 text-red-400" onClick={() => removeBulletPoint(i)}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {(form.bulletPoints ?? []).length === 0 && (
                    <button className="text-xs text-zinc-400 hover:text-zinc-600" onClick={addBulletPoint}>
                      + Add first bullet point
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="card p-5">
            <SectionHeader title="Pricing" open={openSections.pricing} onToggle={() => toggleSection('pricing')} />
            {openSections.pricing && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Price *</label>
                  <input
                    className={`input ${errors.price ? 'border-red-400' : ''}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pricing?.price ?? ''}
                    onChange={(e) => set('pricing', { ...form.pricing!, price: parseFloat(e.target.value) || 0 })}
                  />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="label">Sale Price</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pricing?.salePrice ?? ''}
                    onChange={(e) => set('pricing', { ...form.pricing!, salePrice: parseFloat(e.target.value) || undefined })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label">Cost Price</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pricing?.costPrice ?? ''}
                    onChange={(e) => set('pricing', { ...form.pricing!, costPrice: parseFloat(e.target.value) || undefined })}
                    placeholder="Internal only"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Attributes */}
          <div className="card p-5">
            <SectionHeader title="Attributes" open={openSections.attributes} onToggle={() => toggleSection('attributes')} />
            {openSections.attributes && (
              <div className="space-y-2">
                {(form.attributes ?? []).map((attr, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="input flex-1"
                      value={attr.name}
                      onChange={(e) => updateAttribute(i, 'name', e.target.value)}
                      placeholder="Attribute name"
                    />
                    <input
                      className="input flex-1"
                      value={attr.value}
                      onChange={(e) => updateAttribute(i, 'value', e.target.value)}
                      placeholder="Value"
                    />
                    <button className="btn-ghost p-1.5 text-red-400" onClick={() => removeAttribute(i)}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1 mt-1" onClick={addAttribute}>
                  <Plus size={12} /> Add attribute
                </button>
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="card p-5">
            <SectionHeader title="SEO Metadata" open={openSections.seo} onToggle={() => toggleSection('seo')} />
            {openSections.seo && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">SEO Title</label>
                    <button
                      className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1"
                      onClick={() => handleAiEnrich('generate_seo')}
                      disabled={enriching || isNew}
                    >
                      <Sparkles size={11} /> AI Generate
                    </button>
                  </div>
                  <input
                    className="input"
                    value={form.seo?.title ?? ''}
                    onChange={(e) => set('seo', { ...form.seo!, title: e.target.value })}
                    placeholder="SEO-optimized title…"
                  />
                </div>
                <div>
                  <label className="label">Meta Description</label>
                  <textarea
                    className="input min-h-[70px]"
                    value={form.seo?.description ?? ''}
                    onChange={(e) => set('seo', { ...form.seo!, description: e.target.value })}
                    placeholder="150-160 char meta description…"
                  />
                </div>
                <div>
                  <label className="label">URL Slug</label>
                  <input
                    className="input font-mono text-xs"
                    value={form.seo?.slug ?? ''}
                    onChange={(e) => set('seo', { ...form.seo!, slug: e.target.value })}
                    onBlur={(e) => set('seo', { ...form.seo!, slug: slugify(e.target.value) })}
                    placeholder="auto-from-name"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Status</h3>
            <div className="flex items-center justify-between mb-3">
              <Badge variant={form.status as any}>{statusLabel(form.status ?? 'draft')}</Badge>
              <CompletenessBar score={completeness} size="sm" className="w-24" />
            </div>
            {completeness < 60 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-2">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>Fill in more fields to improve completeness before publishing.</span>
              </div>
            )}
          </div>

          {/* Image placeholder */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Images</h3>
            {(form.images ?? []).length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {(form.images ?? []).map((img, i) => (
                  <img key={i} src={img.url} alt={img.alt} className="w-full aspect-square rounded-lg object-cover border border-zinc-200" />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center">
                <Package size={20} className="text-zinc-300 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No images yet</p>
                <p className="text-[10px] text-zinc-300 mt-1">Image upload managed via backend</p>
              </div>
            )}
          </div>

          {/* AI Quick Actions */}
          {!isNew && (
            <div className="card p-4 border border-violet-100 bg-violet-50/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} className="text-violet-600" />
                <h3 className="text-xs font-semibold text-violet-800">AI Enrichment</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Improve Description', task: 'improve_description' },
                  { label: 'Generate Title', task: 'generate_title' },
                  { label: 'Create Bullet Points', task: 'create_bullet_points' },
                  { label: 'Generate SEO', task: 'generate_seo' },
                ].map(({ label, task }) => (
                  <button
                    key={task}
                    className="w-full text-left text-xs text-violet-700 hover:bg-violet-100 px-2.5 py-2 rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => handleAiEnrich(task)}
                    disabled={enriching}
                  >
                    <Sparkles size={11} />
                    {label}
                  </button>
                ))}
                <p className="text-[10px] text-violet-500 mt-1 flex gap-1">
                  <Info size={10} className="shrink-0 mt-0.5" />
                  AI tasks are queued — review results in AI Assistant.
                </p>
              </div>
            </div>
          )}

          {/* Woo status */}
          {!isNew && form.wooId && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">WooCommerce</h3>
              <div className="text-xs text-zinc-600">
                <p>Woo ID: <code className="bg-zinc-100 px-1 rounded">{form.wooId}</code></p>
                <p className="mt-1">Sync status: <Badge variant={form.syncStatus as any}>{form.syncStatus}</Badge></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
