import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { events, songs as songsApi, catalog as catalogApi, billing as billingApi } from '../../api/api';
import {
  Plus, Music, List, QrCode,
  Power, ExternalLink, Settings, LogOut, Trophy,
  BarChart2, FileText, Download, Trash2, ChevronUp, ChevronDown, ChevronRight, X, Check, ArrowLeft, Zap, History, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRModal from '../../components/QRModal';
import SkeletonLoader from '../../components/SkeletonLoader';

interface Song {
  id: number;
  title: string;
  artist: string;
  votes: number;
  played: boolean;
  played_at?: string;
  created_at: string;
}

interface EventStats {
  totalVotes: number;
  uniqueVoters: number;
  engagement: number | string;
}

interface Event {
  id: number;
  name: string;
  venue: string;
  status: string;
  isRecitalMode: boolean;
  maxVotesPerDevice: number;
  created_at: string;
  _count?: { songs: number };
}

const DJDashboard = () => {
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ranking, setRanking] = useState<Song[]>([]);
  const [playedSongs, setPlayedSongs] = useState<Song[]>([]);
  const [stats, setStats] = useState<EventStats>({ totalVotes: 0, uniqueVoters: 0, engagement: 0 });
  const [elapsed, setElapsed] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventsPanel, setShowEventsPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ name: '', venue: '', date: new Date().toISOString().split('T')[0], template_id: '', isPending: false });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closedSummary, setClosedSummary] = useState<any>(null);
  const [showSongModal, setShowSongModal] = useState(false);
  const [showFullCatalogModal, setShowFullCatalogModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplatesSection, setShowTemplatesSection] = useState(false);
  const [showPastEventsSection, setShowPastEventsSection] = useState(false);
  const [selectedPastEvent, setSelectedPastEvent] = useState<any>(null);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [fullCatalog, setFullCatalog] = useState<any[]>([]);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [songList, setSongList] = useState<Song[]>([]);
  const [newSong, setNewSong] = useState({ title: '', artist: '' });
  const [catalogSuggestions, setCatalogSuggestions] = useState<{ id: number; title: string; artist: string; genre: string }[]>([]);
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [billingStatus, setBillingStatus] = useState<{ plan: string; subscriptionStatus: string; daysLeft: number } | null>(null);
  const [activeDevices, setActiveDevices] = useState<number>(0);
  const [albumArt, setAlbumArt] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const djUser = JSON.parse(localStorage.getItem('dj_user') || '{}');
  // Guard: if somehow we reach here without a valid id, we rely on ProtectedRoute
  // to redirect. Avoid falling back to 1 which would show another DJ's events.
  const djId = djUser.id ?? null;
  const initialEventId = (location.state as any)?.eventId as number | undefined;

  // Album art from iTunes
  useEffect(() => {
    if (!nowPlaying) { setAlbumArt(null); return; }
    const q = encodeURIComponent(`${nowPlaying.artist} ${nowPlaying.title}`);
    fetch(`https://itunes.apple.com/search?term=${q}&media=music&limit=1`)
      .then(r => r.json())
      .then(d => {
        const url = d.results?.[0]?.artworkUrl100?.replace('100x100', '300x300');
        setAlbumArt(url || null);
      })
      .catch(() => setAlbumArt(null));
  }, [nowPlaying?.id]);

  // Elapsed timer for live events
  useEffect(() => {
    if (selectedEvent?.status !== 'ACTIVE') { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [selectedEvent?.status, selectedEvent?.id]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    if (h > 0) return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  };

  const fetchEvents = async () => {
    if (!djId) return;
    try {
      const res = await api.get(`/events?dj_id=${djId}`);
      if (res.data && res.data.length > 0) {
        setMyEvents(res.data);
        if (!selectedEventId) {
          const preferred = initialEventId
            ? res.data.find((e: Event) => e.id === initialEventId)
            : null;
          const first = preferred || res.data[0];
          setSelectedEventId(first.id);
          setSelectedEvent(first);
        } else {
          const updated = res.data.find((e: Event) => e.id === selectedEventId);
          if (updated) {
            setSelectedEvent(updated);
            // Si el evento activo pasó a FINISHED, cambiar a uno activo o volver al home
            if (updated.status === 'FINISHED') {
              const activeEvent = res.data.find((e: Event) => e.status === 'ACTIVE' || e.status === 'PENDING');
              if (activeEvent) {
                setSelectedEventId(activeEvent.id);
                setSelectedEvent(activeEvent);
              } else {
                navigate('/dj/home');
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await events.getTemplates();
      setTemplates(res.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchPastEvents = async () => {
    if (!djId) return;
    try {
      const res = await api.get(`/events?dj_id=${djId}`);
      const finished = (res.data || []).filter((ev: any) => ev.status === 'FINISHED');
      setPastEvents(finished);
    } catch (err) {
      console.error('Error fetching past events:', err);
    }
  };

  const fetchRanking = async (id: number) => {
    try {
      const res = await songsApi.getRanking(id);
      setRanking(res.data);

      const statsRes = await events.getStats(id);
      setStats(statsRes.data);

      const playedRes = await songsApi.getPlayedSongs(id);
      const played = playedRes.data.sort((a: Song, b: Song) => {
          const timeA = a.played_at ? new Date(a.played_at).getTime() : new Date(a.created_at).getTime();
          const timeB = b.played_at ? new Date(b.played_at).getTime() : new Date(b.created_at).getTime();
          return timeB - timeA;
      });
      setPlayedSongs(played);
      setNowPlaying(played[0] || null);

      const devicesRes = await events.getActiveDevices(id);
      setActiveDevices(devicesRes.data.count ?? 0);
    } catch (err) {
      console.error('Error fetching ranking:', err);
    }
  };

  // Single polling interval — replaces cascading 5s fetches that caused 429s
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchTemplates();
    fetchPastEvents();
    billingApi.getStatus().then(r => setBillingStatus(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedEventId) return;

    // Clear closed event summary when switching to a different event
    setClosedSummary(null);

    fetchRanking(selectedEventId);

    // 8s is safe: avoids 429s while keeping UI reasonably fresh
    pollRef.current = setInterval(() => {
      if (isMounted.current) fetchRanking(selectedEventId);
    }, 8000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedEventId]);

  const openSongModal = async () => {
    if (!selectedEventId) return;
    try {
      const res = await songsApi.getByEvent(selectedEventId);
      setSongList(res.data);
      setShowSongModal(true);
    } catch { showToast('Error al cargar canciones', 'error'); }
  };

  const handleAddSong = async () => {
    if (!newSong.title || !newSong.artist || !selectedEventId) return;
    try {
      await events.addSongs(selectedEventId, [{ title: newSong.title, artist: newSong.artist }]);
      setNewSong({ title: '', artist: '' });
      const res = await songsApi.getByEvent(selectedEventId);
      setSongList(res.data);
      fetchRanking(selectedEventId);
      showToast('Canción agregada', 'success');
    } catch { showToast('Error al agregar canción', 'error'); }
  };

  const handleDeleteSong = async (id: number) => {
    try {
      await songsApi.delete(id);
      setSongList(prev => prev.filter(s => s.id !== id));
      if (selectedEventId) fetchRanking(selectedEventId);
    } catch { showToast('Error al eliminar canción', 'error'); }
  };

  const moveSong = (index: number, direction: 'up' | 'down') => {
    const next = direction === 'up' ? index - 1 : index + 1;
    if (next < 0 || next >= songList.length) return;
    const updated = [...songList];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    setSongList(updated);
  };

  const handleCatalogSearch = async (q: string) => {
    setNewSong(prev => ({ ...prev, title: q }));
    if (q.length < 2) { setCatalogSuggestions([]); setShowCatalogDropdown(false); return; }
    try {
      const res = await catalogApi.search(q);
      setCatalogSuggestions(res.data);
      setShowCatalogDropdown(res.data.length > 0);
    } catch { setCatalogSuggestions([]); }
  };

  const selectCatalogSong = (song: { title: string; artist: string }) => {
    setNewSong({ title: song.title, artist: song.artist });
    setCatalogSuggestions([]);
    setShowCatalogDropdown(false);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.venue) return;
    try {
      setIsProcessing(true);
      const res = await events.create({
        name: newEvent.name,
        venue: newEvent.venue,
        event_date: newEvent.date,
        dj_id: djUser.id || 1,
        template_id: newEvent.template_id ? parseInt(newEvent.template_id) : undefined,
        status: newEvent.isPending ? 'PENDING' : 'ACTIVE',
      });
      showToast(newEvent.isPending ? 'Pre-evento creado' : 'Evento creado con éxito', 'success');
      setShowCreateModal(false);
      setNewEvent({ name: '', venue: '', template_id: '', isPending: false });
      fetchEvents();
      setSelectedEventId(res.data.id);
      setSelectedEvent(res.data);
    } catch (err) {
      console.error('Error creating event:', err);
      showToast('Error al crear evento', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsPlayed = async (songId: number) => {
    try {
      await songsApi.markAsPlayed(songId);
      if (selectedEventId) fetchRanking(selectedEventId);
      showToast('Continuando con el siguiente tema...', 'success');
    } catch (err) {
      console.error('Error marking as played:', err);
      showToast('Error al marcar canción', 'error');
    }
  };

  const handleCloseEvent = async () => {
    if (!selectedEventId) return;
    try {
      await events.close(selectedEventId);
      const summaryRes = await events.getSummary(selectedEventId);
      setClosedSummary(summaryRes.data);
      setShowCloseConfirm(false);
      fetchEvents();
    } catch (err) {
      console.error('Error closing event:', err);
      showToast('Error al cerrar evento', 'error');
    }
  };

  const handleExportClosed = async () => {
    if (!closedSummary) return;
    const res = await events.getExport(closedSummary.event.id);
    const blob = new Blob([res.data.content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = res.data.filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSet = async () => {
    if (!selectedEventId) return;
    try {
      const res = await events.getExport(selectedEventId);
      const blob = new Blob([res.data.content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = res.data.filename; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast('Error al exportar', 'error'); }
  };

  const publicUrl = `${window.location.origin}/event/${selectedEventId}`;
  const mirrorUrl = `${window.location.origin}/mirror/${selectedEventId}`;

  if (loading) return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '2rem' }}>
      <div className="container"><SkeletonLoader /></div>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem',
    padding: '0.6rem 0.8rem', color: 'white', fontSize: '0.8rem',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.12em',
    color: '#4b5563', textTransform: 'uppercase', marginBottom: '0.85rem',
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'white' }}>

      {/* ── TOPBAR ─────────────────────────────────────────── */}
      <nav style={{
        background: '#0a0a10',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 clamp(1rem, 2vw, 2rem)',
        height: 'clamp(70px, 8vw, 100px)',
        display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 1.5rem)',
        position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
        backdropFilter: 'blur(12px)',
      }}>
        {/* Left: Back + Logo + event selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            title="Volver al inicio"
            onClick={() => navigate('/dj/home')}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.3rem', display: 'flex', borderRadius: '0.4rem', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <ArrowLeft size={16} />
          </button>
          <img src="/logo.png" alt="EC Music" style={{
            width: 'clamp(32px, 4.5vw, 52px)', height: 'clamp(32px, 4.5vw, 52px)', 
            borderRadius: '0.6rem', objectFit: 'cover'
          }} />
          <span style={{ fontWeight: '800', fontSize: 'clamp(0.85rem, 1.5vw, 1.3rem)', letterSpacing: '-0.02em' }}>
            EC <span style={{ color: '#8b5cf6' }}>Music</span>
          </span>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 0.15rem' }} />
          {selectedEvent ? (
            <button
              type="button"
              title="Cambiar de evento"
              onClick={() => { setShowEventsPanel(!showEventsPanel); setShowSettingsPanel(false); }}
              style={{
                background: showEventsPanel ? 'rgba(255,255,255,0.06)' : 'none',
                border: 'none', cursor: 'pointer',
                padding: '0.25rem 0.5rem', borderRadius: '0.4rem',
                display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'white',
              }}
            >
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontWeight: '700', fontSize: 'clamp(0.85rem, 1.5vw, 1.3rem)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedEvent.name}</div>
                <div style={{ fontSize: 'clamp(0.6rem, 1vw, 0.9rem)', color: '#64748b', lineHeight: 1 }}>{selectedEvent.venue}</div>
              </div>
              <ChevronDown size={window.innerWidth < 768 ? 14 : 20} style={{ color: '#64748b', flexShrink: 0 }} />
            </button>
          ) : (
            <button
              type="button"
              title="Crear nuevo evento"
              onClick={() => setShowCreateModal(true)}
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '0.4rem', padding: '0.2rem 0.65rem', cursor: 'pointer', fontSize: '0.72rem', color: '#8b5cf6', fontWeight: '600' }}
            >
              + Nuevo evento
            </button>
          )}
        </div>

        {/* Center: timer + stats */}
        {selectedEvent?.status === 'ACTIVE' && (
          <div className="dj-topbar-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', overflow: 'hidden' }}>
            <span className="chip chip-cyan" style={{ fontFamily: '"Courier New", monospace', fontSize: '0.88rem', fontWeight: '800', letterSpacing: '0.1em', flexShrink: 0 }}>
              {formatElapsed(elapsed)}
            </span>
            <div className="badge-live" style={{ flexShrink: 0 }}>
              <div className="badge-live-dot" />
              EN VIVO
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.3rem, 1vw, 0.8rem)', flexShrink: 0 }}>
              {[
                { label: 'VOTOS',   value: stats.totalVotes,    cls: 'chip-violet' },
                { label: 'SONADAS', value: playedSongs.length,  cls: 'chip-green'  },
                { label: 'ASIST',   value: stats.uniqueVoters,  cls: 'chip-amber'  },
                { label: 'EN VIVO', value: activeDevices,       cls: 'chip-cyan'   },
              ].map(s => (
                <div key={s.label} className={`chip ${s.cls}`} style={{ padding: 'clamp(0.2rem, 0.5vw, 0.5rem) clamp(0.4rem, 1vw, 1rem)', gap: '0.3rem' }}>
                  <span style={{ fontWeight: '800', fontSize: 'clamp(0.75rem, 1.2vw, 1.1rem)' }}>{s.value}</span>
                  <span style={{ opacity: 0.65, fontSize: 'clamp(0.5rem, 0.8vw, 0.75rem)', letterSpacing: '0.07em' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedEvent?.status === 'PENDING' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: '600', letterSpacing: '0.06em' }}>◷ PRE-EVENTO · VOTACIÓN ABIERTA</span>
          </div>
        )}

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto', flexShrink: 0 }}>
          {billingStatus && (
            <button type="button" className="btn-pill dj-topbar-billing" aria-label="Ver estado de facturación" onClick={() => navigate('/dj/billing')} style={{
              background: billingStatus.subscriptionStatus === 'EXPIRED' ? 'rgba(239,68,68,0.15)' : billingStatus.subscriptionStatus === 'ACTIVE' ? 'rgba(16,185,129,0.12)' : 'rgba(251,191,36,0.12)',
              borderColor: billingStatus.subscriptionStatus === 'EXPIRED' ? 'rgba(239,68,68,0.4)' : billingStatus.subscriptionStatus === 'ACTIVE' ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)',
              color: billingStatus.subscriptionStatus === 'EXPIRED' ? '#ef4444' : billingStatus.subscriptionStatus === 'ACTIVE' ? '#10b981' : '#fbbf24',
              fontWeight: '700',
            }}>
              {billingStatus.subscriptionStatus === 'EXPIRED' ? '⚠ Expirado' : billingStatus.subscriptionStatus === 'ACTIVE' ? `✓ ${billingStatus.plan}` : `◷ ${billingStatus.daysLeft}d`}
            </button>
          )}

          {/* Separator */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', margin: '0 0.1rem' }} />

          <button type="button" className="btn-pill" title="Proyectar pantalla gigante para el público" aria-label="Proyectar pantalla gigante" onClick={() => window.open(mirrorUrl, '_blank')} style={{ padding: '0.65rem 1.25rem', gap: '0.6rem', fontSize: '0.85rem' }}>
            <ExternalLink size={18} /> PROYECTAR
          </button>
          <button type="button" className="btn-pill" title="Ver y descargar código QR del evento" aria-label="Ver código QR del evento" onClick={() => setShowQRModal(true)} style={{ padding: '0.65rem 1.25rem', gap: '0.6rem', fontSize: '0.85rem' }}>
            <QrCode size={18} /> VER QR
          </button>

          {/* Separator */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', margin: '0 0.1rem' }} />

          {selectedEvent?.status === 'ACTIVE' && (
            <button type="button" className="btn-pill" title="Cerrar y finalizar este evento" onClick={() => setShowCloseConfirm(true)}
              style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', padding: '0.65rem 1.25rem', gap: '0.6rem', fontSize: '0.85rem' }}>
              <Power size={18} /> CERRAR EVENTO
            </button>
          )}
          {selectedEvent?.status === 'PENDING' && (
            <button type="button" className="btn-pill" title="Lanzar en vivo"
              onClick={async () => {
                try { await events.launch(selectedEventId!); showToast('¡Evento lanzado en vivo!', 'success'); fetchEvents(); }
                catch { showToast('Error al lanzar evento', 'error'); }
              }}
              style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.06)', padding: '0.5rem 1rem', gap: '0.5rem' }}>
              ▶ LANZAR EN VIVO
            </button>
          )}

          {/* Separator */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', margin: '0 0.1rem' }} />

          <button type="button" className="btn-pill"
            title="Configuración del evento (Votos, Modo Recital)"
            aria-label="Configuración del evento"
            onClick={() => { setShowSettingsPanel(!showSettingsPanel); setShowEventsPanel(false); }}
            style={{ background: showSettingsPanel ? 'rgba(255,255,255,0.08)' : undefined, padding: '0.65rem 1rem' }}
          >
            <Settings size={22} />
          </button>
          <button type="button" className="btn-pill"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={() => { localStorage.removeItem('dj_user'); navigate('/dj/login'); }}
            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)', padding: '0.65rem 1rem' }}
          >
            <LogOut size={22} />
          </button>
        </div>
      </nav>

      {/* ── BILLING BANNER ─────────────────────────────────── */}
      <AnimatePresence>
        {billingStatus && (billingStatus.subscriptionStatus === 'EXPIRED' || (billingStatus.subscriptionStatus === 'TRIAL' && billingStatus.daysLeft <= 5)) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{
              background: billingStatus.subscriptionStatus === 'EXPIRED' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.08)',
              borderBottom: `1px solid ${billingStatus.subscriptionStatus === 'EXPIRED' ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.2)'}`,
              padding: '0.5rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: billingStatus.subscriptionStatus === 'EXPIRED' ? '#ef4444' : '#fbbf24' }}>
              {billingStatus.subscriptionStatus === 'EXPIRED'
                ? '⚠ Tu período de prueba expiró. Algunas funciones están bloqueadas.'
                : `◷ Tu prueba vence en ${billingStatus.daysLeft} día${billingStatus.daysLeft !== 1 ? 's' : ''}.`}
            </span>
            <button type="button" onClick={() => navigate('/dj/billing')} style={{
              background: billingStatus.subscriptionStatus === 'EXPIRED' ? '#ef4444' : '#fbbf24',
              color: billingStatus.subscriptionStatus === 'EXPIRED' ? 'white' : '#000',
              border: 'none', borderRadius: '999px', padding: '0.25rem 0.8rem',
              fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer',
            }}>
              {billingStatus.subscriptionStatus === 'EXPIRED' ? 'Elegir plan' : 'Ver planes'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EVENTS DROPDOWN PANEL ──────────────────────────── */}
      <AnimatePresence>
        {showEventsPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEventsPanel(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed', top: '60px', left: '12px', zIndex: 200,
                width: '290px', background: '#0d1117',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
                overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase' }}>MIS EVENTOS</span>
                <button type="button" onClick={() => { setShowCreateModal(true); setShowEventsPanel(false); }}
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '0.35rem', padding: '0.15rem 0.5rem', cursor: 'pointer', fontSize: '0.62rem', color: '#8b5cf6', fontWeight: '700' }}>
                  + NUEVO
                </button>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {myEvents.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>Sin eventos</div>
                ) : myEvents.map((ev: Event) => {
                  const isSelected = selectedEventId === ev.id;
                  const isLive = ev.status === 'ACTIVE';
                  const isPending = ev.status === 'PENDING';
                  const isFinished = ev.status === 'FINISHED';

                  const handleExportEvent = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const res = await events.getExport(ev.id);
                    const blob = new Blob([res.data.content], { type: 'text/csv;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = res.data.filename; a.click();
                    URL.revokeObjectURL(url);
                  };

                  return (
                    <div key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div
                        onClick={() => {
                          if (isFinished) {
                            setShowEventsPanel(false);
                            navigate(`/dj/events/${ev.id}/summary`);
                            return;
                          }
                          setSelectedEventId(ev.id);
                          setSelectedEvent(ev);
                          setShowEventsPanel(false);
                        }}
                        style={{
                          padding: '0.6rem 1rem', cursor: 'pointer',
                          background: isSelected ? 'rgba(139,92,246,0.1)' : 'transparent',
                          borderLeft: isSelected ? '2px solid #8b5cf6' : '2px solid transparent',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{ev.venue}</div>
                        </div>
                        <span style={{
                          fontSize: '0.56rem', padding: '0.1rem 0.35rem', borderRadius: '9999px', fontWeight: '700', flexShrink: 0,
                          background: isLive ? 'rgba(16,185,129,0.15)' : isPending ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)',
                          color: isLive ? '#10b981' : isPending ? '#fbbf24' : '#64748b',
                        }}>
                          {isLive ? '● LIVE' : isPending ? '◷ PREV' : 'FIN'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.15rem', padding: '0.1rem 0.85rem 0.4rem' }}>
                        {isPending && (
                          <button type="button" onClick={async (e) => { e.stopPropagation(); try { await events.launch(ev.id); showToast('¡Evento lanzado!', 'success'); fetchEvents(); } catch { showToast('Error', 'error'); } }}
                            style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '0.1rem 0.3rem', fontSize: '0.6rem', borderRadius: '0.25rem' }}>▶ Lanzar</button>
                        )}
                        {isFinished && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/dj/events/${ev.id}/summary`); }}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.1rem 0.3rem', fontSize: '0.6rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                            <FileText size={9} /> Resumen
                          </button>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/dj/events/${ev.id}/analytics`); }}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.1rem 0.3rem', fontSize: '0.6rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          <BarChart2 size={9} /> Stats
                        </button>
                        <button type="button" onClick={handleExportEvent}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.1rem 0.3rem', fontSize: '0.6rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          <Download size={9} /> CSV
                        </button>
                        <button type="button" onClick={async (e) => { e.stopPropagation(); try { await events.duplicate(ev.id); showToast('Duplicado', 'success'); fetchEvents(); } catch { showToast('Error', 'error'); } }}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.1rem 0.3rem', fontSize: '0.6rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          <Plus size={9} /> Dup
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── SETTINGS DROPDOWN PANEL ────────────────────────── */}
      <AnimatePresence>
        {showSettingsPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettingsPanel(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed', top: '60px', right: '12px', zIndex: 200,
                width: '240px', background: '#0d1117',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
                overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase' }}>CONFIGURACIÓN</span>
              </div>
              <div style={{ padding: '0.5rem 0.75rem' }}>
                {/* Recital mode toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Modo Recital</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedEvent) return;
                      const newVal = !selectedEvent.isRecitalMode;
                      setSelectedEvent({ ...selectedEvent, isRecitalMode: newVal });
                      setMyEvents(prev => prev.map(ev => ev.id === selectedEventId ? { ...ev, isRecitalMode: newVal } : ev));
                      try { await events.toggleRecital(selectedEventId!); }
                      catch { showToast('Error al cambiar modo recital', 'error'); }
                    }}
                    style={{
                      width: 36, height: 20, borderRadius: 99, position: 'relative', flexShrink: 0,
                      background: selectedEvent?.isRecitalMode ? '#8b5cf6' : 'rgba(255,255,255,0.15)',
                      border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, left: selectedEvent?.isRecitalMode ? 18 : 2,
                      width: 16, height: 16, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                {/* Max votes */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Votos por persona</span>
                  <select
                    title="Máximo de votos por persona"
                    value={selectedEvent?.maxVotesPerDevice || 3}
                    onChange={async (e) => {
                      if (!selectedEventId || !selectedEvent) return;
                      const val = parseInt(e.target.value);
                      setSelectedEvent({ ...selectedEvent, maxVotesPerDevice: val });
                      setMyEvents(prev => prev.map(ev => ev.id === selectedEventId ? { ...ev, maxVotesPerDevice: val } : ev));
                      try { await events.setMaxVotes(selectedEventId, val); }
                      catch { showToast('Error al actualizar votos', 'error'); }
                    }}
                    style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', padding: '0.2rem 0.4rem', color: 'white', fontSize: '0.78rem', width: '52px', cursor: 'pointer' }}
                  >
                    {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {/* Links */}
                {[
                  { icon: <ExternalLink size={13} />, label: 'Modo Espejo', action: () => { window.open(mirrorUrl, '_blank'); setShowSettingsPanel(false); } },
                  { icon: <BarChart2 size={13} />, label: 'Analytics', action: () => { selectedEventId && navigate(`/dj/events/${selectedEventId}/analytics`); setShowSettingsPanel(false); } },
                  { icon: <Settings size={13} />, label: 'Planes y billing', action: () => { navigate('/dj/billing'); setShowSettingsPanel(false); } },
                ].map(item => (
                  <button key={item.label} type="button" title={item.label} onClick={item.action}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem 0.25rem', fontSize: '0.78rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'inherit' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      {!selectedEvent ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '340px' }}>
            <div style={{ width: 60, height: 60, borderRadius: '1rem', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 32px rgba(139,92,246,0.3)' }}>
              <Music size={26} color="white" />
            </div>
            <h2 style={{ fontWeight: '800', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Sin eventos activos</h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Crea tu primer evento para empezar a recibir votos.</p>
            <button type="button" onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ fontSize: '0.88rem' }}>
              Crear evento
            </button>
          </div>
        </div>
      ) : (
        <div className="dj-main-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0 }}>

          {/* ── LEFT: RANKING ──────────────────────────────── */}
          <section style={{ padding: '1.25rem 1.5rem', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', minHeight: 0, background: '#000' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={sectionLabel}>RANKING ACTIVO (PEDIDOS)</span>
              <span style={{
                fontSize: '0.58rem', padding: '0.15rem 0.5rem', borderRadius: '9999px',
                background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)',
                color: '#8b5cf6', fontWeight: '700', letterSpacing: '0.05em',
              }}>
                {ranking.length} EN COLA
              </span>
            </div>

            {ranking.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', gap: '0.75rem', opacity: 0.25 }}>
                <Music size={36} />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sin canciones en cola</span>
              </div>
            ) : (() => {
              const maxVotes = Math.max(...ranking.map(s => s.votes || 0), 1);
              const medals: Record<number, { emoji: string; color: string; bg: string; border: string }> = {
                0: { emoji: '🥇', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
                1: { emoji: '🥈', color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)' },
                2: { emoji: '🥉', color: '#cd7c4a', bg: 'rgba(205,124,74,0.06)',  border: 'rgba(205,124,74,0.18)'  },
              };
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <AnimatePresence mode="popLayout">
                    {ranking.map((song, index) => {
                      const medal = medals[index];
                      const pct = Math.round(((song.votes || 0) / maxVotes) * 100);
                      const isTop = index < 3;
                      return (
                        <motion.div
                          layout
                          key={song.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            display: 'flex', flexDirection: 'column',
                            padding: 'clamp(0.75rem, 1.5vw, 1.5rem) clamp(1rem, 2vw, 2rem)',
                            borderRadius: 'clamp(0.6rem, 1.2vw, 1.2rem)',
                            background: isTop ? medal!.bg : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isTop ? medal!.border : 'rgba(255,255,255,0.05)'}`,
                            position: 'relative', overflow: 'hidden',
                          }}
                        >
                          {/* Top glow line */}
                          {index === 0 && (
                            <div style={{
                              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                              background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
                              opacity: 0.6,
                            }} />
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {/* Position */}
                            <div style={{
                              width: 26, height: 26, borderRadius: '0.4rem', flexShrink: 0,
                              background: isTop ? `rgba(${index === 0 ? '245,158,11' : index === 1 ? '148,163,184' : '205,124,74'},0.15)` : 'rgba(255,255,255,0.04)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {isTop
                                ? <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{medal!.emoji}</span>
                                : <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#475569' }}>{index + 1}</span>}
                            </div>

                            {/* Song info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '1.35rem', fontWeight: index === 0 ? '900' : '800',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                color: index === 0 ? '#fff' : '#cbd5e1',
                              }}>
                                {song.title}
                              </div>
                              <div style={{ fontSize: '1rem', color: '#64748b', marginTop: '0.2rem', fontWeight: '500' }}>
                                {song.artist}
                              </div>
                            </div>

                            {/* Votes */}
                            <span style={{
                              fontSize: '1.4rem', fontWeight: '900', flexShrink: 0,
                              color: isTop ? medal!.color : '#374151', minWidth: '40px', textAlign: 'center'
                            }}>
                              {song.votes > 0 ? song.votes : '—'}
                            </span>

                            {/* Mark as played */}
                            <button
                              type="button"
                              title="Marcar como sonó"
                              onClick={() => handleMarkAsPlayed(song.id)}
                              style={{
                                width: 'clamp(44px, 6vw, 64px)', 
                                height: 'clamp(44px, 6vw, 64px)', 
                                borderRadius: 'clamp(0.5rem, 1vw, 1rem)', flexShrink: 0,
                                background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#22c55e', padding: 0,
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.25)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              <Check size={window.innerWidth < 768 ? 24 : 36} strokeWidth={3} />
                            </button>
                          </div>

                          {/* Progress bar */}
                          {song.votes > 0 && (
                            <div style={{ marginTop: '0.45rem', height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                style={{
                                  height: '100%', borderRadius: 99,
                                  background: index === 0
                                    ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                                    : index === 1
                                      ? 'linear-gradient(90deg, #64748b, #94a3b8)'
                                      : index === 2
                                        ? 'linear-gradient(90deg, #92400e, #cd7c4a)'
                                        : 'linear-gradient(90deg, #4c1d95, #7c3aed)',
                                }}
                              />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              );
            })()}
          </section>

          {/* ── RIGHT SIDEBAR ──────────────────────────────── */}
          <aside className="dj-sidebar" style={{ background: '#0a0a10', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>

            {/* REPRODUCIENDO AHORA */}
            <div>
              <div style={sectionLabel}>REPRODUCIENDO AHORA</div>
              {nowPlaying ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Album art with glow */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div style={{
                      position: 'absolute', inset: -8, borderRadius: '1.1rem',
                      background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.3) 0%, transparent 70%)',
                      filter: 'blur(8px)',
                      zIndex: 0,
                    }} />
                    <div style={{
                      width: '100%', aspectRatio: '1/1', borderRadius: '0.85rem', overflow: 'hidden',
                      background: 'linear-gradient(135deg,#1e1b4b,#2d1b69)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', zIndex: 1,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.2)',
                    }}>
                      {albumArt ? (
                        <img src={albumArt} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        /* Vinyl disc effect */
                        <div style={{ position: 'relative', width: 90, height: 90 }}>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                            style={{
                              width: 90, height: 90, borderRadius: '50%',
                              background: 'conic-gradient(from 0deg, #1a1a2e, #16213e, #0f3460, #533483, #1a1a2e)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                            }}
                          >
                            {/* Rings */}
                            {[70, 52, 34].map(size => (
                              <div key={size} style={{
                                position: 'absolute', width: size, height: size, borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.06)',
                              }} />
                            ))}
                            {/* Center hole */}
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                              boxShadow: '0 0 10px rgba(139,92,246,0.5)',
                              position: 'relative', zIndex: 1,
                            }} />
                          </motion.div>
                        </div>
                      )}
                    </div>
                    {/* LIVE badge */}
                    <div className="badge-live" style={{
                      position: 'absolute', bottom: '0.6rem', left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(34,197,94,0.9)', borderColor: 'transparent',
                      color: 'white', zIndex: 2,
                    }}>
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', display: 'inline-block' }}
                      />
                      LIVE
                    </div>
                  </div>

                  {/* Song info */}
                  <div style={{
                    width: '100%', background: 'rgba(139,92,246,0.06)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    borderRadius: '0.65rem', padding: '0.6rem 0.75rem',
                  }}>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.2rem' }}>
                      {nowPlaying.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: '600' }}>{nowPlaying.artist}</div>

                    {/* Sound wave bars */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, marginTop: '0.5rem' }}>
                      {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 1, 0.5, 0.6].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={{ scaleY: [h, h * 0.3, h, h * 0.6, h] }}
                          transition={{ duration: 0.8 + i * 0.07, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            width: 3, borderRadius: 2,
                            background: i % 3 === 0 ? '#7c3aed' : i % 3 === 1 ? '#8b5cf6' : '#a78bfa',
                            transformOrigin: 'bottom',
                            height: `${h * 100}%`,
                          }}
                        />
                      ))}
                      <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.35rem', alignSelf: 'center' }}>
                        {nowPlaying.votes} votos
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '1.25rem 0.75rem', borderRadius: '0.65rem',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  color: '#374151', fontSize: '0.72rem', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                }}>
                  <Music size={20} style={{ opacity: 0.3 }} />
                  Nada sonando aún
                </div>
              )}
            </div>

            {/* AGREGAR CANCIÓN */}
            <div>
              <div style={{...sectionLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                AGREGAR CANCIÓN
                <button type="button" onClick={async () => {
                  try {
                    const res = await catalogApi.getAll();
                    setFullCatalog(res.data);
                    setShowFullCatalogModal(true);
                  } catch { showToast('Error al cargar catálogo', 'error'); }
                }} style={{
                  background: 'transparent', border: 'none', color: '#8b5cf6',
                  fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0
                }}>
                  <List size={12} /> Ver catálogo completo
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Título / buscar catálogo"
                    value={newSong.title}
                    onChange={(e) => handleCatalogSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !showCatalogDropdown) handleAddSong(); if (e.key === 'Escape') setShowCatalogDropdown(false); }}
                    onBlur={(e) => { setTimeout(() => setShowCatalogDropdown(false), 150); e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
                    style={inputStyle}
                  />
                  {showCatalogDropdown && catalogSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                      background: '#111827', border: '1px solid rgba(139,92,246,0.22)',
                      borderRadius: '0.5rem', marginTop: '0.2rem', overflow: 'hidden',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                    }}>
                      {catalogSuggestions.map((s) => (
                        <div key={s.id} onMouseDown={() => selectCatalogSong(s)}
                          style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.12)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: '600' }}>{s.title}</div>
                          <div style={{ fontSize: '0.64rem', color: '#64748b' }}>{s.artist} · {s.genre}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="Artista"
                    value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSong(); }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    style={{ ...inputStyle, flex: 1, width: 'auto' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSong}
                    disabled={!newSong.title || !newSong.artist}
                    style={{
                      width: 36, height: 36, borderRadius: '0.5rem', flexShrink: 0,
                      background: '#7c3aed',
                      border: '1px solid #8b5cf6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: (!newSong.title || !newSong.artist) ? 'not-allowed' : 'pointer',
                      color: 'white', opacity: (!newSong.title || !newSong.artist) ? 0.4 : 1,
                      padding: 0,
                    }}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <button type="button" onClick={openSongModal}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.63rem', marginTop: '0.5rem', padding: '0.2rem 0', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >
                <List size={11} /> Gestionar lista completa
              </button>
            </div>

            {/* HISTORIAL DE LA NOCHE */}
            <div style={{ flex: 1 }}>
              <div style={sectionLabel}>
                HISTORIAL DE LA NOCHE ({playedSongs.length} REPRODUCIDAS)
              </div>
              {playedSongs.length === 0 ? (
                <div style={{ color: '#374151', fontSize: '0.7rem', textAlign: 'center', padding: '1.5rem 0' }}>
                  Todavía no sonó ninguna
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {playedSongs.map((song, i) => (
                    <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.4rem', borderRadius: '0.4rem' }}>
                      <span style={{ fontSize: '0.58rem', color: '#374151', fontWeight: '700', width: '16px', textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8' }}>{song.title}</div>
                        <div style={{ fontSize: '0.6rem', color: '#374151' }}>{song.artist}</div>
                      </div>
                      <Check size={10} style={{ color: '#10b981', flexShrink: 0, opacity: 0.5 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </aside>
        </div>
      )}

      {/* ── CREATE EVENT MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.25 }}
              style={{ width: '100%', maxWidth: '480px', background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
            >
              <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(139,92,246,0.08) 0%, transparent 100%)' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 40%, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  CREAR NUEVO EVENTO
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>Listo en 30 segundos</p>
              </div>
              <div style={{ padding: '1.75rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.85rem', textTransform: 'uppercase' }}>Detalles del evento</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <Music size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input type="text" placeholder="Nombre del evento" className="input-field" style={{ paddingLeft: '2.4rem' }} value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} autoFocus />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ position: 'relative' }}>
                        <ExternalLink size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input type="text" placeholder="Lugar / Venue" className="input-field" style={{ paddingLeft: '2.4rem', width: '100%' }} value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input type="date" className="input-field" style={{ paddingLeft: '2.4rem', width: '100%' }} value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
                {templates.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.65rem', textTransform: 'uppercase' }}>Playlist inicial (opcional)</p>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={newEvent.template_id} 
                        onChange={(e) => setNewEvent({ ...newEvent, template_id: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem 0.85rem 2.5rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '0.75rem',
                          color: 'white',
                          fontSize: '0.9rem',
                          appearance: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        <option value="" style={{ background: '#111827' }}>- Evento vacío (sin canciones) -</option>
                        {templates.map(t => (
                          <option key={t.id} value={String(t.id)} style={{ background: '#111827' }}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }}>
                        <Music size={16} />
                      </div>
                      <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                )}
                <div onClick={() => setNewEvent(prev => ({ ...prev, isPending: !prev.isPending }))} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', background: newEvent.isPending ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${newEvent.isPending ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                  <div style={{ width: 36, height: 20, borderRadius: 99, position: 'relative', background: newEvent.isPending ? '#fbbf24' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: newEvent.isPending ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: newEvent.isPending ? '#fbbf24' : 'var(--text-main)' }}>Modo pre-evento</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>El público vota días antes del evento</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: '0 0 auto', padding: '0.85rem 1.5rem' }}>Cancelar</button>
                  <motion.button type="button" onClick={handleCreateEvent} className="btn-primary" disabled={isProcessing || !newEvent.name || !newEvent.venue} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, fontSize: '1rem', fontWeight: '700', padding: '0.85rem', letterSpacing: '0.04em', opacity: (!newEvent.name || !newEvent.venue) ? 0.5 : 1, background: newEvent.isPending ? 'linear-gradient(135deg, #d97706, #fbbf24)' : undefined }}>
                    {isProcessing ? 'Creando...' : newEvent.isPending ? '◷ CREAR PRE-EVENTO' : 'CREAR EVENTO'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CLOSE EVENT CONFIRM ────────────────────────────── */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCloseConfirm(false); }}
            style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ width: '100%', maxWidth: '400px', background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Power size={24} style={{ color: '#ef4444' }} />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>¿Cerrar el evento?</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Se desactivará la votación y se generará el resumen automáticamente.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCloseConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <motion.button type="button" onClick={handleCloseEvent} whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}>
                  Cerrar evento
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CLOSED SUMMARY ─────────────────────────────────── */}
      <AnimatePresence>
        {closedSummary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '520px', background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}
            >
              <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.1))', padding: '1.5rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Evento cerrado · Reporte final</div>
                <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>{closedSummary.event.name}</h2>
                <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>📍 {closedSummary.event.venue}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Votos totales', value: closedSummary.totalVotes, color: 'var(--accent)' },
                  { label: 'Participantes', value: closedSummary.uniqueVoters, color: 'var(--primary)' },
                  { label: 'Canciones tocadas', value: `${closedSummary.playedCount}/${closedSummary.totalSongs}`, color: 'var(--success)' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '1.25rem', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.2rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {closedSummary.topSongs.length > 0 && (
                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trophy size={22} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>Top hit de la noche</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{closedSummary.topSongs[0].title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{closedSummary.topSongs[0].artist}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent)' }}>{closedSummary.topSongs[0].votes}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>votos</div>
                  </div>
                </div>
              )}
              <div style={{ padding: '1.25rem 1.75rem', display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={handleExportClosed} className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Download size={15} /> Descargar set
                </button>
                <motion.button type="button" onClick={() => setClosedSummary(null)} className="btn-primary" whileTap={{ scale: 0.97 }} style={{ flex: 1, fontSize: '0.85rem', fontWeight: '700' }}>
                  Volver al dashboard
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SONG MANAGEMENT MODAL ──────────────────────────── */}
      <AnimatePresence>
        {showSongModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSongModal(false); }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.25 }}
              style={{ width: '100%', maxWidth: '560px', background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
            >
              <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(139,92,246,0.08) 0%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 40%, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LISTA DE CANCIONES</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{selectedEvent?.name} · {songList.length} en cola</p>
                </div>
                <button type="button" title="Cerrar" aria-label="Cerrar" onClick={() => setShowSongModal(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <p style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Agregar canción</p>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input type="text" placeholder="Buscar en catálogo o escribir título" className="input-field" style={{ width: '100%' }} value={newSong.title}
                      onChange={(e) => handleCatalogSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !showCatalogDropdown) handleAddSong(); if (e.key === 'Escape') setShowCatalogDropdown(false); }}
                      onBlur={() => setTimeout(() => setShowCatalogDropdown(false), 150)}
                    />
                    {showCatalogDropdown && catalogSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '0.75rem', marginTop: '0.25rem', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                        {catalogSuggestions.map((s) => (
                          <div key={s.id} onMouseDown={() => selectCatalogSong(s)}
                            style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>{s.title}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.artist} · {s.genre}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="text" placeholder="Artista" className="input-field" style={{ flex: 1 }} value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSong(); }}
                  />
                  <motion.button type="button" onClick={handleAddSong} className="btn-primary" whileTap={{ scale: 0.95 }} disabled={!newSong.title || !newSong.artist}
                    style={{ padding: '0 1.25rem', flexShrink: 0, opacity: (!newSong.title || !newSong.artist) ? 0.5 : 1 }}>
                    <Plus size={18} />
                  </motion.button>
                </div>
              </div>

              {/* Boliche Playlists Section */}
              <div style={{ padding: '0 1.75rem', marginBottom: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowTemplatesSection(!showTemplatesSection)}
                  style={{
                    width: '100%', padding: '0.65rem 1.25rem', background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.85rem',
                    color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.12)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Music size={15} /> 📀 PLAYLISTS PREDISEÑADAS (BOLICHE)
                  </div>
                  {showTemplatesSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showTemplatesSection && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    style={{ 
                      marginTop: '0.6rem', background: 'rgba(0,0,0,0.25)', borderRadius: '1rem', 
                      border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' 
                    }}
                  >
                    {!selectedTemplate ? (
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {templates.map(t => (
                          <div key={t.id} onClick={() => setSelectedTemplate(t)}
                            style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>{t.name}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t.songs?.length || 0} canciones</div>
                            </div>
                            <ChevronRight size={16} color="#64748b" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                          <button onClick={() => setSelectedTemplate(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#8b5cf6', cursor: 'pointer', display: 'flex', padding: '0.4rem', borderRadius: '0.5rem' }}><ArrowLeft size={16} /></button>
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', display: 'block' }}>{selectedTemplate.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{selectedTemplate.description}</span>
                          </div>
                        </div>
                        <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                          {selectedTemplate.songs?.map((ts: any) => (
                            <div key={ts.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ts.title}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ts.artist}</div>
                              </div>
                              <button 
                                onClick={async () => {
                                  if (!selectedEventId) return;
                                  try {
                                    await events.addSongs(selectedEventId, [{ title: ts.title, artist: ts.artist }]);
                                    const res = await songsApi.getByEvent(selectedEventId);
                                    setSongList(res.data);
                                    fetchRanking(selectedEventId);
                                    showToast(`"${ts.title}" añadida`, 'success');
                                  } catch { showToast('Error al añadir', 'error'); }
                                }}
                                style={{ background: 'rgba(34,197,94,0.15)', border: 'none', color: '#22c55e', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}
                              >+ Añadir</button>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={async () => {
                            if (!selectedEventId || !selectedTemplate.songs) return;
                            try {
                              setIsProcessing(true);
                              const toAdd = selectedTemplate.songs.map((s: any) => ({ title: s.title, artist: s.artist }));
                              await events.addSongs(selectedEventId, toAdd);
                              const res = await songsApi.getByEvent(selectedEventId);
                              setSongList(res.data);
                              fetchRanking(selectedEventId);
                              showToast(`Playlist "${selectedTemplate.name}" cargada`, 'success');
                              setSelectedTemplate(null);
                              setShowTemplatesSection(false);
                            } catch { showToast('Error al cargar playlist', 'error'); }
                            finally { setIsProcessing(false); }
                          }}
                          className="btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.85rem', borderRadius: '0.75rem' }}
                        >
                          {isProcessing ? 'Cargando...' : 'CARGAR TODA LA PLAYLIST'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Past Events Import Section */}
              <div style={{ padding: '0 1.75rem', marginBottom: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPastEventsSection(!showPastEventsSection)}
                  style={{
                    width: '100%', padding: '0.65rem 1.25rem', background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.25)', borderRadius: '0.85rem',
                    color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.12)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <History size={15} /> 📀 IMPORTAR DE EVENTO ANTERIOR
                  </div>
                  {showPastEventsSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showPastEventsSection && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    style={{ 
                      marginTop: '0.6rem', background: 'rgba(0,0,0,0.25)', borderRadius: '1rem', 
                      border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' 
                    }}
                  >
                    {!selectedPastEvent ? (
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {pastEvents.length === 0 ? (
                          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No hay eventos finalizados en el historial.</div>
                        ) : (
                          pastEvents.map(ev => (
                            <div key={ev.id} onClick={async () => {
                              try {
                                const res = await events.getSummary(ev.id);
                                setSelectedPastEvent({ ...ev, songs: res.data.songs });
                              } catch { showToast('Error al cargar detalle', 'error'); }
                            }}
                              style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>{ev.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{ev.venue} · {new Date(ev.created_at).toLocaleDateString()}</div>
                              </div>
                              <ChevronRight size={16} color="#64748b" />
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                          <button onClick={() => setSelectedPastEvent(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', padding: '0.4rem', borderRadius: '0.5rem' }}><ArrowLeft size={16} /></button>
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', display: 'block' }}>{selectedPastEvent.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{selectedPastEvent.songs?.length || 0} canciones en este set</span>
                          </div>
                        </div>
                        <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                          {selectedPastEvent.songs?.map((s: any) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.artist}</div>
                              </div>
                              <button 
                                onClick={async () => {
                                  if (!selectedEventId) return;
                                  try {
                                    await events.addSongs(selectedEventId, [{ title: s.title, artist: s.artist }]);
                                    const res = await songsApi.getByEvent(selectedEventId);
                                    setSongList(res.data);
                                    fetchRanking(selectedEventId);
                                    showToast('Añadida', 'success');
                                  } catch { showToast('Error', 'error'); }
                                }}
                                style={{ background: 'rgba(34,197,94,0.15)', border: 'none', color: '#22c55e', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}
                              >+ Añadir</button>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={async () => {
                            if (!selectedEventId || !selectedPastEvent.songs) return;
                            try {
                              setIsProcessing(true);
                              const toAdd = selectedPastEvent.songs.map((s: any) => ({ title: s.title, artist: s.artist }));
                              await events.addSongs(selectedEventId, toAdd);
                              const res = await songsApi.getByEvent(selectedEventId);
                              setSongList(res.data);
                              fetchRanking(selectedEventId);
                              showToast(`Set de "${selectedPastEvent.name}" cargado`, 'success');
                              setSelectedPastEvent(null);
                              setShowPastEventsSection(false);
                            } catch { showToast('Error al importar set', 'error'); }
                            finally { setIsProcessing(false); }
                          }}
                          className="btn-primary" style={{ width: '100%', background: '#3b82f6', borderColor: '#3b82f6', color: '#fff', padding: '0.85rem', fontSize: '0.85rem', borderRadius: '0.75rem' }}
                        >
                          {isProcessing ? 'Cargando...' : 'CARGAR SET COMPLETO'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem 1.75rem 1.5rem' }}>
                {songList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', opacity: 0.5 }}>
                    <Music size={40} style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>No hay canciones. Agregá la primera.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {songList.map((song, index) => (
                      <motion.div key={song.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: index < songList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                      >
                        <span style={{ width: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{index + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{song.artist}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                          <button type="button" onClick={() => moveSong(index, 'up')} disabled={index === 0} title="Subir"
                            style={{ background: 'none', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.15)' : 'var(--text-muted)', cursor: index === 0 ? 'default' : 'pointer', padding: '0.25rem' }}>
                            <ChevronUp size={16} />
                          </button>
                          <button type="button" onClick={() => moveSong(index, 'down')} disabled={index === songList.length - 1} title="Bajar"
                            style={{ background: 'none', border: 'none', color: index === songList.length - 1 ? 'rgba(255,255,255,0.15)' : 'var(--text-muted)', cursor: index === songList.length - 1 ? 'default' : 'pointer', padding: '0.25rem' }}>
                            <ChevronDown size={16} />
                          </button>
                          <button type="button" onClick={() => handleDeleteSong(song.id)} title="Eliminar"
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', opacity: 0.7 }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL CATALOG MODAL ──────────────────────────── */}
      <AnimatePresence>
        {showFullCatalogModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowFullCatalogModal(false); }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.25 }}
              style={{ width: '100%', maxWidth: '600px', background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
            >
              <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(139,92,246,0.08) 0%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 40%, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CATÁLOGO COMPLETO</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Explorá y agregá desde la base de datos de EC Music</p>
                </div>
                <button type="button" aria-label="Cerrar" onClick={() => setShowFullCatalogModal(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <input type="text" placeholder="Buscar canción, artista o género..." className="input-field" style={{ width: '100%' }} value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                />
              </div>

              {/* Boliche Playlists Section (Reused) */}
              <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowTemplatesSection(!showTemplatesSection)}
                  style={{
                    width: '100%', padding: '0.65rem 1.25rem', background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.85rem',
                    color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.12)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Music size={15} /> 📀 EXPLORAR POR PLAYLIST
                  </div>
                  {showTemplatesSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showTemplatesSection && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    style={{ 
                      marginTop: '0.6rem', background: 'rgba(0,0,0,0.25)', borderRadius: '1rem', 
                      border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' 
                    }}
                  >
                    {!selectedTemplate ? (
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {templates.map(t => (
                          <div key={t.id} onClick={() => setSelectedTemplate(t)}
                            style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>{t.name}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t.songs?.length || 0} canciones</div>
                            </div>
                            <ChevronRight size={16} color="#64748b" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                          <button onClick={() => setSelectedTemplate(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#8b5cf6', cursor: 'pointer', display: 'flex', padding: '0.4rem', borderRadius: '0.5rem' }}><ArrowLeft size={16} /></button>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTemplate.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{selectedTemplate.songs?.length} canciones</span>
                          </div>
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                          {selectedTemplate.songs?.map((ts: any) => (
                            <div key={ts.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ts.title}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ts.artist}</div>
                              </div>
                              <button 
                                onClick={async () => {
                                  if (!selectedEventId) return;
                                  try {
                                    await events.addSongs(selectedEventId, [{ title: ts.title, artist: ts.artist }]);
                                    const res = await songsApi.getByEvent(selectedEventId);
                                    setSongList(res.data);
                                    fetchRanking(selectedEventId);
                                    showToast(`"${ts.title}" añadida`, 'success');
                                  } catch { showToast('Error al añadir', 'error'); }
                                }}
                                style={{ background: 'rgba(34,197,94,0.15)', border: 'none', color: '#22c55e', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}
                              >+ Añadir</button>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={async () => {
                            if (!selectedEventId || !selectedTemplate.songs) return;
                            try {
                              setIsProcessing(true);
                              const toAdd = selectedTemplate.songs.map((s: any) => ({ title: s.title, artist: s.artist }));
                              await events.addSongs(selectedEventId, toAdd);
                              const res = await songsApi.getByEvent(selectedEventId);
                              setSongList(res.data);
                              fetchRanking(selectedEventId);
                              showToast(`Playlist "${selectedTemplate.name}" cargada`, 'success');
                              setSelectedTemplate(null);
                              setShowTemplatesSection(false);
                            } catch { showToast('Error al cargar playlist', 'error'); }
                            finally { setIsProcessing(false); }
                          }}
                          className="btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '0.8rem', borderRadius: '0.75rem' }}
                        >
                          {isProcessing ? 'Cargando...' : 'CARGAR TODA LA PLAYLIST'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Past Events Import Section (Reused in Catalog) */}
              <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPastEventsSection(!showPastEventsSection)}
                  style={{
                    width: '100%', padding: '0.65rem 1.25rem', background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.25)', borderRadius: '0.85rem',
                    color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.12)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <History size={15} /> 📀 IMPORTAR DE EVENTO ANTERIOR
                  </div>
                  {showPastEventsSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showPastEventsSection && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    style={{ 
                      marginTop: '0.6rem', background: 'rgba(0,0,0,0.25)', borderRadius: '1rem', 
                      border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' 
                    }}
                  >
                    {!selectedPastEvent ? (
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {pastEvents.length === 0 ? (
                          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No hay eventos finalizados en el historial.</div>
                        ) : (
                          pastEvents.map(ev => (
                            <div key={ev.id} onClick={async () => {
                              try {
                                const res = await events.getSummary(ev.id);
                                setSelectedPastEvent({ ...ev, songs: res.data.songs });
                              } catch { showToast('Error al cargar detalle', 'error'); }
                            }}
                              style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>{ev.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{ev.venue} · {new Date(ev.created_at).toLocaleDateString()}</div>
                              </div>
                              <ChevronRight size={16} color="#64748b" />
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                          <button onClick={() => setSelectedPastEvent(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', padding: '0.4rem', borderRadius: '0.5rem' }}><ArrowLeft size={16} /></button>
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', display: 'block' }}>{selectedPastEvent.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{selectedPastEvent.songs?.length || 0} canciones</span>
                          </div>
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                          {selectedPastEvent.songs?.map((s: any) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.artist}</div>
                              </div>
                              <button 
                                onClick={async () => {
                                  if (!selectedEventId) return;
                                  try {
                                    await events.addSongs(selectedEventId, [{ title: s.title, artist: s.artist }]);
                                    const res = await songsApi.getByEvent(selectedEventId);
                                    setSongList(res.data);
                                    fetchRanking(selectedEventId);
                                    showToast('Añadida', 'success');
                                  } catch { showToast('Error', 'error'); }
                                }}
                                style={{ background: 'rgba(34,197,94,0.15)', border: 'none', color: '#22c55e', borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}
                              >+ Añadir</button>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={async () => {
                            if (!selectedEventId || !selectedPastEvent.songs) return;
                            try {
                              setIsProcessing(true);
                              const toAdd = selectedPastEvent.songs.map((s: any) => ({ title: s.title, artist: s.artist }));
                              await events.addSongs(selectedEventId, toAdd);
                              const res = await songsApi.getByEvent(selectedEventId);
                              setSongList(res.data);
                              fetchRanking(selectedEventId);
                              showToast(`Set de "${selectedPastEvent.name}" cargado`, 'success');
                              setSelectedPastEvent(null);
                              setShowPastEventsSection(false);
                            } catch { showToast('Error al importar set', 'error'); }
                            finally { setIsProcessing(false); }
                          }}
                          className="btn-primary" style={{ width: '100%', background: '#3b82f6', borderColor: '#3b82f6', color: '#fff', padding: '0.8rem', fontSize: '0.8rem', borderRadius: '0.75rem' }}
                        >
                          {isProcessing ? 'Cargando...' : 'CARGAR SET COMPLETO'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '0' }}>
                {fullCatalog.filter(s => (s.title + ' ' + s.artist + ' ' + s.genre).toLowerCase().includes(catalogSearchTerm.toLowerCase())).map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#fff' }}>{song.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{song.artist} <span style={{opacity: 0.5}}>· {song.genre}</span></div>
                    </div>
                    <button type="button" onClick={async () => {
                      if (!selectedEventId) return;
                      try {
                        await events.addSongs(selectedEventId, [{ title: song.title, artist: song.artist }]);
                        const res = await songsApi.getByEvent(selectedEventId);
                        setSongList(res.data);
                        fetchRanking(selectedEventId);
                        showToast(`"${song.title}" agregada`, 'success');
                      } catch { showToast('Error al agregar', 'error'); }
                    }} className="btn-pill" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderColor: 'transparent', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                      <Plus size={14} /> Add
                    </button>
                  </div>
                ))}
                {fullCatalog.filter(s => (s.title + ' ' + s.artist + ' ' + s.genre).toLowerCase().includes(catalogSearchTerm.toLowerCase())).length === 0 && (
                   <div style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>No se encontraron resultados en el catálogo.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── QR MODAL ───────────────────────────────────────── */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        url={publicUrl}
        onCopy={() => { navigator.clipboard.writeText(publicUrl); showToast('URL de Invitación copiada', 'success'); }}
      />

      {/* ── TOAST ──────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#ef4444' : 'rgba(15, 23, 42, 0.95)',
          color: 'white', padding: '0.85rem 2rem', borderRadius: '3rem', zIndex: 2000,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          animation: 'slideUp 0.3s ease-out', whiteSpace: 'nowrap', fontSize: '0.85rem',
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        body { background: #000 !important; }
      `}</style>
    </div>
  );
};

export default DJDashboard;
