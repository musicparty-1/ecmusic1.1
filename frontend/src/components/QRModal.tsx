import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onCopy: () => void;
  activeDevices?: number;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, url, onCopy, activeDevices }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const style = `@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement('a');
      a.download = 'qr-musicparty.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(serialized)));
  };

  return (
    <>
    <style>{style}</style>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ duration: 0.22 }}
            style={{
              maxWidth: '380px', width: '100%',
              background: '#0d1117',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '1.25rem',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(124,58,237,0.12)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '0.5rem',
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <QrCode size={16} color="#8b5cf6" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Invitá al Público</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Escaneá el QR desde el celular</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                title="Cerrar"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.5rem',
                  padding: '0.35rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Code */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div
                ref={qrRef}
                style={{
                  background: 'white',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(124,58,237,0.25)',
                }}
              >
                <QRCodeSVG value={url} size={220} />
              </div>

              {/* Active devices badge */}
              {activeDevices !== undefined && activeDevices > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.9rem',
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 6px #10b981',
                    animation: 'pulse-dot 1.2s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10b981' }}>
                    {activeDevices} {activeDevices === 1 ? 'persona votando' : 'personas votando'} en vivo
                  </span>
                </div>
              )}

              {/* URL */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '0.6rem',
                padding: '0.5rem 0.85rem',
                width: '100%',
                textAlign: 'center',
              }}>
                <p style={{
                  wordBreak: 'break-all', fontSize: '0.72rem',
                  color: '#475569', fontFamily: 'monospace',
                  lineHeight: 1.4,
                }}>
                  {url}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.6rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={onCopy}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '0.75rem',
                    color: '#94a3b8',
                    padding: '0.65rem',
                    fontSize: '0.8rem', fontWeight: '600',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <Share2 size={14} /> Copiar link
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '0.75rem',
                    color: '#94a3b8',
                    padding: '0.65rem',
                    fontSize: '0.8rem', fontWeight: '600',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <Download size={14} /> Descargar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: 'white',
                    padding: '0.65rem',
                    fontSize: '0.8rem', fontWeight: '700',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.filter = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default QRModal;
