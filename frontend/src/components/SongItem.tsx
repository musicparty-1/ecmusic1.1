import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface Song {
  id: number;
  title: string;
  artist: string;
  votes: number;
  played: boolean;
}

interface SongItemProps {
  song: Song;
  index: number;
  isNowPlaying: boolean;
  onMarkAsPlayed?: (id: number) => void;
  showAction?: boolean;
}

const SongItem: React.FC<SongItemProps> = ({ 
  song, 
  index, 
  isNowPlaying, 
  onMarkAsPlayed, 
  showAction = true 
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="animate-fade"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        background: isNowPlaying ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
        borderRadius: '1rem',
        gap: '1rem',
        border: isNowPlaying ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'
      }}
    >
      <div style={{ 
        width: '40px', 
        fontWeight: '800', 
        fontSize: '1.25rem', 
        color: index === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.2)' 
      }}>
        #{index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600' }}>{song.title}</div>
        <div style={{ fontSize: '0.875rem', color: isNowPlaying ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)' }}>
          {song.artist}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', color: isNowPlaying ? 'white' : 'var(--primary)' }}>
            {song.votes}
          </div>
          <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>VOTOS</div>
        </div>
        {showAction && onMarkAsPlayed && (
          <button
            type="button"
            onClick={() => onMarkAsPlayed(song.id)}
            className="btn-primary"
            style={{ padding: '0.6rem', borderRadius: '50%' }}
            title="Marcar como sonando"
          >
            <Play size={18} fill="white" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SongItem;
