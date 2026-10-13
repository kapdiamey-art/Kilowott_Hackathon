import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ChevronDown, Check, X, RotateCcw, ArrowRight,
  Info, Zap, Package, FlaskConical, RefreshCw,
} from 'lucide-react';
import { products as productsApi, ai as aiApi, type Product } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { CompletenessBar } from '../components/ui/CompletenessBar';
import { toast } from '../components/ui/Toast';
import { statusLabel } from '../lib/utils';
import type { AiTaskType, AiTone } from '../types';

const TASK_TYPES: { value: AiTaskType; label: string; description: string }[] = [
  { value: 'improve_description', label: 'Improve Description', description: 'Rewrite the product description to be more compelling and SEO-friendly.' },
  { value: 'generate_title', label: 'Generate Title', description: 'Create a keyword-rich, conversion-optimised product title.' },
  { value: 'create_bullet_points', label: 'Create Bullet Points', description: 'Generate scannable key-feature bullet points for marketplace listings.' },
  { value: 'generate_seo', label: 'Generate SEO Metadata', description: 'Produce a title tag and meta description optimised for search.' },
  { value: 'suggest_attributes', label: 'Suggest Attributes', description: 'Identify and populate structured product attributes from description context.' },
];

const TONES: { value: AiTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'technical', label: 'Technical' },
  { value: 'casual', label: 'Casual' },
];

interface AiTask {
  _id: string;
  taskType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected';
  before?: string | string[];
  after?: string | string[];
  reasoning?: string;
  confidence?: number;
  error?: string;
  createdAt: string;
}

type Step = 'configure' | 'generating' | 'review';

