import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, AlertCircle, Loader, Film, ShieldCheck } from 'lucide-react';

export default function GoogleAuthCallbackPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('PROCESSING'); // PROCESSING, SUCCESS, ERROR
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const token = params.get('token');
    const userId = params.get('userId');
    const name = params.get('name');
    const email = params.get('email');
    const role = params.get('role');
    const avatarUrl = params.get('avatarUrl');
    const authStatus = params.get('authStatus');
    const message = params.get('message');

    if (error) {
      setStatus('ERROR');
      setErrorMsg(error);
      return;
    }

    if (token && email) {
      const userData = {
        token,
        id: userId ? Number(userId) : null,
        userId: userId ? Number(userId) : null,
        name: name || email.split('@')[0],
        email,
        role: role || 'CUSTOMER',
        avatarUrl: avatarUrl !== 'null' ? avatarUrl : null,
        authProvider: 'GOOGLE'
      };

      // Store in sessionStorage (cleared on browser close → always start fresh)
      sessionStorage.setItem('mtx_token', token);
      sessionStorage.setItem('mtx_user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      setStatus('SUCCESS');
      setSuccessMsg(message || 'Autentikasi Google Berhasil!');

      // Redirect based on role after 1.5 seconds
      const timer = setTimeout(() => {
        if (userData.role === 'ADMIN') navigate('/admin');
        else if (userData.role === 'CASHIER') navigate('/scanner');
        else navigate('/');
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setStatus('ERROR');
      setErrorMsg('Token atau informasi pengguna tidak lengkap dari Google callback.');
    }
  }, [location, navigate, onLoginSuccess]);

  return (
    <div className="container" style={{ padding: '80px 20px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f5c518, #e50914)',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 0 30px rgba(245, 197, 24, 0.4)'
        }}>
          <Film size={32} color="var(--text-on-accent)" />
        </div>

        {status === 'PROCESSING' && (
          <div>
            <Loader size={48} className="animate-spin" style={{ color: 'var(--gold-primary)', margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Memverifikasi Akun Google...</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Sedang menautkan kredensial Google OAuth 2.0 Anda dengan sistem MovieTickets. Harap tunggu...
            </p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div>
            <CheckCircle2 size={56} color="#00e676" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', color: '#00e676' }}>Login Google Berhasil!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>
              {successMsg}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 230, 118, 0.1)', border: '1px solid #00e676', padding: '8px 16px', borderRadius: '999px', fontSize: '0.85rem', color: '#00e676', marginBottom: '24px' }}>
              <ShieldCheck size={16} /> Sesi JWT Terenkripsi Aktif
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Mengalihkan Anda ke halaman utama dalam beberapa detik...
            </p>
          </div>
        )}

        {status === 'ERROR' && (
          <div>
            <AlertCircle size={56} color="#ff4d54" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', color: '#ff4d54' }}>Autentikasi Gagal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              {errorMsg || 'Terjadi kesalahan saat memvalidasi akun Google Anda.'}
            </p>
            <Link to="/" className="btn-gold" style={{ padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              Kembali ke Beranda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
