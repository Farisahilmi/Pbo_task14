import React from 'react';
import { Clock } from 'lucide-react';

export default function SeatGrid({ seats, selectedSeatIds, onToggleSeat, lockTimer }) {
  // Group seats by rowLabel
  const rows = {};
  seats.forEach(seat => {
    if (!rows[seat.rowLabel]) {
      rows[seat.rowLabel] = [];
    }
    rows[seat.rowLabel].push(seat);
  });

  const rowLabels = Object.keys(rows).sort();

  return (
    <div className="glass-card" style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflowX: 'auto' }}>
      {/* Screen Arc (IMAX / Atmos Glow) */}
      <div className="screen-arc">
        <span>🖥️ LAYAR BIOSKOP (SCREEN DIRECTION)</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-secondary)', letterSpacing: '1px', marginTop: '4px' }}>
          Harap menghadap ke arah layar ini
        </span>
      </div>

      {/* Lock Timer Alert if active */}
      {lockTimer && (
        <div style={{
          background: 'rgba(245, 197, 24, 0.15)',
          border: '1px solid var(--gold-primary)',
          padding: '12px 24px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--gold-primary)',
          fontWeight: 700,
          boxShadow: '0 0 20px rgba(245, 197, 24, 0.2)',
          animation: 'pulseGlow 2s infinite'
        }}>
          <Clock size={18} className="animate-pulse" /> Sesi penguncian kursi Anda tersisa: <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '6px' }}>{lockTimer}</span>
        </div>
      )}

      {/* Seat Rows Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '45px' }}>
        {rowLabels.map(rowLabel => (
          <div key={rowLabel} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ width: '28px', fontWeight: 800, color: 'var(--gold-primary)', textAlign: 'center', fontSize: '0.9rem' }}>
              {rowLabel}
            </span>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {rows[rowLabel].map(seat => {
                const isSelected = selectedSeatIds.includes(seat.id);
                let seatClass = 'seat-item ';
                if (isSelected) {
                  seatClass += 'seat-selected';
                } else if (seat.status === 'BOOKED') {
                  seatClass += 'seat-booked';
                } else if (seat.status === 'LOCKED') {
                  seatClass += 'seat-locked';
                } else {
                  seatClass += 'seat-available';
                }
                if (seat.seatType === 'PREMIUM') {
                  seatClass += ' seat-premium';
                } else if (seat.seatType === 'COUPLE') {
                  seatClass += ' seat-couple';
                }

                return (
                  <div
                    key={seat.id}
                    className={seatClass}
                    onClick={() => {
                      if (seat.status === 'AVAILABLE' || isSelected) {
                        onToggleSeat(seat.id);
                      }
                    }}
                    title={`${seat.seatLabel} - ${seat.seatType} (Rp ${seat.price ? seat.price.toLocaleString('id-ID') : '0'}) - Status: ${seat.status}`}
                  >
                    {seat.seatType === 'PREMIUM' && !isSelected && seat.status === 'AVAILABLE' ? '👑 ' : ''}
                    {seat.seatNumber}
                  </div>
                );
              })}
            </div>
            <span style={{ width: '28px', fontWeight: 800, color: 'var(--gold-primary)', textAlign: 'center', fontSize: '0.9rem' }}>
              {rowLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Luxury Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        justifyContent: 'center',
        padding: '18px 28px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        width: '100%',
        maxWidth: '680px',
        fontSize: '0.8rem',
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-item seat-available" style={{ width: '22px', height: '22px' }} />
          <span>Regular</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-item seat-premium seat-available" style={{ width: '22px', height: '22px' }}>👑</div>
          <span style={{ color: '#fce79c', fontWeight: 600 }}>VIP Leather</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-item seat-couple seat-available" style={{ width: '38px', height: '22px' }} />
          <span style={{ color: '#fbcfe8', fontWeight: 600 }}>Couple Seat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-item seat-selected" style={{ width: '22px', height: '22px' }} />
          <span style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>Pilihanmu</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-item seat-locked" style={{ width: '22px', height: '22px' }} />
          <span>Locked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="seat-item seat-booked" style={{ width: '22px', height: '22px' }} />
          <span>Terjual</span>
        </div>
      </div>
    </div>
  );
}
