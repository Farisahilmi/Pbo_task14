import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PaymentModal from '../components/PaymentModal';
import TicketQRModal from '../components/TicketQRModal';
import { Clock, ShieldCheck, Tag, CreditCard, ArrowLeft, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CheckoutPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { lockData, selectedSeats, showtimeId, subtotal } = location.state || {};

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!lockData || !selectedSeats || selectedSeats.length === 0) {
      navigate('/');
      return;
    }

    // Calculate time left from expiredAt
    if (lockData.expiredAt) {
      const exp = new Date(lockData.expiredAt).getTime();
      const now = new Date().getTime();
      const diffSec = Math.max(0, Math.floor((exp - now) / 1000));
      setTimeLeft(diffSec);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast('Waktu penguncian kursi telah habis! Silakan pilih kursi kembali.', 'warning', 5000);
          navigate(`/showtime/${showtimeId}/seats`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockData]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    // Simulate promo evaluation or use standard rules from DataSeeder
    if (code === 'HEMAT50') {
      const disc = Math.min(50000, subtotal * 0.5);
      setDiscountAmount(disc);
      setAppliedPromo({ code: 'HEMAT50', desc: 'Diskon 50% (Maks Rp 50.000)' });
    } else if (code === 'WEEKEND20') {
      setDiscountAmount(20000);
      setAppliedPromo({ code: 'WEEKEND20', desc: 'Diskon Akhir Pekan Rp 20.000' });
    } else if (code === 'WELCOME') {
      setDiscountAmount(15000);
      setAppliedPromo({ code: 'WELCOME', desc: 'Diskon Pengguna Baru Rp 15.000' });
    } else {
      setPromoError('Kode promo tidak valid atau kuota telah habis!');
    }
  };

  const finalPrice = Math.max(0, subtotal - discountAmount);

  const handleCreateBookingAndPay = async () => {
    if (!user) {
      alert('Silakan login atau daftar akun terlebih dahulu agar tiket tersimpan dengan aman di E-Ticket Saya!');
      return;
    }

    setLoadingBooking(true);
    setError(null);

    try {
      const payload = {
        lockSessionId: lockData.lockSessionId,
        showtimeId: Number(showtimeId),
        seatIds: selectedSeats.map(s => s.id),
        promoCode: appliedPromo ? appliedPromo.code : null,
        paymentMethod: paymentMethod,
        userId: user.id ?? user.userId
      };

      const res = await axios.post('/api/v1/bookings', payload);
      setCreatedBooking(res.data);
      if (paymentMethod === 'QRIS') {
        setShowQRModal(true);
        toast('Pemesanan berhasil! Silakan scan QR untuk membayar.', 'success');
      } else {
        toast('Pemesanan berhasil!', 'success');
        setTimeout(() => navigate('/my-tickets'), 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal membuat pesanan. Sesi penguncian mungkin sudah habis.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoadingBooking(false);
    }
  };

  const handlePaymentSuccess = async (confirmedData) => {
    setShowPaymentModal(false);
    // Fetch complete enriched booking data (with movieTitle, cinemaName, tickets array, QR codes, etc.)
    // because the raw Booking entity returned from createBooking lacks these enriched fields
    try {
      const uid = user?.id ?? user?.userId;
      const res = await axios.get(`/api/v1/tickets/my-tickets?userId=${uid}`);
      const allBookings = res.data || [];
      // Find the booking that was just paid (match by bookingCode or first PAID booking)
      const paidCode = confirmedData?.bookingCode || createdBooking?.bookingCode;
      const enrichedBooking = allBookings.find(b => b.bookingCode === paidCode) || allBookings[0];
      if (enrichedBooking) {
        setCreatedBooking(enrichedBooking);
      }
    } catch (e) {
      console.error('Could not fetch enriched booking after payment:', e);
    }
    setShowQRModal(true);
  };

  if (!lockData || !selectedSeats) return null;

  return (
    <div className="container page-transition" style={{ padding: '40px 24px', maxWidth: '1100px' }}>
      <button onClick={() => navigate(-1)} className="btn-glass" style={{ padding: '8px 16px', fontSize: '0.85rem', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Kembali
      </button>

      {/* Timer Bar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 197, 24, 0.15), rgba(229, 9, 20, 0.15))',
        border: '1px solid var(--gold-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
          <Clock size={24} color="var(--gold-primary)" />
          <span>Selesaikan pembayaran dalam <strong style={{ color: 'var(--gold-primary)', fontSize: '1.2rem' }}>{formatTime(timeLeft)}</strong> sebelum kursi dilepas otomatis.</span>
        </div>
        <span className="badge badge-gold">Seat Lock Active</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
        {/* Left Column: Order Details & Promo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              Rincian Pemesanan Tiket
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Studio Bioskop:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedSeats[0]?.studioName || 'IMAX Theatre'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Daftar Kursi ({selectedSeats.length}):</span>
                <strong style={{ color: 'var(--gold-primary)', fontSize: '1.1rem' }}>
                  {selectedSeats.map(s => s.seatLabel).join(', ')}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tipe Kursi:</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedSeats[0]?.seatType || 'REGULAR'}</span>
              </div>
            </div>

            {/* Promo Code Box */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                <Tag size={16} color="var(--gold-primary)" /> Punya Kode Promo Diskon?
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Contoh: HEMAT50, WEEKEND20"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  disabled={appliedPromo !== null}
                  style={{
                    flex: 1,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    textTransform: 'uppercase',
                    fontWeight: 700
                  }}
                />
                {appliedPromo ? (
                  <button onClick={() => { setAppliedPromo(null); setDiscountAmount(0); setPromoCode(''); }} className="btn-glass" style={{ color: '#ff4d54' }}>
                    Hapus
                  </button>
                ) : (
                  <button onClick={handleApplyPromo} className="btn-gold" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                    Pakai
                  </button>
                )}
              </div>

              {appliedPromo && (
                <div style={{ marginTop: '10px', color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <CheckCircle size={14} /> Berhasil menggunakan promo: {appliedPromo.desc}
                </div>
              )}
              {promoError && (
                <div style={{ marginTop: '10px', color: '#ff4d54', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> {promoError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Price Breakdown */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            Rincian Harga & Pembayaran
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal Tiket ({selectedSeats.length} kursi)</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 600 }}>
                <span>Diskon Promo ({appliedPromo?.code})</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Biaya Layanan & Pajak</span>
              <span style={{ color: '#10b981' }}>GRATIS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              <span>Total Pembayaran</span>
              <span style={{ color: 'var(--gold-primary)' }}>Rp {finalPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Metode Pembayaran</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {['QRIS', 'GOPAY', 'OVO', 'VA_BCA'].map(m => (
              <label key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: paymentMethod === m ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-tertiary)', border: `1px solid ${paymentMethod === m ? 'var(--gold-primary)' : 'var(--border-glass)'}`, padding: '12px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === m}
                    onChange={() => setPaymentMethod(m)}
                    style={{ accentColor: 'var(--gold-primary)' }}
                  />
                  <span style={{ fontWeight: 700, color: paymentMethod === m ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                    {m === 'QRIS' ? 'QRIS Instant (GoPay, OVO, Dana)' : m === 'VA_BCA' ? 'BCA Virtual Account' : `Aplikasi ${m}`}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Instant</span>
              </label>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(229, 9, 20, 0.15)', border: '1px solid var(--crimson-primary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: '#ff4d54', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleCreateBookingAndPay}
            disabled={loadingBooking}
            className="btn-gold"
            style={{ width: '100%', padding: '16px', fontSize: '1.05rem', boxShadow: '0 6px 20px rgba(245, 197, 24, 0.4)' }}
          >
            {loadingBooking ? 'Membuat Pesanan...' : <><CreditCard size={18} /> Buat Pesanan & Bayar Sekarang</>}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && createdBooking && (
        <PaymentModal
          booking={createdBooking}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showQRModal && createdBooking && (
        <TicketQRModal
          booking={createdBooking}
          onClose={() => {
            setShowQRModal(false);
            navigate('/my-tickets');
          }}
        />
      )}
    </div>
  );
}
