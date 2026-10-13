import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Sparkles, Check } from 'lucide-react';
import { ShelfLogo } from '../components/ui/Logo';
import { auth, ApiError } from '../services/api';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allRulesMet = PASSWORD_RULES.every((r) => r.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet) { setError('Password does not meet all requirements'); return; }
    setError('');
    setLoading(true);
    try {
      await auth.register({ name, email, password });
      navigate('/app', { replace: true });
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
              Start building your<br />smart product shelf.
            </h2>
            <p className="text-purple-200 text-sm leading-relaxed">
              Create your free workspace and start managing products with AI-powered enrichment today.
            </p>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="text-white text-sm font-semibold mb-1 flex items-center gap-2">
              <Sparkles size={13} /> Free during hackathon
            </p>
            <p className="text-purple-200 text-xs leading-relaxed">
              All features including AI enrichment, quality scoring, duplicate detection, and WooCommerce integration are fully available.
            </p>
          </div>
        </div>
        <p className="text-purple-300 text-xs">© {new Date().getFullYear()} ProductShelf · Kilowott Hackathon</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-7">
          <div className="lg:hidden flex items-center gap-2">
            <ShelfLogo size={24} />
            <span className="font-bold text-sm" style={{ color: '#0f172a' }}>ProductShelf</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>Create your account</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>Get started with ProductShelf for free</p>
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
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Email address</label>
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
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="input pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw((v) => !v)} tabIndex={-1} aria-label="Toggle password">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center`}
                          style={{ background: ok ? '#ecfdf5' : '#f1f5f9' }}>
                          <Check size={9} style={{ color: ok ? '#059669' : '#cbd5e1' }} />
                        </div>
                        <span style={{ color: ok ? '#059669' : '#94a3b8' }}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || !allRulesMet} className="btn-primary w-full justify-center py-3 text-sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={15} />
                  Create Account
                </span>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold" style={{ color: '#7c3aed' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
