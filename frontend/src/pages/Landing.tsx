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
            Empezar gratis
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
              <Zap size={16} fill="white" /> Empezar gratis — 30 días
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

    {/* ── EXPERIENCES (Quince, Cumple, Nightclub, Retro) */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto',
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
            EC Music se adapta a la energía de cada noche. Desde la elegancia de un evento social hasta la explosión del boliche.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
        }}>
          {[
            {
              title: 'Quince Años Mágicos',
              desc: 'Haz que tus mejores amigos sean los co-DJs de tu fiesta de 15. Cada tanda de baile es una competencia por el hit del momento.',
              img: '/quinceanera_party_app_1777419589917.png',
              tag: '⭐ Recomendado',
              color: '#8b5cf6',
              features: ['Votación masiva en tandas locas', 'QR personalizados por mesa']
            },
            {
              title: 'Cumpleaños Inolvidables',
              desc: '¿Cansado de la misma lista de siempre? Deja que tus invitados voten sus temas favoritos. Desde clásicos hasta hits del momento.',
              img: '/birthday_celebration_music_1777419603960.png',
              tag: '🔥 Popular',
              color: '#ec4899',
              features: ['Ranking en vivo proyectado', 'Estadísticas finales del evento']
            },
            {
              title: 'Boliches & Discos',
              desc: 'Aumenta el engagement en tu pista. Los clientes eligen qué hit de reggaetón o electrónica quieren que suene a continuación.',
              img: '/nightclub_voting_experience_1777425766129.png',
              tag: '⚡ Explosivo',
              color: '#06b6d4',
              features: ['Integración con pantalla gigante', 'Modo Recital de alta velocidad']
            },
            {
              title: 'Eventos Retro',
              desc: 'La nostalgia interactiva. Deja que el público decida qué clásico de los 80, 90 o 2000 nos hará volver a vivir el momento.',
              img: '/retro_party_music_voting_1777425779058.png',
              tag: '📻 Nostalgia',
              color: '#f59e0b',
              features: ['Catálogos curados por década', 'Trivia musical en vivo']
            }
          ].map((exp, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '1.5rem',
                overflow: 'hidden',
                border: `1px solid ${exp.color}33`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={exp.img} 
                  alt={exp.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', border: `1px solid ${exp.color}44`, color: exp.color }}>
                  {exp.tag}
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem' }}>{exp.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  {exp.desc}
                </p>
                <div style={{ marginTop: 'auto' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {exp.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                        <Zap size={12} color={exp.color} fill={exp.color} /> {f}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => navigate('/dj/register')}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: `1px solid ${exp.color}55`, fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem' }}
                    onMouseEnter={e => { e.currentTarget.style.background = exp.color; e.currentTarget.style.borderColor = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = `${exp.color}55`; }}
                  >
                    Me interesa
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
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

      {/* ── PLANS SUMMARY */}
      <section style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '5rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(139,92,246,0.03)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            Empezá gratis hoy
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', marginBottom: '2rem' }}>
            30 días de prueba sin tarjeta. Después elegís el plan que mejor se adapte.
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap',
            marginBottom: '2.5rem',
          }}>
            {[
              { plan: 'Demo', price: 'Gratis', color: '#64748b' },
              { plan: 'Starter', price: '$4.999 ARS', color: '#8b5cf6' },
              { plan: 'Pro', price: '$9.999 ARS', color: '#ec4899' },
              { plan: 'Agency', price: '$19.999 ARS', color: '#f59e0b' },
            ].map(p => (
              <div key={p.plan} style={{
                background: '#0d1117',
                border: `1px solid ${p.color}33`,
                borderRadius: '0.875rem',
                padding: '0.9rem 1.5rem',
                minWidth: 130,
              }}>
                <div style={{ fontWeight: '800', color: p.color, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{p.plan}</div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{p.price}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>/ mes</div>
              </div>
            ))}
          </div>
          <motion.button type="button" onClick={() => navigate('/dj/register')}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              border: 'none', color: 'white', borderRadius: '9999px',
              padding: '0.9rem 2.25rem', cursor: 'pointer',
              fontSize: '1rem', fontWeight: '800', fontFamily: 'inherit',
              boxShadow: '0 8px 30px rgba(124,58,237,0.4)',
            }}
          >
            Crear cuenta gratis
          </motion.button>
        </motion.div>
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
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dj/billing')}>Planes</span>
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
