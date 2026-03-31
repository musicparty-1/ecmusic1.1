import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { events, songs as songsApi } from '../../api/api';
import { Music, Radio, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Song {
  id: number;
  title: string;
  artist: string;
  votes: number;
  played: boolean;
  created_at: string;
}

interface EventData {
  id: number;
  name: string;
  venue: string;
}

const POLL_MS = 8000;

/* ── Ecualizador animado ── */
const Equalizer = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
    {[0.6, 1, 0.4, 0.85, 0.55].map((h, i) => (
      <motion.div
        key={i}
        animate={{ scaleY: [h, 1, h * 0.5, 1, h] }}
        transition={{ repeat: Infinity, duration: 0.9 + i * 0.15, ease: 'easeInOut' }}
        style={{
          width: 4,
          height: 22,
          borderRadius: 99,
          background: 'linear-gradient(to top, #8b5cf6, #ec4899)',
          transformOrigin: 'bottom',
        }}
      />
    ))}
  </div>
);

/* ── Orb decorativo de fondo ── */
const Orb = ({ x, y, size, color }: { x: string; y: string; size: number; color: string }) => (
  <div style={{
    position: 'absolute',
    left: x, top: y,
    width: size, height: size,
    borderRadius: '50%',
    background: color,
    filter: `blur(${size * 0.55}px)`,
    opacity: 0.18,
    pointerEvents: 'none',
  }} />
);

/* ── Número de posición estilizado ── */
const RankBadge = ({ index }: { index: number }) => {
  const gradients = [
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #94a3b8, #cbd5e1)',
    'linear-gradient(135deg, #d97706, #92400e)',
  ];
  if (index < 3) {
    return (
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: gradients[index],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '900', fontSize: '1.15rem', color: 'white',
        flexShrink: 0,
        boxShadow: index === 0 ? '0 0 18px rgba(245,158,11,0.5)' : 'none',
      }}>
        {index + 1}
      </div>
    );
  }
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '800', fontSize: '1rem', color: 'rgba(255,255,255,0.35)',
      flexShrink: 0,
    }}>
      {index + 1}
    </div>
  );
};

