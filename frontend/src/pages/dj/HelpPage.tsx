import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronDown, ChevronUp,
  Zap, QrCode, Music,
  BarChart2, CreditCard, Smartphone, HelpCircle,
  Radio,
} from 'lucide-react';

// ── Datos del manual ──────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'inicio',
    icon: Zap,
    color: '#8b5cf6',
    title: 'Primeros pasos',
    intro: 'Todo lo que necesitás saber para crear tu primer evento en menos de 2 minutos.',
    items: [
      {
        q: '¿Cómo creo mi primer evento?',
        a: `Desde el Dashboard (panel principal), hacé clic en el botón <strong>+ NUEVO EVENTO</strong>. Completá el nombre del evento y el venue (boliche/lugar). Podés dejarlo en modo EN VIVO para que empiece de inmediato, o activar el modo <em>Pre-evento</em> para que el público vote antes de que empiece la noche.\n\nEn menos de 30 segundos el evento está activo y listo para recibir votos.`,
      },
      {
        q: '¿Cómo accede el público a votar?',
        a: `Cada evento tiene su propio <strong>QR y link único</strong>. El público lo abre desde el celular — no necesita instalar nada ni registrarse. Basta con escanear el QR o abrir el link.\n\nEl QR lo encontrás en el botón <strong>VER QR</strong> del panel principal del evento.`,
      },
      {
        q: '¿Cuántos votos puede dar cada persona?',
        a: `Por defecto <strong>3 votos por dispositivo</strong> en todo el evento. Podés cambiarlo desde el ícono de ajustes (⚙) del panel, entre 1 y 10 votos. El cambio es inmediato y aplica a dispositivos que todavía no votaron.`,
      },
    ],
  },
  {
    id: 'canciones',
    icon: Music,
    color: '#ec4899',
    title: 'Canciones y setlist',
    intro: 'Cómo construir y administrar la lista de canciones que el público puede votar.',
    items: [
      {
        q: '¿Cómo agrego canciones al evento?',
        a: `Tenés dos formas:\n\n<strong>1. Catálogo propio:</strong> Expandí la sección <em>Catálogo</em> en el panel izquierdo. Las canciones están organizadas por género. Hacé clic en el símbolo <strong>+</strong> de cualquier canción para agregarla al evento al instante.\n\n<strong>2. Búsqueda libre:</strong> Usá la barra de búsqueda para encontrar por nombre, artista o género. También podés agregar canciones que no estén en el catálogo usando el botón <strong>+ AGREGAR</strong> e ingresando título y artista manualmente.`,
      },
      {
        q: '¿Cómo copio el set de otro evento?',
        a: `Al crear un nuevo evento, en el formulario aparece la opción <em>"Copiar set de canciones de otro evento"</em>. Seleccioná el evento anterior del menú desplegable y todas sus canciones se copian automáticamente al nuevo evento al crearlo.`,
      },
      {
        q: '¿Cómo marco una canción como reproducida?',
        a: `En la lista de canciones del panel, cada canción tiene un ícono <strong>▶</strong> (reproducir). Al hacerle clic, la canción pasa al historial "Reproducidas" y deja de aparecer en la votación activa del público. El público ve automáticamente en el banner superior qué canción está sonando ahora.`,
      },
      {
        q: '¿Puedo cambiar el orden de las canciones?',
        a: `Sí. En el panel de canciones hay flechas ↑ ↓ en cada canción para reordenarlas manualmente. Esto solo afecta el orden visual en tu panel — el público siempre ve las canciones ordenadas por cantidad de votos de mayor a menor.`,
      },
    ],
  },
  {
    id: 'votacion',
    icon: QrCode,
    color: '#06b6d4',
    title: 'Sistema de votación',
    intro: 'Cómo funciona el proceso de votación desde la perspectiva del público.',
    items: [
      {
        q: '¿Cómo vota el público?',
        a: `El público abre el link del evento (por QR o link directo) desde el navegador del celular. Ve la lista de canciones ordenadas por votos. Toca el botón de corazón/voto en la canción que quiere. Recibe feedback visual inmediato y puede ver en tiempo real cómo cambia el ranking.`,
      },
      {
        q: '¿Qué es la app móvil?',
        a: `La <strong>app nativa de Android</strong> (MusicParty) ofrece una experiencia mejorada para el público: búsqueda de canciones, trending de posiciones, "ahora suena", y vibración al votar. Se instala desde el archivo APK. El link web también funciona perfectamente sin instalar nada.`,
      },
      {
        q: '¿Cómo funciona el anti-fraude?',
        a: `Cada dispositivo tiene un ID único generado automáticamente. No se pueden dar más votos que el límite configurado (por defecto 3) por dispositivo. Cambiar de pestaña o limpiar cookies genera un nuevo ID, pero el sistema rastrea también la IP y el user agent para detectar abuso.`,
      },
      {
        q: '¿El público ve los resultados en tiempo real?',
        a: `Sí. La lista de canciones se actualiza cada pocos segundos mostrando el orden actual por votos, con indicadores de tendencia (↑ subiendo, ↓ bajando) y el badge de la canción que está sonando ahora.`,
      },
    ],
  },
  {
    id: 'modos',
    icon: Radio,
    color: '#f59e0b',
    title: 'Modos especiales',
    intro: 'Pre-evento, Modo Recital y Modo Espejo para diferentes situaciones.',
    items: [
      {
        q: '¿Qué es el Modo Pre-evento?',
        a: `Permite que el público vote <strong>días antes</strong> del evento. Creás el evento con estado PENDIENTE activando el toggle "Modo pre-evento" en el formulario de creación.\n\nOpcional: podés cargar una <strong>fecha y hora de lanzamiento automático</strong>. Cuando llegue ese momento, el evento pasa a EN VIVO automáticamente sin que tengas que hacer nada.\n\nSi no cargás fecha, lo lanzás manualmente con el botón "▶ Lanzar" del panel.`,
      },
      {
        q: '¿Qué es el Modo Recital?',
        a: `Con el toggle <strong>RECITAL</strong> activado, el público ya <em>no puede votar</em> — solo puede ver el ranking y lo que está sonando. Útil para:\n\n• Shows en vivo donde vos definís el setlist\n• Momentos donde querés mostrar el ranking sin recibir más votos\n• Recitales donde el artista no quiere que el público influya\n\nEl toggle se puede activar y desactivar en cualquier momento.`,
      },
      {
        q: '¿Qué es el Modo Espejo?',
        a: `El botón <strong>ESPEJO</strong> abre una pantalla diseñada para proyectar en una pantalla grande del boliche. Muestra en tiempo real:\n\n• Las canciones más votadas con sus posiciones\n• La canción que está sonando ahora\n• El nombre y venue del evento\n• Diseño oscuro de alto contraste, legible a distancia\n\nAbrís la URL del espejo en un segundo monitor o conectás una notebook a la pantalla del boliche.`,
      },
    ],
  },
  {
    id: 'cierre',
    icon: BarChart2,
    color: '#10b981',
    title: 'Cierre y analytics',
    intro: 'Qué pasa cuando terminás el evento y cómo acceder a los datos.',
    items: [
      {
        q: '¿Cómo cierro un evento?',
        a: `Hacé clic en el botón <strong>CERRAR</strong> (ícono 🔒) en la barra superior del panel. El sistema pedirá confirmación. Al cerrar, el evento pasa a estado FINALIZADO y el público ya no puede votar.\n\nInmediatamente después se genera el <strong>Resumen del evento</strong> con todas las estadísticas.`,
      },
      {
        q: '¿Qué información tiene el resumen?',
        a: `El resumen post-evento incluye:\n\n• Total de votos y votantes únicos\n• Ranking final completo con votos por canción\n• Canción más votada (ganadora)\n• Evolución de votos a lo largo del evento\n• Canciones reproducidas vs no reproducidas\n• Promedio de votos por persona`,
      },
      {
        q: '¿Puedo exportar los datos?',
        a: `Sí. Desde el botón <strong>CSV</strong> en la lista de eventos podés descargar un archivo con el ranking completo, votos por canción, y datos del evento. Útil para llevar un registro histórico o compartirlo con el artista.`,
      },
      {
        q: '¿Cómo duplico un evento pasado?',
        a: `En la lista de eventos, cada evento tiene un botón <strong>Duplicar</strong>. Crea un nuevo evento con el mismo nombre, venue y lista de canciones (con votos en cero). Ideal para DJs con residencia que tienen un setlist fijo.`,
      },
    ],
  },
  {
    id: 'planes',
    icon: CreditCard,
    color: '#a78bfa',
    title: 'Planes y pagos',
    intro: 'Cómo funcionan los períodos de prueba, membresías y créditos por evento.',
    items: [
      {
        q: '¿Qué incluye el período de prueba?',
        a: `Al registrarte tenés un <strong>trial gratuito</strong> con acceso al plan Demo: hasta 10 eventos por mes y 50 votos por evento. No necesitás tarjeta de crédito para empezar.\n\nCuando el trial expira, el sistema te avisa y podés elegir entre una membresía mensual o comprar créditos por evento.`,
      },
      {
        q: '¿Cuál es la diferencia entre membresía y créditos?',
        a: `<strong>Membresía mensual:</strong> Pagás una vez por mes y tenés acceso continuo. Ideal si hacés más de 2 eventos por mes.\n• Starter ($4.999/mes): 10 eventos, 200 votos/evento\n• Pro ($9.999/mes): eventos y votos ilimitados\n• Agency ($19.999/mes): multi-DJ, branding propio\n\n<strong>Créditos por evento:</strong> Pagás por evento, sin compromiso mensual. Se acumulan y no vencen. Ideal para DJs esporádicos.\n• 1 evento: $1.499\n• Pack 3: $3.999\n• Pack 10: $9.999`,
      },
      {
        q: '¿Cómo se cobran los créditos de evento?',
        a: `Se descuenta 1 crédito automáticamente cuando creás un nuevo evento. El saldo de créditos lo ves en la pantalla de Planes (menú → Planes).`,
      },
      {
        q: '¿Puedo cancelar la membresía?',
        a: `Sí, en cualquier momento desde <strong>Planes → Cancelar plan</strong>. La membresía sigue activa hasta fin del período ya abonado. Luego pasás al plan Demo.`,
      },
    ],
  },
  {
    id: 'app',
    icon: Smartphone,
    color: '#34d399',
    title: 'App móvil',
    intro: 'La app nativa de Android para una mejor experiencia del público.',
    items: [
      {
        q: '¿Cómo instalo la app en Android?',
        a: `La app se distribuye como APK (instalación directa, fuera del Play Store por ahora):\n\n1. Descargá el archivo <strong>musicparty.apk</strong>\n2. En el celular, habilitá "Instalar desde fuentes desconocidas" en Ajustes → Seguridad\n3. Abrí el APK descargado y seguí los pasos de instalación\n4. Abrí la app, ingresá el código del evento (el número del link) y listo\n\nEl proceso lleva menos de 2 minutos.`,
      },
      {
        q: '¿Qué ventajas tiene la app vs el link web?',
        a: `La app ofrece:\n• <strong>Búsqueda de canciones</strong> con teclado nativo\n• <strong>Trending</strong> en tiempo real (↑↓ canciones subiendo/bajando)\n• <strong>Vibración háptica</strong> al votar\n• <strong>Ahora suena</strong> — banner con la canción actual\n• <strong>Contador de personas votando</strong> en tiempo real\n• Mejor rendimiento en conexiones lentas\n\nEl link web funciona perfectamente para eventos donde no querés que el público instale nada.`,
      },
      {
        q: '¿La app necesita internet durante el evento?',
        a: `Sí, necesita conexión a internet (WiFi o datos móviles) para votar y ver el ranking en tiempo real. Los datos se sincronizan cada 8 segundos. En conexión lenta sigue funcionando — simplemente los resultados se actualizan más despacio.`,
      },
    ],
  },
  {
    id: 'faq',
    icon: HelpCircle,
    color: '#fb923c',
    title: 'Preguntas frecuentes',
    intro: 'Problemas comunes y cómo resolverlos.',
    items: [
      {
        q: 'El público dice que no puede entrar al link',
        a: `Verificá que:\n\n1. El evento está en estado <strong>EN VIVO</strong> (no PENDIENTE ni FINALIZADO)\n2. El link que compartiste es correcto — copialo desde el botón "VER QR" del panel\n3. Si usás ngrok, asegurate que la sesión de ngrok esté activa y apuntando al puerto 8080`,
      },
      {
        q: 'Los votos no se actualizan en tiempo real',
        a: `El panel del DJ se refresca cada 5 segundos. Si ves que los datos no cambian:\n\n1. Verificá la conexión a internet\n2. Recargá el panel (F5)\n3. Chequeá que el backend (NestJS) esté corriendo en el puerto 8080`,
      },
      {
        q: 'El QR no funciona con la cámara del celular',
        a: `Probá:\n1. Abrí la cámara y apuntá al QR por 2-3 segundos\n2. Si no aparece el link, probá con una app lectora de QR (Google Lens, QR Reader)\n3. Alternativamente, compartí el link de texto directamente por WhatsApp`,
      },
      {
        q: '¿Cómo comparto el link para que el público vote?',
        a: `En el panel del evento, hacé clic en <strong>VER QR</strong>. Aparece el QR para proyectar o imprimir, y también el link de texto para copiar y compartir por WhatsApp, Instagram Stories, etc.\n\nEl link tiene el formato: <code>tu-dominio.com/event/NÚMERO</code>`,
      },
      {
        q: 'El panel dice "error al cargar" o "sin conexión"',
        a: `El backend NestJS no está corriendo o ngrok se desconectó. Chequeá:\n1. La consola del backend — debe estar corriendo con <code>npm run start:dev</code>\n2. El terminal de ngrok — debe mostrar "Forwarding https://..."\n3. Si ngrok se cortó, reinicialo con el mismo comando`,
      },
    ],
  },
];

