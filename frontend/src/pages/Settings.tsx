import { useState, useEffect } from 'react';
import {
  Settings2, Globe, Sparkles, Link2, User,
  Check, AlertCircle, ChevronRight, X, RefreshCw, Eye, EyeOff, Zap,
} from 'lucide-react';
import { publishing as publishingApi, ApiError } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import type { ProductCategory } from '../types';

const CATEGORIES: ProductCategory[] = [
  'Electronics', 'Home & Living', 'Fashion', 'Beauty', 'Sports', 'Toys', 'Food & Grocery', 'Uncategorized',
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'];

// ─── UI helpers ────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon size={15} className="text-violet-600" />
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        </div>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1">
        <label className="text-sm font-medium text-zinc-900">{label}</label>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0 w-64">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-violet-600' : 'bg-zinc-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ─── WooCommerce Configure Modal ────────────────────────────────────────────

interface WooConfigModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function WooConfigModal({ onClose, onSaved }: WooConfigModalProps) {
  const [siteUrl, setSiteUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!siteUrl || !consumerKey || !consumerSecret) {
      toast.error('Fill in all required fields first');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // Save first so we can test
      await fetch('/api/sync/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ siteUrl, consumerKey, consumerSecret, webhookSecret }),
      });
      const res = await fetch('/api/sync/connection/test', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, message: `Connected! Store: ${data.storeName ?? siteUrl}` });
      } else {
        setTestResult({ ok: false, message: data.error ?? 'Connection failed' });
      }
    } catch {
      setTestResult({ ok: false, message: 'Could not reach server' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!siteUrl || !consumerKey || !consumerSecret) {
      toast.error('Site URL, Consumer Key, and Consumer Secret are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/sync/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ siteUrl, consumerKey, consumerSecret, webhookSecret }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      toast.success('WooCommerce connection saved');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-purple-600" />
            <h3 className="text-sm font-semibold text-zinc-900">Configure WooCommerce</h3>
          </div>
          <button className="btn-ghost p-2" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Help note */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex gap-2">
            <Zap size={13} className="shrink-0 mt-0.5 text-blue-500" />
            <span>Generate API keys in your WooCommerce store: <strong>WooCommerce → Settings → Advanced → REST API</strong></span>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 mb-1 block">Store URL *</label>
            <input className="input" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://yourstore.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 mb-1 block">Consumer Key *</label>
            <input className="input font-mono text-xs" value={consumerKey} onChange={(e) => setConsumerKey(e.target.value)} placeholder="ck_…" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 mb-1 block">Consumer Secret *</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                className="input font-mono text-xs pr-10"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                placeholder="cs_…"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                onClick={() => setShowSecret((v) => !v)}
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 mb-1 block">Webhook Secret (optional)</label>
            <input className="input font-mono text-xs" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="Used to verify incoming webhooks" />
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${testResult.ok ? 'bg-teal-50 border border-teal-200 text-teal-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {testResult.ok ? <Check size={13} /> : <AlertCircle size={13} />}
              {testResult.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <button className="btn-secondary" onClick={handleTest} disabled={testing || saving}>
            {testing ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
            Test Connection
          </button>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Local settings (stored in localStorage, not backend) ────────────────

interface LocalSettings {
  workspaceName: string;
  defaultCurrency: string;
  defaultLanguage: string;
  defaultCategory: ProductCategory;
  autoEnrichOnCreate: boolean;
  requireApprovalForAi: boolean;
  scheduledSyncEnabled: boolean;
  scheduledSyncCron: string;
}

const DEFAULT_LOCAL: LocalSettings = {
  workspaceName: 'ProductShelf', defaultCurrency: 'USD', defaultLanguage: 'en',
  defaultCategory: 'Electronics', autoEnrichOnCreate: false, requireApprovalForAi: true,
  scheduledSyncEnabled: false, scheduledSyncCron: '0 2 * * *',
};

function loadLocal(): LocalSettings {
  try { return { ...DEFAULT_LOCAL, ...JSON.parse(localStorage.getItem('ps_workspace_settings') ?? '{}') }; }
  catch { return DEFAULT_LOCAL; }
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<LocalSettings>(loadLocal);
  const [saving, setSaving] = useState(false);
  const [wooConnected, setWooConnected] = useState(false);
  const [wooChecking, setWooChecking] = useState(true);
  const [showWooModal, setShowWooModal] = useState(false);

  const set = <K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  // Check WooCommerce status from backend
  useEffect(() => {
    publishingApi.status()
      .then((data: any) => {
        const woo = data.destinations?.find((d: any) => d.id === 'woocommerce');
        setWooConnected(woo?.configured ?? false);
      })
      .catch(() => {})
      .finally(() => setWooChecking(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('ps_workspace_settings', JSON.stringify(settings));
      setSaving(false);
      toast.success('Settings saved');
    }, 400);
  };

  const handleWooSaved = () => {
    setWooConnected(true);
    toast.success('WooCommerce configured — publishing is now live!');
  };

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      {showWooModal && (
        <WooConfigModal onClose={() => setShowWooModal(false)} onSaved={handleWooSaved} />
      )}

      {/* Workspace */}
      <Section icon={Settings2} title="Workspace" description="General preferences for this ProductShelf workspace.">
        <Field label="Workspace Name">
          <input className="input" value={settings.workspaceName} onChange={(e) => set('workspaceName', e.target.value)} />
        </Field>
        <Field label="Default Currency">
          <select className="input" value={settings.defaultCurrency} onChange={(e) => set('defaultCurrency', e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Default Category" description="Applied when creating new products.">
          <select className="input" value={settings.defaultCategory} onChange={(e) => set('defaultCategory', e.target.value as ProductCategory)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Default Language">
          <select className="input" value={settings.defaultLanguage} onChange={(e) => set('defaultLanguage', e.target.value)}>
            <option value="en">English</option>
            <option value="de">German</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </Field>
      </Section>

      {/* Logged-in user */}
      <Section icon={User} title="Account" description="Your current session details.">
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{user?.name}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
          <Badge variant="info" className="ml-auto capitalize">{user?.role}</Badge>
        </div>
      </Section>

      {/* AI */}
      <Section icon={Sparkles} title="AI Provider" description="Configure the AI provider used for content enrichment.">
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-xs text-teal-800">
          <Check size={14} className="shrink-0 mt-0.5 text-teal-600" />
          <div>
            <strong>Gemini AI is configured.</strong> The backend uses <code>GEMINI_API_KEY</code> from your <code>.env</code> file.
            The AI Assistant page creates real enrichment tasks powered by Gemini.
          </div>
        </div>
        <Field label="Auto-enrich on Create" description="Automatically trigger AI enrichment when a product is created.">
          <Toggle checked={settings.autoEnrichOnCreate} onChange={(v) => set('autoEnrichOnCreate', v)} />
        </Field>
        <Field label="Require Human Approval" description="All AI suggestions must be reviewed before being applied.">
          <Toggle checked={settings.requireApprovalForAi} onChange={(v) => set('requireApprovalForAi', v)} />
        </Field>
      </Section>

      {/* WooCommerce integration */}
      <Section icon={Link2} title="Integrations" description="Connect ProductShelf to your publishing channels.">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Globe size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">WooCommerce</p>
                <p className="text-xs text-zinc-500">Sync product content and publish directly to your WooCommerce store.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {wooChecking ? (
                <RefreshCw size={13} className="animate-spin text-zinc-400" />
              ) : (
                <Badge variant={wooConnected ? 'success' : 'default'}>
                  {wooConnected ? <><Check size={10} /> Connected</> : 'Not Connected'}
                </Badge>
              )}
              <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1" onClick={() => setShowWooModal(true)}>
                {wooConnected ? 'Reconfigure' : 'Configure'} <ChevronRight size={12} />
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-400">
            Credentials (consumer key & secret) are encrypted with AES-256-GCM on the backend — never stored in frontend code or localStorage.
            Without WooCommerce, publishing uses <strong>Simulation mode</strong> which works perfectly for demos.
          </p>
        </div>

        {/* Sync schedule */}
        <div className="border-t border-zinc-100 pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-700">Sync Schedule</h4>
          <Field label="Enable Scheduled Sync" description="Automatically sync products to WooCommerce on a schedule.">
            <Toggle checked={settings.scheduledSyncEnabled} onChange={(v) => set('scheduledSyncEnabled', v)} />
          </Field>
          {settings.scheduledSyncEnabled && (
            <Field label="Cron Schedule" description="Standard cron expression (e.g. 0 2 * * * = daily at 2am).">
              <input
                className="input font-mono text-xs"
                value={settings.scheduledSyncCron}
                onChange={(e) => set('scheduledSyncCron', e.target.value)}
              />
            </Field>
          )}
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
