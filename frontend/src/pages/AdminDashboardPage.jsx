import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, TrendingUp, Ticket, Film, Users, Plus, Trash2, Edit, Check, DollarSign, Calendar, MapPin, Award, Clock, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ANALYTICS');

  // CMS state
  const [movies, setMovies] = useState([]);
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [newMovie, setNewMovie] = useState({
    title: '',
    synopsis: '',
    genre: 'Sci-Fi, Action',
    durationMinutes: 120,
    ageRating: '13+',
    language: 'Bahasa Indonesia',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
    status: 'NOW_SHOWING'
  });

  useEffect(() => {
    fetchAnalytics();
    fetchMovies();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await axios.get('/api/v1/movies?status=ALL');
      setMovies(res.data || []);
    } catch (err) {
      console.error('Error fetching movies:', err);
    }
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/admin/movies', newMovie);
      alert('Film berhasil ditambahkan ke katalog!');
      setShowAddMovie(false);
      fetchMovies();
      fetchAnalytics();
    } catch (err) {
      alert('Gagal menyimpan film: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Yakin ingin menghapus film ini?')) return;
    try {
      await axios.delete(`/api/v1/admin/movies/${id}`);
      fetchMovies();
      fetchAnalytics();
    } catch (err) {
      alert('Gagal menghapus film');
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-crimson" style={{ padding: '6px 12px' }}>EXECUTIVE PORTAL</span>
          </div>
          <h1 style={{ fontSize: '2.4rem' }}>CMS & Executive Reporting</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Dashboard manajemen pertunjukan bioskop, monitoring okupansi studio, & analitik pendapatan real-time.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              background: activeTab === 'ANALYTICS' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'ANALYTICS' ? '#000' : '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrendingUp size={16} /> Dashboard Analitik
          </button>
          <button
            onClick={() => setActiveTab('MOVIES')}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              background: activeTab === 'MOVIES' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'MOVIES' ? '#000' : '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Film size={16} /> Katalog Film
          </button>
        </div>
      </div>

      {activeTab === 'ANALYTICS' && (
        <div>
          {loading || !analytics ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Clock size={18} /> Memuat analitik bioskop...</div>
          ) : (
            <>
              {/* Summary Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--gold-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                    <span>Total Pendapatan Tiket</span>
                    <DollarSign size={20} color="var(--gold-primary)" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Rp {Number(analytics.totalRevenue || 0).toLocaleString('id-ID')}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    ▲ +18.4% vs Bulan Lalu
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--cyan-accent)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                    <span>Total Tiket Terjual</span>
                    <Ticket size={20} color="var(--cyan-accent)" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {analytics.totalTicketsSold || 0} Kursi
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
                    Dari {analytics.totalMovies || 0} Film Aktif
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                    <span>Okupansi Kursi Rata-rata</span>
                    <Users size={20} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                    {analytics.occupancyRate || 0}%
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
                    Target KPI Bioskop: &gt; 65%
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--crimson-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                    <span>Jaringan Bioskop</span>
                    <MapPin size={20} color="var(--crimson-primary)" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {analytics.totalCinemas || 5} Cabang
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
                    Jakarta, Bandung, Surabaya, Bali
                  </span>
                </div>
              </div>

              {/* Movie Performance Table */}
              <div className="glass-card" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Laporan Penjualan per Film (Movie Performance)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 16px' }}>ID</th>
                        <th style={{ padding: '12px 16px' }}>Judul Film</th>
                        <th style={{ padding: '12px 16px' }}>Tiket Terjual</th>
                        <th style={{ padding: '12px 16px' }}>Total Pendapatan</th>
                        <th style={{ padding: '12px 16px' }}>Performa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics.movieStats || []).map(ms => (
                        <tr key={ms.movieId} style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
                          <td style={{ padding: '16px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{ms.movieId}</td>
                          <td style={{ padding: '16px', fontWeight: 700 }}>{ms.title}</td>
                          <td style={{ padding: '16px' }}>
                            <span className="badge badge-cyan">{ms.ticketsSold || 0} Tiket</span>
                          </td>
                          <td style={{ padding: '16px', color: 'var(--gold-primary)', fontWeight: 700 }}>
                            Rp {Number(ms.revenue || 0).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ color: ms.ticketsSold > 0 ? '#10b981' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                              {ms.ticketsSold > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Flame size={14} /> TRENDING</span> : 'READY'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'MOVIES' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.4rem' }}>Manajemen Katalog Film</h3>
            <button onClick={() => setShowAddMovie(!showAddMovie)} className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
              <Plus size={18} /> Tambah Film Baru
            </button>
          </div>

          {showAddMovie && (
            <div className="glass-card animate-fade-in" style={{ padding: '28px', marginBottom: '32px', background: 'var(--bg-tertiary)' }}>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Form Tambah Film Blockbuster</h4>
              <form onSubmit={handleSaveMovie} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Judul Film</label>
                  <input
                    type="text"
                    required
                    value={newMovie.title}
                    onChange={e => setNewMovie({ ...newMovie, title: e.target.value })}
                    placeholder="Contoh: Avatar 3"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Genre</label>
                  <input
                    type="text"
                    required
                    value={newMovie.genre}
                    onChange={e => setNewMovie({ ...newMovie, genre: e.target.value })}
                    placeholder="Sci-Fi, Action"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Durasi (Menit)</label>
                  <input
                    type="number"
                    required
                    value={newMovie.durationMinutes}
                    onChange={e => setNewMovie({ ...newMovie, durationMinutes: Number(e.target.value) })}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Age Rating</label>
                  <select
                    value={newMovie.ageRating}
                    onChange={e => setNewMovie({ ...newMovie, ageRating: e.target.value })}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', width: '100%' }}
                  >
                    <option value="SU">SU (Semua Umur)</option>
                    <option value="13+">13+</option>
                    <option value="17+">17+</option>
                    <option value="21+">21+</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status Penayangan</label>
                  <select
                    value={newMovie.status}
                    onChange={e => setNewMovie({ ...newMovie, status: e.target.value })}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', width: '100%' }}
                  >
                    <option value="NOW_SHOWING">NOW_SHOWING (Sedang Tayang)</option>
                    <option value="COMING_SOON">COMING_SOON (Segera Tayang)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Poster Image URL</label>
                  <input
                    type="url"
                    required
                    value={newMovie.posterUrl}
                    onChange={e => setNewMovie({ ...newMovie, posterUrl: e.target.value })}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sinopsis</label>
                  <textarea
                    rows={3}
                    required
                    value={newMovie.synopsis}
                    onChange={e => setNewMovie({ ...newMovie, synopsis: e.target.value })}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', width: '100%', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowAddMovie(false)} className="btn-glass">Batal</button>
                  <button type="submit" className="btn-gold">Simpan Film</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {movies.map(m => (
              <div key={m.id} className="glass-card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img src={m.posterUrl} alt={m.title} style={{ width: '80px', height: '115px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ flex: 1 }}>
                  <span className="badge badge-gold" style={{ marginBottom: '6px', display: 'inline-block' }}>{m.status}</span>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{m.title}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{m.genre} • {m.durationMinutes}m</div>
                  <button onClick={() => handleDeleteMovie(m.id)} style={{ background: 'rgba(229, 9, 20, 0.2)', color: '#ff4d54', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
