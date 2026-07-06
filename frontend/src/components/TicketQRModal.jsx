import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Film, MapPin, Calendar, Clock, Ticket as TicketIcon, CheckCircle2 } from 'lucide-react';

export default function TicketQRModal({ booking, onClose }) {
  if (!booking) return null;

  const tickets = booking.tickets || [];
  const firstTicket = tickets[0] || {};
  const qrValue = firstTicket.qrCodeValue || `QR-MTX-${booking.bookingId || booking.id}-DEMO`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: 0, overflow: 'hidden', background: '#0f131d' }}>
        
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #f5c518, #e50914)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-on-accent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.2rem' }}>
            <Film size={24} /> MovieTickets E-Ticket
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-on-accent)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '8px', display: 'inline-block' }}>
              {booking.format || 'IMAX 2D'}
            </span>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>{booking.movieTitle || 'Judul Film Bioskop'}</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              <MapPin size={14} color="var(--gold-primary)" /> {booking.cinemaName || 'CGV Grand Indonesia'} ({booking.studioName || 'Studio 1'})
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            width: 'fit-content',
            boxShadow: 'var(--card-shadow)'
          }}>
            <QRCodeSVG value={qrValue} size={180} level="H" includeMargin={true} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#333', marginTop: '8px', fontWeight: 700 }}>
              {firstTicket.ticketCode || 'TKT-DEMO-2026'}
            </span>
          </div>

          {/* Ticket Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            background: 'var(--bg-tertiary)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-glass)',
            marginBottom: '24px',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Tanggal & Jam</span>
              <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} color="var(--gold-primary)" /> {booking.startTime ? new Date(booking.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Hari Ini'}
                <Clock size={14} color="var(--gold-primary)" style={{ marginLeft: '4px' }} /> {booking.startTime ? new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '15:00'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Nomor Kursi ({tickets.length})</span>
              <strong style={{ color: 'var(--gold-primary)', fontSize: '1.05rem' }}>
                {tickets.map(t => t.seatLabel).join(', ') || 'D4, D5'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Kode Booking</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{booking.bookingCode || 'TIX-2026-999'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Status Tiket</span>
              <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> SIAP DIGUNAKAN
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handlePrint} className="btn-gold" style={{ flex: 1, padding: '12px' }}>
              <Download size={18} /> Unduh / Cetak e-Ticket
            </button>
            <button onClick={onClose} className="btn-glass" style={{ padding: '12px 20px' }}>
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
