import { useState, useCallback, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { categories as categoriesApi, attributes as attributesApi, type Category, type AttributeDefinition } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';

// ─── Category section ────────────────────────────────────────────────────────

function CategoryRow({ cat, onEdit, onDelete }: {
  cat: Category; onEdit: (c: Category) => void; onDelete: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
          <span className="text-sm font-medium text-zinc-900">{cat.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-400 font-mono">{cat.slug}</td>
      <td className="px-4 py-3 text-xs text-zinc-600">{cat.productCount}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button className="btn-ghost p-1.5" onClick={() => onEdit(cat)}><Pencil size={13} /></button>
          <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600" onClick={() => onDelete(cat._id)}>
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CategoryForm({ initial, onSave, onCancel, saving }: {
  initial?: Category; onSave: (data: Partial<Category>) => void; onCancel: () => void; saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [color, setColor] = useState(initial?.color ?? '#6366f1');
  const [description, setDescription] = useState(initial?.description ?? '');

  const handleSave = () => {
    if (!name.trim()) { toast.error('Category name required'); return; }
    onSave({ name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), color, description });
  };

  return (
    <div className="p-4 bg-zinc-50 border-t border-zinc-200 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-700 mb-1 block">Name *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electronics" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 mb-1 block">Slug</label>
          <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 mb-1 block">Color</label>
          <div className="flex gap-2 items-center">
            <input type="color" className="h-9 w-12 rounded border border-zinc-200 cursor-pointer" value={color} onChange={(e) => setColor(e.target.value)} />
            <input className="input flex-1" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div className="col-span-3">
          <label className="text-xs font-medium text-zinc-700 mb-1 block">Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description…" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={onCancel} disabled={saving}><X size={13} /> Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
          {initial ? 'Save' : 'Create'}
        </button>
      </div>
    </div>
  );
}

// ─── Attribute section ────────────────────────────────────────────────────────

const FIELD_TYPES = ['text', 'number', 'select', 'boolean', 'multiselect'] as const;

function AttributeRow({ attr, onEdit, onDelete }: {
  attr: AttributeDefinition; onEdit: (a: AttributeDefinition) => void; onDelete: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900">{attr.name}</span>
          {attr.required && <Badge variant="critical">Required</Badge>}
        </div>
      </td>
      <td className="px-4 py-3">
        <code className="text-[11px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">{attr.type}</code>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {attr.options ? attr.options.join(', ') : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button className="btn-ghost p-1.5" onClick={() => onEdit(attr)}><Pencil size={13} /></button>
          <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600" onClick={() => onDelete(attr._id)}>
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AttributeForm({ initial, onSave, onCancel, saving }: {
  initial?: AttributeDefinition; onSave: (data: Partial<AttributeDefinition>) => void; onCancel: () => void; saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? 'text');
  const [options, setOptions] = useState(initial?.options?.join(', ') ?? '');
  const [required, setRequired] = useState(initial?.required ?? false);
  const [description, setDescription] = useState(initial?.description ?? '');

  const handleSave = () => {
    if (!name.trim()) { toast.error('Attribute name required'); return; }
    onSave({
      name, type: type as AttributeDefinition['type'], required, description,
      options: options ? options.split(',').map((o) => o.trim()).filter(Boolean) : [],
      categoryIds: initial?.categoryIds ?? [],
    });
  };

  return (
    <div className="p-4 bg-zinc-50 border-t border-zinc-200 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-700 mb-1 block">Name *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Color" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 mb-1 block">Field Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {FIELD_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        {(type === 'select' || type === 'multiselect') && (
          <div className="col-span-2">
            <label className="text-xs font-medium text-zinc-700 mb-1 block">Options (comma-separated)</label>
            <input className="input" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="e.g. Red, Blue, Green" />
          </div>
        )}
        <div className="col-span-2">
          <label className="text-xs font-medium text-zinc-700 mb-1 block">Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional…" />
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <input type="checkbox" id="req" checked={required} onChange={(e) => setRequired(e.target.checked)} className="rounded" />
          <label htmlFor="req" className="text-xs text-zinc-700">Required attribute</label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={onCancel} disabled={saving}><X size={13} /> Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
          {initial ? 'Save' : 'Create'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Categories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [attrs, setAttrs] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingCat, setEditingCat] = useState<Category | null | 'new'>(null);
  const [editingAttr, setEditingAttr] = useState<AttributeDefinition | null | 'new'>(null);
  const [catOpen, setCatOpen] = useState(true);
  const [attrOpen, setAttrOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catsData, attrsData] = await Promise.all([
        categoriesApi.list(),
        attributesApi.list(),
      ]);
      setCats(catsData);
      setAttrs(attrsData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Category handlers
  const handleSaveCat = async (data: Partial<Category>) => {
    setSaving(true);
    try {
      if (editingCat === 'new') {
        await categoriesApi.create(data);
        toast.success('Category created');
      } else if (editingCat) {
        await categoriesApi.update(editingCat._id, data);
        toast.success('Category updated');
      }
      setEditingCat(null);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCat = async (id: string) => {
    try {
      await categoriesApi.delete(id);
      toast.success('Category deleted');
      load();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  // Attribute handlers
  const handleSaveAttr = async (data: Partial<AttributeDefinition>) => {
    setSaving(true);
    try {
      if (editingAttr === 'new') {
        await attributesApi.create(data);
        toast.success('Attribute created');
      } else if (editingAttr) {
        await attributesApi.update(editingAttr._id, data);
        toast.success('Attribute updated');
      }
      setEditingAttr(null);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save attribute');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttr = async (id: string) => {
    try {
      await attributesApi.delete(id);
      toast.success('Attribute deleted');
      load();
    } catch {
      toast.error('Failed to delete attribute');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Categories section */}
      <div className="card overflow-hidden">
        <button className="flex items-center justify-between w-full px-5 py-4 hover:bg-zinc-50 transition-colors" onClick={() => setCatOpen((o) => !o)}>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-violet-600" />
            <span className="text-sm font-semibold text-zinc-900">Categories</span>
            <Badge variant="info">{cats.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary text-xs py-1.5 px-3"
              onClick={(e) => { e.stopPropagation(); setEditingCat('new'); setCatOpen(true); }}
            >
              <Plus size={13} /> Add Category
            </button>
            {catOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
          </div>
        </button>

        {catOpen && (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Products</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cats.map((cat) => (
                    <CategoryRow key={cat._id} cat={cat} onEdit={(c) => setEditingCat(c)} onDelete={handleDeleteCat} />
                  ))}
                </tbody>
              </table>
            </div>
            {cats.length === 0 && (
              <EmptyState icon={<Tag size={18} />} title="No categories" description="Add your first category." />
            )}
            {(editingCat === 'new' || (editingCat && editingCat !== 'new')) && (
              <CategoryForm
                initial={editingCat !== 'new' ? editingCat : undefined}
                onSave={handleSaveCat}
                onCancel={() => setEditingCat(null)}
                saving={saving}
              />
            )}
          </>
        )}
      </div>

      {/* Attributes section */}
      <div className="card overflow-hidden">
        <button className="flex items-center justify-between w-full px-5 py-4 hover:bg-zinc-50 transition-colors" onClick={() => setAttrOpen((o) => !o)}>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-violet-600" />
            <span className="text-sm font-semibold text-zinc-900">Attributes</span>
            <Badge variant="info">{attrs.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary text-xs py-1.5 px-3"
              onClick={(e) => { e.stopPropagation(); setEditingAttr('new'); setAttrOpen(true); }}
            >
              <Plus size={13} /> Add Attribute
            </button>
            {attrOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
          </div>
        </button>

        {attrOpen && (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Options</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attrs.map((attr) => (
                    <AttributeRow key={attr._id} attr={attr} onEdit={(a) => setEditingAttr(a)} onDelete={handleDeleteAttr} />
                  ))}
                </tbody>
              </table>
            </div>
            {attrs.length === 0 && (
              <EmptyState icon={<Tag size={18} />} title="No attributes" description="Add your first attribute definition." />
            )}
            {(editingAttr === 'new' || (editingAttr && editingAttr !== 'new')) && (
              <AttributeForm
                initial={editingAttr !== 'new' ? editingAttr : undefined}
                onSave={handleSaveAttr}
                onCancel={() => setEditingAttr(null)}
                saving={saving}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
