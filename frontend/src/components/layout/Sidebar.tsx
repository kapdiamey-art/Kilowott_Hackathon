import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Sparkles, ShieldCheck, Copy,
  Tag, Upload, Clock, Settings, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { ShelfLogo } from '../ui/Logo';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useLang } from '../../contexts/LanguageContext';

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

const navItems = [
  { to: '/app', icon: LayoutDashboard, key: 'nav_dashboard', end: true },
  { to: '/app/products', icon: Package, key: 'nav_products', end: false },
  { to: '/app/ai-assistant', icon: Sparkles, key: 'nav_ai_assistant', end: false },
  { to: '/app/quality', icon: ShieldCheck, key: 'nav_quality', end: false },
  { to: '/app/duplicates', icon: Copy, key: 'nav_duplicates', end: false },
  { to: '/app/categories', icon: Tag, key: 'nav_categories', end: false },
  { to: '/app/publishing', icon: Upload, key: 'nav_publishing', end: false },
  { to: '/app/activity', icon: Clock, key: 'nav_activity', end: false },
  { to: '/app/settings', icon: Settings, key: 'nav_settings', end: false },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  const bg = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const subBorder = isDark ? '#1e293b' : '#f1f5f9';
  const logoText = isDark ? '#f1f5f9' : '#0f172a';
  const inactiveText = isDark ? '#94a3b8' : '#64748b';
  const inactiveHoverBg = isDark ? '#334155' : '#f8fafc';
  const inactiveHoverText = isDark ? '#e2e8f0' : '#1e293b';
  const activeBg = isDark ? '#2d1b69' : '#f5f3ff';
  const activeText = isDark ? '#c4b5fd' : '#7c3aed';
  const aiBg = isDark ? '#2d1b69' : '#f5f3ff';
  const aiBorder = isDark ? '#4c1d95' : '#ddd6fe';
  const aiText = isDark ? '#c4b5fd' : '#6d28d9';
  const toggleBorder = isDark ? '#334155' : '#f1f5f9';
  const toggleText = isDark ? '#64748b' : '#94a3b8';

  return (
    <aside
      className={cn('flex flex-col h-full shrink-0 transition-all duration-300', collapsed ? 'w-14' : 'w-56')}
      style={{ background: bg, borderRight: `1px solid ${border}` }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-3 py-4 cursor-pointer select-none"
        style={{ borderBottom: `1px solid ${subBorder}` }}
        onClick={() => navigate('/')}
        title="Back to home"
      >
        <ShelfLogo size={28} />
        {!collapsed && (
          <div>
            <span className="text-sm font-bold leading-none block" style={{ color: logoText }}>ProductShelf</span>
            <span className="text-[10px] leading-none font-semibold" style={{ color: '#7c3aed' }}>AI-First PIM</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, key, end }) => {
          const label = t(key);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-100',
                  collapsed && 'justify-center',
                  isActive ? '' : '',
                )
              }
              style={({ isActive }) => ({
                background: isActive ? activeBg : 'transparent',
                color: isActive ? activeText : inactiveText,
                borderLeft: isActive && !collapsed ? '2px solid #8b5cf6' : '2px solid transparent',
              })}
              onMouseOver={(e) => {
                const el = e.currentTarget;
                if (!el.getAttribute('aria-current')) {
                  el.style.background = inactiveHoverBg;
                  el.style.color = inactiveHoverText;
                }
              }}
              onMouseOut={(e) => {
                const el = e.currentTarget;
                if (!el.getAttribute('aria-current')) {
                  el.style.background = 'transparent';
                  el.style.color = inactiveText;
                }
              }}
            >
              <Icon size={15} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* AI badge */}
      {!collapsed && (
        <div className="mx-2 mb-3 p-3 rounded-xl" style={{ background: aiBg, border: `1px solid ${aiBorder}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={11} style={{ color: aiText }} />
            <span className="text-xs font-semibold" style={{ color: aiText }}>AI Agent</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
          </div>
          <p className="text-[11px] leading-tight" style={{ color: aiText, opacity: 0.7 }}>Gemini AI active</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 transition-colors"
        style={{ borderTop: `1px solid ${toggleBorder}`, color: toggleText }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </aside>
  );
}
