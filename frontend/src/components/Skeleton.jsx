import React from 'react';

// Skeleton shimmer animation is in index.css (.skeleton class)

export function MovieCardSkeleton() {
  return (
    <div className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Poster skeleton */}
      <div className="skeleton" style={{ width: '100%', paddingTop: '145%', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'inherit' }} />
      </div>

      {/* Content skeleton */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {/* Title */}
        <div className="skeleton" style={{ height: '20px', borderRadius: '6px', width: '85%' }} />
        {/* Stars */}
        <div className="skeleton" style={{ height: '14px', borderRadius: '6px', width: '50%' }} />
        {/* Meta */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="skeleton" style={{ height: '12px', borderRadius: '6px', width: '40%' }} />
          <div className="skeleton" style={{ height: '12px', borderRadius: '6px', width: '30%' }} />
        </div>
        {/* Synopsis lines */}
        <div className="skeleton" style={{ height: '11px', borderRadius: '6px', width: '100%' }} />
        <div className="skeleton" style={{ height: '11px', borderRadius: '6px', width: '80%' }} />
        {/* Button */}
        <div className="skeleton" style={{ height: '40px', borderRadius: '10px', marginTop: 'auto' }} />
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ height: '14px', width: '30%', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '11px', width: '100%', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '11px', width: '70%', borderRadius: '6px' }} />
        </div>
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="skeleton" style={{ height: '18px', width: '120px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '22px', width: '60%', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '13px', width: '80%', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '13px', width: '55%', borderRadius: '6px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div className="skeleton" style={{ height: '28px', width: '90px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '36px', width: '110px', borderRadius: '8px', marginTop: '8px' }} />
        </div>
      </div>
    </div>
  );
}
