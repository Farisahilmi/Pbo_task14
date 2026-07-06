import React, { useState } from 'react';
import axios from 'axios';
import { QrCode, CheckCircle2, AlertTriangle, ShieldCheck, Search, Film, MapPin, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TicketScannerPage() {
  const { user } = useAuth();
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async (e) => {
    if (e) e.preventDefault();
    if (!qrInput.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await axios.post('/api/v1/tickets/validate', {
        qrCodeValue: qrInput.trim()
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Tiket tidak ditemukan atau sudah hangus');
    } finally {
      setLoading(false);
    }
  };

  const handleScanDemoTicket = () => {
    // Generate simulated QR string that matches our DataSeeder or ticket format
    const demoQr = 'QR-MTX-1-DEMO';
    setQrInput(demoQr);
  };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ background: 'rgba(0, 240, 255, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--cyan-accent)' }}>
          <QrCode size={32} />
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Loket Scanner E-Ticket</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Portal verifikasi tiket masuk bioskop untuk staf loket & pemeriksa pintu studio.
        </p>
        <div style={{ marginTop: '12px' }}>
          <span className="badge badge-cyan">Petugas: {user?.name || 'Staff Loket CGV'} ({user?.role || 'CASHIER'})</span>
        </div>
      </div>

      {/* Input Form */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
        <form onSubmit={handleValidate} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0 16px', border: '1px solid var(--border-glass)', flex: 1, height: '52px' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '12px' }} />
            <input
              type="text"
              placeholder="Masukkan / Scan Kode QR Tiket (cth: QR-MTX-1-DEMO)..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '1rem', fontFamily: 'monospace' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !qrInput.trim()}
            className="btn-gold"
            style={{ padding: '0 28px', height: '52px', fontSize: '1rem', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Memvalidasi...' : <>Verifikasi <ShieldCheck size={18} /></>}
          </button>
        </form>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Search size={14} color="var(--gold-primary)" /> Gunakan barcode reader atau ketik kode QR secara manual.</span>
          <button
            type="button"
            onClick={handleScanDemoTicket}
            style={{ background: 'transparent', color: 'var(--gold-primary)', textDecoration: 'underline', fontWeight: 600 }}
          >
            Isi Kode Tiket Demo
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="glass-card animate-fade-in" style={{
          padding: '32px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid #10b981',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ background: '#10b981', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#000' }}>
            <CheckCircle2 size={36} />
          </div>

          <span className="badge" style={{ background: '#10b981', color: '#000', marginBottom: '12px', display: 'inline-block', fontWeight: 800 }}>
            TIKET VALID & BERHASIL DIGUNAKAN
          </span>

          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {result.movieTitle || 'Film Bioskop Nusantara'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            <MapPin size={16} color="var(--gold-primary)" /> {result.cinemaName || 'CGV Grand Indonesia'} ({result.studioName || 'Studio 1'})
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'left', border: '1px solid var(--border-glass)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Kode Tiket</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '1.05rem' }}>{result.ticketCode || 'TKT-101'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nomor Kursi</span>
              <strong style={{ color: 'var(--gold-primary)', fontSize: '1.3rem' }}>{result.seatLabel || 'D4'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Waktu Check-in</span>
              <strong style={{ color: '#10b981' }}>{new Date().toLocaleTimeString('id-ID')} WIB</strong>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card animate-fade-in" style={{
          padding: '32px',
          background: 'rgba(229, 9, 20, 0.15)',
          border: '2px solid var(--crimson-primary)',
          boxShadow: '0 0 30px rgba(229, 9, 20, 0.4)',
          textAlign: 'center'
        }}>
          <div style={{ background: 'var(--crimson-primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--text-on-accent)' }}>
            <AlertTriangle size={36} />
          </div>

          <span className="badge badge-crimson" style={{ marginBottom: '12px', display: 'inline-block', fontWeight: 800 }}>
            VERIFIKASI DITOLAK
          </span>

          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {error}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Tiket ini mungkin sudah dipindai sebelumnya atau kode QR tidak terdaftar dalam sistem.
          </p>
        </div>
      )}
    </div>
  );
}
