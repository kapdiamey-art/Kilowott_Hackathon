import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Sparkles, ShieldCheck, Copy, Tag, Upload,
  ArrowRight, Check, BarChart2, Zap, ChevronRight,
  LayoutDashboard, RefreshCw, Star,
} from 'lucide-react';
import { ShelfLogo } from '../components/ui/Logo';
import { CompletenessBar } from '../components/ui/CompletenessBar';

// ── Mini dashboard preview ────────────────────────────────────────────────

function MiniStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; border: string }> = {
    Published:  { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    Draft:      { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },
    'In Review':{ bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    Ready:      { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  };
  const c = config[status] ?? config['Draft'];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {status}
    </span>
  );
}

function DashboardPreview() {
  const products = [
    { name: 'UltraSound Pro Earbuds', sku: 'EAR-001', status: 'Published', score: 94 },
    { name: 'Bamboo Yoga Block Set', sku: 'YOG-012', status: 'Ready', score: 82 },
    { name: 'Smart LED Desk Lamp', sku: 'LMP-007', status: 'In Review', score: 61 },
    { name: 'Organic Face Serum', sku: 'BST-034', status: 'Draft', score: 38 },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06)',
      }}
    >
      {/* Fake browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fca5a5' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fde68a' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#86efac' }} />
        </div>
        <div className="flex-1 h-4 rounded mx-2 flex items-center justify-center" style={{ background: '#fff', border: '1px solid #e2e8f0', maxWidth: 180 }}>
          <span className="text-[9px]" style={{ color: '#94a3b8' }}>productshelf.app/dashboard</span>
        </div>
      </div>

      <div className="flex" style={{ minHeight: 320 }}>
        {/* Mini sidebar */}
        <div className="flex flex-col gap-1 px-2 py-3" style={{ width: 110, background: '#fff', borderRight: '1px solid #f1f5f9' }}>
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: false },
            { icon: Package, label: 'Products', active: true },
            { icon: Sparkles, label: 'AI Assistant', active: false },
            { icon: ShieldCheck, label: 'Quality', active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium"
              style={{
                background: active ? '#f5f3ff' : 'transparent',
                color: active ? '#7c3aed' : '#94a3b8',
                borderLeft: active ? '2px solid #8b5cf6' : '2px solid transparent',
              }}
            >
              <Icon size={10} />
              {label}
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="flex-1 p-4 space-y-3" style={{ background: '#f8fafc' }}>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total Products', value: '248', color: '#7c3aed' },
              { label: 'Published', value: '184', color: '#059669' },
              { label: 'Avg. Quality', value: '74%', color: '#d97706' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-2 rounded-lg" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
                <div className="text-base font-bold" style={{ color }}>{value}</div>
                <div className="text-[9px] mt-0.5" style={{ color: '#94a3b8' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Products */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="px-3 py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-[10px] font-semibold" style={{ color: '#94a3b8' }}>RECENT PRODUCTS</span>
            </div>
            {products.map((p) => (
              <div key={p.sku} className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#f5f3ff' }}>
                  <Package size={9} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold truncate" style={{ color: '#334155' }}>{p.name}</div>
                  <div className="text-[9px]" style={{ color: '#94a3b8' }}>{p.sku}</div>
                </div>
                <MiniStatusBadge status={p.status} />
                <span className="text-[10px] font-bold tabular-nums ml-1" style={{ color: p.score >= 80 ? '#059669' : p.score >= 50 ? '#d97706' : '#dc2626' }}>{p.score}%</span>
              </div>
            ))}
          </div>

          {/* Quality bars */}
          <div className="p-2.5 rounded-xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="text-[10px] font-semibold mb-2" style={{ color: '#94a3b8' }}>CATALOG QUALITY</div>
            <div className="space-y-1.5">
              {[{ label: 'Electronics', score: 94 }, { label: 'Home & Living', score: 61 }, { label: 'Fashion', score: 38 }].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-[10px]">
                  <span style={{ color: '#94a3b8', minWidth: 72 }}>{item.label}</span>
                  <CompletenessBar score={item.score} size="sm" className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Showcase ───────────────────────────────────────────────────────────────

const AI_BEFORE = 'Good product. Works well. Customers like it. Fast shipping available.';
const AI_AFTER = 'Engineered for everyday excellence, these wireless earbuds deliver rich 40mm drivers, 30-hour total battery life, and active noise cancellation — all in a compact IPX5-rated design. Perfect for commuting, workouts, and focused work sessions.';

function AiShowcase() {
  const [showAfter, setShowAfter] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (showAfter) { setShowAfter(false); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    setShowAfter(true);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(139,92,246,0.08)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f5f3ff' }}>
            <Sparkles size={14} style={{ color: '#7c3aed' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>AI Content Assistant</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
            ⚗ Demo
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>Current Description</p>
          <div className="p-3 rounded-xl text-sm leading-relaxed" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
            {AI_BEFORE}
          </div>
        </div>

        <button
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          style={{
            background: showAfter ? '#f5f3ff' : '#7c3aed',
            color: showAfter ? '#7c3aed' : '#fff',
            border: showAfter ? '1px solid #ddd6fe' : 'none',
            boxShadow: !showAfter && !loading ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
          }}
          onClick={handleGenerate}
        >
          {loading ? (
            <><RefreshCw size={14} className="animate-spin" /> Generating…</>
          ) : showAfter ? (
            <><RefreshCw size={14} /> Reset Demo</>
          ) : (
            <><Sparkles size={14} /> Improve with AI</>
          )}
        </button>

        {showAfter && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#059669' }}>✦ AI Suggestion</p>
            <div className="p-3 rounded-xl text-sm leading-relaxed" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#374151' }}>
              {AI_AFTER}
            </div>
            <div className="flex gap-2 pt-1">
              <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}>
                <Check size={12} /> Apply
              </button>
              <button className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Package,    title: 'Centralized Catalog',       description: 'One searchable source of truth for all your products. Search, filter, and maintain with full audit history.', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: Sparkles,   title: 'AI Content Assistant',      description: 'Generate descriptions, titles, bullet points, and SEO metadata. Every suggestion needs your approval first.', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { icon: ShieldCheck,title: 'Data Quality Intelligence', description: 'Detect missing fields, incomplete descriptions, and invalid values. Fix issues in one click with clear severity scoring.', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: Copy,       title: 'Duplicate Detection',       description: 'Find near-identical products using similarity scoring. Review side-by-side and safely merge or dismiss candidates.', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { icon: Tag,        title: 'Categories & Attributes',   description: 'Define reusable schemas per category. Enforce required fields and keep structured, consistent data catalog-wide.', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { icon: Upload,     title: 'Publishing Readiness',      description: 'See which products are ready to publish. Push to WooCommerce in one click once quality thresholds are met.', color: '#dc2626', bg: '#fff5f5', border: '#fecaca' },
];

const HOW_STEPS = [
  { num: '01', title: 'Import Your Products', body: 'Bring in your catalog from CSV, API, or WooCommerce. Products are automatically scored for completeness.' },
  { num: '02', title: 'Identify & Fix Issues', body: 'The quality engine flags missing fields, short descriptions, and structural problems. Prioritize by severity.' },
  { num: '03', title: 'Enrich with AI', body: 'Run AI tasks on individual products or in bulk. Review every suggestion before it touches your data.' },
  { num: '04', title: 'Publish with Confidence', body: 'Products marked Ready are queued for publishing. Push to WooCommerce once your quality bar is met.' },
];

// ── Landing page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.95)' : '#fff',
          borderBottom: '1px solid #e2e8f0',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? '0 1px 8px rgba(15,23,42,0.08)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShelfLogo size={26} />
            <span className="text-sm font-bold" style={{ color: '#0f172a' }}>ProductShelf</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {['Features', 'AI Capabilities', 'How It Works'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm font-medium transition-colors hover:text-violet-600"
                style={{ color: '#64748b' }}>
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium transition-colors hover:text-violet-600"
              style={{ color: '#64748b' }} onClick={() => navigate('/app')}>
              Sign In
            </button>
            <button className="btn-primary text-xs" onClick={() => navigate('/app')}>
              Get Started <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden hero-grid" style={{ paddingTop: 80, paddingBottom: 80, background: '#fff' }}>
        {/* Glow */}
        <div className="absolute pointer-events-none" style={{
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)',
          top: -80, left: '50%', transform: 'translateX(-50%)',
        }} />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}>
                <Zap size={11} /> AI-First Product Information Management
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight" style={{ color: '#0f172a', letterSpacing: '-0.03em' }}>
                Your Product Data.{' '}
                <span className="gradient-text">Organized.</span>{' '}
                <span className="gradient-text">Optimized.</span>{' '}
                Ready to Grow.
              </h1>

              <p className="text-base leading-relaxed" style={{ color: '#64748b', maxWidth: 480 }}>
                One intelligent workspace to manage product information, improve catalog quality with AI, eliminate duplicates, and prepare every product for publishing.
              </p>

              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={() => navigate('/app')}>
                  Get Started Free <ArrowRight size={15} />
                </button>
                <a href="#features" className="btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }}>
                  Explore Features
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {['Centralized product catalog', 'AI-assisted content enrichment', 'Data quality scoring', 'Publishing readiness checks'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: '#ecfdf5' }}>
                      <Check size={9} style={{ color: '#059669' }} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="hidden lg:block">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Features ── */}
      <section id="features" className="py-20" style={{ background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}>
              <Star size={10} /> Features
            </div>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Everything your catalog needs
            </h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: '#64748b' }}>
              A complete PIM toolkit — from data import to publish-ready content — with AI at the core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, description, color, bg, border }) => (
              <div
                key={title}
                className="p-5 rounded-xl transition-all duration-200 group cursor-default"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = border;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(15,23,42,0.08)`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(15,23,42,0.04)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: '#0f172a' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── AI Showcase ── */}
      <section id="ai-capabilities" className="py-20" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{ background: '#ecfeff', border: '1px solid #a5f3fc', color: '#0891b2' }}>
                <Sparkles size={10} /> AI Capabilities
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                Your AI writes it.<br />
                <span className="gradient-text">You approve it.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#64748b' }}>
                Product Shelf uses an AI agent to generate descriptions, titles, bullet points, and SEO metadata.
                Every output is shown with a before/after comparison before you can apply it. No suggestion touches your data without explicit approval.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Improve Description', desc: 'Rewrites vague descriptions into compelling, benefit-driven copy.' },
                  { label: 'Generate Title', desc: 'Creates keyword-rich titles optimised for search.' },
                  { label: 'Create Bullet Points', desc: '5 scannable feature bullets addressing key buying objections.' },
                  { label: 'SEO Metadata', desc: 'Page title and meta description within character limits.' },
                  { label: 'Suggest Attributes', desc: 'Identifies structured attributes from product context.' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#8b5cf6' }} />
                    <div>
                      <span className="text-sm font-semibold" style={{ color: '#334155' }}>{label} </span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>— {desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div><AiShowcase /></div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20" style={{ background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#0f172a' }}>How It Works</h2>
            <p className="text-sm" style={{ color: '#64748b' }}>Four steps from raw data to published, polished products.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_STEPS.map(({ num, title, body }, i) => (
              <div key={num} className="relative p-5 rounded-xl" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-4 h-px z-10" style={{ background: '#ddd6fe' }} />
                )}
                <div className="text-2xl font-extrabold mb-3 gradient-text">{num}</div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: '#0f172a' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20" style={{ background: '#fff' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="rounded-2xl p-12" style={{
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%)',
            border: '1px solid #ddd6fe',
            boxShadow: '0 4px 32px rgba(139,92,246,0.1)',
          }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>
              <BarChart2 size={24} style={{ color: '#fff' }} />
            </div>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Every Product. One Smart Shelf.
            </h2>
            <p className="text-sm mb-8 mx-auto" style={{ color: '#64748b', maxWidth: 400 }}>
              Start managing your product catalog with AI-powered enrichment, quality scoring, and publishing-ready workflows.
            </p>
            <button className="btn-primary mx-auto" style={{ padding: '14px 32px', fontSize: 15 }} onClick={() => navigate('/app')}>
              Open ProductShelf <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '32px 24px', background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShelfLogo size={22} />
            <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>ProductShelf</span>
            <span className="text-xs ml-1" style={{ color: '#94a3b8' }}>Every Product. One Smart Shelf.</span>
          </div>
          <p className="text-xs" style={{ color: '#cbd5e1' }}>Built for the Kilowott AI Hackathon · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
