import { lazy, Suspense, Component } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import './index.css';

const DJHome        = lazy(() => import('./pages/dj/DJHome'));
const DJDashboard   = lazy(() => import('./pages/dj/DJDashboard'));
const DJLogin       = lazy(() => import('./pages/dj/DJLogin'));
const DJRegister      = lazy(() => import('./pages/dj/DJRegister'));
const ForgotPassword  = lazy(() => import('./pages/dj/ForgotPassword'));
const EventSummary  = lazy(() => import('./pages/dj/EventSummary'));
const EventAnalytics = lazy(() => import('./pages/dj/EventAnalytics'));
const BillingPage   = lazy(() => import('./pages/dj/Billing'));
const PublicVote    = lazy(() => import('./pages/public/PublicVote'));
const MirrorMode    = lazy(() => import('./pages/public/MirrorMode'));
const FlyerPage     = lazy(() => import('./pages/public/FlyerPage'));
const Landing       = lazy(() => import('./pages/Landing'));
const NotFound      = lazy(() => import('./pages/NotFound'));
const TermsPage     = lazy(() => import('./pages/TermsPage'));
const HelpPage      = lazy(() => import('./pages/dj/HelpPage'));

// Top-level error boundary
class AppErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'monospace', padding: '2rem', gap: '1rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>Error de aplicación</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', maxWidth: 500, textAlign: 'center' }}>{this.state.error}</div>
          <button onClick={() => window.location.reload()} style={{ padding: '0.6rem 1.4rem', background: '#7c3aed', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', fontWeight: '700' }}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Loader = () => (
  <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function AnimatedRoutes() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Landing />} />
      {/* Rutas Públicas */}
      <Route path="/event/:id" element={<PublicVote />} />
      <Route path="/mirror/:id" element={<MirrorMode />} />
      <Route path="/flyer/:id" element={<FlyerPage />} />
      {/* Admin — login propio (no usa ProtectedRoute del DJ) */}
      <Route path="/admin" element={<AdminDashboard />} />
      {/* Auth */}
      <Route path="/dj/login" element={<DJLogin />} />
      <Route path="/dj/register" element={<DJRegister />} />
      <Route path="/dj/forgot-password" element={<ForgotPassword />} />
      {/* DJ — protegidas */}
      <Route path="/dj/home" element={<ProtectedRoute><DJHome /></ProtectedRoute>} />
      <Route path="/dj/dashboard" element={<ProtectedRoute><DJDashboard /></ProtectedRoute>} />
      <Route path="/dj/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/dj/events/:id/summary" element={<ProtectedRoute><EventSummary /></ProtectedRoute>} />
      <Route path="/dj/events/:id/analytics" element={<ProtectedRoute><EventAnalytics /></ProtectedRoute>} />
      <Route path="/dj" element={<Navigate to="/dj/home" replace />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/dj/help" element={<HelpPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <Router>
        <Suspense fallback={<Loader />}>
          <AnimatedRoutes />
        </Suspense>
      </Router>
    </AppErrorBoundary>
  );
}

export default App;
