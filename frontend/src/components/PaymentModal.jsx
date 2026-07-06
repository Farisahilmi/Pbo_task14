import React, { useState, useEffect } from 'react';
import { QrCode, CreditCard, Smartphone, CheckCircle, AlertCircle, Copy, Check, X, ArrowRight, Clock, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';
import axios from 'axios';

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [method, setMethod] = useState('MIDTRANS_SNAP');
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [showMockSnap, setShowMockSnap] = useState(false);

  const methods = [
    { id: 'MIDTRANS_SNAP', name: 'Midtrans Snap Sandbox', icon: ShieldCheck, desc: 'Simulator Resmi (VA / QRIS / GoPay / Kartu)' },
    { id: 'QRIS', name: 'QRIS Instant', icon: QrCode, desc: 'Scan via GoPay, OVO, Dana, BCA, dll' },
    { id: 'GOPAY', name: 'GoPay / Go-Jek', icon: Smartphone, desc: 'Bayar langsung di aplikasi GoPay' },
    { id: 'VA_BCA', name: 'BCA Virtual Account', icon: CreditCard, desc: 'ATM BCA, KlikBCA, BCA Mobile' }
  ];

  useEffect(() => {
    // If MIDTRANS_SNAP is selected and we already have a snapToken, no need to re-initiate
    if (method === 'MIDTRANS_SNAP' && paymentData?.snapToken) return;

    const controller = new AbortController();
    initiatePayment(method, controller.signal);

    // Cleanup: cancel previous in-flight request when method changes rapidly
    return () => controller.abort();
  }, [method]);

  useEffect(() => {
    // Load Midtrans Snap.js script if clientKey is available or use default sandbox script
    const scriptId = 'midtrans-snap-script';
    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', paymentData?.clientKey || 'SB-Mid-client-DemoSandboxKey123');
      script.async = true;
      document.head.appendChild(script);
    } else if (paymentData?.clientKey) {
      existingScript.setAttribute('data-client-key', paymentData.clientKey);
    }
  }, [paymentData]);

  const initiatePayment = async (selectedMethod, signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/v1/payments/initiate', {
        bookingId: booking.id,
        paymentMethod: selectedMethod
      }, { signal });
      setPaymentData(res.data);
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        // Request was cancelled because user switched methods - ignore silently
        return;
      }
      setError(err.response?.data?.error || 'Gagal memulai pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSimulation = async () => {
    setConfirming(true);
    setError(null);
    try {
      const res = await axios.post(`/api/v1/payments/${booking.id}/confirm`);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengonfirmasi pembayaran');
    } finally {
      setConfirming(false);
    }
  };

  const checkStatusPolling = async () => {
    try {
      const res = await axios.get(`/api/v1/payments/${booking.id}/status`);
      if (res.data?.status === 'PAID') {
        onSuccess(res.data);
      }
    } catch (e) {
      console.error('Polling error:', e);
    }
  };

  const handleOpenSnap = () => {
    if (!paymentData?.snapToken) return;
    
    // If offline fallback token is detected, trigger simulated UI
    if (paymentData.snapToken.startsWith('SNAP-TEST-')) {
      setShowMockSnap(true);
      return;
    }

    if (window.snap) {
      window.snap.pay(paymentData.snapToken, {
        onSuccess: function(result) {
          console.log('Midtrans Snap Success:', result);
          handleConfirmSimulation();
        },
        onPending: function(result) {
          console.log('Midtrans Snap Pending:', result);
          // Pembayaran tertunda - mulai polling status tanpa memblokir UI dengan alert
          checkStatusPolling();
        },
        onError: function(result) {
          console.log('Midtrans Snap Error:', result);
          setError('Pembayaran ditolak atau gagal diverifikasi oleh Midtrans.');
        },
        onClose: function() {
          console.log('Customer closed popup without finishing payment');
          checkStatusPolling();
        }
      });
    } else if (paymentData?.redirectUrl) {
      window.open(paymentData.redirectUrl, '_blank');
    } else {
      setError('Skrip Midtrans Snap belum siap. Silakan klik "Bayar Sekarang" di bawah.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showMockSnap) {
    return (
      <div className="modal-backdrop" onClick={() => setShowMockSnap(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: 0, overflow: 'hidden', background: '#fff' }}>
          <div style={{ background: '#f8fafc', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <ShieldCheck color="#10b981" /> Midtrans Sandbox
            </h3>
            <button onClick={() => setShowMockSnap(false)} style={{ background: 'transparent', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Total Pembayaran</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Rp {booking.finalAmount?.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '32px', fontFamily: 'monospace' }}>
              Order ID: {booking.bookingCode}
            </div>
            
            <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Merchant</div>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>MovieTickets ID Sandbox</div>
            </div>
            
            <button
              onClick={handleConfirmSimulation}
              disabled={confirming}
              style={{ width: '100%', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', transition: 'all 0.2s' }}
            >
              {confirming ? 'Memverifikasi...' : <><CheckCircle size={20} /> Bayar Sekarang</>}
            </button>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '16px' }}>Ini adalah simulasi lingkungan testing.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', color: 'var(--text-secondary)' }}
        >
          <X size={22} />
        </button>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={24} color="var(--gold-primary)" /> Pilih Metode Pembayaran
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Kode Pesanan: <strong style={{ color: 'var(--gold-primary)' }}>{booking.bookingCode}</strong> • Total: <strong style={{ color: 'var(--text-primary)' }}>Rp {booking.finalAmount?.toLocaleString('id-ID')}</strong>
        </p>

        {/* Method Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {methods.map(m => {
            const Icon = m.icon;
            const isSelected = method === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setMethod(m.id)}
                style={{
                  background: isSelected ? 'rgba(245, 197, 24, 0.15)' : 'var(--bg-tertiary)',
                  border: `1px solid ${isSelected ? 'var(--gold-primary)' : 'var(--border-glass)'}`,
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ background: isSelected ? 'var(--gold-primary)' : 'var(--bg-glass)', padding: '8px', borderRadius: '8px', color: isSelected ? 'var(--text-on-accent)' : 'var(--text-primary)' }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--gold-primary)' : 'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{m.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Detail Section */}
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '24px',
          minHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} /> Menyiapkan instruksi pembayaran...</div>
          ) : error ? (
            <div style={{ color: '#ff4d54', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} /> {error}
            </div>
          ) : paymentData ? (
            <>
              {method === 'MIDTRANS_SNAP' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: 'var(--radius-md)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', width: '100%' }}>
                    <ShieldCheck size={32} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Midtrans Sandbox Snap Simulator Siap!</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Token: <span style={{ fontFamily: 'monospace', color: 'var(--gold-primary)' }}>{paymentData.snapToken?.substring(0, 20)}...</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleOpenSnap}
                    className="btn-gold"
                    style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 800, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(245, 197, 24, 0.3)' }}
                  >
                    <ShieldCheck size={20} /> Buka Popup Pembayaran Midtrans Snap <ExternalLink size={18} />
                  </button>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.4 }}>
                    💡 <strong>Tips Sandbox:</strong> Pilih metode Virtual Account (BCA/BNI/BRI), salin nomor VA di popup, lalu validasi pembayaran di <a href="https://simulator.sandbox.midtrans.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'underline' }}>simulator.sandbox.midtrans.com</a>.
                  </p>
                </div>
              )}

              {method === 'QRIS' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', display: 'inline-block' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(paymentData.qrPayload || 'QRIS-SIMULATION')}`}
                      alt="QRIS Code"
                      style={{ width: '160px', height: '160px', display: 'block' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '350px' }}>
                    {paymentData.instruction}
                  </p>
                </div>
              )}

              {method === 'VA_BCA' && (
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nomor Virtual Account BCA:</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', margin: '8px 0 16px 0', border: '1px solid var(--border-glass)' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--gold-primary)' }}>
                      {paymentData.vaNumber}
                    </span>
                    <button onClick={() => copyToClipboard(paymentData.vaNumber)} className="btn-glass" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      {copied ? <><Check size={14} color="#10b981" /> Tersalin!</> : <><Copy size={14} /> Salin</>}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{paymentData.instruction}</p>
                </div>
              )}

              {method === 'GOPAY' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '16px', borderRadius: '50%', color: 'var(--cyan-accent)' }}>
                    <Smartphone size={36} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Konfirmasi Aplikasi {method}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                      {paymentData.instruction}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Simulator Instant Pay Action */}
        <div style={{
          background: 'rgba(245, 197, 24, 0.08)',
          border: '1px dashed var(--gold-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--gold-primary)" /> Simulator Payment Gateway
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Klik tombol di kanan untuk mensimulasikan pembayaran sukses secara instan tanpa perlu bayar sungguhan.
            </div>
          </div>
          <button
            onClick={handleConfirmSimulation}
            disabled={confirming || loading}
            className="btn-gold"
            style={{ padding: '10px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            {confirming ? 'Memproses...' : <>Bayar Sekarang <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
