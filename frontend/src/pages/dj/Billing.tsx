import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { billing } from '../../api/api';
import { Check, Zap, Crown, Building2, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

interface BillingStatus {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  daysLeft: number;
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

const PLANS = [
  {
    key: 'STARTER',
    name: 'Starter',
    price: 4999,
    icon: Zap,
    color: '#8b5cf6',
    colorRgb: '139,92,246',
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
    price: 9999,
    icon: Crown,
    color: '#ec4899',
    colorRgb: '236,72,153',
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
    price: 19999,
    icon: Building2,
    color: '#f59e0b',
    colorRgb: '245,158,11',
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

const BillingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    billing.getStatus()
      .then(r => setStatus(r.data))
      .catch(() => navigate('/dj/login'))
      .finally(() => setLoading(false));

    if (searchParams.get('status') === 'success') {
      showToast('¡Pago exitoso! Tu plan fue activado.');
    }
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

  const handleCancel = async () => {
    if (!confirm('¿Cancelar tu suscripción? Pasarás al plan Demo al vencer el período.')) return;
    try {
      await billing.cancel();
      showToast('Suscripción cancelada.');
      billing.getStatus().then(r => setStatus(r.data));
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

  return (
    <div style={{
      background: '#000',
      minHeight: '100vh',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)',
      }} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
              background: toast.type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
              color: 'white', padding: '0.75rem 1.75rem', borderRadius: '9999px',
              fontWeight: '600', fontSize: '0.9rem', zIndex: 2000,
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem', position: 'relative', zIndex: 1 }}>

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/dj/home')}
          style={{
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.82rem', marginBottom: '2rem', padding: 0, fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          <ArrowLeft size={14} /> Volver al dashboard
        </button>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            {isExpired ? '⚠️ Tu prueba expiró' : '✨ Elegí tu plan'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            {isExpired
              ? 'Para seguir usando MusicParty, elegí el plan que mejor se adapte a tu ritmo.'
              : 'Potenciá tus eventos con más votos, analytics y funciones avanzadas.'}
          </p>
        </div>

        {/* Current plan banner */}
        {status && (
          <div style={{
            background: isTrial
              ? 'rgba(245,158,11,0.08)'
              : isActive
                ? 'rgba(34,197,94,0.08)'
                : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isTrial ? 'rgba(245,158,11,0.25)' : isActive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            borderRadius: '1rem',
            padding: '1.1rem 1.5rem',
            marginBottom: '2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                Plan actual:{' '}
                <span style={{ color: isTrial ? '#f59e0b' : isActive ? '#22c55e' : '#ef4444' }}>
                  {isActive ? status.plan : isTrial ? 'DEMO — Trial' : 'EXPIRADO'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {isTrial && `Trial activo — quedan ${status.daysLeft} día${status.daysLeft !== 1 ? 's' : ''}`}
                {isActive && 'Suscripción activa'}
                {isExpired && 'Tu período de prueba terminó'}
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'right' }}>
              {status.limits.maxEvents !== null
                ? `${status.usage.eventsThisMonth} / ${status.limits.maxEvents} eventos este mes`
                : `${status.usage.eventsThisMonth} eventos este mes`}
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          {PLANS.map((plan, idx) => {
            const Icon = plan.icon;
            const isCurrent = isActive && status?.plan === plan.key;
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                style={{
                  background: plan.popular
                    ? `rgba(${plan.colorRgb},0.06)`
                    : '#0d1117',
                  border: isCurrent
                    ? `2px solid ${plan.color}`
                    : plan.popular
                      ? `1px solid rgba(${plan.colorRgb},0.4)`
                      : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '1.25rem',
                  padding: '1.75rem',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxShadow: isCurrent
                    ? `0 0 40px rgba(${plan.colorRgb},0.2)`
                    : plan.popular
                      ? `0 0 32px rgba(${plan.colorRgb},0.12)`
                      : '0 4px 20px rgba(0,0,0,0.3)',
                  transform: plan.popular ? 'scale(1.025)' : undefined,
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                    borderRadius: '9999px', padding: '0.25rem 1rem',
                    fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em',
                    whiteSpace: 'nowrap', color: 'white',
                    boxShadow: '0 4px 16px rgba(236,72,153,0.4)',
                  }}>
                    MÁS POPULAR
                  </div>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: '-14px', right: '1rem',
                    background: plan.color, borderRadius: '9999px',
                    padding: '0.2rem 0.75rem',
                    fontSize: '0.65rem', fontWeight: '800', color: 'white',
                  }}>
                    PLAN ACTUAL
                  </div>
                )}

                {/* Plan name */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '0.6rem',
                      background: `rgba(${plan.colorRgb},0.15)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} style={{ color: plan.color }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{plan.name}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>{plan.description}</div>
                </div>

                {/* Price */}
                <div style={{ lineHeight: 1 }}>
                  <span style={{ fontSize: '2.6rem', fontWeight: '900' }}>
                    ${plan.price.toLocaleString('es-AR')}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.82rem' }}> ARS/mes</span>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: '#d1d5db' }}>
                      <Check size={13} style={{ color: plan.color, flexShrink: 0, marginTop: '0.18rem' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => isCurrent ? handleCancel() : handleCheckout(plan.key)}
                  disabled={checkingOut !== null}
                  style={{
                    width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
                    border: isCurrent ? `1px solid rgba(239,68,68,0.4)` : 'none',
                    cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem',
                    background: isCurrent
                      ? 'rgba(239,68,68,0.12)'
                      : `linear-gradient(135deg, rgba(${plan.colorRgb},0.85), ${plan.color})`,
                    color: isCurrent ? '#ef4444' : 'white',
                    opacity: (checkingOut && checkingOut !== plan.key) ? 0.5 : 1,
                    fontFamily: 'inherit',
                    boxShadow: isCurrent ? 'none' : `0 4px 20px rgba(${plan.colorRgb},0.35)`,
                  }}
                >
                  {checkingOut === plan.key ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Redirigiendo...
                    </span>
                  ) : isCurrent ? 'Cancelar plan' : `Elegir ${plan.name}`}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            <ShieldCheck size={15} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: '500' }}>Pago seguro con MercadoPago</span>
          </div>
          <p style={{ color: '#374151', fontSize: '0.75rem', lineHeight: 1.7 }}>
            Todos los planes se cobran mensualmente en ARS.<br />
            Podés cancelar en cualquier momento desde este panel.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default BillingPage;