export default function AiAssistant() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [taskType, setTaskType] = useState<AiTaskType>('improve_description');
  const [tone, setTone] = useState<AiTone>('professional');
  const [step, setStep] = useState<Step>('configure');
  const [currentTask, setCurrentTask] = useState<AiTask | null>(null);
  const [polling, setPolling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);

  // Load product list
  useEffect(() => {
    productsApi.list({ limit: 100 })
      .then((res) => setAllProducts(res.data))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoadingProducts(false));
  }, []);

  const selectedProduct = allProducts.find((p) => p._id === selectedProductId);

  const reset = () => {
    setStep('configure');
    setCurrentTask(null);
    setPolling(false);
  };

  // Poll a task until it reaches terminal state
  const pollTask = useCallback(async (taskId: string) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s max

    const poll = async (): Promise<void> => {
      if (attempts++ >= maxAttempts) {
        toast.error('AI task timed out. Please try again.');
        setStep('configure');
        setPolling(false);
        return;
      }
      try {
        const tasks = await aiApi.getTasks(selectedProductId) as { data: AiTask[] };
        const task = tasks.data?.find((t: AiTask) => t._id === taskId);
        if (!task) { await new Promise((r) => setTimeout(r, 2000)); return poll(); }

        setCurrentTask(task);

        if (task.status === 'completed') {
          setStep('review');
          setPolling(false);
          return;
        }
        if (task.status === 'failed') {
          toast.error(`AI task failed: ${task.error ?? 'Unknown error'}`);
          setStep('configure');
          setPolling(false);
          return;
        }
        // Still processing
        await new Promise((r) => setTimeout(r, 2000));
        return poll();
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
        return poll();
      }
    };

    poll();
  }, [selectedProductId]);

  const handleGenerate = async () => {
    if (!selectedProductId) { toast.error('Select a product first.'); return; }
    setSubmitting(true);
    setStep('generating');
    setCurrentTask(null);
    try {
      const res = await aiApi.enrich(selectedProductId, taskType) as { task?: AiTask };
      if (res?.task?._id) {
        pollTask(res.task._id);
      } else {
        // Backend acknowledged but no task ID returned — treat as pending
        toast.success('AI task queued. Fetching results…');
        // Fetch tasks after a short wait
        await new Promise((r) => setTimeout(r, 2000));
        const tasks = await aiApi.getTasks(selectedProductId) as { data: AiTask[] };
        const latestTask = tasks.data?.[0];
        if (latestTask) {
          setCurrentTask(latestTask);
          if (latestTask.status === 'completed') setStep('review');
          else pollTask(latestTask._id);
        } else {
          toast.error('Could not retrieve AI task');
          setStep('configure');
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to start AI task');
      setStep('configure');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!currentTask) return;
    setApproving(true);
    try {
      await aiApi.approve(currentTask._id);
      toast.success('AI suggestion approved and applied to product!');
      // Refresh the product in our list
      const updated = await productsApi.get(selectedProductId);
      setAllProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setCurrentTask((t) => t ? { ...t, status: 'approved' } : t);
    } catch (err: any) {
      toast.error(err?.message ?? 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!currentTask) return;
    try {
      await aiApi.reject(currentTask._id);
      toast.error('Suggestion rejected');
      setCurrentTask((t) => t ? { ...t, status: 'rejected' } : t);
    } catch {
      toast.error('Rejection failed');
    }
  };

  const isTerminal = currentTask?.status === 'approved' || currentTask?.status === 'rejected';
  const taskLabel = TASK_TYPES.find((t) => t.value === taskType)?.label ?? taskType;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Hero header */}
      <div className="card p-6 border-violet-100 bg-gradient-to-br from-violet-50 to-violet-50/40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
            <Sparkles size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-zinc-900">AI Product Assistant</h2>
            <p className="text-sm text-zinc-600 mt-0.5">
              Generate compelling product content — descriptions, titles, bullet points, SEO metadata, and attributes.
              All suggestions require your approval before being applied.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 text-xs font-medium text-violet-700">
                <Zap size={11} /> Powered by Gemini AI
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-medium text-teal-700">
                <Check size={11} /> Human approval required
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product picker */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-3">1. Select Product</h3>
            <div className="relative">
              <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                className="input pl-8 appearance-none pr-8"
                value={selectedProductId}
                onChange={(e) => { setSelectedProductId(e.target.value); reset(); }}
                disabled={loadingProducts}
              >
                <option value="">{loadingProducts ? 'Loading products…' : 'Choose a product…'}</option>
                {allProducts.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>

            {selectedProduct && (
              <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="flex items-center gap-2 mb-1.5">
                  {selectedProduct.images[0] && (
                    <img src={selectedProduct.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-zinc-900">{selectedProduct.name}</p>
                    <p className="text-[10px] text-zinc-400">{selectedProduct.sku} · {selectedProduct.category}</p>
                  </div>
                </div>
                <CompletenessBar score={selectedProduct.completeness} size="sm" />
              </div>
            )}
          </div>

          {/* Task picker */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-3">2. Choose Task</h3>
            <div className="space-y-1.5">
              {TASK_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    taskType === value
                      ? 'border-violet-300 bg-violet-50 text-violet-900'
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700'
                  }`}
                  onClick={() => { setTaskType(value); reset(); }}
                >
                  <span className="font-medium block">{label}</span>
                  <span className="text-xs text-zinc-500">{description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone picker */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-3">3. Tone & Style</h3>
            <div className="flex flex-wrap gap-2">
              {TONES.map(({ value, label }) => (
                <button
                  key={value}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    tone === value
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-zinc-200 text-zinc-600 hover:border-violet-300 hover:text-violet-700'
                  }`}
                  onClick={() => setTone(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            className="w-full btn-primary py-3 justify-center text-sm"
            onClick={handleGenerate}
            disabled={!selectedProductId || step === 'generating' || submitting}
          >
            {submitting || polling ? (
              <><RefreshCw size={15} className="animate-spin" /> Generating…</>
            ) : (
              <><Sparkles size={15} /> Generate Suggestion</>
            )}
          </button>
        </div>

        {/* Output panel */}
        <div className="lg:col-span-3">
          {step === 'configure' && (
            <div className="card h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Ready to generate</h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                Select a product and a task on the left, then click "Generate Suggestion" to use AI-powered content.
              </p>
            </div>
          )}

          {step === 'generating' && (
            <div className="card h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4 animate-pulse">
                <Sparkles size={28} className="text-violet-500" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Generating content…</h3>
              <p className="text-xs text-zinc-500">Gemini AI is analysing your product and producing suggestions.</p>
              <div className="mt-6 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {step === 'review' && currentTask && (
            <div className="card p-6 space-y-5">
              {/* Result header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-violet-600" />
                  <h3 className="text-sm font-semibold text-zinc-900">{taskLabel}</h3>
                  {currentTask.confidence && (
                    <Badge variant="info">{currentTask.confidence}% confidence</Badge>
                  )}
                </div>
                <Badge variant={currentTask.status === 'approved' ? 'success' : currentTask.status === 'rejected' ? 'critical' : 'medium'}>
                  {currentTask.status}
                </Badge>
              </div>

              {/* Before / After */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Before</p>
                  <div className="min-h-[100px] p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-500 leading-relaxed">
                    {Array.isArray(currentTask.before)
                      ? currentTask.before.length > 0
                        ? currentTask.before.map((b, i) => <p key={i} className="line-through opacity-70">• {b}</p>)
                        : <span className="italic">No existing content</span>
                      : currentTask.before || <span className="italic">Empty</span>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wide mb-2">AI Suggestion</p>
                  <div className={`min-h-[100px] p-3 border rounded-xl text-xs text-zinc-900 leading-relaxed transition-colors ${
                    currentTask.status === 'approved' ? 'bg-teal-50 border-teal-200'
                    : currentTask.status === 'rejected' ? 'bg-red-50 border-red-200 opacity-60'
                    : 'bg-violet-50 border-violet-200'
                  }`}>
                    {Array.isArray(currentTask.after)
                      ? currentTask.after.map((a, i) => <p key={i}>• {a}</p>)
                      : currentTask.after}
                    {currentTask.status === 'approved' && (
                      <div className="mt-2 flex items-center gap-1 text-teal-700 font-medium">
                        <Check size={11} /> Applied to product
                      </div>
                    )}
                    {currentTask.status === 'rejected' && (
                      <div className="mt-2 flex items-center gap-1 text-red-500 font-medium">
                        <X size={11} /> Rejected
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              {currentTask.reasoning && (
                <div className="flex gap-2.5 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <Info size={13} className="text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase mb-1">Why this suggestion?</p>
                    <p className="text-xs text-zinc-600 leading-relaxed">{currentTask.reasoning}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isTerminal && (
                <div className="flex gap-2">
                  <button className="btn-danger flex-1 justify-center" onClick={handleReject} disabled={approving}>
                    <X size={14} /> Reject
                  </button>
                  <button className="btn-secondary flex-1 justify-center" onClick={handleGenerate} disabled={approving || submitting}>
                    <RotateCcw size={14} /> Regenerate
                  </button>
                  <button className="btn-primary flex-1 justify-center" onClick={handleApprove} disabled={approving}>
                    {approving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    Apply to Product
                  </button>
                </div>
              )}

              {isTerminal && (
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1 justify-center" onClick={reset}>
                    <RotateCcw size={14} /> Start over
                  </button>
                  {currentTask.status === 'approved' && (
                    <button
                      className="btn-primary flex-1 justify-center"
                      onClick={() => navigate(`/app/products/${selectedProductId}`)}
                    >
                      Open Product <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
