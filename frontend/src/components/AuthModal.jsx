import React, { useState } from 'react';
import { LogIn, UserPlus, X, Mail, Lock, User, Phone, Calendar, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import GoogleSignInButton from './GoogleSignInButton';

export default function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    birthDate: '2000-01-01'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const payload = isLogin ? { email: formData.email, password: formData.password } : formData;

    try {
      const res = await axios.post(url, payload);
      if (res.data.token) {
        if (res.data.userId && !res.data.id) res.data.id = res.data.userId;
        if (res.data.id && !res.data.userId) res.data.userId = res.data.id;
        sessionStorage.setItem('mtx_token', res.data.token);
        sessionStorage.setItem('mtx_user', JSON.stringify(res.data));
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan saat autentikasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', color: 'var(--text-secondary)' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>
            {isLogin ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {isLogin ? 'Login untuk memesan tiket bioskop favoritmu' : 'Daftar sekarang untuk menikmati kemudahan booking tiket'}
          </p>
        </div>

        {/* Google Sign-In Section */}
        <div style={{ marginBottom: '16px' }}>
          <GoogleSignInButton
            onSuccess={(userData) => {
              onSuccess(userData);
            }}
            onError={(err) => {
              setError(err);
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 20px 0', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
          <span style={{ padding: '0 12px' }}>ATAU DENGAN EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              background: isLogin ? 'var(--gold-primary)' : 'transparent',
              color: isLogin ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s ease'
            }}
          >
            Login Email
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              background: !isLogin ? 'var(--gold-primary)' : 'transparent',
              color: !isLogin ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s ease'
            }}
          >
            Register Email
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(229, 9, 20, 0.15)', border: '1px solid var(--crimson-primary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', color: '#ff4d54', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nama Lengkap</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '0 12px', border: '1px solid var(--border-glass)' }}>
                  <User size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Budi Santoso"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '10px 0', width: '100%', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>No. Telepon</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '0 12px', border: '1px solid var(--border-glass)' }}>
                    <Phone size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                    <input
                      type="text"
                      name="phone"
                      placeholder="08123456789"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '10px 0', width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tgl. Lahir</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '0 8px', border: '1px solid var(--border-glass)' }}>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '10px 0', width: '100%', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Alamat Email</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '0 12px', border: '1px solid var(--border-glass)' }}>
              <Mail size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
              <input
                type="email"
                name="email"
                required
                placeholder="email@contoh.com"
                value={formData.email}
                onChange={handleChange}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '10px 0', width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '0 12px', border: '1px solid var(--border-glass)' }}>
              <Lock size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '10px 0', width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold"
            style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '0.95rem' }}
          >
            {loading ? 'Memproses...' : isLogin ? <><LogIn size={18} /> Login Sekarang</> : <><UserPlus size={18} /> Daftar Akun</>}
          </button>
        </form>

        {/* Demo Accounts hint */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--gold-primary)' }}><Info size={14} /> <strong>Akun Demo:</strong></span><br />
          Admin: <code>admin@movietickets.id</code> (pass: <code>admin123</code>)<br />
          Kasir: <code>kasir@movietickets.id</code> (pass: <code>kasir123</code>)<br />
          Customer: <code>budi@gmail.com</code> (pass: <code>budi123</code>)
        </div>
      </div>
    </div>
  );
}
