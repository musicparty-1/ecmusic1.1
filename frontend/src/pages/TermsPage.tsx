import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <nav style={{ background: 'rgba(5,3,18,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontFamily: 'inherit', padding: '0.3rem 0' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')} onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: 26, height: 26, borderRadius: '0.45rem', objectFit: 'cover' }} />
          <span style={{ fontWeight: '900', fontSize: '0.88rem', letterSpacing: '-0.02em' }}>
            EC <span style={{ color: '#8b5cf6' }}>Music</span>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem', fontWeight: '700', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 4, padding: '0.1rem 0.4rem', color: '#a78bfa', letterSpacing: '0.1em' }}>TÉRMINOS</span>
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Términos de Uso</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '3rem' }}>Última actualización: Abril 2026</p>

        {[
          {
            title: '1. Aceptación de los Términos',
            body: `Al acceder y utilizar EC Music (el "Servicio"), usted acepta quedar vinculado por estos Términos de Uso. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Servicio.`,
          },
          {
            title: '2. Descripción del Servicio',
            body: `EC Music es una plataforma de votación musical en tiempo real diseñada para eventos en vivo. Permite a los DJs gestionar listas de canciones y a los asistentes votar sus canciones favoritas mediante un código QR, sin necesidad de crear una cuenta.`,
          },
          {
            title: '3. Cuentas de Usuario (DJ)',
            body: `Para utilizar el panel de DJ, deberá registrarse con un correo electrónico válido y una contraseña. Usted es responsable de mantener la confidencialidad de su cuenta y de todas las actividades que ocurran bajo la misma. Debe notificarnos de inmediato ante cualquier uso no autorizado.`,
          },
          {
            title: '4. Uso Aceptable',
            body: `Usted acepta no utilizar el Servicio para:\n• Cargar o transmitir contenido ilegal, difamatorio, obsceno o que infrinja derechos de autor.\n• Realizar ingeniería inversa, descompilar o desensamblar el Servicio.\n• Interferir con el funcionamiento normal del Servicio o sus servidores.\n• Crear cuentas de forma automatizada o mediante bots.\n• Utilizar el Servicio para cualquier propósito comercial no autorizado.`,
          },
          {
            title: '5. Privacidad y Datos',
            body: `Los votantes participan de forma anónima mediante un identificador de dispositivo único generado localmente. No recopilamos nombre, correo ni datos personales de los votantes. Los DJs proporcionan su correo electrónico únicamente para autenticación. No compartimos datos con terceros salvo cuando sea requerido por ley.`,
          },
          {
            title: '6. Propiedad Intelectual',
            body: `El Servicio y su contenido original, características y funcionalidades son y seguirán siendo propiedad exclusiva de EC Music y sus licenciantes. El software está protegido por leyes de derechos de autor y otras leyes de propiedad intelectual. Los nombres y logos de canciones y artistas pertenecen a sus respectivos titulares.`,
          },
          {
            title: '7. Plan de Prueba y Facturación',
            body: `Los nuevos usuarios tienen acceso a un período de prueba gratuito de 30 días con funcionalidades completas (plan DEMO). Al finalizar el período de prueba, será necesario contratar un plan de pago para continuar utilizando el Servicio. Los pagos son procesados por terceros seguros y no almacenamos datos de tarjetas de crédito.`,
          },
          {
            title: '8. Limitación de Responsabilidad',
            body: `EC Music no garantiza que el Servicio estará disponible de forma ininterrumpida, libre de errores o que los resultados sean precisos. En ningún caso EC Music será responsable de daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de usar el Servicio.`,
          },
          {
            title: '9. Terminación',
            body: `Podemos terminar o suspender su acceso al Servicio de inmediato, sin previo aviso, por conducta que consideremos que viola estos Términos o que es perjudicial para otros usuarios, el Servicio o terceros. Usted puede cancelar su cuenta en cualquier momento desde el panel de configuración.`,
          },
          {
            title: '10. Modificaciones',
            body: `Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigencia al publicarse en esta página. El uso continuado del Servicio después de la publicación de cambios constituye su aceptación de los nuevos términos.`,
          },
          {
            title: '11. Ley Aplicable',
            body: `Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República Argentina. Cualquier disputa que surja en relación con estos Términos estará sujeta a la jurisdicción exclusiva de los tribunales competentes de la Ciudad Autónoma de Buenos Aires.`,
          },
          {
            title: '12. Contacto',
            body: `Si tiene preguntas sobre estos Términos de Uso, puede contactarnos en: support@ecmusic.app`,
          },
        ].map((section) => (
          <section key={section.title} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#a78bfa', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
              {section.title}
            </h2>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {section.body.replace(/EC Music/g, 'EC Music')}
            </div>
          </section>
        ))}

        <div style={{ marginTop: '3rem', padding: '1.25rem 1.5rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.7 }}>
          Al registrarse o usar EC Music, usted confirma que ha leído, entendido y aceptado estos Términos de Uso en su totalidad.
        </div>
      </div>
    </div>
  );
}
