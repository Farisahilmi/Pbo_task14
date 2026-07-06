import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SeatGrid from '../components/SeatGrid';
import { ArrowLeft, ShieldCheck, AlertCircle, Clock, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SeatSelectionPage() {
  const { user } = useAuth();
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSeats();
    // Refresh seat statuses every 10 seconds for real-time vibe
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, [showtimeId]);

  const fetchSeats = async () => {
    try {
      const res = await axios.get(`/api/v1/showtimes/${showtimeId}/seats`);
      setSeats(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching seats:', err);
      setError('Gagal memuat peta kursi. Jadwal mungkin tidak valid.');
      setLoading(false);
    }
  };

  const handleToggleSeat = (seatId) => {
    setError(null);
    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter(id => id !== seatId));
    } else {
      if (selectedSeatIds.length >= 6) {
        setError('Maksimal pemilihan adalah 6 kursi per transaksi.');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seatId]);
    }
  };

  const calculateSubtotal = () => {
    let sum = 0;
    selectedSeatIds.forEach(id => {
      const s = seats.find(seat => seat.id === id);
      if (s && s.price) {
        sum += Number(s.price);
      }
    });
    return sum;
  };

  const handleLockSeats = async () => {
    if (selectedSeatIds.length === 0) return;
    setLocking(true);
    setError(null);

    try {
      const payload = {
        showtimeId: Number(showtimeId),
        seatIds: selectedSeatIds,
        userId: user ? user.id : 3 // Default demo user Budi
      };
      const res = await axios.post('/api/v1/bookings/lock-seats', payload);
      const lockData = res.data;

      // Find full selected seat objects for display in checkout
      const selectedSeatObjs = seats.filter(s => selectedSeatIds.includes(s.id));

      navigate('/checkout', {
        state: {
          lockData,
          selectedSeats: selectedSeatObjs,
          showtimeId: Number(showtimeId),
          subtotal: calculateSubtotal()
        }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Kursi yang dipilih sudah dikunci atau dipesan orang lain. Silakan pilih kursi lain.');
      fetchSeats(); // Refresh seats to show updated locked ones
    } finally {
      setLocking(false);
    }
  };

  const selectedSeatsList = seats.filter(s => selectedSeatIds.includes(s.id));

  return (
    <div className="container" style={{ padding: '40px 24px', paddingBottom: '140px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button onClick={() => navigate(-1)} className="btn-glass" style={{ padding: '8px 16px', fontSize: '0.85rem', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Kembali ke Jadwal
          </button>
          <h1 style={{ fontSize: '2rem' }}>Pilih Kursi Anda</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Klik kursi yang tersedia untuk memilih. Kursi akan dikunci selama <strong style={{ color: 'var(--gold-primary)' }}>10 menit</strong> setelah Anda melanjutkan.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 197, 24, 0.1)', border: '1px solid var(--gold-primary)', padding: '10px 16px', borderRadius: 'var(--radius-md)', color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
          <ShieldCheck size={18} /> Garansi 0% Double Booking
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(229, 9, 20, 0.15)', border: '1px solid var(--crimson-primary)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: '#ff4d54', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} /> <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Clock size={18} /> Memuat konfigurasi kursi studio...</div>
      ) : (
        <SeatGrid
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
        />
      )}

      {/* Floating Bottom Summary Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-glass-bright)',
        padding: '20px 0',
        zIndex: 90,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.7)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kursi Terpilih ({selectedSeatIds.length}/6):</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedSeatsList.length > 0 ? (
                selectedSeatsList.map(s => (
                  <span key={s.id} style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-glass)', fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {s.seatLabel}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 400 }}>Belum ada kursi dipilih</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subtotal Harga:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Rp {calculateSubtotal().toLocaleString('id-ID')}
              </div>
            </div>

            <button
              onClick={handleLockSeats}
              disabled={selectedSeatIds.length === 0 || locking}
              className="btn-gold"
              style={{ padding: '14px 28px', fontSize: '1rem' }}
            >
              {locking ? 'Mengunci Kursi...' : <>Lanjut ke Pembayaran <Check size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