const MirrorMode = () => {
  const { id } = useParams<{ id: string }>();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [syncing, setSyncing] = useState(false);
  const prevIdsRef = useRef<number[]>([]);

  const fetchData = async (silent = false) => {
    if (!silent) setSyncing(true);
    if (!id) return;
    try {
      const [evRes, songsRes] = await Promise.all([
        events.getOne(parseInt(id)),
        songsApi.getByEvent(parseInt(id)),
      ]);
      setEventData(evRes.data);
      const sorted: Song[] = [...songsRes.data].sort((a, b) => b.votes - a.votes);
      setSongs(sorted);
      const played = songsRes.data
        .filter((s: Song) => s.played)
        .sort((a: Song, b: Song) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNowPlaying(played[0] || null);
      prevIdsRef.current = sorted.map(s => s.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), POLL_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const unplayed = songs.filter(s => !s.played).slice(0, 7);
  const maxVotes = unplayed[0]?.votes || 1;
  const totalVotes = unplayed.reduce((acc, s) => acc + s.votes, 0);

  if (loading) {
    return (
      <div style={{
        background: 'radial-gradient(ellipse at 50% 40%, #1a0a2e 0%, #020617 100%)',
        height: '100vh', color: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        >
          <Music size={52} color="#8b5cf6" />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}
        >
          Cargando evento...
        </motion.p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'radial-gradient(ellipse at 20% 0%, #1a0533 0%, #020617 45%, #000d1a 100%)',
      minHeight: '100vh',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
    }}>

      {/* ── Orbs de fondo ── */}
      <Orb x="5%" y="10%" size={500} color="radial-gradient(#7c3aed, transparent)" />
      <Orb x="70%" y="60%" size={420} color="radial-gradient(#ec4899, transparent)" />
      <Orb x="50%" y="-5%" size={350} color="radial-gradient(#06b6d4, transparent)" />

      <style>{`
        @media (max-width: 960px) {
          .mirror-grid { grid-template-columns: 1fr !important; }
          .mirror-aside { display: none !important; }
          .mirror-header { padding: 1.25rem 1.5rem !important; flex-direction: column !important; align-items: flex-start !important; gap: 1rem !important; }
          .mirror-header h1 { font-size: 2.25rem !important; }
          .mirror-now-playing { min-width: unset !important; width: 100% !important; }
          .mirror-section { padding: 1.5rem !important; }
        }
      `}</style>

      {/* ══════════════ HEADER ══════════════ */}
      <header className="mirror-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.75rem 3rem',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(5,2,15,0.55)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* Nombre del evento */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.3em',
              color: 'rgba(139,92,246,0.7)', textTransform: 'uppercase',
              marginBottom: '0.6rem',
            }}>
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}
              />
              En vivo
            </div>
            <h1 style={{
              fontSize: '3.25rem',
              fontWeight: '900',
              letterSpacing: '-0.035em',
              background: 'linear-gradient(100deg, #e2d9ff 0%, #c084fc 40%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.05,
              marginBottom: '0.4rem',
            }}>
              {eventData?.name}
            </h1>
            <p style={{
              fontSize: '1.1rem', color: 'rgba(255,255,255,0.35)',
              fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <span style={{ opacity: 0.6 }}>📍</span> {eventData?.venue}
            </p>
          </motion.div>
        </div>

        {/* Now Playing */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mirror-now-playing"
          style={{
            minWidth: '400px',
            background: 'rgba(15,5,35,0.6)',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: '1.75rem',
            padding: '1.5rem 2rem',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Glow superior */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)',
            pointerEvents: 'none',
          }} />

          {/* Label */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '0.8rem',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.22em',
              color: 'rgba(139,92,246,0.8)', textTransform: 'uppercase',
            }}>
              <Radio size={12} />
              Sonando Ahora
            </div>
            <Equalizer />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={nowPlaying?.id ?? 'none'}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                fontSize: '2.1rem', fontWeight: '800', lineHeight: 1.2,
                background: nowPlaying ? 'linear-gradient(90deg, #fff 60%, rgba(255,255,255,0.5))' : undefined,
                WebkitBackgroundClip: nowPlaying ? 'text' : undefined,
                WebkitTextFillColor: nowPlaying ? 'transparent' : undefined,
                color: nowPlaying ? undefined : 'rgba(255,255,255,0.25)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {nowPlaying?.title ?? '—'}
              </div>
              <div style={{
                fontSize: '1.2rem', color: 'rgba(255,255,255,0.45)',
                marginTop: '0.2rem',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {nowPlaying?.artist ?? 'Esperando al DJ...'}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </header>

      {/* ══════════════ MAIN ══════════════ */}
      <main className="mirror-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        flex: 1,
        position: 'relative',
        zIndex: 5,
      }}>

        {/* ── Ranking ── */}
        <section className="mirror-section" style={{ padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column' }}>

          {/* Título ranking */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '1.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))',
                border: '1px solid rgba(139,92,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={18} color="#c084fc" />
              </div>
              <h2 style={{
                fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em',
                color: 'white',
              }}>
                Ranking en Vivo
              </h2>
            </div>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: '0.4rem',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '0.75rem',
              padding: '0.5rem 1rem',
            }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '900', color: '#c084fc', lineHeight: 1 }}>
                {totalVotes}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>votos</span>
            </div>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            <AnimatePresence mode="popLayout">
              {unplayed.map((song, index) => {
                const pct = maxVotes > 0 ? (song.votes / maxVotes) * 100 : 0;
                const isTop = index === 0;

                return (
                  <motion.div
                    layout
                    key={song.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    style={{
                      padding: '1.1rem 1.5rem',
                      borderRadius: '1.25rem',
                      background: isTop
                        ? 'rgba(139,92,246,0.1)'
                        : 'rgba(255,255,255,0.028)',
                      border: isTop
                        ? '1px solid rgba(139,92,246,0.35)'
                        : '1px solid rgba(255,255,255,0.055)',
                      position: 'relative',
                      overflow: 'hidden',
                      backdropFilter: 'blur(8px)',
                      transition: 'box-shadow 0.3s',
                      boxShadow: isTop ? '0 0 30px rgba(139,92,246,0.1)' : 'none',
                    }}
                  >
                    {/* Barra de fondo */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        background: isTop
                          ? 'linear-gradient(90deg, rgba(139,92,246,0.15), transparent)'
                          : 'linear-gradient(90deg, rgba(255,255,255,0.035), transparent)',
                        pointerEvents: 'none',
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
                      <RankBadge index={index} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: isTop ? '1.85rem' : '1.5rem',
                          fontWeight: '800',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          color: isTop ? 'white' : 'rgba(255,255,255,0.85)',
                        }}>
                          {song.title}
                        </div>
                        <div style={{
                          fontSize: '1rem',
                          color: 'rgba(255,255,255,0.4)',
                          marginTop: '0.1rem',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {song.artist}
                        </div>
                      </div>

                      {/* Votos */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <motion.div
                          key={song.votes}
                          initial={{ scale: 1.25 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                          style={{
                            fontSize: isTop ? '2.5rem' : '1.75rem',
                            fontWeight: '900',
                            lineHeight: 1,
                            background: isTop
                              ? 'linear-gradient(135deg, #c084fc, #f472b6)'
                              : undefined,
                            WebkitBackgroundClip: isTop ? 'text' : undefined,
                            WebkitTextFillColor: isTop ? 'transparent' : undefined,
                            color: isTop ? undefined : 'rgba(255,255,255,0.55)',
                          }}
                        >
                          {song.votes}
                        </motion.div>
                        <div style={{
                          fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)',
                          fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase',
                        }}>
                          votos
                        </div>
                      </div>
                    </div>

                    {/* Barra inferior */}
                    <div style={{
                      marginTop: '0.65rem', height: 3,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 99, overflow: 'hidden',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                          height: '100%', borderRadius: 99,
                          background: isTop
                            ? 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                            : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* ── QR Sidebar ── */}
        <aside className="mirror-aside" style={{
          padding: '2.5rem 2.5rem 2.5rem 0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.25rem',
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 22 }}
            style={{
              background: 'rgba(10,4,28,0.65)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: '2rem',
              padding: '2.25rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow top */}
            <div style={{
              position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)',
            }} />
            {/* Glow fondo QR */}
            <div style={{
              position: 'absolute', bottom: '25%', left: '50%', transform: 'translateX(-50%)',
              width: 260, height: 260, borderRadius: '50%',
              background: 'radial-gradient(rgba(139,92,246,0.2), transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Icono + título */}
            <div>
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                style={{ fontSize: '3rem', marginBottom: '0.75rem' }}
              >
                🎧
              </motion.div>
              <h3 style={{
                fontSize: '1.5rem', fontWeight: '900',
                letterSpacing: '0.04em',
                background: 'linear-gradient(90deg, #c084fc, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.35rem',
              }}>
                ¡ESCANEÁ Y VOTÁ!
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Tus votos eligen el próximo tema
              </p>
            </div>

            {/* QR */}
            <div style={{ position: 'relative' }}>
              {/* Pulse rings */}
              {[1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.18 + i * 0.08], opacity: [0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.55, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    inset: -14 * i,
                    borderRadius: '1.4rem',
                    border: '2px solid rgba(139,92,246,0.4)',
                    pointerEvents: 'none',
                  }}
                />
              ))}
              <div style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '1.25rem',
                boxShadow: '0 0 50px rgba(139,92,246,0.35), 0 0 100px rgba(139,92,246,0.12)',
                position: 'relative',
              }}>
                <QRCodeSVG
                  value={`${window.location.origin}/event/${id}`}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0f0a1e"
                  level="H"
                />
              </div>
            </div>

            <p style={{
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)',
              fontWeight: '600', letterSpacing: '0.06em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              musicparty.app/event/{id}
            </p>
          </motion.div>
        </aside>
      </main>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{
        padding: '1rem 2rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(5,2,15,0.5)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
      }}>
        <span style={{
          fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase',
        }}>
          MusicParty
        </span>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.1)' }}>
          El poder de la música en tus manos
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <motion.div
            animate={{ opacity: syncing ? [1, 0.2, 1] : 0.35 }}
            transition={{ repeat: syncing ? Infinity : 0, duration: 0.9 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}
          />
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>
            {syncing ? 'Sincronizando...' : 'En vivo'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default MirrorMode;
