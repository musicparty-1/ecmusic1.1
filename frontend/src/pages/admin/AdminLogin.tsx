import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react';

// Credenciales hardcodeadas — solo para uso interno
const ADMIN_USERS: Record<string, { password: string; displayName: string; avatar: string }> = {
  enzul: {
    password: 'musicparty2024',
    displayName: 'Enzo',
    avatar: '🎧',
  },
  diego: {
    password: 'djdiego2024',
    displayName: 'Diego',
    avatar: '🎛️',
  },
  ecmusic: {
    password: 'ec123456',
    displayName: 'Master Admin',
    avatar: '🛡️',
  },
};

const SESSION_KEY = 'mp_admin_session';

export function getAdminSession(): { username: string; displayName: string; avatar: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

interface Props {
  onLogin: (session: { username: string; displayName: string; avatar: string }) => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simular delay de auth
    await new Promise(r => setTimeout(r, 600));

    const user = ADMIN_USERS[username.toLowerCase().trim()];
    if (user && user.password === password) {
      const session = { username: username.toLowerCase().trim(), displayName: user.displayName, avatar: user.avatar };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      onLogin(session);
    } else {
      setError('Usuario o contraseña incorrectos');
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'radial-gradient(ellipse at 30% 20%, #0d0520 0%, #020614 50%, #000 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(#7c3aed33, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-5%', left: '-10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(#ec489922, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(8, 5, 20, 0.85)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '1.75rem',
          padding: '2.5rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(139,92,246,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top shine */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 70, height: 70, borderRadius: '1.2rem',
            margin: '0 auto 1rem',
            boxShadow: '0 0 30px rgba(139,92,246,0.4)',
            overflow: 'hidden'
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Zap size={14} color="#8b5cf6" fill="#8b5cf6" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.15em', color: '#8b5cf6', textTransform: 'uppercase' }}>
              Panel Admin
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.03em', color: 'white', margin: 0 }}>
            EC <span style={{ color: '#8b5cf6' }}>Music</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: '0.4rem' }}>
            Acceso restringido — Solo staff autorizado
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              Usuario
            </label>
            <input
              type="text"
              id="admin-username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="enzul / diego"
              autoComplete="username"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '0.75rem',
                padding: '0.8rem 1rem',
                color: 'white', fontSize: '0.95rem',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                id="admin-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '0.75rem',
                  padding: '0.8rem 2.8rem 0.8rem 1rem',
                  color: 'white', fontSize: '0.95rem',
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                  display: 'flex', padding: '0.25rem',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.6rem', padding: '0.7rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              <Lock size={14} color="#ef4444" />
              <span style={{ color: '#ef4444', fontSize: '0.82rem' }}>{error}</span>
            </motion.div>
          )}

          {/* Submit */}
          <button
            id="admin-login-btn"
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              height: 52,
              borderRadius: '0.9rem',
              background: loading
                ? 'rgba(139,92,246,0.3)'
                : 'linear-gradient(135deg, #6d28d9, #8b5cf6, #a855f7)',
              border: 'none',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '800',
              letterSpacing: '-0.01em',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                Verificando...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Ingresar al panel
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: '0.7rem', marginTop: '1.5rem' }}>
          Acceso solo para Enzo & Diego · EC Music Staff
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
