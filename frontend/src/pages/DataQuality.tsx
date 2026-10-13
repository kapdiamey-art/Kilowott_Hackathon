import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, AlertCircle, Info,
  ArrowRight, Filter, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { quality, type QualityIssue, type QualitySummary } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import type { IssueSeverity } from '../types';

const SEVERITY_ORDER: IssueSeverity[] = ['critical', 'high', 'medium', 'low'];

const SEVERITY_META: Record<IssueSeverity, { label: string; icon: React.ElementType; color: string }> = {
  critical: { label: 'Critical', icon: AlertCircle, color: 'text-red-600' },
  high: { label: 'High', icon: AlertTriangle, color: 'text-orange-500' },
  medium: { label: 'Medium', icon: Info, color: 'text-amber-500' },
  low: { label: 'Low', icon: Info, color: 'text-zinc-400' },
};

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      <circle cx={44} cy={44} r={r} fill="none" stroke="#f4f4f5" strokeWidth={8} />
      <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 44 44)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={44} y={49} textAnchor="middle" fontSize={18} fontWeight={700} fill="#18181b">{score}</text>
    </svg>
  );
}

export default function DataQuality() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<QualitySummary | null>(null);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | ''>('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, issueData] = await Promise.all([
        quality.summary(),
        quality.issues({ severity: filterSeverity || undefined, type: filterType || undefined, page, limit: 50 }),
      ]);
      setSummary(sumData);
      setIssues(issueData.data);
      setTotalIssues(issueData.pagination.total);
    } catch {
      toast.error('Failed to load quality data');
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterType, page]);

  useEffect(() => { load(); }, [load]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await quality.recalculateAll();
      toast.success('Quality scores recalculated');
      load();
    } catch {
      toast.error('Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  };

  const score = summary?.avgScore ?? 0;

  const severityCounts: Record<string, number> = {};
  if (summary?.bands) {
    // Map topIssueTypes to severity counts
    issues.forEach((i) => {
      severityCounts[i.severity] = (severityCounts[i.severity] ?? 0) + 1;
    });
  }

  // Also count from issues array
  const localSeverityCounts: Partial<Record<IssueSeverity, number>> = {};
  issues.forEach((i) => { localSeverityCounts[i.severity as IssueSeverity] = (localSeverityCounts[i.severity as IssueSeverity] ?? 0) + 1; });

  const topTypes = summary?.topIssueTypes ?? {};

  const sorted = [...issues].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity as IssueSeverity) - SEVERITY_ORDER.indexOf(b.severity as IssueSeverity),
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Data Quality</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{totalIssues} issue{totalIssues !== 1 ? 's' : ''} found</span>
          <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" onClick={handleRecalculate} disabled={recalculating || loading}>
            <RefreshCw size={12} className={recalculating ? 'animate-spin' : ''} />
            {recalculating ? 'Recalculating…' : 'Recalculate All'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Score + summary */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="card p-5 flex items-center gap-4">
              <ScoreRing score={score} />
              <div>
                <p className="text-sm font-bold text-zinc-900">Quality Score</p>
                <p className="text-xs text-zinc-500 mt-0.5">Average catalog completeness</p>
                <Badge variant={score >= 80 ? 'success' : score >= 60 ? 'medium' : 'critical'} className="mt-2">
                  {score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Work'}
                </Badge>
              </div>
            </div>

            {SEVERITY_ORDER.map((sev) => {
              const { label, icon: Icon, color } = SEVERITY_META[sev];
              const count = localSeverityCounts[sev] ?? 0;
              return (
                <div
                  key={sev}
                  className={`card p-5 cursor-pointer hover:shadow-sm transition-all ${filterSeverity === sev ? 'ring-2 ring-violet-400' : ''}`}
                  onClick={() => setFilterSeverity((f) => (f === sev ? '' : sev))}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={15} className={color} />
                    <span className="text-xs font-semibold text-zinc-600">{label}</span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">{count}</div>
                  <p className="text-xs text-zinc-400 mt-0.5">issues</p>
                </div>
              );
            })}
          </div>

          {/* Top issue types */}
          {Object.keys(topTypes).length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Top Issue Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(topTypes).slice(0, 8).map(([type, count]) => (
                  <button
                    key={type}
                    className={`p-3 rounded-xl border text-left transition-all hover:border-violet-300 ${filterType === type ? 'border-violet-400 bg-violet-50' : 'border-zinc-200 hover:bg-zinc-50'}`}
                    onClick={() => setFilterType((f) => (f === type ? '' : type))}
                  >
                    <div className="text-xl font-bold text-zinc-900 mb-1">{count as number}</div>
                    <div className="text-xs text-zinc-600">{type.replace(/_/g, ' ')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex items-center gap-3">
            <Filter size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-500">Filters:</span>
            {filterSeverity && (
              <button className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200 hover:bg-violet-100" onClick={() => setFilterSeverity('')}>
                Severity: {SEVERITY_META[filterSeverity].label} ×
              </button>
            )}
            {filterType && (
              <button className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200 hover:bg-violet-100" onClick={() => setFilterType('')}>
                Type: {filterType.replace(/_/g, ' ')} ×
              </button>
            )}
            {(filterSeverity || filterType) && (
              <button className="text-xs text-zinc-400 hover:text-zinc-600" onClick={() => { setFilterSeverity(''); setFilterType(''); }}>
                Clear all
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-500">{sorted.length} result{sorted.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Issues table */}
          <div className="card overflow-hidden">
            {sorted.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={20} className="text-teal-500" />}
                title="No issues found"
                description={filterSeverity || filterType ? 'Try clearing your filters.' : 'Your catalog looks great!'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Issue</th>
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((issue) => {
                      const sev = issue.severity as IssueSeverity;
                      const { icon: Icon, color } = SEVERITY_META[sev] ?? SEVERITY_META.low;
                      return (
                        <tr key={`${issue.productId}-${issue.type}-${issue.field}`} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Icon size={13} className={color} />
                              <Badge variant={sev as any}>{SEVERITY_META[sev]?.label ?? sev}</Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-zinc-900 max-w-[200px] truncate">{issue.productName}</td>
                          <td className="px-4 py-3 text-xs text-zinc-400 font-mono">{issue.productSku}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{issue.message}</td>
                          <td className="px-4 py-3">
                            {issue.field && (
                              <code className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">{issue.field}</code>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className="btn-ghost text-xs text-violet-600 hover:text-violet-800"
                              onClick={() => navigate(`/app/products/${issue.productId}`)}
                            >
                              Fix <ArrowRight size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
