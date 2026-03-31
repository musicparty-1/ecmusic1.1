import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music2 } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      background: '#000', minHeight: '100vh', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: '2rem',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(124,58,237,0.12) 0%, transparent 65%)' }} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 420 }}
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
          style={{ marginBottom: '1.5rem', opacity: 0.15 }}
        >
          <Music2 size={80} />
        </motion.div>
        <h1 style={{
          fontSize: '6rem', fontWeight: '900', lineHeight: 1,
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
        }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Esta pista no existe
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          La página que buscás no se encontró o fue eliminada.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button type="button" onClick={() => navigate(-1)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', borderRadius: '9999px',
              padding: '0.65rem 1.25rem', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <ArrowLeft size={14} /> Volver
          </motion.button>
          <motion.button type="button" onClick={() => navigate('/')}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              border: 'none', color: 'white', borderRadius: '9999px',
              padding: '0.65rem 1.5rem', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: '700', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
            }}
          >
            Ir al inicio
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
