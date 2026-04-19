import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { events, songs as songsApi, votes } from '../../api/api';
import { useDevice } from '../../hooks/useDevice';
import { Search, ThumbsUp, Music, CheckCircle2, TrendingUp, TrendingDown, Minus, MapPin, Zap, Radio } from 'lucide-react';

interface FloatingEmoji { id: number; emoji: string; x: number; y: number; }
const EMOJIS = ['❤️', '🔥', '🎵'];

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
  status: string;
  isRecitalMode: boolean;
  maxVotesPerDevice: number;
}

const PublicVote = () => {
  const { id } = useParams<{ id: string }>();
  const deviceId = useDevice();
  const storageKey = id ? `voted_${id}` : null;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  // Hydrate votedSongs from localStorage so they survive a page refresh
  const [votedSongs, setVotedSongs] = useState<number[]>(() => {
    if (!id) return [];
    try {
      const stored = localStorage.getItem(`voted_${id}`);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
      return [];
    }
  });
  const [votingId, setVotingId] = useState<number | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [impactMsg, setImpactMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [nowPlayingFlash, setNowPlayingFlash] = useState(false);
  const [voterCelebration, setVoterCelebration] = useState<Song | null>(null);
  const prevNowPlayingId = useRef<number | null>(null);
  const prevRankRef = useRef<Record<number, number>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const launchEmoji = useCallback((emoji: string, e: React.MouseEvent) => {
    const id = Date.now();
    const x = e.clientX;
    const y = e.clientY;
    setFloatingEmojis(prev => [...prev, { id, emoji, x, y }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(f => f.id !== id)), 1300);
  }, []);

  const fetchData = async (silent = false) => {
    if (!id) return;
    if (!silent) setSyncing(true);
    try {
      const evRes = await events.getOne(parseInt(id));
      setEventData(evRes.data);
      const songsRes = await songsApi.getByEvent(parseInt(id));
      const fetchedSongs: Song[] = songsRes.data;

      // Guardar ranking anterior antes de actualizar
      const unplayed = fetchedSongs.filter((s) => !s.played).sort((a, b) => b.votes - a.votes);
      const newRank: Record<number, number> = {};
      unplayed.forEach((s, i) => { newRank[s.id] = i; });
      prevRankRef.current = newRank;

      // Liberar votos de canciones que ya sonaron: el slot vuelve a estar disponible
      const playedIds = new Set(fetchedSongs.filter(s => s.played).map(s => s.id));
      setVotedSongs(prev => {
        const updated = prev.filter(id => !playedIds.has(id));
        if (updated.length !== prev.length && id) {
          try { localStorage.setItem(`voted_${id}`, JSON.stringify(updated)); } catch { /* quota */ }
        }
        return updated;
      });

      setSongs(fetchedSongs);
      setFetchError(false);

      const played = fetchedSongs
        .filter((s: Song) => s.played)
        .sort((a: Song, b: Song) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      const newNowPlaying = played[0] || null;
      if (newNowPlaying?.id !== prevNowPlayingId.current) {
        prevNowPlayingId.current = newNowPlaying?.id ?? null;
        if (newNowPlaying) {
          setNowPlayingFlash(true);
          setTimeout(() => setNowPlayingFlash(false), 900);
          // Si el usuario votó por esta canción, mostrar celebración
          let storedVotes: number[] = [];
          try {
            const stored = localStorage.getItem(`voted_${id}`);
            storedVotes = stored ? JSON.parse(stored) : [];
          } catch { /* */ }
          if (storedVotes.includes(newNowPlaying.id)) {
            setVoterCelebration(newNowPlaying);
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors: ['#8b5cf6', '#ec4899', '#fbbf24', '#ffffff'], disableForReducedMotion: true });
            setTimeout(() => setVoterCelebration(null), 5000);
          }
        }
      }
      setNowPlaying(newNowPlaying);
    } catch (err) {
      console.error(err);
      setFetchError(true);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 8s polling — same as dashboard, avoids 429s
    const interval = setInterval(() => fetchData(true), 8000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!id || !deviceId) return;
    const sendHeartbeat = () => events.heartbeat(parseInt(id), deviceId).catch(() => {});
    sendHeartbeat();
    const hb = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(hb);
  }, [id, deviceId]);

  const handleVote = async (songId: number) => {
    if (!deviceId || votingId) return;

    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    setVotingId(songId);
    try {
      await votes.create(songId, deviceId);
      const newVoted = [...votedSongs, songId];
      setVotedSongs(newVoted);
      // Persist votes so they survive a page refresh
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify(newVoted)); } catch { /* quota */ }
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#8b5cf6', '#ec4899', '#ffffff'],
        disableForReducedMotion: true,
      });

      const songsRes = await songsApi.getByEvent(parseInt(id!));
      const updatedSongs: Song[] = songsRes.data;
      const unplayed = updatedSongs.filter((s) => !s.played).sort((a, b) => b.votes - a.votes);

      if (unplayed.length > 0 && unplayed[0].id === songId) {
        const votedSong = updatedSongs.find((s) => s.id === songId);
        if (votedSong) {
          setImpactMsg(`¡Tu voto le dio el #1 a "${votedSong.title}"!`);
          setTimeout(() => setImpactMsg(null), 3500);
        }
      }

      const newRank: Record<number, number> = {};
      unplayed.forEach((s, i) => { newRank[s.id] = i; });
      prevRankRef.current = newRank;
      setSongs(updatedSongs);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al votar');
    } finally {
      setVotingId(null);
    }
  };

  const sortedUnplayed = [...songs]
    .filter((s) => !s.played)
    .sort((a, b) => b.votes - a.votes);

  const totalVotes = sortedUnplayed.reduce((sum, s) => sum + s.votes, 0);

  const filteredSongs = sortedUnplayed.filter((s) =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.artist.toLowerCase().includes(query.toLowerCase())
  );

  // Posición actual por song id (0-indexed)
  const currentRank: Record<number, number> = {};
  sortedUnplayed.forEach((s, i) => { currentRank[s.id] = i; });

  const getTrend = (songId: number) => {
    const prev = prevRankRef.current[songId];
    const curr = currentRank[songId];
    if (prev === undefined || prev === curr) return 'same';
    return prev > curr ? 'up' : 'down';
  };

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', padding: '2rem 1.25rem' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Header skeleton */}
          <div className="skeleton-shimmer" style={{ height: 28, width: '60%', marginBottom: '1.5rem' }} />
          {/* Sticky bar skeleton */}
          <div className="skeleton-shimmer" style={{ height: 64, borderRadius: 14, marginBottom: '1.5rem' }} />
          {/* Song cards */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="skeleton-shimmer" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div className="skeleton-shimmer" style={{ height: 14, width: `${60 + i * 8}%` }} />
                <div className="skeleton-shimmer" style={{ height: 3, width: '100%' }} />
                <div className="skeleton-shimmer" style={{ height: 11, width: '35%' }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '380px', width: '100%', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            No se pudo conectar
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            Verificá tu conexión a internet e intentá de nuevo.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => { setFetchError(false); setLoading(true); fetchData(); }}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!hasEntered) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
      >
        {/* Ambient background */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 55% at 80% 5%, rgba(124,58,237,0.2) 0%, transparent 60%), radial-gradient(ellipse 55% 40% at 15% 95%, rgba(236,72,153,0.12) 0%, transparent 60%)' }} />

        <motion.div
          initial={{ scale: 0.94, y: 28, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: '100%', maxWidth: '420px', position: 'relative',
            background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '24px', padding: '2.5rem 2rem', textAlign: 'center', overflow: 'hidden',
          }}
        >
          {/* Top glow line */}
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7), transparent)' }} />

          {/* Icon */}
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
            style={{
              width: 80, height: 80, borderRadius: '22px', margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(124,58,237,0.5), 0 0 0 1px rgba(139,92,246,0.2)',
            }}
          >
            <Music size={36} color="white" />
          </motion.div>

          {/* Event name */}
          <h1 style={{
            fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1.15,
            background: 'linear-gradient(135deg, #fff 30%, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '0.75rem',
          }}>
            {eventData?.name}
          </h1>

          {/* Venue badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '9999px', padding: '0.3rem 0.9rem',
            fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.75rem',
          }}>
            <MapPin size={11} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
            {eventData?.venue}
          </div>

          {/* Votes available box */}
          <div style={{
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '14px', padding: '0.9rem 1.25rem', marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.6rem', fontWeight: '700' }}>
              Votos disponibles
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              {Array.from({ length: eventData?.maxVotesPerDevice || 3 }).map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.55)',
                }} />
              ))}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '0.25rem', fontWeight: '600' }}>
                × {eventData?.maxVotesPerDevice || 3}
              </span>
            </div>
          </div>

          {/* Pending notice */}
          {eventData?.status === 'PENDING' && (
            <div style={{
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
              fontSize: '0.78rem', color: '#fbbf24', lineHeight: 1.6,
            }}>
              <strong>Pre-votación abierta</strong> — el evento aún no comenzó.<br />
              ¡Votá tus favoritas y ayudá a armar el setlist!
            </div>
          )}

          {/* CTA Button */}
          <motion.button
            type="button"
            onClick={() => setHasEntered(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', height: '52px', border: 'none', borderRadius: '14px',
              background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 55%, #ec4899 100%)',
              color: 'white', fontWeight: '800', fontSize: '0.95rem', letterSpacing: '0.02em',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: '0 8px 28px rgba(124,58,237,0.5)',
            }}
          >
            <Zap size={17} fill="white" />
            {eventData?.status === 'PENDING' ? 'Votar el setlist' : 'Entrar a votar'}
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="container" style={{ padding: '0 1rem', paddingBottom: '5rem', position: 'relative' }}>
      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 65% 45% at 90% 0%, rgba(124,58,237,0.1) 0%, transparent 55%), radial-gradient(ellipse 45% 35% at 5% 100%, rgba(236,72,153,0.07) 0%, transparent 55%)' }} />

      {/* ── VOTER CELEBRATION OVERLAY ── */}
      <AnimatePresence>
        {voterCelebration && (
          <motion.div
            key="voter-celebration"
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{
              position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, width: 'calc(100% - 2rem)', maxWidth: '420px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(236,72,153,0.95) 100%)',
              borderRadius: '20px', padding: '1.5rem 1.75rem',
              boxShadow: '0 16px 48px rgba(124,58,237,0.55), 0 0 0 1px rgba(255,255,255,0.15)',
              backdropFilter: 'blur(20px)',
              cursor: 'pointer',
            }}
            onClick={() => setVoterCelebration(null)}
          >
            {/* Glow top line */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                style={{ fontSize: '2.5rem', flexShrink: 0, lineHeight: 1 }}
              >
                🔥
              </motion.div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  ¡Tu voto hizo la diferencia!
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'white', lineHeight: 1.25, marginBottom: '0.15rem' }}>
                  Vos ayudaste a que suene este tema
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
                  {voterCelebration.title} — {voterCelebration.artist}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {eventData?.status === 'PENDING' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)',
            borderRadius: '12px', padding: '0.65rem 1rem', margin: '0.75rem 0 0',
            fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}>◷</motion.span>
          <span><strong>Pre-votación</strong> — el evento todavía no comenzó. Tus votos van a definir el setlist.</span>
        </motion.div>
      )}
      {eventData?.status === 'FINISHED' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '0.75rem 1rem', margin: '0.75rem 0 0',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🎤</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.1rem' }}>Evento finalizado</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>La votación cerró — este es el ranking final.</div>
          </div>
        </motion.div>
      )}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(8,10,16,0.9)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          margin: '0 -1rem', padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Vinyl disc / now playing icon */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <motion.div
              animate={nowPlaying ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              style={{
                width: 42, height: 42,
                background: nowPlaying
                  ? 'linear-gradient(135deg, #6d28d9, #8b5cf6, #ec4899)'
                  : 'rgba(255,255,255,0.06)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: nowPlaying ? '0 0 20px rgba(139,92,246,0.55)' : 'none',
                transition: 'box-shadow 0.3s',
              }}
            >
              <Radio size={18} color="white" />
            </motion.div>
            {nowPlaying && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', border: '2px solid #08080f', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
              {nowPlaying ? <span className="badge-live"><span className="badge-live-dot" />EN VIVO</span> : <span>AHORA SONANDO</span>}
              {syncing && <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary-light)' }} />}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={nowPlaying?.id ?? 'none'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={nowPlayingFlash ? 'destello' : ''}
                style={{ fontWeight: '700', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}
              >
                {nowPlaying ? nowPlaying.title : 'Esperando música...'}
              </motion.div>
            </AnimatePresence>
            {nowPlaying && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>{nowPlaying.artist}</div>
            )}
          </div>

          {/* Emoji reactions */}
          <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => launchEmoji(emoji, e)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '9999px', width: '34px', height: '34px',
                  cursor: 'pointer', fontSize: '1rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.1s, background 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.82)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
              {eventData?.isRecitalMode ? 'Votá el próximo tema' : 'Votá el próximo tema'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {eventData?.isRecitalMode ? 'El artista elige lo que sigue' : 'Tus votos deciden la noche'}
            </p>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flexShrink: 0,
            background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '0.6rem 0.9rem', backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>Votos</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: eventData?.maxVotesPerDevice || 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: i < votedSongs.length ? [1.3, 1] : 1 }}
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < votedSongs.length ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'rgba(255,255,255,0.12)',
                    boxShadow: i < votedSongs.length ? '0 0 6px rgba(124,58,237,0.6)' : 'none',
                    transition: 'background 0.3s, box-shadow 0.3s',
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: votedSongs.length >= (eventData?.maxVotesPerDevice || 3) ? 'var(--text-muted)' : 'var(--primary-light)' }}>
              {votedSongs.length}/{eventData?.maxVotesPerDevice || 3}
            </div>
          </div>
        </div>
      </header>

      <div style={{
        position: 'relative', marginBottom: '1.5rem',
        background: 'rgba(13,17,23,0.7)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px',
      }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar canción o artista..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '1rem', height: '46px', background: 'transparent', border: 'none', fontSize: '0.85rem' }}
        />
      </div>

      {/* Banner sin votos disponibles */}
      {votedSongs.length >= (eventData?.maxVotesPerDevice || 3) && eventData?.status !== 'FINISHED' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))',
            border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: '1rem', padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🎉</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
              ¡Usaste todos tus votos!
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Votaste por {votedSongs.length} canción{votedSongs.length !== 1 ? 'es' : ''} — ahora esperá que suenen.
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence mode="popLayout">
          {filteredSongs.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}
            >
              <Music size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
              <p>No hay canciones disponibles para votar</p>
            </motion.div>
          ) : (
            filteredSongs.map((song: Song) => {
              const pos = currentRank[song.id] ?? 0;
              const trend = getTrend(song.id);
              const isTop = pos === 0;
              return (
                <motion.div
                  layout
                  key={song.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card vote-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                    border: isTop ? '1px solid rgba(139,92,246,0.4)' :
                      votedSongs.includes(song.id) ? '1px solid rgba(34,197,94,0.25)' :
                      '1px solid rgba(255,255,255,0.06)',
                    borderLeftWidth: '3px',
                    borderLeftStyle: 'solid',
                    borderLeftColor: isTop
                      ? 'var(--primary)'
                      : pos === 1 ? 'rgba(192,192,192,0.45)'
                      : pos === 2 ? 'rgba(205,127,50,0.45)'
                      : votedSongs.includes(song.id) ? 'rgba(34,197,94,0.55)'
                      : 'transparent',
                    boxShadow: isTop ? '0 4px 20px rgba(124,58,237,0.1)' : undefined,
                  }}
                >
                  {/* Posición */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: pos === 0
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                      : pos === 1 ? 'linear-gradient(135deg, #d4d4d4, #9ca3af)'
                      : pos === 2 ? 'linear-gradient(135deg, #cd7f32, #b87333)'
                      : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: pos < 3 ? '1rem' : '0.75rem',
                    color: pos < 3 ? '#000' : 'var(--text-muted)',
                    boxShadow: pos === 0 ? '0 2px 10px rgba(255,215,0,0.35)' :
                      pos === 1 ? '0 2px 8px rgba(212,212,212,0.2)' :
                      pos === 2 ? '0 2px 8px rgba(205,127,50,0.2)' : 'none',
                  }}>
                    {pos === 0 ? '🥇' : pos === 1 ? '🥈' : pos === 2 ? '🥉' : pos + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{song.title}</h3>
                    {/* Barra de progreso con % */}
                    <div style={{ margin: '5px 0 3px' }}>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: totalVotes > 0 ? `${Math.round((song.votes / totalVotes) * 100)}%` : '0%' }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: '99px',
                            background: isTop
                              ? 'linear-gradient(90deg, var(--primary), var(--accent))'
                              : votedSongs.includes(song.id)
                                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                : 'rgba(139,92,246,0.45)',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{song.artist}</p>
                      {trend === 'up' && <TrendingUp size={12} style={{ color: 'var(--success)' }} />}
                      {trend === 'down' && <TrendingDown size={12} style={{ color: '#ef4444' }} />}
                      {trend === 'same' && song.votes > 0 && <Minus size={12} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>

                  {/* Votos + % */}
                  <div style={{ flexShrink: 0, textAlign: 'right', marginRight: '0.4rem', minWidth: 40 }}>
                    <motion.div
                      key={song.votes}
                      initial={song.votes > 0 ? { scale: 1.35, color: '#a78bfa' } : {}}
                      animate={{ scale: 1, color: song.votes === 0 ? 'var(--text-muted)' : isTop ? 'var(--primary-light)' : 'var(--text-secondary)' }}
                      transition={{ duration: 0.35 }}
                      style={{ fontWeight: '800', fontSize: '1rem', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
                    >
                      {song.votes === 0 ? '—' : song.votes}
                    </motion.div>
                    {totalVotes > 0 && song.votes > 0 && (
                      <div style={{ fontSize: '0.65rem', color: isTop ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', marginTop: '0.1rem', fontVariantNumeric: 'tabular-nums' }}>
                        {Math.round((song.votes / totalVotes) * 100)}%
                      </div>
                    )}
                  </div>

                  {/* Acción */}
                  {votedSongs.includes(song.id) ? (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      style={{
                        height: '38px', padding: '0 1rem', borderRadius: '9999px',
                        display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0,
                        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)',
                        color: 'var(--success)', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.06em',
                      }}
                    >
                      <CheckCircle2 size={13} />
                      VOTADO
                    </motion.div>
                  ) : votingId === song.id ? (
                    <div style={{
                      height: '38px', padding: '0 1.1rem', borderRadius: '9999px',
                      display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0,
                      background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
                    }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                      >
                        <div style={{ width: 14, height: 14, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      </motion.div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.06em' }}>...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      title={`Votar por ${song.title}`}
                      onClick={() => handleVote(song.id)}
                      disabled={votedSongs.length >= (eventData?.maxVotesPerDevice || 3) || !!votingId}
                      className="vote-btn"
                      style={{
                        height: '38px', padding: '0 1.1rem', borderRadius: '9999px',
                        display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0,
                        background: votedSongs.length >= (eventData?.maxVotesPerDevice || 3)
                          ? 'rgba(255,255,255,0.05)'
                          : 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                        border: votedSongs.length >= (eventData?.maxVotesPerDevice || 3)
                          ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        color: votedSongs.length >= (eventData?.maxVotesPerDevice || 3) ? '#64748b' : 'white',
                        fontWeight: '800', fontSize: '0.72rem', letterSpacing: '0.06em',
                        cursor: votedSongs.length >= (eventData?.maxVotesPerDevice || 3) ? 'not-allowed' : 'pointer',
                        boxShadow: votedSongs.length >= (eventData?.maxVotesPerDevice || 3)
                          ? 'none' : '0 4px 14px rgba(124,58,237,0.45)',
                        transition: 'all 0.2s', fontFamily: 'inherit',
                      }}
                    >
                      <ThumbsUp size={13} />
                      VOTAR
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Toast de impacto del voto */}
      <AnimatePresence>
        {impactMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--primary)', color: 'white',
              padding: '0.75rem 1.5rem', borderRadius: '2rem', zIndex: 200,
              fontWeight: '600', fontSize: '0.875rem', whiteSpace: 'nowrap',
              boxShadow: '0 8px 20px rgba(139,92,246,0.4)'
            }}
          >
            🏆 {impactMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
              background: '#ef4444', color: 'white',
              padding: '0.75rem 1.5rem', borderRadius: '2rem', zIndex: 201,
              fontWeight: '600', fontSize: '0.875rem', whiteSpace: 'nowrap',
              boxShadow: '0 8px 20px rgba(239,68,68,0.4)'
            }}
          >
            ⚠️ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(8,10,16,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '0.6rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {eventData?.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>sincronizado</span>
          {syncing
            ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 10, height: 10, border: '1.5px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(34,197,94,0.5)' }} />
          }
        </div>
      </footer>

      {/* Offline banner (CSS index.css) */}
      <AnimatePresence>
        {fetchError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="offline-banner"
            style={{ zIndex: 9999 }}
          >
            ⚠️ Sin conexión - Reintentando...
          </motion.div>
        )}
      </AnimatePresence>

      {floatingEmojis.map(f => (
        <div key={f.id} className="emoji-float" style={{ left: f.x, top: f.y }}>
          {f.emoji}
        </div>
      ))}
    </div>
  );
};

export default PublicVote;

