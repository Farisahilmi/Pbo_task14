import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TicketQRModal from '../components/TicketQRModal';
import { useAuth } from '../context/AuthContext';
import { Ticket, Calendar, Clock, MapPin, QrCode, ArrowRight, Film, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchMyTickets();
  }, [user]);

  const fetchMyTickets = async () => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }
    // Support both user.id and user.userId field names (depending on auth provider response)
    const uid = user.id ?? user.userId;
    if (!uid) {
      console.error('Cannot fetch tickets: user.id and user.userId are both undefined', user);
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/tickets/my-tickets?userId=${uid}`);
      setTickets(res.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Ticket size={32} color="var(--gold-primary)" /> E-Ticket Saya
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Daftar tiket bioskop yang telah dibayar. Tunjukkan QR Code kepada petugas loket atau studio bioskop saat kedatangan.
          </p>
        </div>
        <button onClick={fetchMyTickets} className="btn-glass" style={{ padding: '10px 18px' }}>
          <RefreshCw size={16} /> Segarkan Tiket
        </button>
      </div>

      {!user ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
          <Film size={48} color="var(--gold-primary)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ marginBottom: '8px' }}>Silakan Login Terlebih Dahulu</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Untuk melihat koleksi tiket dan riwayat pesanan Anda, silakan masuk ke akun MovieTickets terlebih dahulu.
          </p>
          <Link to="/" className="btn-gold" style={{ padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Kembali ke Beranda & Login
          </Link>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Clock size={18} /> Memuat koleksi tiket Anda...</div>
      ) : tickets.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
          <Film size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ marginBottom: '8px' }}>Belum Ada Tiket</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Anda belum memesan tiket bioskop apapun. Yuk mulai eksplorasi film blockbuster terbaru di katalog kami!
          </p>
          <Link to="/" className="btn-gold" style={{ padding: '12px 24px' }}>
            <Film size={18} /> Lihat Katalog Film
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {tickets.map(item => {
            const seatsList = item.tickets || [];
            return (
              <div
                key={item.bookingId || item.id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: '4px solid var(--gold-primary)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="badge badge-gold">{item.format || 'IMAX 2D'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> PAID & ACTIVE</span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {item.movieTitle || 'Film Bioskop'}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="var(--gold-primary)" />
                      <span>{item.cinemaName} ({item.studioName})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="var(--gold-primary)" />
                      <span>{item.startTime ? new Date(item.startTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Hari Ini'}</span>
                      <Clock size={16} color="var(--gold-primary)" style={{ marginLeft: '8px' }} />
                      <span>{item.startTime ? new Date(item.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '15:00'} WIB</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nomor Kursi:</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--gold-primary)' }}>
                      {seatsList.map(t => t.seatLabel).join(', ') || 'D4, D5'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {item.bookingCode || 'TIX-ID'}
                  </span>
                  <button
                    onClick={() => setSelectedBooking(item)}
                    className="btn-gold"
                    style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                  >
                    <QrCode size={16} /> Lihat E-Ticket QR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBooking && (
        <TicketQRModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
