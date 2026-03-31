import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { events } from '../../api/api';
import { ArrowLeft, TrendingUp, Clock, Music } from 'lucide-react';

interface SongStat {
  id: number;
  title: string;
  artist: string;
  votes: number;
  percentage: number;
  played: boolean;
}

interface HourlyVote {
  hour: string;
  count: number;
}

interface Analytics {
  totalVotes: number;
  songStats: SongStat[];
  hourlyVotes: HourlyVote[];
  mostActiveHour: string | null;
}

const EventAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      events.getAnalytics(parseInt(id)),
      events.getOne(parseInt(id)),
    ])
      .then(([analyticsRes, eventRes]) => {
        setAnalytics(analyticsRes.data);
        setEventName(eventRes.data.name);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Cargando analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Sin datos disponibles</div>
      </div>
    );
  }

  const maxHourlyCount = Math.max(...analytics.hourlyVotes.map((h) => h.count), 1);

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
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Analytics de pista</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{eventName}</h1>
          </div>
        </div>

        {/* Resumen rápido */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{analytics.totalVotes}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Votos totales</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Clock size={20} style={{ color: 'var(--accent)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>{analytics.mostActiveHour || '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hora más activa</div>
          </div>
        </div>

        {/* Votos por hora */}
        {analytics.hourlyVotes.length > 0 && (
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <Clock size={16} /> Actividad por hora
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '100px' }}>
              {analytics.hourlyVotes.map((h) => (
                <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.round((h.count / maxHourlyCount) * 80)}px`,
                      background: 'linear-gradient(180deg, var(--primary), var(--accent))',
                      borderRadius: '4px 4px 0 0',
                      minHeight: '4px',
                      transition: 'height 0.5s ease-out'
                    }}
                    title={`${h.count} votos`}
                  />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{h.hour}h</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Votos por canción */}
        <div className="glass-card">
          <h3 style={{ fontWeight: 'bold', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <Music size={16} /> Votos por canción
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {analytics.songStats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin votos registrados.</p>
            ) : (
              analytics.songStats.map((song, i) => (
                <div key={song.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                        {i === 0 && '🏆 '}{song.title}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> · {song.artist}</span>
                      {song.played && (
                        <span style={{
                          marginLeft: '0.5rem', fontSize: '0.65rem', padding: '0.1rem 0.4rem',
                          background: 'rgba(16,185,129,0.15)', color: 'var(--success)', borderRadius: '0.25rem'
                        }}>tocada</span>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, fontSize: '0.8rem', fontWeight: '600', marginLeft: '1rem' }}>
                      {song.votes} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({song.percentage}%)</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      background: i === 0
                        ? 'linear-gradient(90deg, var(--primary), var(--accent))'
                        : 'rgba(139,92,246,0.4)',
                      height: '100%', borderRadius: '2rem',
                      width: `${song.percentage}%`,
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EventAnalytics;
