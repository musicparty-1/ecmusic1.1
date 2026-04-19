import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../../api/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  // ── Forgot flow ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // ── Reset flow ───────────────────────────────────────────────────────────────
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setResetError('Las contraseñas no coinciden.');
      return;
    }
    if (newPass.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await api.post('/auth/reset-password', { token: tokenFromUrl, password: newPass });
      setResetDone(true);
    } catch {
      setResetError('Token inválido o expirado. Solicitá un nuevo enlace.');
    } finally {
      setResetLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    paddingLeft: '2.6rem', paddingRight: '1rem',
    paddingTop: '0.8rem', paddingBottom: '0.8rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem', color: 'white',
    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(124,58,237,0.1) 0%, transparent 70%)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}
      >
        {/* Volver */}
        <button
          type="button"
          onClick={() => navigate('/dj/login')}
          style={{
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.82rem', fontFamily: 'inherit', marginBottom: '2rem',
            padding: 0, transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          <ArrowLeft size={15} /> Volver al login
        </button>

        <div style={{
          background: '#0d1117',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(124,58,237,0.1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '2rem 2rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '0.875rem',
              background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            }}>
              {tokenFromUrl ? <Lock size={22} color="white" /> : <Mail size={22} color="white" />}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
              {tokenFromUrl ? 'Nueva contraseña' : 'Recuperar contraseña'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.4rem' }}>
              {tokenFromUrl
                ? 'Elegí una contraseña nueva para tu cuenta'
                : 'Ingresá tu email y te enviamos un enlace'}
            </p>
          </div>

          <div style={{ padding: '1.75rem 2rem 2rem' }}>
            <AnimatePresence mode="wait">

              {/* ── Reset de contraseña con token ── */}
              {tokenFromUrl && !resetDone && (
                <motion.form
                  key="reset-form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleReset}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Nueva contraseña
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{ ...inputStyle, paddingRight: '2.75rem' }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Confirmar contraseña
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={inputStyle}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {resetError && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: '0.7rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.65rem', color: '#f87171', fontSize: '0.82rem', textAlign: 'center' }}>
                      {resetError}
                    </motion.div>
                  )}

                  <motion.button type="submit" disabled={resetLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ width: '100%', padding: '0.95rem', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', border: 'none', borderRadius: '0.75rem', color: 'white', fontSize: '1rem', fontWeight: '700', cursor: resetLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: resetLoading ? 0.75 : 1, boxShadow: '0 4px 24px rgba(124,58,237,0.45)', fontFamily: 'inherit' }}>
                    {resetLoading ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando...</> : 'Guardar contraseña'}
                  </motion.button>
                </motion.form>
              )}

              {/* ── Reset exitoso ── */}
              {tokenFromUrl && resetDone && (
                <motion.div key="reset-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <CheckCircle size={52} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: 'white', marginBottom: '0.5rem' }}>¡Contraseña actualizada!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Ya podés ingresar con tu nueva contraseña.</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/dj/login')}
                    style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', border: 'none', borderRadius: '0.75rem', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Ir al login
                  </motion.button>
                </motion.div>
              )}

              {/* ── Formulario envío de email ── */}
              {!tokenFromUrl && !sent && (
                <motion.form
                  key="forgot-form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleForgot}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
                >
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        autoFocus
                        required
                        style={inputStyle}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: '0.7rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.65rem', color: '#f87171', fontSize: '0.82rem', textAlign: 'center' }}>
                      {error}
                    </motion.div>
                  )}

                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ width: '100%', padding: '0.95rem', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', border: 'none', borderRadius: '0.75rem', color: 'white', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.75 : 1, boxShadow: '0 4px 24px rgba(124,58,237,0.45)', fontFamily: 'inherit' }}>
                    {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</> : 'Enviar instrucciones'}
                  </motion.button>
                </motion.form>
              )}

              {/* ── Email enviado ── */}
              {!tokenFromUrl && sent && (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <CheckCircle size={52} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: 'white', marginBottom: '0.5rem' }}>¡Revisá tu email!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Si existe una cuenta con <span style={{ color: '#a78bfa' }}>{email}</span>, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                  </p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/dj/login')}
                    style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#94a3b8', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Volver al login
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: #4b5563 !important; }`}</style>
    </div>
  );
};

export default ForgotPassword;
