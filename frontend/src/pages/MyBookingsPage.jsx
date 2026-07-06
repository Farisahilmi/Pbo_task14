import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Calendar, MapPin, CreditCard, Film, RefreshCw, AlertCircle, CheckCircle2, XCircle, Hourglass, Ticket } from 'lucide-react';
import { BookingCardSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

// Simple countdown component
function CountdownTimer({ expiredAt }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!expiredAt) return;
    const calculate = () => {
      const diff = new Date(expiredAt) - new Date();
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [expiredAt]);

  if (timeLeft <= 0) return <span style={{ color: 'var(--text-muted)' }}>Expired</span>;

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  
  return (
    <span style={{ 
      color: '#f59e0b', 
      fontWeight: 'bold',
      fontFamily: 'monospace',
      fontSize: '1rem',
      background: 'rgba(245, 158, 11, 0.1)',
      padding: '2px 6px',
      borderRadius: '4px'
    }}>
      {m}:{s}
    </span>
  );
}

const STATUS_CONFIG = {
  PAID: { label: 'PAID', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  PENDING: { label: 'MENUNGGU BAYAR', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Hourglass },
  CANCELLED: { label: 'DIBATALKAN', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
  EXPIRED: { label: 'EXPIRED', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: XCircle },
  REFUNDED: { label: 'REFUNDED', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: CheckCircle2 },
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const { toast } = useToast();

  const userId = user?.id ?? user?.userId;

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/bookings/my-bookings?userId=${userId}`);
      // Enrich with showtime & movie data
      const raw = res.data || [];
      const enriched = await Promise.all(raw.map(async (b) => {
        try {
          const stRes = await axios.get(`/api/v1/showtimes/${b.showtimeId}`);
          const st = stRes.data;
          let movieTitle = st?.movieTitle || 'Film';
          let cinemaName = st?.cinemaName || '-';
          let studioName = st?.studioName || '-';
          let startTime = st?.startTime;
          return { ...b, movieTitle, cinemaName, studioName, startTime };
        } catch {
          return b;
        }
      }));
      setBookings(enriched);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast('Gagal memuat riwayat pemesanan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filters = ['ALL', 'PENDING', 'PAID', 'CANCELLED', 'EXPIRED'];

  const filtered = activeFilter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === activeFilter);

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '60px 40px' }}>
          <BookOpen size={48} color="var(--gold-primary)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ marginBottom: '12px' }}>Login Diperlukan</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Silakan login untuk melihat riwayat pemesanan tiket Anda.
          </p>
          <Link to="/" className="btn-gold" style={{ padding: '12px 28px' }}>Kembali & Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-transition" style={{ padding: '40px 24px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={30} color="var(--gold-primary)" /> Riwayat Pemesanan
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Semua transaksi tiket bioskop Anda ada di sini.
          </p>
        </div>
        <button onClick={fetchBookings} className="btn-glass" style={{ padding: '10px 18px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              background: activeFilter === f ? 'var(--gold-primary)' : 'var(--bg-tertiary)',
              color: activeFilter === f ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              border: `1px solid ${activeFilter === f ? 'var(--gold-primary)' : 'var(--border-glass)'}`,
              fontWeight: 600, fontSize: '0.82rem',
              transition: 'all 0.2s ease',
              boxShadow: activeFilter === f ? '0 0 12px var(--gold-glow)' : 'none'
            }}
          >
            {f === 'ALL' ? 'Semua' : STATUS_CONFIG[f]?.label || f}
            {f !== 'ALL' && (
              <span style={{ marginLeft: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem' }}>
                {bookings.filter(b => b.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => <BookingCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <AlertCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ marginBottom: '8px' }}>Tidak Ada Pesanan</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {activeFilter === 'ALL' ? 'Anda belum pernah memesan tiket bioskop.' : `Tidak ada pesanan dengan status ${activeFilter}.`}
          </p>
          <Link to="/" className="btn-gold" style={{ padding: '12px 24px' }}>
            <Film size={16} /> Lihat Katalog Film
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(booking => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const isPending = booking.status === 'PENDING';

            return (
              <div
                key={booking.id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '24px',
                  borderLeft: `4px solid ${cfg.color}`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* Status Badge */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                      background: cfg.bg, color: cfg.color,
                      fontWeight: 700, fontSize: '0.75rem', marginBottom: '10px'
                    }}>
                      <StatusIcon size={12} /> {cfg.label}
                    </div>

                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                      {booking.movieTitle || 'Film Bioskop'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {booking.cinemaName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color="var(--gold-primary)" /> {booking.cinemaName} — {booking.studioName}
                        </span>
                      )}
                      {booking.startTime && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="var(--gold-primary)" />
                          {new Date(booking.startTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          <Clock size={14} color="var(--gold-primary)" style={{ marginLeft: '6px' }} />
                          {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={14} color="var(--gold-primary)" />
                        {booking.paymentMethod || 'Belum dipilih'} &nbsp;•&nbsp;
                        <strong style={{ color: 'var(--text-primary)' }}>
                          Rp {booking.finalAmount?.toLocaleString('id-ID') || '0'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '4px' }}>
                      {booking.bookingCode}
                    </span>
                    {booking.status === 'PAID' && (
                      <Link to="/my-tickets" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                        <Ticket size={14} /> Lihat E-Ticket
                      </Link>
                    )}
                    {isPending && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Hourglass size={12} />
                          Menunggu pembayaran
                        </span>
                        {booking.expiredAt && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sisa Waktu:</span>
                            <CountdownTimer expiredAt={booking.expiredAt} />
                          </div>
                        )}
                      </div>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(booking.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
