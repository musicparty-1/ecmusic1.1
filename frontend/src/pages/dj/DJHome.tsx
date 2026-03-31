import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { events, billing as billingApi } from '../../api/api';
import {
  Search, Radio, BarChart2,
  FileText, Download, LogOut, Zap, Copy,
  Music2, MapPin, Play, XCircle, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const DJHome = () => {
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ name: '', venue: '', template_id: '', isPending: false });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [billingStatus, setBillingStatus] = useState<{ plan: string; subscriptionStatus: string; daysLeft: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const navigate = useNavigate();
  const djUser = JSON.parse(localStorage.getItem('dj_user') || '{}');
  const djName = djUser.name || 'DJ';
  const djInitial = djName.charAt(0).toUpperCase();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get(`/events?dj_id=${djUser.id || 1}`);
      setMyEvents(res.data || []);
    } catch {
      console.error('Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    events.getTemplates().then(r => setTemplates(r.data)).catch(() => {});
    billingApi.getStatus().then(r => setBillingStatus(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.venue) return;
    try {
      setIsProcessing(true);
      const res = await api.post('/events', {
        name: newEvent.name,
        venue: newEvent.venue,
        dj_id: djUser.id || 1,
        template_id: newEvent.template_id ? parseInt(newEvent.template_id) : undefined,
        status: newEvent.isPending ? 'PENDING' : 'ACTIVE',
      });
      showToast(newEvent.isPending ? 'Pre-evento creado' : '¡Evento creado!');
      setShowCreateModal(false);
      setNewEvent({ name: '', venue: '', template_id: '', isPending: false });
      await fetchEvents();
      if (!newEvent.isPending) {
        navigate('/dj/dashboard', { state: { eventId: res.data.id } });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al crear evento';
      const code = err?.response?.data?.code;
      showToast(msg, 'error');
      if (code === 'PLAN_EXPIRED' || code === 'EVENT_LIMIT') {
        setTimeout(() => navigate('/dj/billing'), 3200);
      }
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

  const handleLaunch = async (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await events.launch(ev.id);
      showToast('¡Evento lanzado en vivo!');
      fetchEvents();
    } catch { showToast('Error al lanzar', 'error'); }
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
  const totalVotes = myEvents.reduce((acc, ev) => acc + (ev._count?.songs || 0), 0);

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
        background: 'radial-gradient(ellipse 80% 40% at 80% 0%, rgba(124,58,237,0.1) 0%, transparent 60%)',
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
            <button
              type="button"
              title="Analytics"
              onClick={() => navigate('/dj/dashboard')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', display: 'flex', borderRadius: '0.5rem', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >
              <BarChart2 size={18} />
            </button>
            <button
              type="button"
              title="Cerrar sesión"
              onClick={() => { localStorage.removeItem('dj_user'); navigate('/dj/login'); }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', display: 'flex', borderRadius: '0.5rem', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >
              <LogOut size={18} />
            </button>
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

        {/* ── BILLING BANNER ──────────────────────────── */}
        {billingStatus && billingStatus.subscriptionStatus !== 'ACTIVE' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '1.5rem',
              background: billingStatus.subscriptionStatus === 'EXPIRED' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${billingStatus.subscriptionStatus === 'EXPIRED' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
              borderRadius: '0.75rem',
              padding: '0.75rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: billingStatus.subscriptionStatus === 'EXPIRED' ? '#ef4444' : '#f59e0b' }}>
              {billingStatus.subscriptionStatus === 'EXPIRED'
                ? '⚠ Tu período de prueba expiró.'
                : `◷ Tu prueba vence en ${billingStatus.daysLeft} días.`}
            </span>
            <button type="button" onClick={() => navigate('/dj/billing')} style={{
              background: billingStatus.subscriptionStatus === 'EXPIRED' ? '#ef4444' : '#f59e0b',
              color: billingStatus.subscriptionStatus === 'EXPIRED' ? 'white' : '#000',
              border: 'none', borderRadius: '9999px', padding: '0.25rem 0.85rem',
              fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {billingStatus.subscriptionStatus === 'EXPIRED' ? 'Elegir plan' : 'Ver planes'}
            </button>
          </motion.div>
        )}

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Left: live dot + info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <motion.div
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1.4 }}
                          style={{ width: 8, height: 8, borderRadius: '50%', background: ev.status === 'ACTIVE' ? '#22c55e' : '#f59e0b', flexShrink: 0 }}
                        />
                        <span style={{ fontWeight: '700', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.name}
                        </span>
                        <span className="badge-live" style={ev.status === 'PENDING' ? {
                          background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b',
                        } : {}}>
                          {ev.status === 'ACTIVE' ? <><span className="badge-live-dot" /> EN VIVO</> : '◷ PRE-EVENTO'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.75rem' }}>
                        <MapPin size={11} /> {ev.venue}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button type="button" title="Analytics"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dj/events/${ev.id}/analytics`); }}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.35rem', display: 'flex', borderRadius: '0.4rem' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                      >
                        <BarChart2 size={14} />
                      </button>
                      {ev.status === 'PENDING' && (
                        <button type="button"
                          onClick={(e) => handleLaunch(ev, e)}
                          style={{
                            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                            color: '#f59e0b', borderRadius: '9999px', padding: '0.35rem 0.85rem',
                            cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700',
                            display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit',
                          }}
                        >
                          ▶ Lanzar
                        </button>
                      )}
                      {/* Cerrar evento */}
                      <button type="button" title="Cerrar evento"
                        onClick={(e) => handleClose(ev, e)}
                        style={{
                          background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.25)',
                          color: '#94a3b8', borderRadius: '9999px', padding: '0.35rem 0.85rem',
                          cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700',
                          display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(100,116,139,0.5)'; (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(100,116,139,0.25)'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
                      >
                        <XCircle size={13} /> Cerrar
                      </button>
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
                          <motion.button
                            key="delete"
                            type="button"
                            title="Eliminar evento"
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
                        )}
                      </AnimatePresence>
                      {/* Retomar */}
                      <motion.button
                        type="button"
                        onClick={() => navigate('/dj/dashboard', { state: { eventId: ev.id } })}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                          background: '#22c55e',
                          border: 'none',
                          color: '#000', borderRadius: '9999px',
                          padding: '0.45rem 1rem', cursor: 'pointer',
                          fontSize: '0.78rem', fontWeight: '800',
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          fontFamily: 'inherit',
                        }}
                      >
                        <Play size={13} fill="#000" /> Retomar
                      </motion.button>
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
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '0.875rem', padding: '1rem 1.1rem',
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
                      { icon: <FileText size={11} />, label: 'Resumen', action: (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/dj/events/${ev.id}/summary`); } },
                      { icon: <BarChart2 size={11} />, label: 'Stats',   action: (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/dj/events/${ev.id}/analytics`); } },
                      { icon: <Download size={11} />, label: 'CSV',     action: (e: React.MouseEvent) => handleExport(ev, e) },
                      { icon: <Copy size={11} />,     label: 'Dup',     action: (e: React.MouseEvent) => handleDuplicate(ev, e) },
                    ].map(btn => (
                      <button key={btn.label} type="button"
                        onClick={btn.action}
                        style={{ flex: 1, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '0.3rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', borderRadius: '0.35rem', fontFamily: 'inherit', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                      >
                        {btn.icon} {btn.label}
                      </button>
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
                  width: 52, height: 52, borderRadius: '0.875rem',
                  background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                }}>
                  <Zap size={24} color="white" fill="white" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
                  <span style={{ color: 'white' }}>Music</span>
                  <span style={{ color: '#8b5cf6' }}>Party</span>
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

                {/* Templates */}
                {templates.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.65rem', textTransform: 'uppercase' }}>Playlist inicial</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['', ...templates.map(t => String(t.id))].map((tid, idx) => {
                        const isActive = newEvent.template_id === tid;
                        return (
                          <button key={idx} type="button"
                            onClick={() => setNewEvent({ ...newEvent, template_id: tid })}
                            style={{
                              padding: '0.3rem 0.85rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                              border: `1px solid ${isActive ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
                              background: isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                              color: isActive ? '#8b5cf6' : '#64748b', cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            {tid === '' ? 'Vacía' : templates.find(t => String(t.id) === tid)?.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pre-event toggle */}
                <div onClick={() => setNewEvent(p => ({ ...p, isPending: !p.isPending }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                    borderRadius: '0.75rem', cursor: 'pointer',
                    background: newEvent.isPending ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${newEvent.isPending ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div style={{
                    width: 38, height: 22, borderRadius: 99, position: 'relative', flexShrink: 0,
                    background: newEvent.isPending ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 3, left: newEvent.isPending ? 19 : 3,
                      width: 16, height: 16, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: newEvent.isPending ? '#f59e0b' : '#e2e8f0' }}>
                      Modo pre-evento
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>El público vota antes del evento</div>
                  </div>
                </div>

                {/* Actions */}
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
                      background: newEvent.isPending
                        ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                        : 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                      border: 'none', borderRadius: '0.75rem', color: 'white',
                      cursor: (!newEvent.name || !newEvent.venue) ? 'not-allowed' : 'pointer',
                      opacity: (!newEvent.name || !newEvent.venue) ? 0.5 : 1,
                      fontSize: '0.9rem', fontFamily: 'inherit', letterSpacing: '0.03em',
                      boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                    }}
                  >
                    {isProcessing ? 'Creando...' : newEvent.isPending ? '◷ CREAR PRE-EVENTO' : '⚡ CREAR EVENTO'}
                  </motion.button>
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
      `}</style>
    </div>
  );
};

export default DJHome;
