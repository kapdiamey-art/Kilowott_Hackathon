import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, X, Eye, Layers, RefreshCw } from 'lucide-react';
import { duplicates as duplicatesApi, type DuplicatePair } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import { formatCurrency } from '../lib/utils';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  dismissed: 'Dismissed',
  confirmed: 'Confirmed',
  merged: 'Merged',
};

function SimilarityBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-red-400' : score >= 70 ? 'bg-amber-400' : 'bg-zinc-300';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums">{score}%</span>
    </div>
  );
}

type FilterStatus = 'all' | 'pending' | 'dismissed' | 'confirmed' | 'merged';

export default function Duplicates() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await duplicatesApi.list({ status: filter === 'all' ? undefined : filter, limit: 50 });
      setPairs(res.data);
      setTotal(res.pagination.total);
    } catch {
      toast.error('Failed to load duplicates');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await duplicatesApi.scan(65);
      toast.success(`Scan complete — ${res.newPairsFound} new pair${res.newPairsFound !== 1 ? 's' : ''} found`);
      load();
    } catch {
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleReview = async (id: string, status: 'dismissed' | 'confirmed') => {
    setReviewing(id);
    try {
      await duplicatesApi.review(id, { status });
      toast.success(status === 'dismissed' ? 'Pair dismissed' : 'Pair confirmed as duplicate');
      load();
    } catch {
      toast.error('Review action failed');
    } finally {
      setReviewing(null);
    }
  };

  const pendingCount = pairs.filter((p) => p.status === 'pending').length;

  const FILTER_TABS: FilterStatus[] = ['all', 'pending', 'dismissed', 'confirmed', 'merged'];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Duplicate Finder</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{pendingCount} pair{pendingCount !== 1 ? 's' : ''} pending review</p>
        </div>
        <button
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          onClick={handleScan}
          disabled={scanning || loading}
        >
          <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning…' : 'Scan for Duplicates'}
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 bg-amber-50/60 border-amber-100 flex items-start gap-3">
        <Layers size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <strong>How it works:</strong> Duplicate detection uses name similarity, shared brand/category/price signals.
          Click <strong>Scan for Duplicates</strong> to run a fresh scan against your current catalog. Set similarity threshold in the API (default: 65%).
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {FILTER_TABS.map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${total})` : `${STATUS_LABELS[f]} (${pairs.filter((p) => p.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pairs.length === 0 ? (
        <EmptyState
          icon={<Copy size={20} />}
          title="No duplicates found"
          description={filter === 'all' ? 'Click "Scan for Duplicates" to analyze your catalog.' : 'Switch filter or all pairs have been reviewed.'}
        />
      ) : (
        <div className="space-y-3">
          {pairs.map((pair) => (
            <div key={pair._id} className="card overflow-hidden">
              {/* Summary row */}
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-900">{pair.productAName}</span>
                    <span className="text-zinc-300">vs</span>
                    <span className="text-sm font-medium text-zinc-900">{pair.productBName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>{pair.productASku}</span>
                    <span>·</span>
                    <span>{pair.productBSku}</span>
                    {pair.matchedFields?.length > 0 && (
                      <>
                        <span>·</span>
                        <span>Matched: {pair.matchedFields.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-32 shrink-0">
                  <p className="text-[10px] text-zinc-500 mb-1">Similarity</p>
                  <SimilarityBar score={pair.similarityScore} />
                </div>
                <Badge variant={pair.status === 'pending' ? 'review' : pair.status === 'confirmed' ? 'published' : 'default'}>
                  {STATUS_LABELS[pair.status] ?? pair.status}
                </Badge>
                <button
                  className="btn-ghost p-2"
                  onClick={() => setExpanded((e) => (e === pair._id ? null : pair._id))}
                  aria-label="Expand details"
                >
                  <Eye size={14} />
                </button>
              </div>

              {/* Expanded comparison */}
              {expanded === pair._id && (
                <div className="border-t border-zinc-100 p-5 bg-zinc-50/50">
                  {/* Evidence table */}
                  {pair.evidence && pair.evidence.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Evidence</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-zinc-200">
                              <th className="text-left py-1.5 px-2 text-zinc-400 font-semibold">Field</th>
                              <th className="text-left py-1.5 px-2 text-zinc-400 font-semibold">Product A</th>
                              <th className="text-left py-1.5 px-2 text-zinc-400 font-semibold">Product B</th>
                              <th className="text-left py-1.5 px-2 text-zinc-400 font-semibold">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pair.evidence.map((ev, i) => (
                              <tr key={i} className="border-b border-zinc-100">
                                <td className="py-1.5 px-2 font-mono text-zinc-600">{ev.field}</td>
                                <td className="py-1.5 px-2 text-zinc-700 max-w-[180px] truncate">{ev.valueA}</td>
                                <td className="py-1.5 px-2 text-zinc-700 max-w-[180px] truncate">{ev.valueB}</td>
                                <td className="py-1.5 px-2">
                                  <span className={`font-semibold ${ev.score >= 0.8 ? 'text-red-600' : ev.score >= 0.6 ? 'text-amber-600' : 'text-zinc-500'}`}>
                                    {Math.round(ev.score * 100)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {pair.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        className="btn-danger flex-1 justify-center"
                        onClick={() => handleReview(pair._id, 'dismissed')}
                        disabled={reviewing === pair._id}
                      >
                        <X size={14} /> Dismiss — Not Duplicates
                      </button>
                      <button
                        className="btn-secondary flex-1 justify-center"
                        onClick={() => navigate(`/app/products/${pair.productAId}`)}
                      >
                        Open Product A <Eye size={14} />
                      </button>
                      <button
                        className="btn-primary flex-1 justify-center"
                        onClick={() => handleReview(pair._id, 'confirmed')}
                        disabled={reviewing === pair._id}
                      >
                        <Check size={14} /> Confirm Duplicate
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
