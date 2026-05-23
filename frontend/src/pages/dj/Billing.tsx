import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { billing } from '../../api/api';
import {
  Check, Zap, Crown, Building2, ArrowLeft, Loader2, ShieldCheck,
  Ticket, Package, PackageOpen, RefreshCw,
} from 'lucide-react';

interface BillingStatus {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  daysLeft: number;
  eventCredits: number;
  limits: {
    maxEvents: number | null;
    maxVotesPerEvent: number | null;
    analytics: boolean;
    export: boolean;
    preEvent: boolean;
    duplicate: boolean;
  };
  usage: { eventsThisMonth: number };
}

// ── Planes de membresía ──────────────────────────────────────────────────────
const MEMBERSHIP_PLANS = [
  {
    key: 'STARTER',
    name: 'Starter',
    price: 11999,
    icon: Zap,
    color: '#8b5cf6',
    rgb: '139,92,246',
    description: 'Para DJs que arrancan a crecer',
    features: [
      '10 eventos por mes',
      '200 votos por evento',
      'Analytics básico',
      'Export de playlist',
      'Pre-evento (setlist anticipado)',
      'Duplicar eventos',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 23999,
    icon: Crown,
    color: '#ec4899',
    rgb: '236,72,153',
    description: 'Para residencias y eventos frecuentes',
    popular: true,
    features: [
      'Eventos ilimitados',
      'Votos ilimitados',
      'Analytics completo',
      'Export de playlist',
      'Pre-evento (setlist anticipado)',
      'Duplicar eventos',
      'MirrorMode HD',
    ],
  },
  {
    key: 'AGENCY',
    name: 'Agency',
    price: 47999,
    icon: Building2,
    color: '#f59e0b',
    rgb: '245,158,11',
    description: 'Para productoras y agencias',
    features: [
      'Todo lo de Pro',
      '5 cuentas DJ incluidas',
      'Branding propio',
      'Soporte prioritario',
      'Reportes consolidados',
    ],
  },
];

// ── Packs de créditos por evento ─────────────────────────────────────────────
const CREDIT_PACKS = [
  {
    key: 'SINGLE' as const,
    label: '1 Evento',
    credits: 1,
    price: 3500,
    pricePerEvent: 3500,
    icon: Ticket,
    color: '#06b6d4',
    rgb: '6,182,212',
    description: 'Probalo sin compromiso',
    badge: null,
  },
  {
    key: 'PACK3' as const,
    label: '3 Eventos',
    credits: 3,
    price: 8999,
    pricePerEvent: 3000,
    icon: Package,
    color: '#10b981',
    rgb: '16,185,129',
    description: 'Ahorrás $1.500 en total',
    badge: 'AHORRO 15%',
  },
  {
    key: 'PACK10' as const,
    label: '10 Eventos',
    credits: 10,
    price: 22999,
    pricePerEvent: 2300,
    icon: PackageOpen,
    color: '#8b5cf6',
    rgb: '139,92,246',
    description: 'Ahorrás $12.000 en total',
    badge: 'MEJOR PRECIO',
    popular: true,
  },
];

// ────────────────────────────────────────────────────────────────────────────

const BillingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'membership' | 'credits'>('membership');
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadStatus = () =>
    billing.getStatus()
      .then(r => setStatus(r.data))
      .catch(() => navigate('/dj/login'));

  useEffect(() => {
    loadStatus().finally(() => setLoading(false));

    const s = searchParams.get('status');
    const c = searchParams.get('credits');
    if (s === 'success') showToast('¡Pago exitoso! Tu plan fue activado.');
    if (c === 'success') {
      showToast('¡Créditos acreditados! Ya podés crear nuevos eventos.');
      setActiveTab('credits');
    }
    if (c === 'error') showToast('El pago fue rechazado. Intentá de nuevo.', 'error');
    if (c === 'pending') showToast('Pago pendiente de acreditación. Reintentá en unos minutos.', 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckout = async (planKey: string) => {
    setCheckingOut(planKey);
    try {
      const res = await billing.createCheckout(planKey);
      window.location.href = res.data.checkoutUrl;
    } catch {
      showToast('Error al iniciar el pago. Intentá de nuevo.', 'error');
      setCheckingOut(null);
    }
  };

  const handleBuyCredits = async (pack: 'SINGLE' | 'PACK3' | 'PACK10') => {
    setCheckingOut(pack);
    try {
      const res = await billing.buyCredits(pack);
      window.location.href = res.data.checkoutUrl;
    } catch {
      showToast('Error al iniciar el pago. Intentá de nuevo.', 'error');
      setCheckingOut(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Cancelar tu suscripción? Pasarás al plan Demo al vencer el período.')) return;
    try {
      await billing.cancel();
      showToast('Suscripción cancelada.');
      await loadStatus();
    } catch {
      showToast('Error al cancelar.', 'error');
    }
  };

  if (loading) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={36} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const isActive  = status?.subscriptionStatus === 'ACTIVE';
  const isExpired = status?.subscriptionStatus === 'EXPIRED';
  const isTrial   = status?.subscriptionStatus === 'TRIAL';
  const isCancelled = status?.subscriptionStatus === 'CANCELLED';

  const statusColor = isActive ? '#22c55e' : isTrial ? '#f59e0b' : '#ef4444';
  const statusLabel = isActive
    ? `Plan ${status?.plan} — Suscripción activa`
    : isTrial
      ? `Trial activo — ${status?.daysLeft} día${status?.daysLeft !== 1 ? 's' : ''} restantes`
      : isCancelled
        ? 'Suscripción cancelada'
        : 'Prueba expirada';

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white', position: 'relative', overflow: 'hidden' }}>

      {/* BG glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 60%)',
      }} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
              background: toast.type === 'success'
                ? 'rgba(34,197,94,0.95)'
                : toast.type === 'info'
                  ? 'rgba(59,130,246,0.95)'
                  : 'rgba(239,68,68,0.95)',
              color: 'white', padding: '0.75rem 1.75rem', borderRadius: '9999px',
              fontWeight: '600', fontSize: '0.9rem', zIndex: 2000,
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem', position: 'relative', zIndex: 1 }}>

        {/* Back */}
        <button type="button" onClick={() => navigate('/dj/home')}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '2rem', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
          <ArrowLeft size={14} /> Volver al dashboard
        </button>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>
            {isExpired || isCancelled ? '⚠️ Activá tu cuenta' : '✨ Planes y precios'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Elegí cómo querés usar EC Music: suscripción mensual o créditos por evento.
          </p>
        </div>

        {/* Status banner */}
        {status && (
          <div style={{
            background: `rgba(${isActive ? '34,197,94' : isTrial ? '245,158,11' : '239,68,68'},0.07)`,
            border: `1px solid rgba(${isActive ? '34,197,94' : isTrial ? '245,158,11' : '239,68,68'},0.2)`,
            borderRadius: '1rem', padding: '1rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: statusColor }}>{statusLabel}</div>
                {status.eventCredits > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                    Créditos disponibles: <span style={{ color: '#06b6d4', fontWeight: '700' }}>{status.eventCredits} evento{status.eventCredits !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
              <span>{status.usage.eventsThisMonth} evento{status.usage.eventsThisMonth !== 1 ? 's' : ''} este mes</span>
              <button onClick={loadStatus}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontFamily: 'inherit', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                <RefreshCw size={11} /> Actualizar
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.85rem', padding: '0.3rem', width: 'fit-content' }}>
          {[
            { key: 'membership', label: '📅 Membresía mensual' },
            { key: 'credits', label: '🎟️ Créditos por evento' },
          ].map(tab => (
            <button key={tab.key} type="button"
              onClick={() => setActiveTab(tab.key as 'membership' | 'credits')}
              style={{
                background: activeTab === tab.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: activeTab === tab.key ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                borderRadius: '0.6rem', padding: '0.55rem 1.25rem',
                color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.4)',
                fontWeight: activeTab === tab.key ? '700' : '500',
                fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Membresía ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'membership' && (
            <motion.div key="membership" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>
                Pagás una vez por mes y tenés acceso continuo según tu plan. Podés cancelar cuando quieras.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {MEMBERSHIP_PLANS.map((plan, idx) => {
                  const Icon = plan.icon;
                  const isCurrent = isActive && status?.plan === plan.key;
                  return (
                    <motion.div key={plan.key}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
                      style={{
                        background: plan.popular ? `rgba(${plan.rgb},0.05)` : '#0d1117',
                        border: isCurrent
                          ? `2px solid ${plan.color}`
                          : plan.popular
                            ? `1px solid rgba(${plan.rgb},0.35)`
                            : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '1.25rem', padding: '1.75rem',
                        position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.25rem',
                        boxShadow: isCurrent
                          ? `0 0 40px rgba(${plan.rgb},0.18)`
                          : plan.popular ? `0 0 30px rgba(${plan.rgb},0.1)` : '0 4px 20px rgba(0,0,0,0.3)',
                        transform: plan.popular ? 'scale(1.02)' : undefined,
                      }}>

                      {plan.popular && (
                        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#7c3aed,#ec4899)', borderRadius: '9999px', padding: '0.25rem 1rem', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.1em', whiteSpace: 'nowrap', color: 'white', boxShadow: '0 4px 16px rgba(236,72,153,0.35)' }}>
                          MÁS POPULAR
                        </div>
                      )}
                      {isCurrent && (
                        <div style={{ position: 'absolute', top: '-14px', right: '1rem', background: plan.color, borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.62rem', fontWeight: '800', color: 'white' }}>
                          PLAN ACTUAL
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: `rgba(${plan.rgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={18} style={{ color: plan.color }} />
                          </div>
                          <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{plan.name}</span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{plan.description}</div>
                      </div>

                      <div style={{ lineHeight: 1 }}>
                        <span style={{ fontSize: '2.4rem', fontWeight: '900' }}>${plan.price.toLocaleString('es-AR')}</span>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}> ARS/mes</span>
                      </div>

                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                        {plan.features.map(f => (
                          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.81rem', color: '#d1d5db' }}>
                            <Check size={12} style={{ color: plan.color, flexShrink: 0, marginTop: '0.2rem' }} /> {f}
                          </li>
                        ))}
                      </ul>

                      <motion.button type="button"
                        whileHover={{ scale: 1.02, filter: 'brightness(1.08)' }} whileTap={{ scale: 0.97 }}
                        onClick={() => isCurrent ? handleCancel() : handleCheckout(plan.key)}
                        disabled={checkingOut !== null}
                        style={{
                          width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
                          border: isCurrent ? '1px solid rgba(239,68,68,0.35)' : 'none',
                          cursor: 'pointer', fontWeight: '700', fontSize: '0.86rem',
                          background: isCurrent ? 'rgba(239,68,68,0.1)' : `linear-gradient(135deg, rgba(${plan.rgb},0.85), ${plan.color})`,
                          color: isCurrent ? '#ef4444' : 'white',
                          opacity: (checkingOut && checkingOut !== plan.key) ? 0.45 : 1,
                          fontFamily: 'inherit',
                          boxShadow: isCurrent ? 'none' : `0 4px 18px rgba(${plan.rgb},0.3)`,
                        }}>
                        {checkingOut === plan.key
                          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Redirigiendo...</span>
                          : isCurrent ? 'Cancelar plan' : `Suscribirse — $${plan.price.toLocaleString('es-AR')}/mes`}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1rem 1.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
                💡 <strong style={{ color: 'rgba(255,255,255,0.5)' }}>¿Cuándo conviene la membresía?</strong><br />
                Si hacés más de 2 eventos por mes, la membresía Starter ya te sale más barata que los créditos. Pro es ideal para residencias y trabajo frecuente.
              </div>
            </motion.div>
          )}

          {/* ── Tab: Créditos por evento ── */}
          {activeTab === 'credits' && (
            <motion.div key="credits" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>
                Comprás un paquete de eventos y los usás cuando quieras. Sin vencimiento mensual, sin compromiso de continuidad.
              </p>

              {/* Créditos actuales */}
              {(status?.eventCredits ?? 0) > 0 && (
                <div style={{
                  background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: '0.85rem', padding: '1rem 1.5rem', marginBottom: '1.5rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <Ticket size={20} color="#06b6d4" />
                  <div>
                    <div style={{ fontWeight: '700', color: '#06b6d4', fontSize: '0.9rem' }}>
                      Tenés {status?.eventCredits} crédito{status!.eventCredits !== 1 ? 's' : ''} disponible{status!.eventCredits !== 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                      Se descuentan automáticamente al crear un evento
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {CREDIT_PACKS.map((pack, idx) => {
                  const Icon = pack.icon;
                  return (
                    <motion.div key={pack.key}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
                      style={{
                        background: pack.popular ? `rgba(${pack.rgb},0.05)` : '#0d1117',
                        border: pack.popular
                          ? `1px solid rgba(${pack.rgb},0.35)`
                          : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '1.25rem', padding: '1.75rem',
                        position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.1rem',
                        boxShadow: pack.popular ? `0 0 30px rgba(${pack.rgb},0.1)` : '0 4px 20px rgba(0,0,0,0.3)',
                        transform: pack.popular ? 'scale(1.02)' : undefined,
                      }}>

                      {pack.badge && (
                        <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: pack.popular ? `linear-gradient(90deg,#7c3aed,${pack.color})` : pack.color, borderRadius: '9999px', padding: '0.22rem 0.9rem', fontSize: '0.62rem', fontWeight: '800', letterSpacing: '0.08em', whiteSpace: 'nowrap', color: 'white' }}>
                          {pack.badge}
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: `rgba(${pack.rgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={18} style={{ color: pack.color }} />
                          </div>
                          <span style={{ fontWeight: '800', fontSize: '1.05rem' }}>{pack.label}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{pack.description}</div>
                      </div>

                      <div>
                        <div style={{ lineHeight: 1, marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '2.2rem', fontWeight: '900' }}>${pack.price.toLocaleString('es-AR')}</span>
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}> ARS</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
                          ${pack.pricePerEvent.toLocaleString('es-AR')} por evento
                        </div>
                      </div>

                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
                        {[
                          `${pack.credits} crédito${pack.credits > 1 ? 's' : ''} de evento`,
                          'Sin vencimiento mensual',
                          'Votos ilimitados por evento',
                          'Se acumulan con otros packs',
                        ].map(f => (
                          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#d1d5db' }}>
                            <Check size={12} style={{ color: pack.color, flexShrink: 0, marginTop: '0.2rem' }} /> {f}
                          </li>
                        ))}
                      </ul>

                      <motion.button type="button"
                        whileHover={{ scale: 1.02, filter: 'brightness(1.08)' }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleBuyCredits(pack.key)}
                        disabled={checkingOut !== null}
                        style={{
                          width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: 'none',
                          cursor: 'pointer', fontWeight: '700', fontSize: '0.86rem',
                          background: `linear-gradient(135deg, rgba(${pack.rgb},0.8), ${pack.color})`,
                          color: 'white',
                          opacity: (checkingOut && checkingOut !== pack.key) ? 0.45 : 1,
                          fontFamily: 'inherit',
                          boxShadow: `0 4px 18px rgba(${pack.rgb},0.28)`,
                        }}>
                        {checkingOut === pack.key
                          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Redirigiendo...</span>
                          : `Comprar — $${pack.price.toLocaleString('es-AR')}`}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1rem 1.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
                💡 <strong style={{ color: 'rgba(255,255,255,0.5)' }}>¿Cuándo convienen los créditos?</strong><br />
                Ideal si hacés eventos esporádicos (1–2 por mes) o querés probar el sistema antes de suscribirte. Los créditos no expiran y se pueden acumular.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#4b5563', marginBottom: '0.6rem' }}>
            <ShieldCheck size={15} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: '500' }}>Pago seguro con MercadoPago</span>
          </div>
          <p style={{ color: '#374151', fontSize: '0.73rem', lineHeight: 1.7 }}>
            Los precios son en ARS. Membresías cobradas mensualmente, créditos de pago único.<br />
            Podés cancelar la membresía en cualquier momento desde este panel.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default BillingPage;
