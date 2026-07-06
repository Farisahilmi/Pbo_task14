import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { Film, Play, X, Star, Sparkles, Filter, Ticket, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MovieCardSkeleton } from '../components/Skeleton';

export default function HomePage() {
  const { city, searchTerm } = useApp();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('NOW_SHOWING');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [trailerMovie, setTrailerMovie] = useState(null);

  // Helper: convert watch?v= URL to /embed/ URL for iframe
  const getYoutubeEmbedUrl = (watchUrl) => {
    if (!watchUrl) return null;
    try {
      if (watchUrl.includes('/embed/')) return watchUrl;
      const url = new URL(watchUrl);
      const videoId = url.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
    } catch {
      return null;
    }
  };

  const genres = ['', 'Action', 'Drama', 'Comedy', 'Horror', 'Sci-Fi', 'Thriller', 'Animation', 'Romance', 'Adventure', 'Family', 'Crime', 'Mystery', 'Fantasy', 'Biography'];

  useEffect(() => {
    fetchMovies();
  }, [activeTab, selectedGenre, city, searchTerm]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/movies?status=${activeTab}`;
      if (selectedGenre) url += `&genre=${encodeURIComponent(selectedGenre)}`;
      if (city && city !== 'ALL') url += `&city=${encodeURIComponent(city)}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      
      const res = await axios.get(url);
      setMovies(res.data);
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const featuredMovie = movies.length > 0 ? movies[0] : null;

  return (
    <div className="page-transition">
      {/* Hero Featured Movie Banner */}
      {featuredMovie && activeTab === 'NOW_SHOWING' && !selectedGenre && (
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '480px',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(to right, rgba(11, 13, 19, 0.95) 30%, rgba(11, 13, 19, 0.4) 100%), url(${featuredMovie.posterUrl}) center/cover no-repeat`,
          borderBottom: '1px solid var(--border-glass)',
          marginBottom: '50px',
          padding: '60px 0'
        }}>
          <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '700px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="badge badge-gold"><Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} /> BLOCKBUSTER FEATURED</span>
              <span className="badge badge-crimson">{featuredMovie.ageRating || '13+'}</span>
            </div>

            <h1 style={{ fontSize: '3.2rem', fontWeight: 800, marginBottom: '16px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
              {featuredMovie.title}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '28px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {featuredMovie.synopsis}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <a href={`/movie/${featuredMovie.id}`} className="btn-gold" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                <Ticket size={18} /> Beli Tiket Sekarang
              </a>
              {featuredMovie.trailerUrl && (
                <button
                  onClick={() => setTrailerMovie(featuredMovie)}
                  className="btn-glass"
                  style={{ padding: '14px 24px', fontSize: '1rem', background: 'rgba(255,255,255,0.1)' }}
                >
                  <Play size={18} fill="#fff" /> Lihat Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Catalog Container */}
      <div className="container">
        {/* Header & Filter Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '32px',
          borderBottom: '1px solid var(--border-glass)',
          paddingBottom: '20px'
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('NOW_SHOWING')}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-lg)',
                background: activeTab === 'NOW_SHOWING' ? 'var(--gold-primary)' : 'var(--bg-tertiary)',
                color: activeTab === 'NOW_SHOWING' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: `1px solid ${activeTab === 'NOW_SHOWING' ? 'var(--gold-primary)' : 'var(--border-glass)'}`,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'NOW_SHOWING' ? '0 0 15px var(--gold-glow)' : 'none'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Flame size={16} /> SEDANG TAYANG</span>
            </button>
            <button
              onClick={() => setActiveTab('COMING_SOON')}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-lg)',
                background: activeTab === 'COMING_SOON' ? 'var(--cyan-accent)' : 'var(--bg-tertiary)',
                color: activeTab === 'COMING_SOON' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: `1px solid ${activeTab === 'COMING_SOON' ? 'var(--cyan-accent)' : 'var(--border-glass)'}`,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'COMING_SOON' ? '0 0 15px rgba(0, 240, 255, 0.3)' : 'none'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={16} /> SEGERA TAYANG</span>
            </button>
          </div>

          {/* Genre Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <Filter size={16} color="var(--text-muted)" style={{ marginRight: '4px' }} />
            {genres.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedGenre === g ? 'var(--gold-primary)' : 'var(--bg-tertiary)',
                  color: selectedGenre === g ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  border: `1px solid ${selectedGenre === g ? 'var(--gold-primary)' : 'var(--border-glass)'}`,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {g === '' ? 'Semua Genre' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '30px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <MovieCardSkeleton key={i} />)}
          </div>
        ) : movies.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px', maxWidth: '500px', margin: '40px auto' }}>
            <Film size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ marginBottom: '8px' }}>Film Tidak Ditemukan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tidak ada film yang cocok dengan filter atau kota yang Anda pilih saat ini.
            </p>
            <button
              onClick={() => { setSelectedGenre(''); setActiveTab('NOW_SHOWING'); }}
              className="btn-glass"
              style={{ marginTop: '20px' }}
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '30px'
          }}>
            {movies.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onOpenTrailer={(m) => setTrailerMovie(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Embedded YouTube Trailer Modal — fixed embed URL */}
      {trailerMovie && (
        <div className="modal-backdrop" onClick={() => setTrailerMovie(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', padding: '20px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Trailer — {trailerMovie.title}</h3>
              <button onClick={() => setTrailerMovie(null)} style={{ background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            {getYoutubeEmbedUrl(trailerMovie.trailerUrl) ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
                <iframe
                  src={getYoutubeEmbedUrl(trailerMovie.trailerUrl)}
                  title={`Trailer ${trailerMovie.title}`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <span style={{ fontSize: '3rem' }}>🎬</span>
                <p style={{ marginTop: '16px', fontSize: '1rem' }}>Trailer belum tersedia untuk film ini.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
