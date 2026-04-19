import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { events } from '../../api/api';
import { Music, MapPin, Calendar, Printer } from 'lucide-react';

interface EventData {
  id: number;
  name: string;
  venue: string;
  status: string;
  created_at: string;
}

const FlyerPage = () => {
  const { id } = useParams<{ id: string }>();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    events.getOne(parseInt(id))
      .then(r => setEventData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const voteUrl = `${window.location.origin}/event/${id}`;

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #8b5cf6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const dateStr = eventData?.created_at
    ? new Date(eventData.created_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <>
      {/* Print button (hidden on print) */}
      <div className="no-print" style={{
        position: 'fixed', top: '1rem', right: '1rem', zIndex: 100,
        display: 'flex', gap: '0.5rem',
      }}>
        <button
          id="flyer-print-btn"
          onClick={handlePrint}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            border: 'none', borderRadius: '0.75rem',
            padding: '0.65rem 1.25rem',
            color: 'white', fontWeight: '800', fontSize: '0.85rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
          }}
        >
          <Printer size={16} /> Imprimir Flyer
        </button>
      </div>

      {/* Flyer */}
      <div id="flyer-container" style={{
        background: '#000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'Inter', sans-serif",
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: 520,
            background: 'linear-gradient(160deg, #0a0318 0%, #06011a 40%, #000 100%)',
            border: '1px solid rgba(139,92,246,0.35)',
            borderRadius: '2rem',
            overflow: 'hidden',
            boxShadow: '0 0 80px rgba(139,92,246,0.2), 0 0 160px rgba(236,72,153,0.08)',
            position: 'relative',
          }}
        >
          {/* Corner glows */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(#8b5cf644, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(#ec489933, transparent 70%)', pointerEvents: 'none' }} />

          {/* Top border shine */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #6d28d9, #8b5cf6, #ec4899, #8b5cf6, #6d28d9)' }} />

          <div style={{ padding: '2.5rem 2.5rem 2rem' }}>
            {/* Header: logo + brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '0.85rem',
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(139,92,246,0.4)',
              }}>
                <Music size={22} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'white' }}>
                  Music<span style={{ color: '#8b5cf6' }}>Party</span>
                </div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Votación en tiempo real
                </div>
              </div>
            </div>

            {/* Main headline */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.2em', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                🎉 Esta noche
              </div>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
                fontWeight: '900',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                background: 'linear-gradient(120deg, #ffffff 30%, #c084fc 65%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}>
                Esta fiesta<br />la controlás<br />
                <span style={{
                  background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>vos</span>
              </h1>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
              {[
                { icon: '🗳️', text: 'Votá las canciones en vivo' },
                { icon: '🎛️', text: 'Influí en el DJ en tiempo real' },
                { icon: '🔥', text: 'Viví la fiesta distinto' },
              ].map(item => (
                <div key={item.icon} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '600' }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)', marginBottom: '1.75rem' }} />

            {/* QR + CTA section */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              {/* QR code */}
              <div style={{ flexShrink: 0, position: 'relative' }}>
                {/* Pulse rings */}
                {[0, 1].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.8, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      inset: -8 * (i + 1),
                      borderRadius: '1rem',
                      border: '1.5px solid rgba(139,92,246,0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                ))}
                <div style={{
                  background: 'white',
                  padding: '0.75rem',
                  borderRadius: '1rem',
                  boxShadow: '0 0 30px rgba(139,92,246,0.3)',
                }}>
                  <QRCodeSVG
                    value={voteUrl}
                    size={140}
                    bgColor="#ffffff"
                    fgColor="#0a0318"
                    level="H"
                  />
                </div>
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.03em',
                  background: 'linear-gradient(90deg, #c084fc, #f472b6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2, marginBottom: '0.5rem',
                }}>
                  ¡ESCANEÁ<br />Y VOTÁ!
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                  Sin registro.<br />Entrá, votá y hacé<br />sonar lo que querés.
                </p>
              </div>
            </div>

            {/* Event info footer */}
            {eventData && (
              <div style={{
                marginTop: '1.75rem',
                background: 'rgba(139,92,246,0.07)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '1rem',
                padding: '1rem 1.25rem',
              }}>
                <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'white', marginBottom: '0.5rem' }}>
                  {eventData.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                    <MapPin size={12} /> {eventData.venue}
                  </div>
                  {dateStr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                      <Calendar size={12} /> {dateStr}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* URL */}
            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.05em' }}>
              {voteUrl}
            </div>
          </div>

          {/* Bottom border shine */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #6d28d9, #8b5cf6, #ec4899)' }} />
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          .no-print { display: none !important; }
          body { background: #000 !important; }
          #flyer-container { padding: 0 !important; min-height: unset !important; }
        }
      `}</style>
    </>
  );
};

export default FlyerPage;
