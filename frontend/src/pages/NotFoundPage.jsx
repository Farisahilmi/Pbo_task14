import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Film, ArrowLeft, Ticket } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '480px' }}>
        {/* Animated 404 number */}
        <div style={{
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, var(--gold-primary), var(--crimson-primary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'pulse-glow 3s ease-in-out infinite'
        }}>
          404
        </div>

        {/* Film icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-glass)',
            borderRadius: '50%',
            padding: '24px',
            display: 'inline-flex'
          }}>
            <Film size={48} color="var(--gold-primary)" />
          </div>
        </div>

        <h1 style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
          Halaman Tidak Ditemukan
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Sepertinya film yang kamu cari tidak ada dalam catalog kami, atau URL yang kamu masukkan sudah tidak berlaku.
          Jangan khawatir, masih banyak film seru yang menunggumu! 🎬
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-gold" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
            <Home size={18} /> Ke Beranda
          </Link>
          <Link to="/my-tickets" className="btn-glass" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            <Ticket size={18} /> Tiket Saya
          </Link>
        </div>

        {/* Decorative dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
          {[0, 0.3, 0.6].map((delay, i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i === 1 ? 'var(--gold-primary)' : 'var(--border-glass)',
                animation: `bounce 1.4s ease-in-out ${delay}s infinite`
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(245,197,24,0.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(229,9,20,0.4)); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
