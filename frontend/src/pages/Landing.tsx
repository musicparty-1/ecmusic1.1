import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Music2, BarChart2, QrCode, Radio, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: <Radio size={22} color="#8b5cf6" />,
    title: 'Votación en Vivo',
    desc: 'El público vota en tiempo real desde su celular escaneando el QR.',
  },
  {
    icon: <TrendingUp size={22} color="#ec4899" />,
    title: 'Ranking Dinámico',
    desc: 'El setlist se ordena solo según los votos. Siempre gana la canción más pedida.',
  },
  {
    icon: <BarChart2 size={22} color="#f59e0b" />,
    title: 'Analytics Completo',
    desc: 'Estadísticas de votos, participantes y canciones más pedidas por evento.',
  },
  {
    icon: <QrCode size={22} color="#22c55e" />,
    title: 'Modo Espejo',
    desc: 'Pantalla pública con el ranking en vivo para proyectar en el evento.',
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      background: '#000',
      minHeight: '100vh',
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
    }}>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.2) 0%, transparent 65%)',
      }} />

      {/* ── NAVBAR */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="EC Music" style={{
            width: 30, height: 30, borderRadius: '0.5rem', objectFit: 'cover'
          }} />
          <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em' }}>
            EC <span style={{ color: '#8b5cf6' }}>Music</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={() => navigate('/dj/login')}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', borderRadius: '9999px',
              padding: '0.45rem 1.1rem', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: '600', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
          >
            Iniciar sesión
          </button>
          <motion.button type="button" onClick={() => navigate('/dj/register')}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              border: 'none', color: 'white', borderRadius: '9999px',
              padding: '0.45rem 1.1rem', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: '700', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
            }}
          >
            Crear cuenta
          </motion.button>
        </div>
      </nav>

      {/* ── HERO */}
      <section style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '7rem 1.5rem 5rem',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src="/logo.png" alt="Logo" style={{ width: 100, height: 100, borderRadius: '24px', marginBottom: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '9999px', padding: '0.3rem 0.9rem',
            fontSize: '0.75rem', fontWeight: '700', color: '#a78bfa',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: '1.75rem',
          }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}
            />
            v1.0 disponible ahora
          </div>

          <h1 style={{
            fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
            fontWeight: '900',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: '1.5rem',
            maxWidth: 800,
          }}>
            La música la elige{' '}
            <span style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              el público
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
            maxWidth: 560,
            margin: '0 auto 2.5rem',
          }}>
            EC Music permite que los asistentes de tu evento voten en tiempo real
            las canciones que quieren escuchar. El DJ controla, el público decide.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button type="button" onClick={() => navigate('/dj/register')}
              whileHover={{ scale: 1.04, filter: 'brightness(1.1)' }} whileTap={{ scale: 0.97 }}
              style={{
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                border: 'none', color: 'white', borderRadius: '9999px',
                padding: '0.9rem 2rem', cursor: 'pointer',
                fontSize: '1rem', fontWeight: '800', fontFamily: 'inherit',
                boxShadow: '0 8px 30px rgba(124,58,237,0.45)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              <Zap size={16} fill="white" /> Crear cuenta
            </motion.button>
            <button type="button" onClick={() => navigate('/dj/login')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.8)', borderRadius: '9999px',
                padding: '0.9rem 1.75rem', cursor: 'pointer',
                fontSize: '1rem', fontWeight: '600', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
            >
              Ya tengo cuenta
            </button>
          </div>
        </motion.div>

        {/* Floating music note */}
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          style={{ marginTop: '4rem', opacity: 0.12 }}
        >
          <Music2 size={120} />
        </motion.div>
      </section>

    {/* ── EXPERIENCES (Quince & Cumple) */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1100, margin: '0 auto',
        padding: '2rem 1.5rem 8rem',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>
            Experiencias <span style={{ color: '#8b5cf6' }}>Inolvidables</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
            EC Music se adapta a la energía de tu evento. Diseñado para momentos que duran para siempre.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
        }}>
          {/* Quince Años */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '2rem',
              overflow: 'hidden',
              border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
              <img 
                src="/quinceanera_party_app_1777419589917.png" 
                alt="Quince Años" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.1)' }}>
                ⭐ Recomendado
              </div>
            </div>
            <div style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Quince Años Mágicos</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Tu noche, tu ritmo. Haz que tus mejores amigos sean los co-DJs de tu fiesta de 15. Con EC Music, cada tanda de baile es una competencia por el hit del momento.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  <Zap size={14} color="#8b5cf6" /> Votación masiva en tandas locas
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  <Zap size={14} color="#8b5cf6" /> QR personalizados en cada mesa
                </li>
              </ul>
              <button 
                onClick={() => navigate('/dj/register')}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '1rem', background: 'white', color: 'black', border: 'none', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#8b5cf6'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'black'; }}
              >
                Organizar mis 15
              </button>
            </div>
          </motion.div>

          {/* Cumpleaños */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '2rem',
              overflow: 'hidden',
              border: '1px solid rgba(236,72,153,0.2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
              <img 
                src="/birthday_celebration_music_1777419603960.png" 
                alt="Cumpleaños" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.1)' }}>
                🔥 Popular
              </div>
            </div>
            <div style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Cumpleaños Inolvidables</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                ¿Cansado de la misma lista de siempre? Deja que tus invitados voten sus temas favoritos. Desde los clásicos que todos aman hasta los hits del momento.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  <Zap size={14} color="#ec4899" /> Ranking en vivo para proyectar
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  <Zap size={14} color="#ec4899" /> Estadísticas finales del evento
                </li>
              </ul>
              <button 
                onClick={() => navigate('/dj/register')}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '1rem', background: 'white', color: 'black', border: 'none', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ec4899'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'black'; }}
              >
                Planear mi cumple
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TECHNICAL FEATURES */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 900, margin: '0 auto',
        padding: '0 1.5rem 6rem',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Todo lo que necesitás
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
            Control total para el DJ, diversión máxima para el público.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              style={{
                background: '#0d1117',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                transition: 'border-color 0.2s, transform 0.2s',
                cursor: 'default',
              }}
              whileHover={{ y: -4, borderColor: 'rgba(139,92,246,0.3)' } as any}
            >
              <div style={{
                width: 42, height: 42, borderRadius: '0.75rem',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ── FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem',
        color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem',
      }}>
        <span>© 2026 EC Music — El poder de la música en tus manos 🎧</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dj/login')}>Login</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dj/register')}>Registro</span>
        </div>
      </footer>

      <style>{`
        @media (max-width: 600px) {
          nav { padding: 0.75rem 1rem !important; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
