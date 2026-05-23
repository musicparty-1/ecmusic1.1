import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { events, songs as songsApi } from '../../api/api';
import { QRCodeSVG } from 'qrcode.react';

interface Song {
  id: number;
  title: string;
  artist: string;
  votes: number;
  played?: boolean;
}

interface EventData {
  id: number;
  name: string;
  venue: string;
  logoUrl?: string;
}

const POLL_MS = 8000;

/* ── Ecualizador animado ── */
const Equalizer = ({ large = false }: { large?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: large ? 5 : 3, height: large ? 32 : 20 }}>
    {[0.55, 1, 0.7, 0.9, 0.45, 0.8, 0.6].map((h, i) => (
      <motion.div
        key={i}
        animate={{ scaleY: [h, 1, h * 0.4, 0.9, h] }}
        transition={{ repeat: Infinity, duration: 0.75 + i * 0.12, ease: 'easeInOut', delay: i * 0.07 }}
        style={{
          width: large ? 5 : 3,
          height: large ? 32 : 20,
          borderRadius: 99,
          background: `linear-gradient(to top, #7c3aed, #ec4899, #f59e0b)`,
          transformOrigin: 'bottom',
          boxShadow: large ? '0 0 8px rgba(236,72,153,0.5)' : 'none',
        }}
      />
    ))}
  </div>
);

/* ── Partículas de fondo ── */
const Particles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 12,
    size: 2 + Math.random() * 3,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ y: '-10vh', opacity: [0, 0.6, 0.6, 0] }}
          transition={{ repeat: Infinity, duration: p.duration, delay: p.delay, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: p.x,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(139,92,246,0.8)',
            boxShadow: '0 0 6px rgba(139,92,246,0.6)',
          }}
        />
      ))}
    </div>
  );
};