// ── Componente principal ──────────────────────────────────────────────────────

const HelpPage = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>('inicio');
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(prev => (prev === id ? null : id));
    setOpenItem(null);
  };

  const toggleItem = (key: string) => {
    setOpenItem(prev => (prev === key ? null : key));
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white', position: 'relative' }}>

      {/* BG glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.09) 0%, transparent 60%)',
      }} />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '2.5rem 1.25rem 5rem', position: 'relative', zIndex: 1 }}>

        {/* Back */}
        <button type="button" onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '2.5rem', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
          <ArrowLeft size={14} /> Volver
        </button>

        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '0.9rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={22} color="#8b5cf6" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: '900', margin: 0, letterSpacing: '-0.03em' }}>Manual de uso</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', margin: 0 }}>MusicParty — Guía completa para DJs</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} type="button"
                onClick={() => { toggleSection(s.id); document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: openSection === s.id ? `rgba(${hexToRgb(s.color)},0.12)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${openSection === s.id ? `rgba(${hexToRgb(s.color)},0.35)` : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '9999px', padding: '0.4rem 0.85rem',
                  color: openSection === s.id ? s.color : 'rgba(255,255,255,0.45)',
                  fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}>
                <Icon size={12} />
                {s.title}
              </button>
            );
          })}
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {SECTIONS.map(section => {
            const Icon = section.icon;
            const isOpen = openSection === section.id;
            return (
              <div key={section.id} id={`section-${section.id}`}
                style={{
                  background: isOpen ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.018)',
                  border: `1px solid ${isOpen ? `rgba(${hexToRgb(section.color)},0.2)` : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '1.1rem',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}>

                {/* Section header */}
                <button type="button" onClick={() => toggleSection(section.id)}
                  style={{
                    width: '100%', padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.9rem',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                  <div style={{ width: 34, height: 34, borderRadius: '0.65rem', background: `rgba(${hexToRgb(section.color)},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} style={{ color: section.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>{section.title}</div>
                    {!isOpen && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.15rem' }}>{section.intro}</div>}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Section content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}>
                      <div style={{ padding: '0 1.5rem 1.25rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                          {section.intro}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {section.items.map((item, idx) => {
                            const key = `${section.id}-${idx}`;
                            const isItemOpen = openItem === key;
                            return (
                              <div key={key} style={{
                                background: isItemOpen ? 'rgba(255,255,255,0.03)' : 'transparent',
                                border: `1px solid ${isItemOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '0.75rem',
                                overflow: 'hidden',
                                transition: 'border-color 0.15s, background 0.15s',
                              }}>
                                <button type="button" onClick={() => toggleItem(key)}
                                  style={{
                                    width: '100%', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                                  }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: isItemOpen ? 'white' : 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                                    {item.q}
                                  </span>
                                  <div style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                                    {isItemOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </div>
                                </button>

                                <AnimatePresence initial={false}>
                                  {isItemOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.18 }}>
                                      <div
                                        style={{ padding: '0 1rem 0.9rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, whiteSpace: 'pre-line' }}
                                        dangerouslySetInnerHTML={{ __html: item.a.replace(/\n/g, '<br/>') }}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem' }}>¿Algo no está claro?</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
            Contactanos por WhatsApp o Instagram. Estamos para ayudarte a sacarle el máximo partido a cada evento.
          </div>
        </div>
      </div>
    </div>
  );
};

// Convierte hex a "R,G,B"
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '139,92,246';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

export default HelpPage;
