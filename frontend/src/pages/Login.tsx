import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, LogIn } from 'lucide-react';
import { ShelfLogo } from '../components/ui/Logo';
import { ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not reach server. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12"
        style={{ background: 'linear-gradient(160deg, #7c3aed 0%, #5b21b6 60%, #1e1b4b 100%)' }}>
        <div className="flex items-center gap-2.5">
          <ShelfLogo size={32} light />
          <span className="text-white font-bold text-base">ProductShelf</span>
        </div>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Every Product.<br />One Smart Shelf.
            </h2>
            <p className="text-purple-200 text-sm leading-relaxed">
              Manage your entire product catalog, improve content with AI, and publish with confidence — all from one workspace.
            </p>
          </div>
          <div className="space-y-3">
            {[
              'AI-powered content enrichment',
              'Real-time data quality scoring',
              'WooCommerce publishing integration',
              'Duplicate detection & management',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-purple-100">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Sparkles size={10} className="text-white" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-purple-300 text-xs">© {new Date().getFullYear()} ProductShelf · Kilowott Hackathon</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <ShelfLogo size={24} />
            <span className="font-bold text-sm" style={{ color: '#0f172a' }}>ProductShelf</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>Welcome back</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>Sign in to your ProductShelf workspace</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
              style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={15} />
                  Sign In
                </span>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold" style={{ color: '#7c3aed' }}>
                Create one
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="rounded-xl p-4 text-xs" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
            <p className="font-semibold mb-1" style={{ color: '#6d28d9' }}>Demo credentials</p>
            <p style={{ color: '#7c3aed' }}>Email: <code>admin@productshelf.local</code></p>
            <p style={{ color: '#7c3aed' }}>Password: from <code>ADMIN_PASSWORD</code> in <code>backend/.env</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
