import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Plus, LayoutGrid, List, SortAsc, Trash2,
  Package, ChevronLeft, ChevronRight, Eye, RefreshCw,
} from 'lucide-react';
import { products as productsApi, type Product } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { CompletenessBar } from '../components/ui/CompletenessBar';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import { formatCurrency, formatDate, statusLabel, truncate } from '../lib/utils';
import type { ProductStatus } from '../types';

const CATEGORIES = [
  'Electronics', 'Home & Living', 'Fashion', 'Beauty', 'Sports', 'Toys', 'Food & Grocery',
];
const STATUSES: ProductStatus[] = ['draft', 'in_review', 'ready', 'published'];
type SortKey = 'name' | 'updatedAt' | 'completeness' | 'pricing.price';
type SortDir = 'asc' | 'desc';

function ProductRow({ product, selected, onSelect, onOpen }: {
  product: Product; selected: boolean; onSelect: (id: string) => void; onOpen: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-zinc-50 cursor-pointer transition-colors" onClick={() => onOpen(product._id)}>
      <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); onSelect(product._id); }}>
        <input type="checkbox" checked={selected} onChange={() => onSelect(product._id)} className="rounded border-zinc-300" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
            {product.images[0] ? (
              <img src={product.images[0].url} alt={product.images[0].alt} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-zinc-400" /></div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-900">{truncate(product.name, 40)}</div>
            <div className="text-xs text-zinc-400">{product.sku}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-600">{product.category}</td>
      <td className="px-4 py-3 text-xs text-zinc-600">{product.brand}</td>
      <td className="px-4 py-3 text-sm font-medium text-zinc-900">
        {formatCurrency(product.pricing.price)}
        {product.pricing.salePrice && (
          <span className="ml-1 text-xs text-teal-600">↓{formatCurrency(product.pricing.salePrice)}</span>
        )}
      </td>
      <td className="px-4 py-3"><CompletenessBar score={product.completeness} size="sm" className="w-24" /></td>
      <td className="px-4 py-3"><Badge variant={product.status as any}>{statusLabel(product.status)}</Badge></td>
      <td className="px-4 py-3 text-xs text-zinc-400">{formatDate(product.updatedAt)}</td>
      <td className="px-4 py-3">
        <button className="btn-ghost p-1.5 text-zinc-400" onClick={(e) => { e.stopPropagation(); onOpen(product._id); }}>
          <Eye size={14} />
        </button>
      </td>
    </tr>
  );
}

function ProductCard({ product, selected, onSelect, onOpen }: {
  product: Product; selected: boolean; onSelect: (id: string) => void; onOpen: (id: string) => void;
}) {
  return (
    <div className="card p-4 cursor-pointer hover:shadow-sm hover:border-zinc-300 transition-all" onClick={() => onOpen(product._id)}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
          {product.images[0] ? (
            <img src={product.images[0].url} alt={product.images[0].alt} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-zinc-400" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zinc-900 truncate">{product.name}</div>
          <div className="text-xs text-zinc-400">{product.sku}</div>
        </div>
        <input type="checkbox" checked={selected} onChange={() => onSelect(product._id)} onClick={(e) => e.stopPropagation()} className="rounded border-zinc-300" />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={product.status as any}>{statusLabel(product.status)}</Badge>
        <span className="text-xs text-zinc-400">{product.category}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900">{formatCurrency(product.pricing.price)}</span>
        <CompletenessBar score={product.completeness} size="sm" className="w-20" />
      </div>
    </div>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({
        search: search || undefined,
        status: filterStatus || undefined,
        category: filterCategory || undefined,
        page,
        limit: PAGE_SIZE,
        sort: sortKey,
      });
      setData(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.pages);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterCategory, page, sortKey]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleAll = () => {
    if (selected.size === data.length) setSelected(new Set());
    else setSelected(new Set(data.map((p) => p._id)));
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map((id) => productsApi.delete(id)));
      toast.success(`${selected.size} product(s) deleted`);
      setSelected(new Set());
      load();
    } catch {
      toast.error('Failed to delete products');
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      className="flex items-center gap-1 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide hover:text-zinc-700"
      onClick={() => handleSort(k)}
    >
      {label}
      {sortKey === k && <SortAsc size={11} className={sortDir === 'desc' ? 'rotate-180' : ''} />}
    </button>
  );

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="input pl-8 pr-3 h-9"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="input h-9 w-auto" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <select className="input h-9 w-auto" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>

        <div className="flex gap-1 ml-auto">
          <button className={`btn-ghost p-2 ${view === 'table' ? 'bg-zinc-100 text-zinc-900' : ''}`} onClick={() => setView('table')}>
            <List size={15} />
          </button>
          <button className={`btn-ghost p-2 ${view === 'grid' ? 'bg-zinc-100 text-zinc-900' : ''}`} onClick={() => setView('grid')}>
            <LayoutGrid size={15} />
          </button>
        </div>

        {selected.size > 0 && (
          <button className="btn-danger" onClick={handleBulkDelete} disabled={deleting}>
            <Trash2 size={14} /> Delete ({selected.size})
          </button>
        )}

        <button className="btn-ghost p-2" onClick={load} title="Refresh" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        <button className="btn-primary" onClick={() => navigate('/app/products/new')}>
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{total} product{total !== 1 ? 's' : ''}</span>
        {selected.size > 0 && <span className="text-violet-600">{selected.size} selected</span>}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Table view */}
      {!loading && view === 'table' && (
        <div className="card overflow-hidden">
          {data.length === 0 ? (
            <EmptyState icon={<Package size={20} />} title="No products found" description="Try adjusting your search or filters, or add your first product." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={selected.size === data.length && data.length > 0} onChange={toggleAll} className="rounded border-zinc-300" />
                    </th>
                    <th className="px-4 py-3"><SortBtn k="name" label="Product" /></th>
                    <th className="px-4 py-3"><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Category</span></th>
                    <th className="px-4 py-3"><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Brand</span></th>
                    <th className="px-4 py-3"><SortBtn k="pricing.price" label="Price" /></th>
                    <th className="px-4 py-3"><SortBtn k="completeness" label="Complete" /></th>
                    <th className="px-4 py-3"><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</span></th>
                    <th className="px-4 py-3"><SortBtn k="updatedAt" label="Updated" /></th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => (
                    <ProductRow
                      key={p._id}
                      product={p}
                      selected={selected.has(p._id)}
                      onSelect={toggleSelect}
                      onOpen={(id) => navigate(`/app/products/${id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grid view */}
      {!loading && view === 'grid' && (
        data.length === 0 ? (
          <EmptyState icon={<Package size={20} />} title="No products found" description="Try adjusting your search or filters." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                selected={selected.has(p._id)}
                onSelect={toggleSelect}
                onOpen={(id) => navigate(`/app/products/${id}`)}
              />
            ))}
          </div>
        )
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-zinc-500">Page {page} of {totalPages} · {total} total</span>
          <div className="flex gap-1">
            <button className="btn-ghost p-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${n === page ? 'bg-violet-600 text-white' : 'hover:bg-zinc-100 text-zinc-600'}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button className="btn-ghost p-2" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
