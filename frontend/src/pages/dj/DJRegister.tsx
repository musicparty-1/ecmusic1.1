import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../../api/api';
import {
  Lock, Mail, User, CheckCircle2, Loader2,
  AlertCircle, Zap, Music, QrCode, BarChart2, Eye, EyeOff, ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Music size={18} color="#a78bfa" />,
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

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  paddingTop: '0.75rem', paddingBottom: '0.75rem',
  paddingLeft: '2.5rem', paddingRight: '1rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.75rem', color: 'white',
  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.45rem',
  fontSize: '0.68rem', fontWeight: '700',
  letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase',
};

const DJRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const passLengthOk = pass.length === 0 || pass.length >= 6;
  const passMatch = pass2.length === 0 || pass === pass2;
  const passMatchFinal = pass.length > 0 && pass2.length > 0 && pass === pass2;
  const canSubmit = !!email && !!pass && passLengthOk && passMatch && passMatchFinal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass !== pass2) { setError('Las contraseñas no coinciden'); return; }
    if (pass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await auth.register(email, pass, name);
      localStorage.setItem('dj_user', JSON.stringify({
        ...response.data.user,
        access_token: response.data.access_token,
      }));
      navigate('/dj/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse. Intentalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)');
  const blurBorder = (e: React.FocusEvent<HTMLInputElement>, override?: string) =>
    (e.currentTarget.style.borderColor = override || 'rgba(255,255,255,0.1)');

  return (
    <div className="reg-root">

      {/* ── PANEL IZQUIERDO ─────────────────────────── */}
      <div className="reg-panel-left">
        <div>
          <div style={{ marginBottom: '2.5rem' }}>
            <img src="/logo.png" alt="EC Music" style={{
              width: 56, height: 56, borderRadius: '1rem',
              marginBottom: '1.25rem', objectFit: 'cover',
              boxShadow: '0 0 24px rgba(139,92,246,0.35)',
            }} />
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em', color: 'white' }}>
              EC Music
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              La consola del DJ moderno
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '0.6rem', flexShrink: 0,
                  background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.2rem', color: 'white' }}>{f.title}</div>
                  <div style={{ fontSize: '0.77rem', color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trial badge (Oculto temporalmente)
          <div style={{
            marginTop: '2rem', padding: '0.9rem 1rem', borderRadius: '0.75rem',
            background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
          }}>
            <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#fbbf24', marginBottom: '0.5rem' }}>
              30 días de prueba gratis
            </div>
            {['Hasta 3 eventos y 50 votos c/u', 'MirrorMode + QR incluido', 'Sin tarjeta de crédito'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>
                <CheckCircle2 size={12} style={{ color: '#fbbf24', flexShrink: 0 }} /> {item}
              </div>
            ))}
          </div>
          */}
        </div>

        <div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: '1.25rem' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.14em', color: '#374151', textTransform: 'uppercase' }}>
            Para DJs profesionales
          </span>
        </div>
      </div>

      {/* ── PANEL DERECHO ───────────────────────────── */}
      <div className="reg-panel-right">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          <div style={{ marginBottom: '2rem' }}>
            {/* Mobile logo */}
            <div className="reg-mobile-logo">
              <img src="/logo.png" alt="EC Music" style={{
                width: 44, height: 44, borderRadius: '0.75rem',
                objectFit: 'cover',
                boxShadow: '0 0 20px rgba(139,92,246,0.4)',
              }} />
              <span style={{ fontWeight: '800', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
                EC <span style={{ color: '#8b5cf6' }}>Music</span>
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
              Creá tu cuenta
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Registrate para comenzar a usar la plataforma
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', marginBottom: '2rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.75rem', padding: '0.3rem', gap: '0.25rem',
          }}>
            <button type="button" onClick={() => navigate('/dj/login')}
              style={{
                flex: 1, textAlign: 'center', padding: '0.55rem',
                borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.85rem',
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >
              Iniciar sesión
            </button>
            <div style={{
              flex: 1, textAlign: 'center', padding: '0.55rem',
              borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              color: 'white', boxShadow: '0 2px 8px rgba(139,92,246,0.35)',
            }}>
              Registrarse
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Nombre */}
            <div>
              <label htmlFor="reg-name" style={labelStyle}>Nombre artístico</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                <input id="reg-name" type="text" placeholder="DJ Nombre" value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={focusBorder} onBlur={blurBorder} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                <input id="reg-email" type="email" placeholder="dj@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  style={inputStyle}
                  onFocus={focusBorder} onBlur={blurBorder} />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="reg-pass" style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                <input id="reg-pass" type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={pass}
                  onChange={e => setPass(e.target.value)} required
                  style={{ ...inputStyle, paddingRight: '2.75rem', borderColor: pass.length > 0 && !passLengthOk ? 'rgba(239,68,68,0.5)' : undefined }}
                  onFocus={focusBorder}
                  onBlur={e => blurBorder(e, pass.length > 0 && !passLengthOk ? 'rgba(239,68,68,0.5)' : undefined)} />
                <button type="button" aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPass ? 'Ocultar' : 'Mostrar'} onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pass.length > 0 && !passLengthOk && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.72rem', color: '#f87171' }}>
                  <AlertCircle size={12} /> Mínimo 6 caracteres
                </div>
              )}
            </div>

            {/* Repetir contraseña */}
            <div>
              <label htmlFor="reg-pass2" style={labelStyle}>Repetir contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                <input id="reg-pass2" type={showPass2 ? 'text' : 'password'} placeholder="Repetir contraseña" value={pass2}
                  onChange={e => setPass2(e.target.value)} required
                  style={{
                    ...inputStyle, paddingRight: '2.75rem',
                    borderColor: pass2.length > 0 && !passMatch ? 'rgba(239,68,68,0.5)' : passMatchFinal ? 'rgba(16,185,129,0.5)' : undefined,
                  }}
                  onFocus={focusBorder}
                  onBlur={e => blurBorder(e, pass2.length > 0 && !passMatch ? 'rgba(239,68,68,0.5)' : passMatchFinal ? 'rgba(16,185,129,0.5)' : undefined)} />
                <button type="button" aria-label={showPass2 ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPass2 ? 'Ocultar' : 'Mostrar'} onClick={() => setShowPass2(!showPass2)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                  {showPass2 ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {passMatchFinal && (
                  <CheckCircle2 size={15} style={{ position: 'absolute', right: '36px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', pointerEvents: 'none' }} />
                )}
              </div>
              {pass2.length > 0 && !passMatch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.72rem', color: '#f87171' }}>
                  <AlertCircle size={12} /> Las contraseñas no coinciden
                </div>
              )}
            </div>

            {/* Error global */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                role="alert"
                style={{ padding: '0.65rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.65rem', color: '#f87171', fontSize: '0.82rem', textAlign: 'center' }}>
                {error}
              </motion.div>
            )}

            {/* Botón */}
            <motion.button type="submit" disabled={loading || !canSubmit}
              whileHover={{ scale: loading || !canSubmit ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '0.9rem',
                background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                border: 'none', borderRadius: '0.75rem',
                color: 'white', fontSize: '1rem', fontWeight: '700',
                cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                opacity: loading || !canSubmit ? 0.6 : 1,
                boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                fontFamily: 'inherit', marginTop: '0.25rem',
              }}>
              {loading
                ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Creando cuenta...</>
                : <>Crear cuenta <ArrowRight size={17} /></>}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.72rem', color: '#475569' }}>
            Powered by <span style={{ color: '#8b5cf6', fontWeight: '700' }}>EC Music</span>
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4b5563 !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0d1117 inset !important;
          -webkit-text-fill-color: white !important;
        }
        .reg-root { min-height: 100vh; display: flex; background: #000; font-family: inherit; }
        .reg-panel-left {
          width: 420px; flex-shrink: 0;
          background: #090c14;
          border-right: 1px solid rgba(255,255,255,0.06);
          padding: 3rem 2.5rem;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .reg-panel-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 2rem; overflow-y: auto;
        }
        .reg-mobile-logo { display: none; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        @media (max-width: 768px) {
          .reg-panel-left { display: none !important; }
          .reg-mobile-logo { display: flex !important; }
          .reg-panel-right { padding: 1.5rem 1.25rem; align-items: flex-start; padding-top: 2.5rem; }
        }
      `}</style>
    </div>
  );
};

export default DJRegister;
