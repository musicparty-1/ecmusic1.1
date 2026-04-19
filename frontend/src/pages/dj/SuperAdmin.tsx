import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, Activity, BarChart2, Shield, Zap, TrendingUp, 
  ArrowUpRight, Clock, MapPin, Search, ChevronRight
} from 'lucide-react';
import api from '../../api/api';

const SuperAdmin = () => {
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any>(null);
  const [events, setEvents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'events'>('overview');

  const fetchData = async () => {
    try {
      const [ovRes, userRes, evRes] = await Promise.all([
        api.get('/admin/telemetry/overview'),
        api.get('/admin/telemetry/users'),
        api.get('/admin/telemetry/events')
      ]);
      setOverview(ovRes.data);
      setUsers(userRes.data);
      setEvents(evRes.data);
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'white' }}>
        <Zap size={40} className="spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: 'white', padding: '2rem' }}>
      <header style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Shield size={24} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.15em', color: 'var(--primary)', textTransform: 'uppercase' }}>Superadmin Panel</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em' }}>EC Music Telemetry</h1>
        </div>
        
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '0.3rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          {(['overview', 'users', 'events'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.6rem 1.25rem', border: 'none', borderRadius: '0.75rem',
                background: tab === t ? 'var(--primary)' : 'transparent',
                color: tab === t ? 'white' : 'rgba(255,255,255,0.5)',
                fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >
              {/* KPIs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <KpiCard label="Live Events" value={overview.live_events} icon={<Activity size={20} />} trend="+12%" color="#22c55e" />
                <KpiCard label="Concurrent Users" value={overview.concurrent_users} icon={<Users size={20} />} trend="+45%" color="#a78bfa" />
                <KpiCard label="Total DJs" value={overview.total_djs} icon={<Zap size={20} />} trend={overview.new_djs_today > 0 ? `+${overview.new_djs_today} today` : 'Stable'} color="#3b82f6" />
                <KpiCard label="System Status" value={overview.system_status} icon={<Shield size={20} />} trend="Stable" color="#10b981" />
              </div>

              {/* Live Activity Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Activity size={18} style={{ color: 'var(--primary)' }} /> Live Events Detailed
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {events?.live_events.map((ev: any) => (
                      <div key={ev.event_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.2rem' }}>{ev.dj_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={12} /> Started {new Date(ev.started_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                          <div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Voters</div>
                            <div style={{ fontWeight: '800', color: '#22c55e' }}>{ev.active_voters}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Votes</div>
                            <div style={{ fontWeight: '800' }}>{ev.total_votes}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {events?.live_events.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>No events currently live</div>
                    )}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>DJ Growth</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <StatRow label="Last 7 days" value={users?.new_last_7d} total={users?.total_djs} />
                    <StatRow label="Last 30 days" value={users?.new_last_30d} total={users?.total_djs} />
                    <StatRow label="Active (30d)" value={users?.active_last_30d} total={users?.total_djs} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0' }}>Top DJs by Activity</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '1rem' }}>DJ Name</th>
                      <th style={{ padding: '1rem' }}>Total Events</th>
                      <th style={{ padding: '1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.top_djs_by_events.map((dj: any) => (
                      <tr key={dj.dj_id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1.25rem', fontWeight: '600' }}>{dj.display_name}</td>
                        <td style={{ padding: '1.25rem' }}>{dj.total_events} events</td>
                        <td style={{ padding: '1.25rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>View Profile</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {tab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            >
               <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={18} style={{ color: 'var(--primary)' }} /> Global Events History
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th style={{ padding: '1rem' }}>Event Name</th>
                      <th style={{ padding: '1rem' }}>DJ</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem' }}>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events?.all_events.map((ev: any) => (
                      <tr key={ev.event_id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1.25rem', fontSize: '0.85rem' }}>{new Date(ev.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '1.25rem', fontWeight: '700' }}>{ev.name}</td>
                        <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{ev.dj_name}</td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: '800',
                            background: ev.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                            color: ev.status === 'ACTIVE' ? '#22c55e' : 'rgba(255,255,255,0.5)',
                            border: `1px solid ${ev.status === 'ACTIVE' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}`
                          }}>
                            {ev.status}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem', fontWeight: '800' }}>{ev.total_votes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const KpiCard = ({ label, value, icon, trend, color }: any) => (
  <div className="glass-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: '0.7rem', color: trend.includes('+') ? '#22c55e' : 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{trend}</div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.2rem' }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
  </div>
);

const StatRow = ({ label, value, total }: any) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
        <span>{label}</span>
        <span style={{ fontWeight: '700' }}>{value}</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }} 
        />
      </div>
    </div>
  );
};

export default SuperAdmin;
