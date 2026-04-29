import { useEffect, useState, useRef, Component } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Users, Music, Zap, Activity, Globe,
  AlertTriangle, TrendingUp, LogOut, RefreshCw, Wifi,
  UserCheck, Percent, AlertCircle, ScrollText, Plus
} from 'lucide-react';
import AdminLogin, { getAdminSession, clearAdminSession } from './AdminLogin';


// ── Error boundary ─────────────────────────────────────────────────────────────
class AdminErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err: Error) {
    return { error: err.message || 'Error desconocido' };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: '#020614', minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          gap: '1rem', fontFamily: "'Inter', sans-serif", padding: '2rem',
        }}>
          <AlertTriangle size={40} color="#ef4444" />
          <div style={{ color: 'white', fontWeight: '800', fontSize: '1.2rem' }}>Error en el panel</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', maxWidth: 400, textAlign: 'center' }}>{this.state.error}</div>
          <button
            onClick={() => { clearAdminSession(); window.location.reload(); }}
            style={{ marginTop: '0.5rem', padding: '0.7rem 1.5rem', background: '#7c3aed', border: 'none', borderRadius: '0.6rem', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Limpiar sesión y recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usa fetch directo (sin el interceptor DJ 401 de Axios)
const BASE = import.meta.env.VITE_API_URL || '/api';
const apiFetch = async (path: string) => {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

interface GlobalStats {
  totalEvents: number;
  activeEvents: number;
  totalVotes: number;
  totalSongs: number;
  totalDJs: number;
  avgVotesPerEvent: number;
  totalUniqueVoters: number;
  avgVotesPerVoter: number;
  participationPct: number;
  fetchErrors: number;
  totalActiveDevices: number;
}

interface EventRow {
  id: number;
  name: string;
  venue: string;
  status: string;
  totalVotes: number;
  uniqueVoters: number;
  songCount: number;
  topSong: string;
  avgVotesPerVoter: number;
  activeDevices: number;
}

interface VotePoint {
  time: string;
  count: number;
}

interface BackendLogEntry {
  id: number;
  action: string;
  details: string | null;
  created_at: string;
  event: { name: string; venue: string } | null;
  dj: { email: string; name: string | null } | null;
}

interface DJActivity {
  id: number;
  name: string | null;
  email: string;
  createdAt: string | null;
  totalEvents: number;
  activeEvents: number;
  lastEventDate: string | null;
  lastEventName: string | null;
  lastEventStatus: string | null;
}

const POLL_MS = 15000;

// ── Mini sparkline ────────────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#8b5cf6' }: { data: number[]; color?: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = 36;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`}
        fill={`${color}22`} stroke="none" />
    </svg>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  icon, label, value, sub, color, trend
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; trend?: number[];
}) => (
  <div style={{
    background: 'rgba(255,255,255,0.028)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '1.1rem',
    padding: '1.25rem 1.4rem',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '0.65rem',
        background: `${color}22`,
        border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      {trend && trend.length > 1 && <Sparkline data={trend} color={color} />}
    </div>
    <div style={{ fontSize: '1.9rem', fontWeight: '900', letterSpacing: '-0.04em', color: 'white', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: '0.35rem' }}>
      {label}
    </div>
    {sub && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.2rem' }}>{sub}</div>}
  </div>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { color: string; label: string }> = {
    ACTIVE:  { color: '#10b981', label: '🟢 EN VIVO' },
    PENDING: { color: '#fbbf24', label: '🟡 PRÓXIMO' },
    FINISHED:{ color: '#64748b', label: '⬛ CERRADO' },
  };
  const s = map[status] ?? map.FINISHED;
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: '800', padding: '0.15rem 0.55rem',
      borderRadius: 9999,
      background: `${s.color}18`,
      color: s.color,
      border: `1px solid ${s.color}40`,
      letterSpacing: '0.05em',
    }}>
      {s.label}
    </span>
  );
};

// ── Main dashboard ────────────────────────────────────────────────────────────
function AdminDashboardContent({ session, onLogout }: {
  session: { username: string; displayName: string; avatar: string };
  onLogout: () => void;
}) {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [backendLogs, setBackendLogs] = useState<BackendLogEntry[]>([]);
  const [djActivity, setDjActivity] = useState<DJActivity[]>([]);
  const [voteHistory, setVoteHistory] = useState<VotePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState(false);
  const [lastSync, setLastSync] = useState('—');
  const [syncing, setSyncing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Catalog manager state
  const [activeTab, setActiveTab] = useState<'telemetry' | 'catalog'>('telemetry');
  const [catalogSubTab, setCatalogSubTab] = useState<'global' | 'playlists'>('global');
  const [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [previewRows, setPreviewRows] = useState<{ title: string; artist: string; genre: string; bpm: string }[]>([]);

  // Playlist management state
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [expandedPlaylist, setExpandedPlaylist] = useState<number | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlistImportText, setPlaylistImportText] = useState('');
  const [playlistPreviewRows, setPlaylistPreviewRows] = useState<{ title: string; artist: string; genre: string; bpm: string }[]>([]);
  const [playlistImportStatus, setPlaylistImportStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [addToPlaylistId, setAddToPlaylistId] = useState<number | null>(null);
  const [addSongsText, setAddSongsText] = useState('');
  const [addSongsPreview, setAddSongsPreview] = useState<{ title: string; artist: string; genre: string; bpm: string }[]>([]);
  const [addSongsStatus, setAddSongsStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const fetchAll = async (silent = false) => {
    if (!silent) { setLoading(true); setFetchError(null); }
    else setSyncing(true);
    let fetchErrorCount = 0;
    try {
      // Fetch all events
      const ADMIN_KEY = 'mp-admin-secret-2024';
      const raw = await apiFetch(`/events/admin-all?key=${ADMIN_KEY}`);
      // Guard: if backend returns error object instead of array
      if (!Array.isArray(raw)) throw new Error('Backend no disponible o clave inválida');
      const allEvents: any[] = raw;

      // Build event rows with stats
      const rows: EventRow[] = [];
      let totalVotesGlobal = 0;
      let totalUniqueVoters = 0;

      for (const ev of allEvents) {
        try {
          const [sData, rData, adData] = await Promise.all([
            apiFetch(`/events/${ev.id}/stats`),
            apiFetch(`/events/${ev.id}/ranking`),
            ev.status === 'ACTIVE' ? apiFetch(`/events/${ev.id}/active-devices`) : Promise.resolve({ count: 0 }),
          ]);
          const s = sData;
          const topSong = rData[0];
          const votes = s.totalVotes || 0;
          const voters = s.uniqueVoters || 0;
          const activeDevices = adData?.count ?? 0;
          totalVotesGlobal += votes;
          totalUniqueVoters += voters;
          rows.push({
            id: ev.id,
            name: ev.name,
            venue: ev.venue,
            status: ev.status,
            totalVotes: votes,
            uniqueVoters: voters,
            songCount: ev._count?.songs || 0,
            topSong: topSong ? `${topSong.title} · ${topSong.votes} votos` : '—',
            avgVotesPerVoter: voters > 0 ? parseFloat((votes / voters).toFixed(1)) : 0,
            activeDevices,
          });
        } catch {
          fetchErrorCount++;
          rows.push({
            id: ev.id, name: ev.name, venue: ev.venue, status: ev.status,
            totalVotes: 0, uniqueVoters: 0, songCount: 0, topSong: '—', avgVotesPerVoter: 0, activeDevices: 0,
          });
        }
      }

      const active = rows.filter(e => e.status === 'ACTIVE');
      const avgVotesPerVoter = totalUniqueVoters > 0
        ? parseFloat((totalVotesGlobal / totalUniqueVoters).toFixed(1)) : 0;
      // % participación: votantes únicos como % de los eventos activos con al menos 1 voto
      const eventsWithVotes = rows.filter(e => e.totalVotes > 0).length;
      const participationPct = rows.length > 0
        ? Math.round((eventsWithVotes / rows.length) * 100) : 0;

      const totalActiveDevices = rows.filter(e => e.status === 'ACTIVE').reduce((a, e) => a + e.activeDevices, 0);

      const globalStats: GlobalStats = {
        totalEvents: rows.length,
        activeEvents: active.length,
        totalVotes: totalVotesGlobal,
        totalSongs: rows.reduce((a, e) => a + e.songCount, 0),
        totalDJs: new Set(allEvents.map((e: any) => e.dj_id)).size,
        avgVotesPerEvent: rows.length > 0 ? Math.round(totalVotesGlobal / rows.length) : 0,
        totalUniqueVoters,
        avgVotesPerVoter,
        participationPct,
        fetchErrors: fetchErrorCount,
        totalActiveDevices,
      };

      // Vote history: acumula puntos reales en cada poll (últimos 12)
      const newPoint = {
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        count: totalVotesGlobal,
      };
      setVoteHistory(prev => [...prev, newPoint].slice(-12));

      setSyncError(false);
      setStats(globalStats);
      setEvents(rows.sort((a, b) => {
        const order = { ACTIVE: 0, PENDING: 1, FINISHED: 2 };
        return (order[a.status as keyof typeof order] ?? 2) - (order[b.status as keyof typeof order] ?? 2);
      }));
      setLastSync(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Fetch backend event logs
      try {
        const ADMIN_KEY = 'mp-admin-secret-2024';
        const logs = await apiFetch(`/events/admin-logs?key=${ADMIN_KEY}`);
        if (Array.isArray(logs)) setBackendLogs(logs);
      } catch { /* silently ignore */ }

      // Fetch DJ activity
      try {
        const ADMIN_KEY = 'mp-admin-secret-2024';
        const djs = await apiFetch(`/events/admin-djs?key=${ADMIN_KEY}`);
        if (Array.isArray(djs)) setDjActivity(djs);
      } catch { /* silently ignore */ }
    } catch (err) {
      console.error('Admin fetch error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (!silent) setFetchError(msg);
      else setSyncError(true);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(() => fetchAll(true), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const voteTrend = voteHistory.map(p => p.count);
  const activeEvents = events.filter(e => e.status === 'ACTIVE');

  // --- Catalog helpers ---
  const ADMIN_KEY = 'mp-admin-secret-2024';

  const fetchCatalogCount = async () => {
    try {
      const res = await fetch(`${BASE}/events/admin-catalog?key=${ADMIN_KEY}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setCatalogCount(data.length);
    } catch { /* silent */ }
  };

  const parseImportText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    return lines.map(line => {
      // Detect separator: Tab (Excel), then check for multiple spaces, fallback to comma
      let sep: string | RegExp = ',';
      if (line.includes('\t')) {
        sep = '\t';
      } else if (!line.includes(',') && /\s{2,}/.test(line)) {
        // If no comma but has 2+ spaces, use spaces as separator
        sep = /\s{2,}/;
      }
      
      const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        title: cols[0] || '',
        artist: cols[1] || '',
        genre: cols[2] || 'General',
        bpm: cols[3] || '',
      };
    }).filter(r => r.title && r.artist);
  };

  const handleTextChange = (text: string) => {
    setImportText(text);
    setPreviewRows(parseImportText(text));
    setImportStatus({ type: 'idle', message: '' });
  };

  const handleImport = async () => {
    if (previewRows.length === 0) return;
    setImportStatus({ type: 'loading', message: 'Importando canciones...' });
    try {
      const songs = previewRows.map(r => ({
        title: r.title,
        artist: r.artist,
        genre: r.genre || 'General',
        bpm: r.bpm ? parseInt(r.bpm) || undefined : undefined,
      }));
      const res = await fetch(`${BASE}/catalog/admin-import?key=${ADMIN_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error del servidor');
      setImportStatus({ type: 'success', message: `✅ ${data.imported} canciones nuevas agregadas al catálogo.` });
      setImportText('');
      setPreviewRows([]);
      fetchCatalogCount();
    } catch (err) {
      setImportStatus({ type: 'error', message: `❌ Error: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  // --- Playlist helpers ---
  const fetchPlaylists = async () => {
    setPlaylistsLoading(true);
    try {
      const res = await fetch(`${BASE}/event-templates/admin-all?key=${ADMIN_KEY}`);
      const data = await res.json();
      if (Array.isArray(data)) setPlaylists(data);
    } catch { /* silent */ } finally { setPlaylistsLoading(false); }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || playlistPreviewRows.length === 0) return;
    setPlaylistImportStatus({ type: 'loading', message: 'Creando playlist...' });
    try {
      const songs = playlistPreviewRows.map(r => ({
        title: r.title, artist: r.artist,
        category: r.genre || 'General',
        bpm: r.bpm ? parseInt(r.bpm) || undefined : undefined,
      }));
      const res = await fetch(`${BASE}/event-templates/admin-create?key=${ADMIN_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName.trim(), description: newPlaylistDesc.trim(), songs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error del servidor');
      setPlaylistImportStatus({ type: 'success', message: `✅ Playlist "${data.name}" creada con ${data.songs?.length || 0} canciones.` });
      setNewPlaylistName(''); setNewPlaylistDesc(''); setPlaylistImportText(''); setPlaylistPreviewRows([]);
      setShowCreatePlaylist(false);
      fetchPlaylists();
    } catch (err) {
      setPlaylistImportStatus({ type: 'error', message: `❌ Error: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const handleAddSongsToPlaylist = async (playlistId: number) => {
    if (addSongsPreview.length === 0) return;
    setAddSongsStatus({ type: 'loading', message: 'Agregando canciones...' });
    try {
      const songs = addSongsPreview.map(r => ({
        title: r.title, artist: r.artist,
        category: r.genre || 'General',
        bpm: r.bpm ? parseInt(r.bpm) || undefined : undefined,
      }));
      const res = await fetch(`${BASE}/event-templates/admin-add-songs/${playlistId}?key=${ADMIN_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error del servidor');
      setAddSongsStatus({ type: 'success', message: `✅ ${data.added} canciones agregadas.` });
      setAddSongsText(''); setAddSongsPreview([]); setAddToPlaylistId(null);
      fetchPlaylists();
    } catch (err) {
      setAddSongsStatus({ type: 'error', message: `❌ Error: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const handleDeleteSong = async (songId: number) => {
    try {
      await fetch(`${BASE}/event-templates/admin-delete-song/${songId}?key=${ADMIN_KEY}`, { method: 'DELETE' });
      fetchPlaylists();
    } catch { /* silent */ }
  };

  const handleDeletePlaylist = async (playlistId: number, name: string) => {
    if (!confirm(`¿Eliminar la playlist "${name}" y todas sus canciones? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch(`${BASE}/event-templates/admin-delete/${playlistId}?key=${ADMIN_KEY}`, { method: 'DELETE' });
      if (expandedPlaylist === playlistId) setExpandedPlaylist(null);
      fetchPlaylists();
    } catch { /* silent */ }
  };

  return (
    <div style={{
      background: '#020614',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 20% -5%, rgba(109,40,217,0.18) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(236,72,153,0.1) 0%, transparent 50%)',
      minHeight: '100vh',
      color: 'white',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Topbar ── */}
      <nav style={{
        background: 'rgba(5,3,18,0.95)',
        borderBottom: '1px solid rgba(139,92,246,0.12)',
        padding: '0 1.5rem',
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(24px)',
        boxShadow: '0 1px 30px rgba(0,0,0,0.4)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #7c3aed 0%, #ec4899 50%, #06b6d4 100%)', opacity: 0.7 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/logo.png" alt="EC Music" style={{ width: 28, height: 28, borderRadius: '0.5rem', objectFit: 'cover' }} />
          <span style={{ fontWeight: '900', fontSize: '0.9rem', letterSpacing: '-0.02em' }}>
            EC <span style={{ color: '#8b5cf6' }}>Music</span>
            <span style={{
              marginLeft: '0.5rem', fontSize: '0.6rem', fontWeight: '700',
              background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)',
              borderRadius: 4, padding: '0.1rem 0.4rem', color: '#a78bfa',
              letterSpacing: '0.1em',
            }}>ADMIN</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Sync indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: syncError ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
            <motion.div
              animate={{ opacity: syncing ? [1, 0.2, 1] : 0.5 }}
              transition={{ repeat: syncing ? Infinity : 0, duration: 0.7 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: syncing ? '#fbbf24' : syncError ? '#ef4444' : '#22c55e' }}
            />
            {syncing ? 'Sync...' : syncError ? '⚠ sin conexión' : lastSync}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchAll(true)}
            disabled={syncing}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.3rem 0.6rem', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={13} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>

          {/* User + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{session.avatar}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>{session.displayName}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '0.3rem 0.7rem', cursor: 'pointer', color: '#ef4444', fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <LogOut size={12} /> Salir
          </button>
        </div>
      </nav>

      <div style={{ padding: '2rem', maxWidth: 1300, margin: '0 auto' }}>
        {/* Page title + Tabs */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.03em', margin: 0, background: 'linear-gradient(90deg, #e9d5ff 0%, #a78bfa 55%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {activeTab === 'telemetry' ? 'Telemetría Global' : '🎵 Gestión de Catálogo'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: '0.3rem' }}>
            {activeTab === 'telemetry' ? `Vista en tiempo real de todos los eventos · Actualiza cada ${POLL_MS / 1000}s` : 'Agregá canciones al catálogo compartido de todos los DJs'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {([{ id: 'telemetry', label: '📊 Telemetría' }, { id: 'catalog', label: '🎵 Catálogo' }] as const).map(tab => (
              <button key={tab.id} type="button"
                onClick={() => { setActiveTab(tab.id); if (tab.id === 'catalog') fetchCatalogCount(); }}
                style={{ padding: '0.4rem 1.1rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700', border: `1px solid ${activeTab === tab.id ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, background: activeTab === tab.id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)', color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CATALOG TAB ── */}
        {activeTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Sub-tabs: Global / Playlists */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {([{ id: 'global', label: '🌐 Catálogo Global' }, { id: 'playlists', label: '📋 Playlists' }] as const).map(st => (
                <button key={st.id} type="button"
                  onClick={() => {
                    setCatalogSubTab(st.id);
                    if (st.id === 'global') fetchCatalogCount();
                    if (st.id === 'playlists') fetchPlaylists();
                  }}
                  style={{ padding: '0.4rem 1.1rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700', border: `1px solid ${catalogSubTab === st.id ? '#ec4899' : 'rgba(255,255,255,0.1)'}`, background: catalogSubTab === st.id ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.03)', color: catalogSubTab === st.id ? '#f472b6' : 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                  {st.label}
                </button>
              ))}
            </div>

            {/* ── SUB: CATÁLOGO GLOBAL ── */}
            {catalogSubTab === 'global' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              <StatCard icon={<Music size={18} color="#8b5cf6" />} label="Canciones en catálogo" value={catalogCount ?? '…'} sub="disponibles para todos los DJs" color="#8b5cf6" />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '1.1rem', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.3rem' }}>➕ Importar canciones nuevas</div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Copiá las celdas de Excel/Google Sheets y pegá acá. Columnas: <strong style={{ color: '#e2e8f0' }}>Título · Artista · Género (opcional) · BPM (opcional)</strong></p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '0.6rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
                # Ejemplo (pegá directamente desde Excel o Google Sheets):<br/>
                Gata Only &nbsp;&nbsp; FloyyMenor &nbsp;&nbsp; Reggaetón &nbsp;&nbsp; 100<br/>
                Blinding Lights &nbsp;&nbsp; The Weeknd &nbsp;&nbsp; Pop &nbsp;&nbsp; 171
              </div>
              <textarea value={importText} onChange={e => handleTextChange(e.target.value)}
                placeholder={"Pegá aquí tus canciones desde Excel o escríbelas...\n(una canción por línea, separado por comas o tabs)"}
                style={{ width: '100%', minHeight: 180, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'white', fontSize: '0.85rem', padding: '0.85rem 1rem', resize: 'vertical', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              {previewRows.length > 0 && (
                <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.25)', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ padding: '0.6rem 1rem', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    Vista previa · {previewRows.length} canción{previewRows.length !== 1 ? 'es' : ''} detectada{previewRows.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {['Título', 'Artista', 'Género', 'BPM'].map(h => <th key={h} style={{ padding: '0.5rem 0.85rem', textAlign: 'left', color: 'rgba(255,255,255,0.25)', fontWeight: '700', fontSize: '0.6rem', textTransform: 'uppercase' }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '0.45rem 0.85rem', color: '#f1f5f9', fontWeight: '600' }}>{r.title}</td>
                            <td style={{ padding: '0.45rem 0.85rem', color: 'rgba(255,255,255,0.5)' }}>{r.artist}</td>
                            <td style={{ padding: '0.45rem 0.85rem', color: 'rgba(255,255,255,0.35)' }}>{r.genre || 'General'}</td>
                            <td style={{ padding: '0.45rem 0.85rem' }}>{r.bpm ? <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', borderRadius: '0.25rem', padding: '0.1rem 0.35rem', fontWeight: '700', fontSize: '0.7rem' }}>{r.bpm}</span> : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {importStatus.type !== 'idle' && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '0.65rem', fontSize: '0.82rem', fontWeight: '600', background: importStatus.type === 'success' ? 'rgba(34,197,94,0.12)' : importStatus.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.1)', border: `1px solid ${importStatus.type === 'success' ? 'rgba(34,197,94,0.3)' : importStatus.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.2)'}`, color: importStatus.type === 'success' ? '#22c55e' : importStatus.type === 'error' ? '#ef4444' : '#a78bfa' }}>
                  {importStatus.message}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.1rem' }}>
                <button type="button" onClick={() => { setImportText(''); setPreviewRows([]); setImportStatus({ type: 'idle', message: '' }); }} disabled={!importText}
                  style={{ padding: '0.7rem 1.4rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: '700', cursor: importText ? 'pointer' : 'not-allowed', fontSize: '0.85rem', opacity: importText ? 1 : 0.4 }}>
                  Limpiar
                </button>
                <motion.button type="button" onClick={handleImport} disabled={previewRows.length === 0 || importStatus.type === 'loading'}
                  whileHover={{ scale: previewRows.length > 0 ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, padding: '0.7rem 1.4rem', borderRadius: '0.75rem', background: previewRows.length > 0 ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'rgba(255,255,255,0.05)', border: 'none', color: previewRows.length > 0 ? 'white' : 'rgba(255,255,255,0.3)', fontWeight: '800', fontSize: '0.88rem', cursor: previewRows.length > 0 ? 'pointer' : 'not-allowed', boxShadow: previewRows.length > 0 ? '0 4px 16px rgba(124,58,237,0.4)' : 'none' }}>
                  {importStatus.type === 'loading' ? '⏳ Guardando...' : `Agregar ${previewRows.length > 0 ? previewRows.length + ' canciones' : ''} al Catálogo`}
                </motion.button>
              </div>
            </div>
            </>)}

            {/* ── SUB: PLAYLISTS ── */}
            {catalogSubTab === 'playlists' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Header + Create button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.12em', color: '#f472b6', textTransform: 'uppercase' }}>Playlists · {playlists.length} listas</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem' }}>Las playlists son los setlists predefinidos que el DJ elige al crear un evento</div>
                  </div>
                  <button type="button" onClick={() => { setShowCreatePlaylist(v => !v); setPlaylistImportStatus({ type: 'idle', message: '' }); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #db2777, #ec4899)', border: 'none', color: 'white', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(236,72,153,0.35)' }}>
                    <Plus size={14} /> Nueva Playlist
                  </button>
                </div>

                {/* Create playlist panel */}
                {showCreatePlaylist && (
                  <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.25)', borderRadius: '1.1rem', padding: '1.4rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', color: '#f472b6', textTransform: 'uppercase', marginBottom: '1rem' }}>➕ Crear nueva playlist</div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="Nombre de la playlist *" maxLength={80}
                        style={{ flex: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.65rem', padding: '0.65rem 0.9rem', color: 'white', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
                      <input value={newPlaylistDesc} onChange={e => setNewPlaylistDesc(e.target.value)} placeholder="Descripción (opcional)"
                        style={{ flex: 3, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.65rem', padding: '0.65rem 0.9rem', color: 'white', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.5rem' }}>Canciones — Pegá desde Excel: <strong style={{ color: '#e2e8f0' }}>Título · Artista · Género · BPM</strong></div>
                    <textarea value={playlistImportText} onChange={e => { setPlaylistImportText(e.target.value); setPlaylistPreviewRows(parseImportText(e.target.value)); }}
                      placeholder={"Pegá canciones desde Excel o escríbelas...\nUna por línea, separadas por tabs o comas"}
                      style={{ width: '100%', minHeight: 140, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'white', fontSize: '0.83rem', padding: '0.75rem 1rem', resize: 'vertical', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                    {playlistPreviewRows.length > 0 && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#22c55e' }}>✓ {playlistPreviewRows.length} canciones detectadas</div>
                    )}
                    {playlistImportStatus.type !== 'idle' && (
                      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: '0.55rem', fontSize: '0.8rem', fontWeight: '600', background: playlistImportStatus.type === 'success' ? 'rgba(34,197,94,0.1)' : playlistImportStatus.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.08)', color: playlistImportStatus.type === 'success' ? '#22c55e' : playlistImportStatus.type === 'error' ? '#ef4444' : '#a78bfa', border: `1px solid ${playlistImportStatus.type === 'success' ? 'rgba(34,197,94,0.25)' : playlistImportStatus.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(139,92,246,0.2)'}` }}>
                        {playlistImportStatus.message}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                      <button type="button" onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(''); setNewPlaylistDesc(''); setPlaylistImportText(''); setPlaylistPreviewRows([]); setPlaylistImportStatus({ type: 'idle', message: '' }); }}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem' }}>
                        Cancelar
                      </button>
                      <button type="button" onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim() || playlistPreviewRows.length === 0 || playlistImportStatus.type === 'loading'}
                        style={{ flex: 1, padding: '0.6rem 1.2rem', borderRadius: '0.65rem', background: (newPlaylistName.trim() && playlistPreviewRows.length > 0) ? 'linear-gradient(135deg, #db2777, #ec4899)' : 'rgba(255,255,255,0.05)', border: 'none', color: (newPlaylistName.trim() && playlistPreviewRows.length > 0) ? 'white' : 'rgba(255,255,255,0.25)', fontWeight: '800', cursor: (newPlaylistName.trim() && playlistPreviewRows.length > 0) ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}>
                        {playlistImportStatus.type === 'loading' ? '⏳ Creando...' : `Crear Playlist${playlistPreviewRows.length > 0 ? ` con ${playlistPreviewRows.length} canciones` : ''}`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Playlists list */}
                {playlistsLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(236,72,153,0.2)', borderTopColor: '#ec4899', animation: 'spin 0.9s linear infinite' }} />
                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Cargando playlists...</span>
                  </div>
                ) : playlists.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                    No hay playlists. Creá la primera con el botón de arriba.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {playlists.map((pl: any) => (
                      <div key={pl.id} style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1rem', overflow: 'hidden' }}>

                        {/* Playlist header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.2rem', cursor: 'pointer' }}
                          onClick={() => setExpandedPlaylist(expandedPlaylist === pl.id ? null : pl.id)}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              📋 {pl.name}
                              <span style={{ fontSize: '0.65rem', background: 'rgba(236,72,153,0.15)', color: '#f472b6', borderRadius: '9999px', padding: '0.15rem 0.55rem', fontWeight: '700' }}>{pl.songs?.length || 0} canciones</span>
                            </div>
                            {pl.description && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.15rem' }}>{pl.description}</div>}
                          </div>
                          <button type="button" onClick={e => { e.stopPropagation(); handleDeletePlaylist(pl.id, pl.name); }}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', color: '#ef4444', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            🗑️ Eliminar
                          </button>
                          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', transform: expandedPlaylist === pl.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</div>
                        </div>

                        {/* Expanded playlist content */}
                        {expandedPlaylist === pl.id && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.2rem' }}>

                            {/* Songs list */}
                            <div style={{ marginBottom: '1rem', maxHeight: 280, overflowY: 'auto' }}>
                              {pl.songs?.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>Sin canciones todavía</div>
                              ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                      {['Título', 'Artista', 'Género', 'BPM', ''].map(h => <th key={h} style={{ padding: '0.4rem 0.75rem', textAlign: 'left', color: 'rgba(255,255,255,0.25)', fontWeight: '700', fontSize: '0.6rem', textTransform: 'uppercase' }}>{h}</th>)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {pl.songs.map((s: any) => (
                                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '0.4rem 0.75rem', fontWeight: '600', color: '#f1f5f9' }}>{s.title}</td>
                                        <td style={{ padding: '0.4rem 0.75rem', color: 'rgba(255,255,255,0.5)' }}>{s.artist}</td>
                                        <td style={{ padding: '0.4rem 0.75rem', color: 'rgba(255,255,255,0.3)' }}>{s.category || '—'}</td>
                                        <td style={{ padding: '0.4rem 0.75rem' }}>{s.bpm ? <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', borderRadius: '0.2rem', padding: '0.1rem 0.3rem', fontWeight: '700', fontSize: '0.68rem' }}>{s.bpm}</span> : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}</td>
                                        <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                                          <button type="button" onClick={() => handleDeleteSong(s.id)}
                                            style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: '0.2rem', borderRadius: '0.3rem', fontSize: '0.9rem' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.6)')} title="Eliminar canción">✕</button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>

                            {/* Add songs to existing playlist */}
                            {addToPlaylistId === pl.id ? (
                              <div style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.1em', color: '#f472b6', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Agregar canciones</div>
                                <textarea value={addSongsText} onChange={e => { setAddSongsText(e.target.value); setAddSongsPreview(parseImportText(e.target.value)); }}
                                  placeholder={"Pegá canciones desde Excel...\nTítulo · Artista · Género · BPM"}
                                  style={{ width: '100%', minHeight: 110, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem', color: 'white', fontSize: '0.8rem', padding: '0.65rem 0.85rem', resize: 'vertical', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                                {addSongsPreview.length > 0 && <div style={{ fontSize: '0.72rem', color: '#22c55e', marginTop: '0.35rem' }}>✓ {addSongsPreview.length} canciones detectadas</div>}
                                {addSongsStatus.type !== 'idle' && (
                                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: '600', background: addSongsStatus.type === 'success' ? 'rgba(34,197,94,0.1)' : addSongsStatus.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.08)', color: addSongsStatus.type === 'success' ? '#22c55e' : addSongsStatus.type === 'error' ? '#ef4444' : '#a78bfa' }}>
                                    {addSongsStatus.message}
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                  <button type="button" onClick={() => { setAddToPlaylistId(null); setAddSongsText(''); setAddSongsPreview([]); setAddSongsStatus({ type: 'idle', message: '' }); }}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontWeight: '700', cursor: 'pointer', fontSize: '0.78rem' }}>Cancelar</button>
                                  <button type="button" onClick={() => handleAddSongsToPlaylist(pl.id)} disabled={addSongsPreview.length === 0 || addSongsStatus.type === 'loading'}
                                    style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '0.6rem', background: addSongsPreview.length > 0 ? 'linear-gradient(135deg, #db2777, #ec4899)' : 'rgba(255,255,255,0.05)', border: 'none', color: addSongsPreview.length > 0 ? 'white' : 'rgba(255,255,255,0.25)', fontWeight: '800', cursor: addSongsPreview.length > 0 ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
                                    {addSongsStatus.type === 'loading' ? '⏳ Guardando...' : `Agregar ${addSongsPreview.length > 0 ? addSongsPreview.length + ' canciones' : ''}`}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button type="button" onClick={() => { setAddToPlaylistId(pl.id); setAddSongsText(''); setAddSongsPreview([]); setAddSongsStatus({ type: 'idle', message: '' }); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '0.65rem', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', color: '#f472b6', fontWeight: '700', cursor: 'pointer', fontSize: '0.78rem' }}>
                                <Plus size={13} /> Agregar canciones a esta playlist
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── TELEMETRY TAB ── */}
        {activeTab === 'telemetry' && (
        <div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Cargando telemetría...</span>
          </div>
        ) : fetchError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '1rem' }}>
            <AlertTriangle size={36} color="#ef4444" />
            <div style={{ color: 'white', fontWeight: '800' }}>Error al conectar con el backend</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', maxWidth: 360, textAlign: 'center' }}>{fetchError}</div>
            <button onClick={() => fetchAll()} style={{ padding: '0.6rem 1.4rem', background: '#7c3aed', border: 'none', borderRadius: '0.6rem', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
              Reintentar
            </button>
          </div>
        ) : (
          <>
          <AnimatePresence mode="wait">
            <motion.div key="content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

              {/* ── Stat cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon={<Activity size={18} color="#22c55e" />} label="Eventos activos" value={stats?.activeEvents ?? 0} sub={`de ${stats?.totalEvents} totales`} color="#22c55e" />
                <StatCard icon={<Users size={18} color="#10b981" />} label="Personas activas" value={stats?.totalActiveDevices ?? 0} sub="en eventos en vivo ahora" color="#10b981" />
                <StatCard icon={<BarChart2 size={18} color="#8b5cf6" />} label="Votos totales" value={(stats?.totalVotes ?? 0).toLocaleString('es-AR')} sub={`~${stats?.avgVotesPerEvent} votos/evento`} color="#8b5cf6" trend={voteTrend} />
                <StatCard icon={<UserCheck size={18} color="#06b6d4" />} label="Votantes únicos" value={(stats?.totalUniqueVoters ?? 0).toLocaleString('es-AR')} sub="dispositivos distintos" color="#06b6d4" />
                <StatCard icon={<TrendingUp size={18} color="#f59e0b" />} label="Votos / usuario" value={stats?.avgVotesPerVoter ?? 0} sub="promedio global" color="#f59e0b" />
                <StatCard icon={<Percent size={18} color="#ec4899" />} label="% Participación" value={`${stats?.participationPct ?? 0}%`} sub="eventos con ≥1 voto" color="#ec4899" />
                <StatCard icon={<Users size={18} color="#a78bfa" />} label="DJs registrados" value={stats?.totalDJs ?? 0} color="#a78bfa" />
                <StatCard icon={<Music size={18} color="#f59e0b" />} label="Canciones totales" value={(stats?.totalSongs ?? 0).toLocaleString('es-AR')} color="#f59e0b" />
                <StatCard icon={<Globe size={18} color="#64748b" />} label="Total eventos" value={stats?.totalEvents ?? 0} color="#64748b" />
                {(stats?.fetchErrors ?? 0) > 0 && (
                  <StatCard icon={<AlertCircle size={18} color="#ef4444" />} label="Errores de fetch" value={stats!.fetchErrors} sub="stats no cargadas" color="#ef4444" />
                )}
              </div>

              {/* ── Active events highlight ── */}
              {activeEvents.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.12em', color: '#22c55e', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                    {activeEvents.length} evento{activeEvents.length !== 1 ? 's' : ''} en vivo ahora
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                    {activeEvents.map(ev => (
                      <div key={ev.id} style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.09) 0%, rgba(34,197,94,0.03) 100%)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '1rem',
                        padding: '1.1rem 1.25rem',
                        boxShadow: '0 0 30px rgba(34,197,94,0.07)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                          <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{ev.name}</div>
                          <StatusBadge status={ev.status} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>📍 {ev.venue}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {[
                            { label: 'Activos', value: ev.activeDevices, color: '#10b981' },
                            { label: 'Votos', value: ev.totalVotes },
                            { label: 'Votantes', value: ev.uniqueVoters },
                            { label: 'Canciones', value: ev.songCount },
                          ].map(s => (
                            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.6rem', padding: '0.5rem 0.75rem' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: (s as any).color || '#22c55e' }}>{s.value}</div>
                              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        {ev.topSong !== '—' && (
                          <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Music size={11} /> 🏆 {ev.topSong}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Vote trend mini-chart ── */}
              {voteHistory.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(255,255,255,0.018) 100%)',
                  border: '1px solid rgba(139,92,246,0.15)',
                  borderRadius: '1.1rem',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '2rem',
                  boxShadow: '0 4px 24px rgba(109,40,217,0.1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                      Votos en el tiempo (últimos 60 min)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#8b5cf6' }}>
                      <Wifi size={11} /> En vivo
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 64 }}>
                    {voteHistory.map((p, i) => {
                      const max = Math.max(...voteHistory.map(x => x.count), 1);
                      const h = Math.max(4, (p.count / max) * 64);
                      return (
                        <div key={i} title={`${p.time}: ${p.count} votos`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: h }}
                            transition={{ duration: 0.5, delay: i * 0.03 }}
                            style={{
                              width: '100%', borderRadius: '3px 3px 0 0',
                              background: i === voteHistory.length - 1
                                ? 'linear-gradient(to top, #8b5cf6, #ec4899)'
                                : 'rgba(139,92,246,0.4)',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>{voteHistory[0]?.time}</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>{voteHistory[voteHistory.length - 1]?.time}</span>
                  </div>
                </div>
              )}

              {/* ── All events table ── */}
              <div style={{
                background: 'rgba(255,255,255,0.018)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.1rem',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                    Todos los eventos ({events.length})
                  </span>
                  <AlertTriangle size={14} color="rgba(255,255,255,0.15)" />
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['#', 'Evento', 'Lugar', 'Estado', 'Activos', 'Votos', 'Votantes', 'Votos/usr', 'Canciones', 'Top canción'].map(h => (
                          <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.25)', fontWeight: '700', letterSpacing: '0.05em', fontSize: '0.62rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => (
                        <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', fontSize: '0.65rem' }}>#{ev.id}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: 'white' }}>{ev.name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.4)' }}>{ev.venue}</td>
                          <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={ev.status} /></td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: ev.activeDevices > 0 ? '#10b981' : 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>{ev.status === 'ACTIVE' ? ev.activeDevices : '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#8b5cf6', fontVariantNumeric: 'tabular-nums' }}>{ev.totalVotes.toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{ev.uniqueVoters}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#f59e0b', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{ev.avgVotesPerVoter > 0 ? ev.avgVotesPerVoter : '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{ev.songCount}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.3)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.topSong}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {events.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                      Sin eventos registrados aún
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── LOG DE ACCIONES (backend) ── */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.018)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '1.1rem',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ScrollText size={15} color="#a78bfa" />
                <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                  Log de Acciones (Servidor)
                </span>
                <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9999, padding: '0.1rem 0.5rem' }}>
                  {backendLogs.length} entradas
                </span>
              </div>

              {backendLogs.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>
                  No hay acciones registradas aún en el servidor.
                </div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#020614' }}>
                        {['Acción', 'Evento', 'DJ', 'Detalle', 'Fecha', 'Hora'].map(h => (
                          <th key={h} style={{ padding: '0.55rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.25)', fontWeight: '700', letterSpacing: '0.05em', fontSize: '0.62rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {backendLogs.map(entry => {
                        const actionMap: Record<string, { icon: string; color: string; label: string }> = {
                          CREATE:  { icon: '🎉', color: '#22c55e', label: 'Evento creado' },
                          LAUNCH:  { icon: '🚀', color: '#10b981', label: 'Evento lanzado' },
                          FINISH:  { icon: '🔒', color: '#ef4444', label: 'Evento cerrado' },
                          SUSPEND: { icon: '⏸', color: '#fb923c', label: 'Evento suspendido' },
                          UPDATE:  { icon: '✏️', color: '#a78bfa', label: 'Evento editado' },
                          DELETE:  { icon: '🗑️', color: '#f87171', label: 'Evento eliminado' },
                        };
                        const meta = actionMap[entry.action] ?? { icon: '📋', color: '#64748b', label: entry.action };
                        const date = new Date(entry.created_at);
                        return (
                          <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem' }}>{meta.icon}</span>
                                <span style={{ fontWeight: '700', color: meta.color, fontSize: '0.75rem' }}>{meta.label}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.6rem 1rem', color: 'white', fontWeight: '600', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.event?.name ?? '—'}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', color: 'rgba(255,255,255,0.4)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.dj?.name ?? entry.dj?.email ?? '—'}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', color: 'rgba(255,255,255,0.3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.details ?? '—'}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                              {date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </td>
                            <td style={{ padding: '0.6rem 1rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                              {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── ACTIVIDAD DE DJs ── */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.018)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '1.1rem',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Users size={15} color="#a78bfa" />
                <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                  Actividad de DJs
                </span>
                <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9999, padding: '0.1rem 0.5rem' }}>
                  {djActivity.length} DJs
                </span>
              </div>
              {djActivity.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>
                  No hay DJs registrados aún.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Estado', 'DJ', 'Email', 'Eventos', 'Activos', 'Último evento', 'Último uso', 'Registro'].map(h => (
                          <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.25)', fontWeight: '700', letterSpacing: '0.05em', fontSize: '0.62rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {djActivity
                        .sort((a, b) => {
                          // Sort: active first, then by last event date desc
                          if (b.activeEvents !== a.activeEvents) return b.activeEvents - a.activeEvents;
                          return new Date(b.lastEventDate ?? 0).getTime() - new Date(a.lastEventDate ?? 0).getTime();
                        })
                        .map(dj => {
                          const lastDate = dj.lastEventDate ? new Date(dj.lastEventDate) : null;
                          const daysSince = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / 86400000) : null;
                          const activityColor = dj.activeEvents > 0 ? '#22c55e'
                            : daysSince === null ? '#4b5563'
                            : daysSince <= 30 ? '#fbbf24'
                            : '#ef4444';
                          const activityLabel = dj.activeEvents > 0 ? '🟢 EN VIVO'
                            : daysSince === null ? '⬛ Sin eventos'
                            : daysSince <= 7 ? '🟢 Esta semana'
                            : daysSince <= 30 ? '🟡 Este mes'
                            : daysSince <= 60 ? '🟠 +30 días'
                            : '🔴 Inactivo';
                          return (
                            <tr key={dj.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.15rem 0.55rem', borderRadius: 9999, background: `${activityColor}18`, color: activityColor, border: `1px solid ${activityColor}40` }}>
                                  {activityLabel}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: 'white', whiteSpace: 'nowrap' }}>{dj.name ?? '—'}</td>
                              <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.4)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dj.email}</td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#8b5cf6', fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>{dj.totalEvents}</td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: dj.activeEvents > 0 ? '#22c55e' : 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>{dj.activeEvents > 0 ? dj.activeEvents : '—'}</td>
                              <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.5)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dj.lastEventName ?? '—'}</td>
                              <td style={{ padding: '0.75rem 1rem', color: activityColor, fontWeight: '700', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                {lastDate ? `${daysSince === 0 ? 'Hoy' : daysSince === 1 ? 'Ayer' : `hace ${daysSince}d`}` : '—'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                {dj.createdAt ? new Date(dj.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          </>
        )}
        </div>)}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Root component (auth gate) ────────────────────────────────────────────────
function AdminDashboardRoot() {
  const [session, setSession] = useState(() => {
    const s = getAdminSession();
    // Validate session has required fields; discard if malformed
    if (s && (!s.username || !s.displayName || !s.avatar)) {
      clearAdminSession();
      return null;
    }
    return s;
  });

  if (!session) {
    return <AdminLogin onLogin={setSession} />;
  }

  return (
    <AdminDashboardContent
      session={session}
      onLogout={() => { clearAdminSession(); setSession(null); }}
    />
  );
}

export default function AdminDashboard() {
  return (
    <AdminErrorBoundary>
      <AdminDashboardRoot />
    </AdminErrorBoundary>
  );
}
