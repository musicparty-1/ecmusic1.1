import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../../api/api';
import { Lock, Mail, Loader2, Zap, Music2, QrCode, BarChart2, Eye, EyeOff, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: <Music2 size={18} color="#a78bfa" />,
    title: 'Cola en tiempo real',
    desc: 'El público vota las canciones y vos ves la cola actualizada al instante.',
  },
  {
    icon: <QrCode size={18} color="#a78bfa" />,
    title: 'Votación por QR',
    desc: 'Compartí un código QR y tu público vota desde el celular, sin app.',
  },
  {
    icon: <BarChart2 size={18} color="#a78bfa" />,
    title: 'Estadísticas del set',
    desc: 'Al cerrar el evento, obtenés el resumen completo con votos y canciones sonadas.',
  },
];

const DJLogin = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await auth.login(email, pass);
      localStorage.setItem('dj_user', JSON.stringify({
        ...response.data.user,
        access_token: response.data.access_token,
      }));
      navigate('/dj/home');
    } catch {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* Background glow */}
      <div className="login-bg-glow" />

      {/* ── LEFT PANEL (Branding) ──────────────────────────── */}
      <div className="login-panel-left">
        <div>
          {/* Logo */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '1rem',
              background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.25rem',
              boxShadow: '0 0 28px rgba(124,58,237,0.4)',
            }}>
              <Zap size={28} color="white" fill="white" />
            </div>
            <h1 style={{
              fontSize: '2rem', fontWeight: '800', margin: 0,
              letterSpacing: '-0.03em', lineHeight: 1.1,
            }}>
              <span style={{ color: 'white' }}>Music</span>
              <span style={{ color: '#8b5cf6' }}>Party</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              La consola del DJ moderno
            </p>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.09 }}
                style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '0.65rem', flexShrink: 0,
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.2rem', color: 'white' }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#64748b', lineHeight: 1.55 }}>
                    {f.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: '1.25rem' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.14em', color: '#374151', textTransform: 'uppercase' }}>
            Para DJs profesionales
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ─────────────────────────── */}
      <div className="login-panel-right">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            {/* Mobile logo — only visible on small screens */}
            <div className="login-mobile-logo">
              <div style={{
                width: 44, height: 44, borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              }}>
                <Zap size={22} color="white" fill="white" />
              </div>
              <span style={{ fontWeight: '800', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
                Music<span style={{ color: '#8b5cf6' }}>Party</span>
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
              Bienvenido de vuelta
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.4rem' }}>
              Ingresá para acceder a tu consola DJ
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', marginBottom: '2rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.75rem', padding: '0.3rem', gap: '0.25rem',
          }}>
            <div style={{
              flex: 1, textAlign: 'center', padding: '0.55rem',
              borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
              color: 'white', cursor: 'default',
              boxShadow: '0 2px 10px rgba(124,58,237,0.4)',
            }}>
              Iniciar sesión
            </div>
            <button
              type="button"
              onClick={() => navigate('/dj/register')}
              style={{
                flex: 1, textAlign: 'center', padding: '0.55rem',
                borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem',
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block', marginBottom: '0.45rem',
                  fontSize: '0.68rem', fontWeight: '700',
                  letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase',
                }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: '2.6rem', paddingRight: '1rem',
                    paddingTop: '0.8rem', paddingBottom: '0.8rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem', color: 'white',
                    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block', marginBottom: '0.45rem',
                  fontSize: '0.68rem', fontWeight: '700',
                  letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase',
                }}
              >
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: '2.6rem', paddingRight: '2.75rem',
                    paddingTop: '0.8rem', paddingBottom: '0.8rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem', color: 'white',
                    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer',
                    padding: '0.2rem', display: 'flex', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                style={{
                  padding: '0.7rem 1rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '0.65rem',
                  color: '#f87171', fontSize: '0.82rem', textAlign: 'center',
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: '-0.4rem' }}>
              <button
                type="button"
                onClick={() => navigate('/dj/forgot-password')}
                style={{
                  background: 'none', border: 'none', color: '#64748b',
                  fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
                  padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '0.95rem',
                background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                border: 'none', borderRadius: '0.75rem',
                color: 'white', fontSize: '1rem', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                opacity: loading ? 0.75 : 1,
                boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
                marginTop: '0.25rem',
              }}
            >
              {loading
                ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Iniciando...</>
                : <>Ingresar a la consola <ArrowRight size={17} /></>
              }
            </motion.button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.72rem', color: '#374151' }}>
            Powered by <span style={{ color: '#a78bfa', fontWeight: '700' }}>MusicParty</span>
            {' · '}
            <button type="button" onClick={() => navigate('/terms')}
              style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')} onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
              Términos de uso
            </button>
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-root {
          min-height: 100vh;
          display: flex;
          background: #000000;
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }
        .login-bg-glow {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 60% 50% at 15% 50%, rgba(124,58,237,0.12) 0%, transparent 70%);
        }
        .login-panel-left {
          width: 420px;
          flex-shrink: 0;
          background: #090c14;
          border-right: 1px solid rgba(255,255,255,0.06);
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        .login-panel-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          z-index: 1;
          overflow-y: auto;
        }
        .login-mobile-logo {
          display: none;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        input::placeholder { color: #4b5563 !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #000 inset !important;
          -webkit-text-fill-color: white !important;
        }
        @media (max-width: 768px) {
          .login-panel-left { display: none !important; }
          .login-mobile-logo { display: flex !important; }
          .login-panel-right { padding: 1.5rem 1.25rem; align-items: flex-start; padding-top: 2.5rem; }
        }
      `}</style>
    </div>
  );
};

export default DJLogin;
