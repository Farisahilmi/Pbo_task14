import React from 'react';
import { Film, Heart, Shield, Award, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-glass)',
      padding: '60px 0 30px 0',
      marginTop: '80px'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Film size={24} color="var(--gold-primary)" />
            <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              Movie<span style={{ color: 'var(--gold-primary)' }}>Tickets</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.7' }}>
            Platform pemesanan tiket bioskop online bergaya Luxury Cinema Indonesia. Booking kursi interaktif real-time, garansi 0% double booking, & e-ticket QR instant.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Fitur Keunggulan</h4>
          <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} color="var(--gold-primary)" /> 0% Double Booking Guarantee</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} color="var(--gold-primary)" /> Real-time 10 Menit Seat Lock</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={16} color="var(--gold-primary)" /> QRIS, GoPay, OVO, VA Instant</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Bioskop Rekanan</h4>
          <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>CGV Grand Indonesia (Jakarta)</li>
            <li>XXI Plaza Indonesia (Jakarta)</li>
            <li>Cinepolis PVJ (Bandung)</li>
            <li>XXI Tunjungan Plaza (Surabaya)</li>
            <li>CGV Beachwalk (Bali)</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Bantuan & Dukungan</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
            Email: cs@movietickets.id<br />
            WhatsApp: +62 811-2233-4455
          </p>
          <div style={{ marginTop: '16px' }}>
            <span className="badge badge-gold">PRD Ver 1.0 Compliance</span>
          </div>
        </div>
      </div>

      <div className="container" style={{
        borderTop: '1px solid var(--border-glass)',
        paddingTop: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        <p>© 2026 MovieTickets Platform. Dibuat dengan <Heart size={14} color="var(--crimson-primary)" style={{ display: 'inline', verticalAlign: 'middle' }} /> untuk Pengalaman Nonton Terbaik di Indonesia.</p>
      </div>
    </footer>
  );
}
