import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DJHome from './pages/dj/DJHome';
import DJDashboard from './pages/dj/DJDashboard';
import DJLogin from './pages/dj/DJLogin';
import DJRegister from './pages/dj/DJRegister';
import EventSummary from './pages/dj/EventSummary';
import EventAnalytics from './pages/dj/EventAnalytics';
import BillingPage from './pages/dj/Billing';
import PublicVote from './pages/public/PublicVote';
import MirrorMode from './pages/public/MirrorMode';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Rutas Públicas */}
        <Route path="/event/:id" element={<PublicVote />} />
        <Route path="/mirror/:id" element={<MirrorMode />} />

        {/* Rutas de Auth (sin guard) */}
        <Route path="/dj/login" element={<DJLogin />} />
        <Route path="/dj/register" element={<DJRegister />} />

        {/* Rutas del DJ — protegidas */}
        <Route path="/dj/home" element={<ProtectedRoute><DJHome /></ProtectedRoute>} />
        <Route path="/dj/dashboard" element={<ProtectedRoute><DJDashboard /></ProtectedRoute>} />
        <Route path="/dj/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
        <Route path="/dj/events/:id/summary" element={<ProtectedRoute><EventSummary /></ProtectedRoute>} />
        <Route path="/dj/events/:id/analytics" element={<ProtectedRoute><EventAnalytics /></ProtectedRoute>} />

        {/* Redirección /dj → /dj/home */}
        <Route path="/dj" element={<Navigate to="/dj/home" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

