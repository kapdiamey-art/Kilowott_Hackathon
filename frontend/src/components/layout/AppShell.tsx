import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppToaster } from '../ui/Toast';
import { Bell, Search, Plus, LogOut, Moon, Sun, Languages } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLang, type Lang } from '../../contexts/LanguageContext';
import { toast } from '../ui/Toast';

const pageTitleKeys: Record<string, string> = {
  '/app': 'nav_dashboard',
  '/app/products': 'nav_products',
  '/app/ai-assistant': 'nav_ai_assistant',
  '/app/quality': 'nav_quality',
  '/app/duplicates': 'nav_duplicates',
  '/app/categories': 'nav_categories',
  '/app/publishing': 'nav_publishing',
  '/app/activity': 'nav_activity',
  '/app/settings': 'nav_settings',
};

const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { value: 'mr', label: 'मराठी', flag: '🟠' },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();

  const isDark = theme === 'dark';

  const titleKey = Object.entries(pageTitleKeys)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => location.pathname.startsWith(path))?.[1] ?? 'nav_dashboard';

  const handleLogout = async () => {
    await logout();
    toast.success(t('sign_out'));
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const headerBg = isDark ? '#1e293b' : '#ffffff';
  const headerBorder = isDark ? '#334155' : '#e2e8f0';
  const titleColor = isDark ? '#f1f5f9' : '#0f172a';
  const searchBg = isDark ? '#1e293b' : '#f8fafc';
  const searchBorder = isDark ? '#334155' : '#e2e8f0';
  const searchColor = isDark ? '#94a3b8' : '#94a3b8';
  const menuBg = isDark ? '#1e293b' : '#ffffff';
  const menuBorder = isDark ? '#334155' : '#e2e8f0';
  const menuText = isDark ? '#f1f5f9' : '#0f172a';
  const menuSubText = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: bg }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between h-12 px-5 shrink-0"
          style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold" style={{ color: titleColor }}>{t(titleKey)}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick search */}
            <button
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ background: searchBg, border: `1px solid ${searchBorder}`, color: searchColor }}
              onClick={() => navigate('/app/products')}
            >
              <Search size={12} />
              {t('search_placeholder')}
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: headerBorder, color: searchColor }}>⌘K</span>
            </button>

            <button className="btn-primary text-xs py-1.5 px-3" onClick={() => navigate('/app/products/new')}>
              <Plus size={12} /> {t('btn_add_product')}
            </button>

            {/* Dark/Light toggle */}
            <button
              className="btn-ghost p-2 rounded-lg transition-colors"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ color: isDark ? '#fbbf24' : '#64748b' }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Language switcher */}
            <div className="relative">
              <button
                className="btn-ghost p-2 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors"
                onClick={() => setShowLangMenu((v) => !v)}
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                title="Change language"
              >
                <Languages size={14} />
                <span className="hidden sm:inline">{LANGS.find((l) => l.value === lang)?.flag}</span>
              </button>

              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
                  <div
                    className="absolute right-0 top-9 z-20 w-36 rounded-xl shadow-lg overflow-hidden"
                    style={{ background: menuBg, border: `1px solid ${menuBorder}` }}
                  >
                    {LANGS.map(({ value, label, flag }) => (
                      <button
                        key={value}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium transition-colors text-left"
                        style={{
                          color: lang === value ? '#7c3aed' : menuText,
                          background: lang === value ? (isDark ? '#2d1b69' : '#f5f3ff') : 'transparent',
                        }}
                        onClick={() => { setLang(value); setShowLangMenu(false); }}
                      >
                        <span>{flag}</span> {label}
                        {lang === value && <span className="ml-auto text-violet-500">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="btn-ghost p-2" aria-label="Notifications" style={{ color: isDark ? '#94a3b8' : '#94a3b8' }}>
              <Bell size={14} />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer select-none"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', color: '#fff' }}
                title={user?.name ?? 'Profile'}
                onClick={() => setShowUserMenu((v) => !v)}
              >
                {initials}
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div
                    className="absolute right-0 top-9 z-20 w-52 rounded-xl shadow-lg overflow-hidden"
                    style={{ background: menuBg, border: `1px solid ${menuBorder}` }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: menuBorder }}>
                      <p className="text-sm font-semibold truncate" style={{ color: menuText }}>{user?.name}</p>
                      <p className="text-xs truncate" style={{ color: menuSubText }}>{user?.email}</p>
                      <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium capitalize">
                        {user?.role}
                      </span>
                    </div>
                    <button
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 transition-colors"
                      style={{ background: 'transparent' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = isDark ? '#2d1a1a' : '#fff5f5')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={handleLogout}
                    >
                      <LogOut size={14} /> {t('sign_out')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: bg }}>
          <Outlet />
        </main>
      </div>

      <AppToaster />
    </div>
  );
}
