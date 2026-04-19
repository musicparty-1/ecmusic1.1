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
    <div style={{ background: '#020617', minHeight: '100vh', padding: 'clamp(1.5rem, 4vw, 4rem) clamp(1rem, 3vw, 2rem)', paddingBottom: '6rem' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1rem, 2vw, 2rem)', marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            style={{ 
              width: 'clamp(40px, 6vw, 64px)', 
              height: 'clamp(40px, 6vw, 64px)', 
              borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={window.innerWidth < 768 ? 20 : 32} />
          </button>
          <div>
            <div style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1.1rem)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '700' }}>Analytics de pista</div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{eventName}</h1>
          </div>
        </div>

        {/* Resumen rápido */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', 
          gap: 'clamp(1rem, 3vw, 2.5rem)', 
          marginBottom: 'clamp(2rem, 5vw, 4rem)' 
        }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: 'clamp(1.5rem, 4vw, 3.5rem)' }}>
            <TrendingUp size={window.innerWidth < 768 ? 30 : 48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: '900', color: 'var(--primary)', lineHeight: 1 }}>{analytics.totalVotes}</div>
            <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1.4rem)', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '600' }}>Votos totales</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: 'clamp(1.5rem, 4vw, 3.5rem)' }}>
            <Clock size={window.innerWidth < 768 ? 30 : 48} style={{ color: 'var(--accent)', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: '900', color: 'var(--accent)', lineHeight: 1 }}>{analytics.mostActiveHour || '—'}</div>
            <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1.4rem)', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '600' }}>Hora más activa</div>
          </div>
        </div>

        {/* Votos por hora */}
        {analytics.hourlyVotes.length > 0 && (
          <div className="glass-card" style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)', padding: 'clamp(1.25rem, 3vw, 2.5rem)' }}>
            <h3 style={{ fontWeight: '800', marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>
              <Clock size={window.innerWidth < 768 ? 20 : 32} /> Actividad por hora
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(0.25rem, 1vw, 1rem)', height: 'clamp(120px, 20vw, 280px)' }}>
              {analytics.hourlyVotes.map((h) => (
                <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.round((h.count / maxHourlyCount) * (window.innerWidth < 768 ? 100 : 240))}px`,
                      background: 'linear-gradient(180deg, var(--primary), var(--accent))',
                      borderRadius: 'clamp(4px, 1vw, 12px) clamp(4px, 1vw, 12px) 0 0',
                      minHeight: '4px',
                      transition: 'height 0.5s ease-out'
                    }}
                    title={`${h.count} votos`}
                  />
                  <span style={{ fontSize: 'clamp(0.6rem, 1.2vw, 1.2rem)', color: 'var(--text-muted)', fontWeight: '700' }}>{h.hour}h</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Votos por canción */}
        <div className="glass-card" style={{ padding: 'clamp(1.25rem, 3vw, 2.5rem)' }}>
          <h3 style={{ fontWeight: '800', marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>
            <Music size={window.innerWidth < 768 ? 20 : 32} /> Votos por canción
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 2.5rem)' }}>
            {analytics.songStats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>Sin votos registrados.</p>
            ) : (
              analytics.songStats.map((song, i) => (
                <div key={song.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'flex-end' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: 'clamp(0.9rem, 2.5vw, 1.75rem)', lineHeight: 1.2 }}>
                        {i === 0 && '🏆 '}{song.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.75rem, 1.8vw, 1.25rem)', fontWeight: '500', marginTop: '0.2rem' }}>{song.artist}</div>
                      {song.played && (
                        <div style={{
                          marginTop: '0.4rem', fontSize: 'clamp(0.6rem, 1.2vw, 1rem)', padding: '0.2rem 0.6rem',
                          background: 'rgba(16,185,129,0.15)', color: 'var(--success)', borderRadius: '0.4rem', fontWeight: '700',
                          display: 'inline-block'
                        }}>tocada</div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 'clamp(1rem, 3vw, 1.8rem)', fontWeight: '900', marginLeft: '1.5rem', textAlign: 'right' }}>
                      {song.votes} <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.6em' }}>({song.percentage}%)</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', height: 'clamp(8px, 1.5vw, 18px)', overflow: 'hidden' }}>
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
