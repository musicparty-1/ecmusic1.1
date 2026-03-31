import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { events, songs as songsApi, votes } from '../../api/api';
import { useDevice } from '../../hooks/useDevice';
import { Search, ThumbsUp, Music, CheckCircle2, PartyPopper, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
        style={{
          height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="glass-card" 
          style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '2.5rem' }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
          >
            <PartyPopper size={64} style={{ color: 'var(--primary)', marginBottom: '1.5rem', margin: '0 auto' }} />
          </motion.div>
          <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{eventData?.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>📍 {eventData?.venue}</p>
          {eventData?.status === 'PENDING' && (
            <div style={{
              background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)',
              borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem',
              fontSize: '0.82rem', color: '#fbbf24', lineHeight: 1.5,
            }}>
              ◷ <strong>Pre-votación abierta</strong> — el evento aún no comenzó.<br />
              ¡Votá tus favoritas y ayudá a armar el setlist!
            </div>
          )}
          <button
            type="button"
            onClick={() => setHasEntered(true)}
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.25rem' }}
          >
            {eventData?.status === 'PENDING' ? '⭐ Votar el setlist' : 'Entrar a votar'}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="container" style={{ padding: '0 1rem', paddingBottom: '5rem' }}>
      {eventData?.status === 'PENDING' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '0.75rem', padding: '0.65rem 1rem', margin: '1rem 0',
            fontSize: '0.8rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}>◷</motion.span>
          <span><strong>Pre-votación</strong> — el evento todavía no comenzó. Tus votos van a definir el setlist.</span>
        </motion.div>
      )}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          margin: '0 -1rem', padding: '1rem',
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <motion.div
            animate={nowPlaying ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            style={{
              width: '40px', height: '40px', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: nowPlaying ? '0 0 16px rgba(139,92,246,0.5)' : 'none',
            }}
          >
            <Music color="white" size={20} />
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {nowPlaying ? <span className="badge-live"><span className="badge-live-dot" />EN VIVO</span> : 'Ahora Sonando'}
              {syncing && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', marginLeft: '0.25rem' }} />}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={nowPlaying?.id ?? 'none'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={nowPlayingFlash ? 'destello' : ''}
                style={{ fontWeight: '700', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {nowPlaying ? nowPlaying.title : 'Esperando música...'}
              </motion.div>
            </AnimatePresence>
            {nowPlaying && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{nowPlaying.artist}</div>
            )}
          </div>

          {/* Emoji reactions */}
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => launchEmoji(emoji, e)}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '9999px', width: '36px', height: '36px',
                  cursor: 'pointer', fontSize: '1.1rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.1s, background 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.85)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          {eventData?.isRecitalMode ? 'VOTA EL PRÓXIMO TEMA' : 'Vota el próximo tema'}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {eventData?.isRecitalMode ? 'El artista quiere que elijas lo que sigue' : 'Tus votos deciden la noche'}
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)',
            borderRadius: '9999px', padding: '0.35rem 0.9rem',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>
              {votedSongs.length}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              / {eventData?.maxVotesPerDevice || 3} votos
            </span>
            <div style={{ display: 'flex', gap: '3px', marginLeft: '2px' }}>
              {Array.from({ length: eventData?.maxVotesPerDevice || 3 }).map((_, i) => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: i < votedSongs.length ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem', padding: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar canción o artista..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem', background: 'transparent', border: 'none' }}
          />
        </div>
      </div>

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
                    border: isTop ? '1px solid rgba(139,92,246,0.4)' : undefined
                  }}
                >
                  {/* Posición */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: isTop ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '0.8rem'
                  }}>
                    {pos + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</h3>
                    {/* Barra de progreso */}
                    {totalVotes > 0 && (
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', margin: '4px 0', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((song.votes / totalVotes) * 100)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: '2px',
                            background: isTop
                              ? 'linear-gradient(90deg, var(--primary), var(--accent))'
                              : 'rgba(139,92,246,0.5)',
                          }}
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{song.artist}</p>
                      {trend === 'up' && <TrendingUp size={12} style={{ color: 'var(--success)' }} />}
                      {trend === 'down' && <TrendingDown size={12} style={{ color: '#ef4444' }} />}
                      {trend === 'same' && song.votes > 0 && <Minus size={12} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>

                  {/* Votos */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right', marginRight: '0.5rem' }}>
                    {song.votes > 0 && <div style={{ fontWeight: '600', color: isTop ? 'var(--primary)' : undefined }}>{song.votes}</div>}
                    {song.votes > 0 && <div>votos</div>}
                  </div>

                  {/* Acción */}
                  {votedSongs.includes(song.id) ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: 'var(--success)', flexShrink: 0 }}>
                      <CheckCircle2 size={28} />
                    </motion.div>
                  ) : votingId === song.id ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                      style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <div style={{ width: 20, height: 20, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      title={`Votar por ${song.title}`}
                      onClick={() => handleVote(song.id)}
                      disabled={votedSongs.length >= (eventData?.maxVotesPerDevice || 3) || !!votingId}
                      className="btn-primary vote-btn"
                      style={{
                        width: '48px', height: '48px', padding: 0, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        opacity: votedSongs.length >= (eventData?.maxVotesPerDevice || 3) ? 0.5 : 1,
                        cursor: votedSongs.length >= (eventData?.maxVotesPerDevice || 3) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ThumbsUp size={20} />
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
        padding: '0.75rem', textAlign: 'center',
        background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)',
        fontSize: '0.75rem', color: 'var(--text-muted)',
        borderTop: '1px solid var(--glass-border)'
      }}>
        Participando en {eventData?.name} • ID: {deviceId?.substring(0, 8)}
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

