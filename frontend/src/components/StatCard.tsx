import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
}

const StatCard = ({ label, value, icon: Icon, colorClass = 'text-primary' }: StatCardProps) => {
  return (
    <div className="glass-card" style={{ 
      padding: '0.5rem 1rem', 
      fontSize: '0.75rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      borderRadius: '2rem',
      minWidth: 'fit-content'
    }}>
      <Icon size={14} className={colorClass} />
      <span style={{ fontWeight: '600' }}>{value}</span>
      <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>{label}</span>
    </div>
  );
};

export default StatCard;
