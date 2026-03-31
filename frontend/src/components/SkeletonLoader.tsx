/**
 * SkeletonLoader — Dashboard loading state
 * Uses the .skeleton-shimmer class from index.css
 */
const SkeletonLoader = () => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#000' }}>
    {/* Main area */}
    <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="skeleton-shimmer" style={{ height: 20, width: 140 }} />
        <div className="skeleton-shimmer" style={{ height: 20, width: 60, borderRadius: 999 }} />
      </div>
      {/* Ranking cards */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.7rem 0.85rem', borderRadius: 10,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div className="skeleton-shimmer" style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div className="skeleton-shimmer" style={{ height: 13, width: `${55 + (i % 3) * 15}%` }} />
            <div className="skeleton-shimmer" style={{ height: 3, width: `${30 + (i % 4) * 10}%` }} />
            <div className="skeleton-shimmer" style={{ height: 10, width: `${25 + i * 3}%` }} />
          </div>
          <div className="skeleton-shimmer" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
        </div>
      ))}
    </div>

    {/* Sidebar */}
    <div style={{ width: 300, background: '#0a0a10', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Now playing */}
      <div className="skeleton-shimmer" style={{ height: 11, width: 120, marginBottom: '0.25rem' }} />
      <div className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 12 }} />
      <div className="skeleton-shimmer" style={{ height: 56, borderRadius: 10 }} />
      {/* Add song */}
      <div className="skeleton-shimmer" style={{ height: 11, width: 100, marginTop: '0.5rem' }} />
      <div className="skeleton-shimmer" style={{ height: 38, borderRadius: 8 }} />
      <div className="skeleton-shimmer" style={{ height: 38, borderRadius: 8 }} />
      <div className="skeleton-shimmer" style={{ height: 38, borderRadius: 8 }} />
    </div>
  </div>
);

export default SkeletonLoader;
