import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { events, billing as billingApi } from '../../api/api';
import {
  Search, Radio,
  FileText, LogOut, Zap, Copy, HelpCircle, List,
  Music2, MapPin, Play, XCircle, Trash2, Image, Clock, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from '../../components/Tooltip';

interface Event {
  id: number;
  name: string;
  venue: string;
  status: string;
  isRecitalMode: boolean;
  maxVotesPerDevice: number;
  created_at: string;
  _count?: { songs: number };
  _voteCount?: number;
}

const DJHome = () => {
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ name: '', venue: '', template_id: '', logoUrl: '', startDate: '', copyFromEventId: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [billingStatus, setBillingStatus] = useState<{ plan: string; subscriptionStatus: string; daysLeft: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const navigate = useNavigate();
  const djUser = JSON.parse(localStorage.getItem('dj_user') || '{}');
  const djName = djUser.name || djUser.email?.split('@')[0] || 'DJ';
  const djInitial = djName.charAt(0).toUpperCase();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEvents = async () => {
    if (!djUser.id) {
      navigate('/dj/login');
      return;
    }
    try {
      const res = await api.get(`/events?dj_id=${djUser.id}`);
      setMyEvents(res.data || []);
    } catch {
      console.error('Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  const refreshBilling = () => {
    billingApi.getStatus().then(r => setBillingStatus(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (!djUser.id) { navigate('/dj/login'); return; }
    fetchEvents();
    events.getTemplates().then(r => setTemplates(r.data)).catch(() => {});
    refreshBilling();
    // Refresca billing al volver de otra pestaña (ej: después de suscribirse)
    window.addEventListener('focus', refreshBilling);
    return () => window.removeEventListener('focus', refreshBilling);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.venue) return;
    try {
      setIsProcessing(true);
      const isScheduled = newEvent.startDate && new Date(newEvent.startDate) > new Date();
      const res = await api.post('/events', {
        name: newEvent.name,
        venue: newEvent.venue,
        dj_id: djUser.id,
        template_id: newEvent.template_id ? parseInt(newEvent.template_id) : undefined,
        logoUrl: newEvent.logoUrl || undefined,
        startDate: newEvent.startDate || undefined,
        status: isScheduled ? 'PENDING' : 'ACTIVE',
      });
      const newEventId = res.data.id;
      // Copiar canciones de evento anterior si se eligió uno
      if (newEvent.copyFromEventId) {
        try {
          const { songs: songsApi } = await import('../../api/api');
          const songsRes = await songsApi.getByEvent(parseInt(newEvent.copyFromEventId));
          const songsToCopy = songsRes.data as { title: string; artist: string }[];
          if (songsToCopy.length > 0) {
            const { events: eventsApi } = await import('../../api/api');
            await eventsApi.addSongs(newEventId, songsToCopy.map((s: any) => ({ title: s.title, artist: s.artist })));
          }
        } catch { /* silencioso, el evento ya fue creado */ }
      }
      showToast(isScheduled ? '¡Evento programado!' : '¡Evento creado!');
      setShowCreateModal(false);
      setNewEvent({ name: '', venue: '', template_id: '', logoUrl: '', startDate: '', copyFromEventId: '' });
      await fetchEvents();
      if (!isScheduled) navigate('/dj/dashboard', { state: { eventId: res.data.id } });
    } catch (err: any) {
      console.error('EVENT_CREATION_FAILED:', err);
      const msg = err?.response?.data?.message || 'Error al crear evento (Ver consola)';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await events.getExport(ev.id);
      const blob = new Blob([res.data.content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = res.data.filename; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast('Error al exportar', 'error'); }
  };

  const handleDuplicate = async (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await events.duplicate(ev.id);
      showToast('Evento duplicado');
      fetchEvents();
    } catch { showToast('Error al duplicar', 'error'); }
  };

  const handleClose = async (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await events.close(ev.id);
      showToast('Evento cerrado');
      await fetchEvents();
    } catch { showToast('Error al cerrar evento', 'error'); }
  };

  const handleDelete = async (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId !== ev.id) {
      setConfirmDeleteId(ev.id);
      return;
    }
    try {
      await events.delete(ev.id);
      showToast('Evento eliminado');
      setConfirmDeleteId(null);
      fetchEvents();
    } catch { showToast('Error al eliminar evento', 'error'); }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    try {
      setIsProcessing(true);
      await events.update(editingEvent.id, {
        name: editingEvent.name,
        venue: editingEvent.venue,
        event_date: editingEvent.startDate,
        status: editingEvent.status
      });
      showToast('Evento actualizado');
      setShowEditModal(false);
      fetchEvents();
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const liveEvents = myEvents.filter(e => e.status === 'ACTIVE' || e.status === 'PENDING');
  const historial = myEvents.filter(e => e.status === 'FINISHED');

  const filtered = (list: Event[]) =>
    search.trim()
      ? list.filter(e =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.venue.toLowerCase().includes(search.toLowerCase())
        )
      : list;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

  const totalSessions = myEvents.length;
  const totalVotes = myEvents.reduce((acc, ev) => acc + (ev._voteCount || 0), 0);

  if (loading) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white', position: 'relative' }}>

      {/* Background ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 40% at 80% 0%, rgba(124,58,237,0.14) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(236,72,153,0.07) 0%, transparent 50%)',
      }} />

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        {/* ── HEADER ──────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem',
        }}>
          {/* Left: Avatar + greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '1.2rem', color: 'white',
              flexShrink: 0,
            }}>
              {djInitial}
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
              Hola, {djName} 👋
            </h1>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <motion.button
              type="button"
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                border: 'none', borderRadius: '9999px',
                color: 'white', fontWeight: '700', fontSize: '0.78rem',
                padding: '0.55rem 1.2rem', cursor: 'pointer',
                letterSpacing: '0.05em', textTransform: 'uppercase',
                boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                fontFamily: 'inherit',
              }}
            >
              <Zap size={14} fill="white" /> Nuevo Evento
            </motion.button>
            <Tooltip tip="Manual de uso">
              <button
                type="button"
                onClick={() => navigate('/dj/help')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', display: 'flex', borderRadius: '0.5rem', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
              >
                <HelpCircle size={18} />
              </button>
            </Tooltip>
            <Tooltip tip="Cerrar sesión">
              <button
                type="button"
                onClick={() => { localStorage.removeItem('dj_user'); navigate('/dj/login'); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', display: 'flex', borderRadius: '0.5rem', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
              >
                <LogOut size={18} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* ── STAT CARDS ──────────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem', marginBottom: '2.5rem',
        }}>
          {[
            { label: 'Sesiones totales', value: totalSessions, icon: <Music2 size={16} color="#8b5cf6" />, iconBg: 'rgba(124,58,237,0.15)' },
            { label: 'Votos recibidos',  value: totalVotes,    icon: <Radio size={16} color="#f59e0b" />,   iconBg: 'rgba(245,158,11,0.15)' },
            { label: 'Eventos activos',  value: liveEvents.length, icon: <Play size={16} color="#22c55e" />, iconBg: 'rgba(34,197,94,0.15)' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="stat-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '0.5rem',
                  background: s.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '500' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* ── BILLING BANNER (HIDDEN FOR MVP) ──────────────────────────── */}

        {/* ── SEARCH ──────────────────────────────────── */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o venue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9999px',
              padding: '0.7rem 1rem 0.7rem 2.6rem', color: 'white',
              fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>

        {/* ── SESIÓN ACTIVA ────────────────────────────── */}
        {filtered(liveEvents).length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span className="section-label" style={{ color: '#64748b' }}>SESIÓN ACTIVA</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered(liveEvents).map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card-active"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* Left: info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span className="badge-live" style={ev.status === 'PENDING' ? {
                          background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.28)', color: '#f59e0b',
                        } : {}}>
                          {ev.status === 'ACTIVE' ? <><span className="badge-live-dot" /> EN VIVO</> : <><Clock size={10} /> PROGRAMADO</>}
                        </span>
                        {ev._voteCount != null && ev._voteCount > 0 && (
                          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--primary-light)', background: 'var(--primary-dim)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>
                            {ev._voteCount} votos
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>
                        {ev.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        <MapPin size={10} style={{ flexShrink: 0 }} /> {ev.venue}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                      {/* Primary action */}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Tooltip tip="Ir al panel del evento">
                          <motion.button
                            type="button"
                            onClick={() => navigate('/dj/dashboard', { state: { eventId: ev.id } })}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            style={{
                              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                              border: 'none', color: '#000', borderRadius: '9999px',
                              padding: '0.4rem 0.9rem', cursor: 'pointer',
                              fontSize: '0.72rem', fontWeight: '800',
                              display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit',
                              boxShadow: '0 3px 10px rgba(34,197,94,0.4)',
                            }}
                          >
                            <Play size={11} fill="#000" /> Abrir
                          </motion.button>
                        </Tooltip>
                      </div>
                      {/* Secondary actions */}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {/* Cerrar evento */}
                        <Tooltip tip="Editar / Reprogramar">
                          <button type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent({ ...ev, startDate: ev.startDate?.split('T')[0] || '' });
                              setShowEditModal(true);
                            }}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.65rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'inherit', transition: 'all 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.3)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                          >
                            <Edit2 size={12} />
                          </button>
                        </Tooltip>
                        <Tooltip tip="Finalizar el evento">
                          <button type="button"
                            onClick={(e) => handleClose(ev, e)}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.65rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'inherit', transition: 'all 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                          >
                            <XCircle size={12} />
                          </button>
                        </Tooltip>
                      {/* Eliminar evento (con confirmación en dos pasos) */}
                      <AnimatePresence mode="wait">
                        {confirmDeleteId === ev.id ? (
                          <motion.button
                            key="confirm"
                            type="button"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => handleDelete(ev, e)}
                            style={{
                              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)',
                              color: '#f87171', borderRadius: '9999px', padding: '0.35rem 0.85rem',
                              cursor: 'pointer', fontSize: '0.72rem', fontWeight: '800',
                              display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit',
                            }}
                            onBlur={() => setConfirmDeleteId(null)}
                          >
                            <Trash2 size={13} /> ¿Confirmar?
                          </motion.button>
                        ) : (
                          <Tooltip tip="Eliminar evento">
                            <motion.button
                              key="delete"
                              type="button"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              onClick={(e) => handleDelete(ev, e)}
                              style={{
                                background: 'none', border: 'none', color: '#64748b',
                                cursor: 'pointer', padding: '0.35rem', display: 'flex', borderRadius: '0.4rem',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </Tooltip>
                        )}
                      </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── HISTORIAL ────────────────────────────────── */}
        <section>
          <div style={{ marginBottom: '1rem' }}>
            <span className="section-label">HISTORIAL</span>
          </div>

          {filtered(historial).length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#374151', fontSize: '0.85rem' }}>
              {search ? 'Sin resultados para tu búsqueda.' : 'Todavía no hay eventos finalizados.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {filtered(historial).map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(13,17,23,0.95) 0%, rgba(8,10,18,1) 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '0.875rem', padding: '1rem 1.1rem',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                  onClick={() => navigate(`/dj/events/${ev.id}/summary`)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: '700', padding: '0.15rem 0.45rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', color: '#64748b', letterSpacing: '0.06em' }}>
                      FINALIZADO
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#475569' }}>
                      {formatDate(ev.created_at)}
                    </span>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569', fontSize: '0.72rem', marginBottom: '0.85rem' }}>
                    <MapPin size={10} /> {ev.venue}
                  </div>
                    <div style={{ display: 'flex', gap: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.65rem' }}>
                      {[
                        { icon: <FileText size={11} />, label: 'Resumen', tip: 'Ver estadísticas del evento',           action: (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/dj/events/${ev.id}/summary`); } },
                        { icon: <Copy size={11} />,     label: 'Dup',     tip: 'Duplicar con el mismo set de canciones', action: (e: React.MouseEvent) => handleDuplicate(ev, e) },
                      ].map(btn => (
                      <Tooltip key={btn.label} tip={btn.tip}>
                        <button type="button"
                          onClick={btn.action}
                          style={{ flex: 1, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '0.3rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', borderRadius: '0.35rem', fontFamily: 'inherit', transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                        >
                          {btn.icon} {btn.label}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── EMPTY STATE ──────────────────────────────── */}
        {myEvents.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '1rem',
              background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 32px rgba(124,58,237,0.4)',
            }}>
              <span style={{ fontSize: '1.6rem' }}>♪</span>
            </div>
            <h2 style={{ fontWeight: '800', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Sin eventos todavía</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Crea tu primer evento y empezá a recibir votos.
            </p>
            <button type="button" onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                border: 'none', borderRadius: '9999px', color: 'white',
                padding: '0.75rem 1.75rem', fontWeight: '700', fontSize: '0.9rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              + Crear evento
            </button>
          </div>
        )}
      </div>

      {/* ── CREATE EVENT MODAL ───────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.22 }}
              style={{
                width: '100%', maxWidth: '480px',
                background: '#0d1117',
                border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: '1.25rem', overflow: 'hidden',
                boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(124,58,237,0.15)',
              }}
            >
              {/* Modal header */}
              <div style={{
                padding: '1.75rem 2rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                  overflow: 'hidden'
                }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
                  <span style={{ color: 'white' }}>EC </span>
                  <span style={{ color: '#8b5cf6' }}>Music</span>
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.3rem' }}>Iniciá tu evento en segundos</p>
              </div>

              <div style={{ padding: '1.5rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Music2 size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                    <input type="text" placeholder="Nombre de la Fiesta" value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      autoFocus
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        paddingLeft: '2.6rem', paddingRight: '1rem', paddingTop: '0.8rem', paddingBottom: '0.8rem',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem', color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                    <input type="text" placeholder="Club / Boliche / Lugar" value={newEvent.venue}
                      onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        paddingLeft: '2.6rem', paddingRight: '1rem', paddingTop: '0.8rem', paddingBottom: '0.8rem',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem', color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                </div>

                {/* Templates Dropdown */}
                {templates.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.62rem', fontWeight: '800', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <List size={12} /> Seleccionar Playlist Inicial
                    </p>
                    <div style={{ position: 'relative' }}>
                      <select
                        title="Seleccionar plantilla de canciones"
                        value={newEvent.template_id}
                        onChange={e => setNewEvent({ ...newEvent, template_id: e.target.value })}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${newEvent.template_id ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '0.75rem', color: newEvent.template_id ? '#fff' : 'rgba(255,255,255,0.3)',
                          fontSize: '0.85rem', fontWeight: '600', padding: '0.8rem 1rem',
                          outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <option value="" style={{ background: '#0d1117', color: '#64748b' }}>Sin playlist (evento vacío)</option>
                        {templates.map(t => (
                          <option key={t.id} value={String(t.id)} style={{ background: '#0d1117', color: '#e2e8f0' }}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Copiar set de otro evento */}
                {myEvents.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.62rem', fontWeight: '800', letterSpacing: '0.1em', color: '#a78bfa', marginBottom: '0.6rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Copy size={12} /> Copiar setlist de evento anterior
                    </p>
                    <div style={{ position: 'relative' }}>
                      <select
                        title="Copiar canciones de un evento pasado"
                        value={newEvent.copyFromEventId}
                        onChange={e => setNewEvent({ ...newEvent, copyFromEventId: e.target.value })}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${newEvent.copyFromEventId ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '0.75rem', color: newEvent.copyFromEventId ? '#fff' : 'rgba(255,255,255,0.3)',
                          fontSize: '0.85rem', fontWeight: '600', padding: '0.8rem 1rem',
                          outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <option value="" style={{ background: '#0d1117', color: '#64748b' }}>No copiar (set vacío)</option>
                        {myEvents.map(e => (
                          <option key={e.id} value={String(e.id)} style={{ background: '#0d1117', color: '#e2e8f0' }}>
                            {e.name} — {e.venue} {e._count?.songs ? `(${e._count.songs} temas)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Fecha/hora de inicio (opcional) */}
                {(() => {
                  const isScheduled = newEvent.startDate && new Date(newEvent.startDate) > new Date();
                  return (
                    <div style={{
                      borderRadius: '0.75rem', padding: '0.85rem 1rem',
                      background: isScheduled ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isScheduled ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                      <p style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.08em', color: isScheduled ? '#f59e0b' : '#64748b', marginBottom: '0.55rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={11} /> Programar inicio (opcional)
                      </p>
                      <input
                        type="datetime-local"
                        value={newEvent.startDate}
                        onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.04)', border: `1px solid ${isScheduled ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '0.65rem', color: isScheduled ? '#fbbf24' : 'white',
                          fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
                          padding: '0.55rem 0.75rem', colorScheme: 'dark',
                        }}
                      />
                      {isScheduled && (
                        <p style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: '0.4rem', opacity: 0.85 }}>
                          ◷ Se lanzará automáticamente el {new Date(newEvent.startDate).toLocaleString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Actions */}
                {(() => {
                  const isScheduled = newEvent.startDate && new Date(newEvent.startDate) > new Date();
                  return (
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button type="button" onClick={() => setShowCreateModal(false)}
                        style={{
                          flex: '0 0 auto', padding: '0.75rem 1.25rem',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '0.75rem', color: '#64748b', cursor: 'pointer',
                          fontWeight: '600', fontFamily: 'inherit',
                        }}
                      >
                        Cancelar
                      </button>
                      <motion.button type="button" onClick={handleCreateEvent}
                        disabled={isProcessing || !newEvent.name || !newEvent.venue}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        style={{
                          flex: 1, fontWeight: '800', padding: '0.85rem',
                          background: isScheduled ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                          border: 'none', borderRadius: '0.75rem', color: isScheduled ? '#000' : 'white',
                          cursor: (!newEvent.name || !newEvent.venue) ? 'not-allowed' : 'pointer',
                          opacity: (!newEvent.name || !newEvent.venue) ? 0.5 : 1,
                          fontSize: '0.9rem', fontFamily: 'inherit', letterSpacing: '0.03em',
                          boxShadow: isScheduled ? '0 4px 16px rgba(245,158,11,0.35)' : '0 4px 16px rgba(124,58,237,0.4)',
                        }}
                      >
                        {isProcessing ? 'Creando...' : isScheduled ? '◷ PROGRAMAR EVENTO' : '⚡ CREAR EVENTO'}
                      </motion.button>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ────────────────────────────────────── */}

      {/* ── EDIT MODAL (INJECTION) ─────────────────── */}
      <AnimatePresence>
        {showEditModal && editingEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              style={{ width: '100%', maxWidth: '480px', background: '#0d1117', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            >
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(139,92,246,0.08) 0%, transparent 100%)' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'white' }}>Editar / Reprogramar Evento</h2>
              </div>
              <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                   <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Nombre de la fiesta</label>
                   <input type="text" className="edit-input-field" style={{ width: '100%', boxSizing: 'border-box' }} value={editingEvent.name} onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Lugar</label>
                    <input type="text" className="edit-input-field" style={{ width: '100%', boxSizing: 'border-box' }} value={editingEvent.venue} onChange={e => setEditingEvent({ ...editingEvent, venue: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Fecha</label>
                    <input type="date" className="edit-input-field" style={{ width: '100%', boxSizing: 'border-box' }} value={editingEvent.startDate} onChange={e => setEditingEvent({ ...editingEvent, startDate: e.target.value })} />
                  </div>
                </div>
                
                {(editingEvent.status === 'SUSPENDED' || editingEvent.status === 'FINISHED') && (
                  <div style={{ background: 'rgba(139,92,246,0.1)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#a78bfa', margin: 0 }}>
                      Este evento está {editingEvent.status === 'SUSPENDED' ? 'suspendido' : 'finalizado'}. Al guardar, se reactivará automáticamente.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} className="edit-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                  <button type="button" 
                    onClick={() => {
                      const status = (editingEvent.status === 'SUSPENDED' || editingEvent.status === 'FINISHED') ? 'PENDING' : editingEvent.status;
                      setEditingEvent({ ...editingEvent, status });
                      setTimeout(handleUpdateEvent, 0);
                    }}
                    className="edit-btn-primary" style={{ flex: 2 }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Guardando...' : (editingEvent.status === 'SUSPENDED' || editingEvent.status === 'FINISHED' ? 'Guardar y Reactivar' : 'Guardar Cambios')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{
              position: 'fixed', bottom: '2rem', left: '50%',
              background: toast.type === 'error' ? '#ef4444' : 'rgba(15,23,42,0.97)',
              color: 'white', padding: '0.85rem 2rem', borderRadius: '3rem', zIndex: 2000,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)', fontSize: '0.85rem', whiteSpace: 'nowrap',
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        body { background: #000; }
        .edit-input-field { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 0.6rem; color: white; padding: 0.65rem 0.8rem; font-size: 0.85rem; transition: border-color 0.2s; font-family: inherit; }
        .edit-input-field:focus { outline: none; border-color: #8b5cf6; background: rgba(139,92,246,0.05); }
        .edit-btn-primary { background: #7c3aed; color: white; border: none; border-radius: 0.6rem; padding: 0.7rem 1.4rem; font-weight: 700; cursor: pointer; font-family: inherit; }
        .edit-btn-secondary { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.6rem; padding: 0.7rem 1.4rem; font-weight: 700; cursor: pointer; font-family: inherit; }
      `}</style>
    </div>
  );
};

export default DJHome;