/* ── Badge de posición ── */
const RankBadge = ({ index }: { index: number }) => {
  const configs = [
    { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', shadow: '0 0 24px rgba(251,191,36,0.6)', emoji: '🥇' },
    { bg: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', shadow: '0 0 16px rgba(148,163,184,0.4)', emoji: '🥈' },
    { bg: 'linear-gradient(135deg, #cd7c2f, #b45309)', shadow: '0 0 16px rgba(180,83,9,0.4)', emoji: '🥉' },
  ];
  if (index < 3) {
    const cfg = configs[index];
    return (
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', flexShrink: 0,
        boxShadow: cfg.shadow,
      }}>
        {cfg.emoji}
      </div>
    );
  }
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '800', fontSize: '1.1rem',
      color: 'rgba(255,255,255,0.3)',
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
  const [nowPlayingCelebration, setNowPlayingCelebration] = useState<Song | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  const prevRankRef = useRef<Map<number, number>>(new Map());
  const currRankRef = useRef<Map<number, number>>(new Map());
  const prevNowPlayingIdRef = useRef<number | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setSyncing(true);
    if (!id) return;
    try {
      const [evRes, rankingRes, playedRes] = await Promise.all([
        events.getOne(parseInt(id)),
        songsApi.getRanking(parseInt(id)),
        songsApi.getPlayedSongs(parseInt(id)),
      ]);
      setEventData(evRes.data);
      const newSongs: Song[] = rankingRes.data;

      prevRankRef.current = new Map(currRankRef.current);
      const newRankMap = new Map<number, number>();
      newSongs.forEach((s: Song, i: number) => newRankMap.set(s.id, i));
      currRankRef.current = newRankMap;

      setSongs(newSongs);
      const newNowPlaying: Song | null = playedRes.data[0] || null;
      if (newNowPlaying?.id !== prevNowPlayingIdRef.current && newNowPlaying) {
        prevNowPlayingIdRef.current = newNowPlaying.id;
        setNowPlayingCelebration(newNowPlaying);
        setTimeout(() => setNowPlayingCelebration(null), 6000);
      } else if (!newNowPlaying) {
        prevNowPlayingIdRef.current = null;
      }
      setNowPlaying(newNowPlaying);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Dynamic polling: 8s when visible, 40s when in background
    const intervalTime = isTabVisible ? POLL_MS : 40000;
    const interval = setInterval(() => fetchData(true), intervalTime);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isTabVisible]);

  const getTrend = (songId: number, currentIdx: number): 'up' | 'down' | 'same' | 'new' => {
    const prevRank = prevRankRef.current.get(songId);
    if (prevRank === undefined) return 'new';
    if (prevRank > currentIdx) return 'up';
    if (prevRank < currentIdx) return 'down';
    return 'same';
  };

  const top10 = songs.slice(0, 10);
  const maxVotes = top10[0]?.votes || 1;
  const totalVotes = top10.reduce((acc, s) => acc + (s.votes || 0), 0);

  if (loading) {
    return (
      <div style={{
        background: '#030010', height: '100vh', color: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          style={{ fontSize: '4rem' }}
        >
          🎵
        </motion.div>
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}
        >
          Cargando evento...
        </motion.p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#030010',
      minHeight: '100vh',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
    }}>

      {/* ── Fondo animado ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Gradiente base */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 20% -10%, rgba(109,40,217,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(236,72,153,0.2) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 60% 40%, rgba(6,182,212,0.08) 0%, transparent 50%)',
        }} />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <Particles />
      </div>

      {/* ── CELEBRATION OVERLAY ── */}
      <AnimatePresence>
        {nowPlayingCelebration && (
          <motion.div
            key={nowPlayingCelebration.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(3,0,16,0.88)',
              backdropFilter: 'blur(12px)',
              pointerEvents: 'none',
            }}
          >
            {/* Pulse rings */}
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0.6 }}
                animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 400, height: 400,
                  borderRadius: '50%',
                  border: '2px solid rgba(139,92,246,0.5)',
                }}
              />
            ))}
            <motion.div
              initial={{ scale: 0.7, y: 60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              style={{
                textAlign: 'center', padding: '4rem 5rem',
                background: 'linear-gradient(135deg, rgba(76,29,149,0.95) 0%, rgba(109,40,217,0.9) 40%, rgba(236,72,153,0.85) 100%)',
                borderRadius: '3rem',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 0 80px rgba(124,58,237,0.7), 0 0 200px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                maxWidth: '900px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: '40%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                  pointerEvents: 'none',
                }}
              />

              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 15, 0] }}
                transition={{ repeat: 4, duration: 0.7, ease: 'easeInOut' }}
                style={{ fontSize: '6rem', lineHeight: 1, marginBottom: '1.25rem' }}
              >
                🔥
              </motion.div>

              <div style={{
                fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.4em',
                color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase',
                marginBottom: '1rem',
              }}>
                ¡ Elegida por voto popular !
              </div>

              <div style={{
                fontSize: '4.5rem', fontWeight: '900', lineHeight: 1.1,
                background: 'linear-gradient(90deg, #fff 30%, rgba(255,255,255,0.7))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: '0.6rem',
                letterSpacing: '-0.03em',
              }}>
                {nowPlayingCelebration.title}
              </div>

              <div style={{
                fontSize: '2rem', color: 'rgba(255,255,255,0.5)',
                fontWeight: '600', letterSpacing: '-0.01em',
              }}>
                {nowPlayingCelebration.artist}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ HEADER ══════════════ */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 3rem',
        borderBottom: '1px solid rgba(139,92,246,0.12)',
        background: 'rgba(3,0,16,0.7)',
        backdropFilter: 'blur(24px)',
        position: 'relative',
        zIndex: 10,
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #7c3aed 30%, #ec4899 70%, transparent 100%)',
        }} />

        {/* Left: branding + evento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {eventData?.logoUrl && (
            <div style={{
              width: 72, height: 72, borderRadius: '1rem', overflow: 'hidden', flexShrink: 0,
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 0 20px rgba(139,92,246,0.25)',
            }}>
              <img src={eventData.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.3em',
              color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.4rem',
            }}>
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}
              />
              En vivo
            </div>
            <h1 style={{
              fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em',
              background: 'linear-gradient(100deg, #e9d5ff 0%, #a78bfa 45%, #f472b6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1, marginBottom: '0.25rem',
            }}>
              {eventData?.name}
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
              📍 {eventData?.venue}
            </p>
          </div>
        </div>

        {/* Center: Now Playing */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            flex: '1 1 400px', maxWidth: 600,
            background: 'rgba(15,5,40,0.7)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '1.5rem',
            padding: '1.25rem 1.75rem',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(109,40,217,0.15)',
          }}
        >
          {/* Animated border glow */}
          <motion.div
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '1.5rem',
              background: 'linear-gradient(90deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2), rgba(6,182,212,0.1), rgba(124,58,237,0.2))',
              backgroundSize: '300% 100%',
              pointerEvents: 'none',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.25em',
            color: 'rgba(167,139,250,0.8)', textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            Sonando Ahora
            <div style={{ marginLeft: 'auto' }}>
              <Equalizer large />
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={nowPlaying?.id ?? 'none'}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div style={{
                fontSize: '2rem', fontWeight: '800', lineHeight: 1.2,
                background: nowPlaying ? 'linear-gradient(90deg, #fff 50%, rgba(255,255,255,0.5))' : undefined,
                WebkitBackgroundClip: nowPlaying ? 'text' : undefined,
                WebkitTextFillColor: nowPlaying ? 'transparent' : undefined,
                color: nowPlaying ? undefined : 'rgba(255,255,255,0.2)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                letterSpacing: '-0.02em',
              }}>
                {nowPlaying?.title ?? '— Esperando al DJ...'}
              </div>
              {nowPlaying && (
                <div style={{
                  fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)',
                  marginTop: '0.15rem',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {nowPlaying.artist}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Right: vote count */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', flexShrink: 0 }}
        >
          <motion.div
            key={totalVotes}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            style={{
              fontSize: '3.5rem', fontWeight: '900', lineHeight: 1,
              background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            {totalVotes}
          </motion.div>
          <div style={{
            fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginTop: '0.2rem',
          }}>
            votos totales
          </div>
        </motion.div>
      </header>

      {/* ══════════════ BODY ══════════════ */}
      <main style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        flex: 1,
        position: 'relative',
        zIndex: 5,
        minHeight: 0,
      }}>

        {/* ── Ranking ── */}
        <section style={{ padding: '2rem 2.5rem 2rem 3rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '0.65rem',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(236,72,153,0.3))',
              border: '1px solid rgba(124,58,237,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}>
              🏆
            </div>
            <h2 style={{
              fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.8)',
            }}>
              Ranking en Vivo
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {top10.map((song, index) => {
              const pct = maxVotes > 0 ? (song.votes / maxVotes) * 100 : 0;
              const isTop = index === 0;
              const trend = getTrend(song.id, index);

              return (
                <motion.div
                  layout
                  key={song.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  style={{
                    padding: isTop ? '1.25rem 1.5rem' : '0.9rem 1.5rem',
                    borderRadius: '1.25rem',
                    background: isTop
                      ? 'linear-gradient(135deg, rgba(109,40,217,0.18) 0%, rgba(236,72,153,0.1) 100%)'
                      : 'rgba(255,255,255,0.025)',
                    border: isTop
                      ? '1px solid rgba(139,92,246,0.4)'
                      : '1px solid rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isTop ? '0 0 40px rgba(109,40,217,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  {/* Progress bar bg */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      background: isTop
                        ? 'linear-gradient(90deg, rgba(124,58,237,0.18), transparent)'
                        : 'linear-gradient(90deg, rgba(255,255,255,0.03), transparent)',
                      pointerEvents: 'none',
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
                    <RankBadge index={index} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          fontSize: isTop ? '1.75rem' : '1.3rem',
                          fontWeight: '800',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          color: isTop ? 'white' : 'rgba(255,255,255,0.8)',
                          flex: 1, minWidth: 0,
                          letterSpacing: isTop ? '-0.02em' : '-0.01em',
                        }}>
                          {song.title}
                        </div>
                        {trend === 'up' && (
                          <motion.span
                            key={`${song.id}-up`}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ fontSize: isTop ? '1.2rem' : '0.9rem', flexShrink: 0, filter: 'drop-shadow(0 0 6px #f97316)' }}
                          >🔥</motion.span>
                        )}
                        {trend === 'down' && (
                          <span style={{ fontSize: '0.8rem', color: 'rgba(148,163,184,0.6)', flexShrink: 0 }}>↓</span>
                        )}
                        {trend === 'new' && (
                          <span style={{
                            fontSize: '0.55rem', fontWeight: '800', padding: '0.1rem 0.45rem',
                            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                            borderRadius: 999, color: '#22c55e', letterSpacing: '0.08em', flexShrink: 0,
                          }}>NUEVO</span>
                        )}
                      </div>
                      <div style={{
                        fontSize: isTop ? '1rem' : '0.85rem',
                        color: 'rgba(255,255,255,0.35)',
                        marginTop: '0.1rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {song.artist}
                      </div>
                      {/* Bar */}
                      <div style={{ marginTop: '0.6rem', height: isTop ? 4 : 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: 99,
                            background: isTop ? 'linear-gradient(90deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.18)',
                            boxShadow: isTop ? '0 0 8px rgba(124,58,237,0.5)' : 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Votos */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <motion.div
                        key={song.votes}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                        style={{
                          fontSize: isTop ? '2.5rem' : '1.8rem',
                          fontWeight: '900', lineHeight: 1,
                          background: isTop ? 'linear-gradient(135deg, #a78bfa, #f472b6)' : undefined,
                          WebkitBackgroundClip: isTop ? 'text' : undefined,
                          WebkitTextFillColor: isTop ? 'transparent' : undefined,
                          color: isTop ? undefined : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {song.votes}
                      </motion.div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        votos
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>

        {/* ── QR Sidebar ── */}
        <aside style={{
          padding: '2rem 2.5rem 2rem 0',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem',
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 22 }}
            style={{
              background: 'rgba(8,3,24,0.8)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: '2rem',
              padding: '2rem',
              textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
              backdropFilter: 'blur(24px)',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 0 60px rgba(109,40,217,0.12)',
            }}
          >
            {/* Glow top */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(236,72,153,0.4), transparent)',
            }} />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{ fontSize: '2.5rem' }}
            >
              🎧
            </motion.div>

            <div>
              <div style={{
                fontSize: '1.3rem', fontWeight: '900',
                background: 'linear-gradient(90deg, #a78bfa, #f472b6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: '0.04em', marginBottom: '0.35rem',
              }}>
                ¡ESCANEÁ Y VOTÁ!
              </div>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                Elegí el próximo tema
              </p>
            </div>

            {/* QR */}
            <div style={{ position: 'relative' }}>
              {[1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2 + i * 0.1], opacity: [0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.6, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: -16 * i, borderRadius: '1.5rem',
                    border: '2px solid rgba(139,92,246,0.35)', pointerEvents: 'none',
                  }}
                />
              ))}
              <div style={{
                background: 'white', padding: '0.85rem',
                borderRadius: '1.25rem',
                boxShadow: '0 0 60px rgba(124,58,237,0.4), 0 0 120px rgba(124,58,237,0.15)',
              }}>
                <QRCodeSVG
                  value={`${window.location.origin}/event/${id}`}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0d0020"
                  level="H"
                />
              </div>
            </div>

            <p style={{
              fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)',
              fontWeight: '600', letterSpacing: '0.05em',
            }}>
              ecmusic.app/event/{id}
            </p>
          </motion.div>
        </aside>
      </main>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{
        padding: '0.75rem 3rem',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(3,0,16,0.7)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 10,
      }}>
        <span style={{
          fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.12)', textTransform: 'uppercase',
        }}>
          Music<span style={{ color: '#7c3aed' }}>Party</span>
        </span>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.08)' }}>
          El poder de la música en tus manos
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <motion.div
            animate={{ opacity: syncing ? [1, 0.2, 1] : [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: syncing ? 0.6 : 2 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.18)', fontWeight: '600' }}>
            {syncing ? 'Sincronizando...' : 'En vivo'}
          </span>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          main { grid-template-columns: 1fr !important; }
          aside { display: none !important; }
          header { padding: 1.25rem 1.5rem !important; }
          header h1 { font-size: 2rem !important; }
          section { padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default MirrorMode;
