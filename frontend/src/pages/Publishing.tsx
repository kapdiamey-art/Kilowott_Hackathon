import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Check, X, AlertTriangle, Clock, Eye,
  FlaskConical, ExternalLink, RefreshCw, Play,
} from 'lucide-react';
import { products as productsApi, publishing as publishingApi, type Product, type PublishingJob } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';

type Destination = 'woocommerce' | 'simulation';

interface DestinationStatus {
  id: string;
  name: string;
  configured: boolean;
  status: string;
  description: string;
}

export default function Publishing() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<DestinationStatus[]>([]);
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [readyProducts, setReadyProducts] = useState<Product[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDest, setSelectedDest] = useState<Destination>('simulation');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusData, jobsData, productsData] = await Promise.all([
        publishingApi.status(),
        publishingApi.jobs({ limit: 20 } as any),
        productsApi.list({ status: 'ready', limit: 50 }),
      ]);
      setDestinations(statusData.destinations as DestinationStatus[]);
      setJobs(jobsData.data);
      setReadyProducts(productsData.data);

      // If woo is configured, default to it
      const woo = (statusData.destinations as DestinationStatus[]).find((d) => d.id === 'woocommerce');
      if (woo?.configured) setSelectedDest('woocommerce');
    } catch {
      toast.error('Failed to load publishing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async (productId: string) => {
    setPublishing(productId);
    try {
      await publishingApi.validate(productId);
    } catch (err: any) {
      toast.error(err?.message ?? 'Product not ready to publish');
      setPublishing(null);
      return;
    }

    try {
      const job = await publishingApi.publish(productId, selectedDest);
      toast.success(
        job.isSimulated
          ? 'Published (simulated) — no real store updated'
          : 'Publishing job queued → WooCommerce',
      );
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Publishing failed');
    } finally {
      setPublishing(null);
    }
  };

  const wooConnected = destinations.find((d) => d.id === 'woocommerce')?.configured ?? false;

  const STATUS_ICON: Record<string, React.ElementType> = {
    simulated: Check,
    completed: Check,
    queued: Clock,
    running: RefreshCw,
    failed: X,
  };

  const STATUS_COLOR: Record<string, string> = {
    simulated: 'success',
    completed: 'success',
    queued: 'medium',
    running: 'info',
    failed: 'critical',
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Publishing Center</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Review readiness and publish products to your channels.</p>
        </div>
        <div className="flex items-center gap-2">
          {!wooConnected && (
            <Badge variant="medium">
              <FlaskConical size={11} /> Simulation mode — no real WooCommerce configured
            </Badge>
          )}
          <button className="btn-ghost p-2" onClick={load} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ready to publish', count: readyProducts.length, color: 'text-teal-600 bg-teal-50', icon: Check },
          { label: 'Recent jobs', count: jobs.length, color: 'text-violet-600 bg-violet-50', icon: Upload },
          { label: 'Destinations', count: destinations.filter((d) => d.configured).length, color: 'text-blue-600 bg-blue-50', icon: ExternalLink },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900">{count}</div>
              <div className="text-xs text-zinc-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Destination selector */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Publish Destination</h3>
        <div className="grid grid-cols-2 gap-3">
          {destinations.map((dest) => (
            <button
              key={dest.id}
              className={`p-4 rounded-xl border-2 text-left transition-all ${selectedDest === dest.id ? 'border-violet-500 bg-violet-50' : 'border-zinc-200 hover:border-zinc-300'}`}
              onClick={() => setSelectedDest(dest.id as Destination)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-zinc-900">{dest.name}</span>
                <Badge variant={dest.configured ? 'success' : 'default'}>
                  {dest.configured ? 'Active' : 'Not configured'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">{dest.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Ready products */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900">Ready to Publish</h3>
          <span className="text-xs text-zinc-500">{readyProducts.length} product{readyProducts.length !== 1 ? 's' : ''} with "Ready" status</span>
        </div>
        {readyProducts.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-zinc-400">
            No products with "Ready" status. Set products to "Ready" in the editor to publish them.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Completeness</th>
                  <th className="px-4 py-3">Sync Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {readyProducts.map((product) => {
                  const isPublishing = publishing === product._id;
                  return (
                    <tr key={product._id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {product.images[0] && (
                            <img src={product.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{product.name}</p>
                            <p className="text-xs text-zinc-400">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 font-mono">{product.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden w-20">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${product.completeness}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-600">{product.completeness}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={product.syncStatus === 'synced' ? 'success' : 'default'}>
                          {product.syncStatus?.replace('_', ' ') ?? 'not synced'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            className="btn-ghost text-xs p-1.5"
                            onClick={() => navigate(`/app/products/${product._id}`)}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className={`btn-primary text-xs py-1 px-2.5 flex items-center gap-1 ${isPublishing ? 'opacity-70' : ''}`}
                            onClick={() => handlePublish(product._id)}
                            disabled={isPublishing}
                          >
                            {isPublishing ? (
                              <><RefreshCw size={11} className="animate-spin" /> Publishing…</>
                            ) : (
                              <><Play size={11} /> Publish</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Publishing jobs history */}
      {jobs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">Recent Publishing Jobs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Simulated</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const StatusIcon = STATUS_ICON[job.status] ?? Clock;
                  return (
                    <tr key={job._id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-sm text-zinc-900 font-medium">{job.productSku}</td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{job.destination}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon size={12} className={job.status === 'failed' ? 'text-red-500' : 'text-teal-500'} />
                          <Badge variant={(STATUS_COLOR[job.status] ?? 'default') as any}>{job.status}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {job.isSimulated ? (
                          <span className="text-xs text-amber-600 flex items-center gap-1"><FlaskConical size={11} /> Simulated</span>
                        ) : (
                          <span className="text-xs text-teal-600 flex items-center gap-1"><Check size={11} /> Real</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{formatDate(job.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{job.triggeredBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Integration notice */}
      <div className="card p-4 flex items-start gap-3 bg-zinc-50/50">
        <ExternalLink size={15} className="text-zinc-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-600">
          <strong>Connect WooCommerce</strong> in Settings to enable real publishing. Once connected, ProductShelf pushes PIM-owned fields
          (name, description, attributes) to your store while respecting WooCommerce-owned data (price, stock).
          Without WooCommerce, publishing uses <strong>Simulation mode</strong> — products are marked published locally.
        </div>
      </div>
    </div>
  );
}
