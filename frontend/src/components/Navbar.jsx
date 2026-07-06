import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Film, MapPin, Search, Ticket, ShieldAlert, LogIn, LogOut, User, QrCode } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { user, logout, setShowAuthModal } = useAuth();
  const { city, setCity, searchTerm, setSearchTerm } = useApp();
  const navigate = useNavigate();
  const [cities, setCities] = useState(['ALL']);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get('/api/v1/cinemas/cities');
        setCities(['ALL', ...res.data]);
      } catch (err) {
        console.error("Failed to load cities", err);
      }
    };
    fetchCities();
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-glass)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '80px',
        gap: '20px'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f5c518, #e50914)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(245, 197, 24, 0.4)'
          }}>
            <Film size={26} color="var(--text-on-accent)" />
          </div>
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Movie<span style={{ color: 'var(--gold-primary)' }}>Tickets</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Luxury Cinema ID
            </span>
          </div>
        </Link>

        {/* City Selector & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '500px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px',
            border: '1px solid var(--border-glass)',
            height: '42px'
          }}>
            <MapPin size={18} color="var(--gold-primary)" style={{ marginRight: '8px' }} />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                outline: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {cities.map(c => (
                <option key={c} value={c} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  {c === 'ALL' ? 'Semua Kota' : c}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: '0 16px',
            border: '1px solid var(--border-glass)',
            flex: 1,
            height: '42px'
          }}>
            <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Cari film, genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                width: '100%',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Navigation Links & Auth */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ fontWeight: 600, fontSize: '0.95rem' }} className="nav-link">
            Katalog
          </Link>
          
          <Link to="/my-tickets" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.95rem' }}>
            <Ticket size={18} color="var(--gold-primary)" /> Tiket Saya
          </Link>

          {(user?.role === 'CASHIER' || user?.role === 'ADMIN') && (
            <Link to="/scanner" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan-accent)', fontWeight: 600 }}>
              <QrCode size={18} /> Scanner Kasir
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4d54', fontWeight: 600 }}>
              <ShieldAlert size={18} /> Admin CMS
            </Link>
          )}

          <ThemeToggle />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-glass)', padding: '6px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
              <User size={18} color="var(--gold-primary)" />
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{user.name}</span>
              <button onClick={logout} title="Logout" style={{ background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
              <LogIn size={16} /> Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
