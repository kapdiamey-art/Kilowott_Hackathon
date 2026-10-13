import { useEffect, useState, useCallback } from 'react';
import {
  Clock, Package, Sparkles, Check, X, Upload,
  RefreshCw, FileDown, Zap, User, Filter,
} from 'lucide-react';
import { activity as activityApi, type ActivityEvent } from '../services/api';
import { EmptyState } from '../components/ui/EmptyState';
import { formatRelative } from '../lib/utils';
import { toast } from '../components/ui/Toast';

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'product.created': { label: 'Product Created', icon: Package, color: 'bg-violet-100 text-violet-600' },
  'product.updated': { label: 'Product Updated', icon: Package, color: 'bg-zinc-100 text-zinc-600' },
  'product.deleted': { label: 'Product Deleted', icon: X, color: 'bg-red-100 text-red-500' },
  'product.approved': { label: 'Product Approved', icon: Check, color: 'bg-teal-100 text-teal-600' },
  'product.synced_to_woo': { label: 'Synced to Woo', icon: Upload, color: 'bg-violet-100 text-violet-600' },
  'publishing.job_completed': { label: 'Published', icon: Upload, color: 'bg-violet-100 text-violet-600' },
  'publishing.job_started': { label: 'Publishing Started', icon: Upload, color: 'bg-blue-100 text-blue-600' },
  'ai.task_created': { label: 'AI Task Created', icon: Sparkles, color: 'bg-violet-100 text-violet-600' },
  'ai.task_approved': { label: 'AI Approved', icon: Check, color: 'bg-teal-100 text-teal-600' },
  'ai.task_rejected': { label: 'AI Rejected', icon: X, color: 'bg-red-100 text-red-500' },
  // Legacy fallbacks
  product_created: { label: 'Product Created', icon: Package, color: 'bg-violet-100 text-violet-600' },
  product_updated: { label: 'Product Updated', icon: Package, color: 'bg-zinc-100 text-zinc-600' },
  product_deleted: { label: 'Product Deleted', icon: X, color: 'bg-red-100 text-red-500' },
  ai_suggestion_generated: { label: 'AI Generated', icon: Sparkles, color: 'bg-violet-100 text-violet-600' },
  ai_suggestion_approved: { label: 'AI Approved', icon: Check, color: 'bg-teal-100 text-teal-600' },
  ai_suggestion_rejected: { label: 'AI Rejected', icon: X, color: 'bg-red-100 text-red-500' },
  product_published: { label: 'Published', icon: Upload, color: 'bg-violet-100 text-violet-600' },
  sync_completed: { label: 'Sync Completed', icon: RefreshCw, color: 'bg-blue-100 text-blue-600' },
  product_imported: { label: 'Imported', icon: FileDown, color: 'bg-amber-100 text-amber-600' },
};

const ACTOR_ICON: Record<string, React.ElementType> = {
  'AI Agent': Zap,
  System: RefreshCw,
};

const ACTION_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Products', value: 'product' },
  { label: 'AI', value: 'ai' },
  { label: 'Publishing', value: 'publishing' },
];

export default function ActivityLog() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const PAGE_SIZE = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activityApi.list({
        action: actionFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setEvents(res.data);
      setTotal(res.pagination.total);
    } catch {
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Activity Log</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{total} event{total !== 1 ? 's' : ''}</span>
          <button className="btn-ghost p-2" onClick={load} disabled={loading} title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        <Filter size={13} className="text-zinc-400 mr-1" />
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${actionFilter === f.value ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            onClick={() => { setActionFilter(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Clock size={20} />}
          title="No activity yet"
          description="Actions you take — and AI agent activity — will appear here."
        />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-4 bottom-4 w-px bg-zinc-200" />

          <div className="space-y-1">
            {events.map((event) => {
              const meta = ACTION_META[event.action];
              const Icon = meta?.icon ?? Clock;
              const ActorIcon = ACTOR_ICON[event.actor] ?? User;

              return (
                <div key={event._id} className="relative flex gap-4 pl-12 py-3">
                  {/* Icon bubble */}
                  <div className={`absolute left-2 w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${meta?.color ?? 'bg-zinc-100 text-zinc-500'}`}>
                    <Icon size={12} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 card p-3.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-zinc-700">{meta?.label ?? event.action}</span>
                          {event.entityName && (
                            <span className="text-xs text-violet-600 font-medium">· {event.entityName}</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">{event.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-zinc-400">{formatRelative(event.timestamp)}</p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <ActorIcon size={10} className="text-zinc-400" />
                          <span className="text-[10px] text-zinc-400">{event.actor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {events.length < total && (
            <div className="pt-4 text-center">
              <button
                className="btn-secondary text-xs"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                Load more ({total - events.length} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
