import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { events } from '../../api/api';
import { Trophy, Users, Activity, Music, ArrowLeft, Download } from 'lucide-react';

interface TopSong {
  id: number;
  title: string;
  artist: string;
  votes: number;
}

interface Summary {
  event: { id: number; name: string; venue: string; status: string; created_at: string };
  totalVotes: number;
  uniqueVoters: number;
  engagement: string;
  topSongs: TopSong[];
  playedCount: number;
  totalSongs: number;
}

const EventSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    events.getSummary(parseInt(id))
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleExport = async () => {
    if (!id) return;
    const res = await events.getExport(parseInt(id));
    const blob = new Blob([res.data.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.data.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Cargando resumen...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Evento no encontrado</div>
      </div>
    );
  }

  const participationPct = summary.uniqueVoters > 0 && summary.totalVotes > 0
    ? Math.min(100, Math.round((summary.uniqueVoters / Math.max(summary.uniqueVoters, 10)) * 100))
    : 0;

  return (
    <div style={{ background: '#020617', minHeight: '100vh', padding: '2rem 1rem', paddingBottom: '4rem' }}>
      <div className="container" style={{ maxWidth: '760px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            style={{ padding: '0.5rem', borderRadius: '50%' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resumen del evento</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.event.name}</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {summary.event.venue}</div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
          >
            <Download size={16} /> Exportar Set
          </button>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Trophy size={24} style={{ color: 'var(--accent)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{summary.totalVotes}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Votos totales</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Users size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{summary.uniqueVoters}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Participantes únicos</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Activity size={24} style={{ color: 'var(--success)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{summary.engagement}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Votos por persona</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Music size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{summary.playedCount}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/{summary.totalSongs}</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Canciones tocadas</div>
          </div>
        </div>

        {/* Participación */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Participación del público</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>{participationPct}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', height: '8px', overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              height: '100%', borderRadius: '2rem',
              width: `${participationPct}%`,
              transition: 'width 1s ease-out'
            }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Objetivo mínimo: 25%
          </div>
        </div>

        {/* Top 5 canciones */}
        <div className="glass-card">
          <h3 style={{ fontWeight: 'bold', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={18} style={{ color: 'var(--accent)' }} /> Top canciones del evento
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {summary.topSongs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin votos registrados.</p>
            ) : (
              summary.topSongs.map((song, i) => (
                <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'var(--accent)' : i === 1 ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '0.875rem'
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{song.artist}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: i === 0 ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>
                    {song.votes} votos
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analytics link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => navigate(`/dj/events/${id}/analytics`)}
            className="btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            Ver Analytics Detallado →
          </button>
        </div>

      </div>
    </div>
  );
};

export default EventSummary;
