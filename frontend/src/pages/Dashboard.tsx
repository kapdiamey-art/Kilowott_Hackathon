import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Package, CheckCircle2, AlertTriangle, TrendingUp,
  Plus, ShieldCheck, Sparkles, ArrowRight, Zap, RefreshCw,
} from 'lucide-react';
import { products as productsApi, activity as activityApi, type DashboardStats, type Product, type ActivityEvent } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { CompletenessBar } from '../components/ui/CompletenessBar';
import { formatRelative, formatCurrency, statusLabel } from '../lib/utils';
import type { ProductStatus } from '../types';

const CATEGORY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#f97316'];

const STATUS_CONFIG: Record<ProductStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#a1a1aa' },
  in_review: { label: 'In Review', color: '#f59e0b' },
  ready: { label: 'Ready', color: '#10b981' },
  published: { label: 'Published', color: '#6366f1' },
};

function StatCard({ icon: Icon, label, value, sub, color = 'violet' }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color?: string;
}) {
  const bg: Record<string, string> = {
    violet: 'bg-violet-50 text-violet-600',
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg[color] ?? bg.violet}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold text-zinc-900">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-zinc-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, productsData, activityData] = await Promise.all([
        productsApi.stats(),
        productsApi.list({ limit: 5, sort: 'updatedAt' }),
        activityApi.list({ limit: 6 }),
      ]);
      setStats(statsData);
      setRecentProducts(productsData.data);
      setActivityEvents(activityData.data);
    } catch {
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 min-h-64 justify-center">
        <p className="text-sm text-red-600">{error || 'No data available'}</p>
        <button className="btn-primary text-xs" onClick={load}><RefreshCw size={13} /> Retry</button>
      </div>
    );
  }

  const statusData = stats.statusBreakdown
    ? Object.entries(stats.statusBreakdown).map(([key, count]) => ({
        name: STATUS_CONFIG[key as ProductStatus]?.label ?? key,
        value: count,
        color: STATUS_CONFIG[key as ProductStatus]?.color ?? '#a1a1aa',
      }))
    : [];

  const qualityBands = stats.qualityBands ?? [];
  const categoryData = stats.categoryData ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Overview</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Every Product. One Smart Shelf.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/app/products/new')}>
          <Plus size={14} />
          Add Product
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Products" value={stats.total} color="violet" />
        <StatCard
          icon={CheckCircle2}
          label="Published"
          value={stats.published}
          sub={stats.total ? `${Math.round((stats.published / stats.total) * 100)}% of catalog` : '0%'}
          color="teal"
        />
        <StatCard icon={AlertTriangle} label="Need Attention" value={stats.needsAttention} sub="Draft or incomplete" color="amber" />
        <StatCard icon={TrendingUp} label="Avg. Completeness" value={`${stats.avgCompleteness}%`} sub="Catalog health" color="violet" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quality bands bar chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Catalog Quality Distribution</h3>
          {qualityBands.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={qualityBands} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} cursor={{ fill: '#f4f4f5' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-zinc-400">No data yet — add some products!</div>
          )}
        </div>

        {/* Category distribution pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">By Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(value) => <span style={{ fontSize: 11, color: '#71717a' }}>{value}</span>} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-zinc-400">No categories yet</div>
          )}
        </div>
      </div>

      {/* Lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent products */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">Recent Products</h3>
            <button className="btn-ghost text-xs" onClick={() => navigate('/app/products')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-zinc-100">
            {recentProducts.length === 0 && (
              <div className="px-5 py-8 text-center text-xs text-zinc-400">No products yet — add your first one!</div>
            )}
            {recentProducts.map((p) => (
              <div
                key={p._id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/app/products/${p._id}`)}
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0].url} alt={p.images[0].alt} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={14} className="text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 truncate">{p.name}</span>
                    <Badge variant={p.status as any}>{statusLabel(p.status)}</Badge>
                  </div>
                  <span className="text-xs text-zinc-400">{p.sku} · {p.brand}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-zinc-900">{formatCurrency(p.pricing.price)}</div>
                  <CompletenessBar score={p.completeness} size="sm" className="w-20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* AI Insights */}
          <div className="card p-5 border border-violet-100 bg-gradient-to-b from-violet-50/60 to-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-violet-600" />
              <h3 className="text-sm font-semibold text-violet-900">AI Insights</h3>
            </div>
            <div className="space-y-2.5 text-xs text-violet-800">
              <p className="flex gap-2">
                <Zap size={12} className="shrink-0 mt-0.5 text-violet-500" />
                <span><strong>{stats.needsAttention} products</strong> have completeness below 60% — AI enrichment can help.</span>
              </p>
              <p className="flex gap-2">
                <Zap size={12} className="shrink-0 mt-0.5 text-violet-500" />
                <span>Products with full descriptions convert <strong>up to 3× better</strong> — consider enriching drafts first.</span>
              </p>
              <p className="flex gap-2">
                <Zap size={12} className="shrink-0 mt-0.5 text-violet-500" />
                <span>Use duplicate detection to avoid <strong>catalog confusion</strong> as you grow.</span>
              </p>
            </div>
            <button className="mt-4 w-full btn-primary text-xs justify-center" onClick={() => navigate('/app/ai-assistant')}>
              <Sparkles size={13} />
              Open AI Assistant
            </button>
          </div>

          {/* Quick actions */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { icon: Plus, label: 'Add new product', to: '/app/products/new' },
                { icon: ShieldCheck, label: 'Review quality issues', to: '/app/quality' },
                { icon: Sparkles, label: 'Improve product content', to: '/app/ai-assistant' },
              ].map(({ icon: Icon, label, to }) => (
                <button
                  key={to}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
                  onClick={() => navigate(to)}
                >
                  <Icon size={14} className="text-zinc-400 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Recent Activity</h3>
              <button className="text-xs text-violet-600 hover:underline" onClick={() => navigate('/app/activity')}>All</button>
            </div>
            <div className="space-y-2.5">
              {activityEvents.length === 0 && <p className="text-xs text-zinc-400">No activity yet.</p>}
              {activityEvents.slice(0, 4).map((ev) => (
                <div key={ev._id} className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-700 leading-snug">{ev.description}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{formatRelative(ev.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
