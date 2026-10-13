import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { AppShell } from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductEditor from './pages/ProductEditor';
import AiAssistant from './pages/AiAssistant';
import DataQuality from './pages/DataQuality';
import Duplicates from './pages/Duplicates';
import Categories from './pages/Categories';
import Publishing from './pages/Publishing';
import ActivityLog from './pages/ActivityLog';
import SettingsPage from './pages/Settings';

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, fontFamily: 'Inter, sans-serif', background: '#f8fafc',
        }}>
          <div style={{ fontSize: 36 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Something went wrong</h2>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 400, textAlign: 'center' }}>
            {(this.state.error as Error).message}
          </p>
          <button
            style={{
              marginTop: 8, padding: '8px 20px', borderRadius: 8, background: '#7c3aed',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
            onClick={() => { this.setState({ error: null }); window.location.href = '/app'; }}
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route element={<RequireAuth />}>
                  <Route element={<AppShell />}>
                    <Route path="/app" element={<Dashboard />} />
                    <Route path="/app/products" element={<Products />} />
                    <Route path="/app/products/new" element={<ProductEditor />} />
                    <Route path="/app/products/:id" element={<ProductEditor />} />
                    <Route path="/app/ai-assistant" element={<AiAssistant />} />
                    <Route path="/app/quality" element={<DataQuality />} />
                    <Route path="/app/duplicates" element={<Duplicates />} />
                    <Route path="/app/categories" element={<Categories />} />
                    <Route path="/app/publishing" element={<Publishing />} />
                    <Route path="/app/activity" element={<ActivityLog />} />
                    <Route path="/app/settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
