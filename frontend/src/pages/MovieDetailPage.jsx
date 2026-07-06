import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, Calendar, MapPin, Play, Star, Sparkles, Shield, Tag, ArrowLeft, Video } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ReviewSection from '../components/ReviewSection';

export default function MovieDetailPage() {
  const { city } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Helper: convert watch?v= URL to /embed/ URL for iframe
  const getYoutubeEmbedUrl = (watchUrl) => {
    if (!watchUrl) return null;
    try {
      if (watchUrl.includes('/embed/')) return watchUrl; // already embed
      const url = new URL(watchUrl);
      const videoId = url.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
    } catch {
      return null;
    }
  };

  // Generate 4 consecutive dates for tab selection, starting from July 7, 2026 or today (whichever is later)
  const dateTabs = [];
  const todayWIB = new Date();
  // Use Asia/Jakarta timezone
  const todayStr = todayWIB.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  const startBase = new Date(Math.max(new Date(todayStr), new Date('2026-07-07')));

  for (let i = 0; i < 5; i++) {
    const d = new Date(startBase);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
    dateTabs.push({
      dateStr,
      dayName: i === 0 ? 'Hari Ini' : i === 1 ? 'Besok' : d.toLocaleDateString('id-ID', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('id-ID', { month: 'short' })
    });
  }

  // Initialize selectedDate to first tab if not set
  const effectiveDate = selectedDate || dateTabs[0]?.dateStr;

  useEffect(() => {
    fetchMovieAndShowtimes();
  }, [id, effectiveDate, city]);

  const fetchMovieAndShowtimes = async () => {
    setLoading(true);
    try {
      const movieRes = await axios.get(`/api/v1/movies/${id}`);
      setMovie(movieRes.data);

      let url = `/api/v1/showtimes?movieId=${id}&date=${effectiveDate}`;
      const stRes = await axios.get(url);
      let list = stRes.data || [];
      if (city && city !== 'ALL') {
        list = list.filter(s => s.cinemaCity && s.cinemaCity.toLowerCase() === city.toLowerCase());
      }
      // Mark past showtimes as disabled
      const nowWIB = new Date();
      list = list.map(st => ({
        ...st,
        isPast: new Date(st.startTime) < nowWIB
      }));
      setShowtimes(list);
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !movie) {
    return <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>⏳ Memuat informasi film & jadwal tayang...</div>;
  }

  if (!movie) {
    return <div style={{ textAlign: 'center', padding: '100px 0' }}>Film tidak ditemukan! <Link to="/" style={{ color: 'var(--gold-primary)' }}>Kembali</Link></div>;
  }

  // Group showtimes by Cinema -> Studio
  const cinemaGroups = {};
  showtimes.forEach(st => {
    const cName = st.cinemaName || 'Bioskop Nusantara';
    if (!cinemaGroups[cName]) {
      cinemaGroups[cName] = { city: st.cinemaCity, studios: {} };
    }
    const sName = st.studioName || 'Studio Regular';
    if (!cinemaGroups[cName].studios[sName]) {
      cinemaGroups[cName].studios[sName] = [];
    }
    cinemaGroups[cName].studios[sName].push(st);
  });

  return (
    <div>
      {/* Back button */}
      <div className="container" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} className="btn-glass" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Kembali ke Katalog
        </button>
      </div>

      {/* Hero Banner with Movie details */}
      <div style={{
        background: `linear-gradient(to right, rgba(11, 13, 19, 0.98) 25%, rgba(11, 13, 19, 0.7) 100%), url(${movie.posterUrl}) center/cover no-repeat`,
        borderBottom: '1px solid var(--border-glass)',
        padding: '40px 0',
        marginBottom: '40px'
      }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
          {/* Poster Box */}
          <div style={{ width: '240px', flexShrink: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.8)', border: '1px solid var(--border-glass)' }}>
            <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', display: 'block' }} />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className="badge badge-gold">{movie.status === 'NOW_SHOWING' ? 'NOW SHOWING' : 'COMING SOON'}</span>
              <span className="badge badge-crimson">{movie.ageRating || '13+'}</span>
              <span className="badge badge-cyan">{movie.language || 'ID'}</span>
            </div>

            <h1 style={{ fontSize: '2.6rem', marginBottom: '16px' }}>{movie.title}</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--gold-primary)" /> {movie.durationMinutes || 120} Menit
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={16} color="var(--gold-primary)" /> {movie.genre}
              </span>
            </div>

            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Sinopsis</h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: '28px', maxWidth: '800px' }}>
              {movie.synopsis}
            </p>

            {movie.trailerUrl && (
              <button onClick={() => setTrailerOpen(true)} className="btn-crimson">
                <Play size={18} fill="#fff" /> Tonton Trailer Resmi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Showtimes Selection Section */}
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem' }}>Pilih Jadwal & Bioskop</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Daftar penayangan untuk kota: <strong style={{ color: 'var(--gold-primary)' }}>{city === 'ALL' ? 'Semua Kota di Indonesia' : city}</strong>
            </p>
          </div>

          {/* Date Selector Tabs */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {dateTabs.map(tab => {
              const isSelected = (selectedDate || dateTabs[0]?.dateStr) === tab.dateStr;
              return (
                <button
                  key={tab.dateStr}
                  onClick={() => setSelectedDate(tab.dateStr)}
                  style={{
                    background: isSelected ? 'var(--gold-primary)' : 'var(--bg-tertiary)',
                    color: isSelected ? 'var(--text-on-accent)' : 'var(--text-primary)',
                    border: `1px solid ${isSelected ? 'var(--gold-primary)' : 'var(--border-glass)'}`,
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    minWidth: '90px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 15px var(--gold-glow)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', opacity: isSelected ? 0.8 : 0.6 }}>{tab.dayName}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{tab.dayNum} {tab.monthName}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Showtimes List */}
        {Object.keys(cinemaGroups).length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', margin: '40px 0' }}>
            <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ marginBottom: '8px' }}>Jadwal Tidak Tersedia</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Belum ada jadwal tayang untuk film ini di tanggal {selectedDate} pada kota {city === 'ALL' ? 'terpilih' : city}.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '60px' }}>
            {Object.entries(cinemaGroups).map(([cinemaName, data]) => (
              <div key={cinemaName} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={20} color="var(--gold-primary)" /> {cinemaName}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '28px' }}>
                      Kota: {data.city || 'Nusantara'} • Fasilitas: IMAX, Dolby Atmos, Premier Lounge
                    </span>
                  </div>
                  <span className="badge badge-gold">Official Partner</span>
                </div>

                {/* Studios in Cinema */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.entries(data.studios).map(([studioName, stList]) => (
                    <div key={studioName} style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Video size={16} /> {studioName} <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{stList[0]?.format || '2D'}</span>
                        </span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Harga mulai: <strong style={{ color: 'var(--text-primary)' }}>Rp {stList[0]?.basePriceRegular?.toLocaleString('id-ID')}</strong> (Regular) / <strong style={{ color: 'var(--gold-primary)' }}>Rp {stList[0]?.basePricePremium?.toLocaleString('id-ID')}</strong> (VIP/Couple)
                        </div>
                      </div>

                      {/* Showtime Buttons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {stList.map(st => {
                          const timeStr = new Date(st.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
                          const isPast = st.isPast;
                          return (
                            <button
                              key={st.id}
                              onClick={() => !isPast && navigate(`/showtime/${st.id}/seats`)}
                              disabled={isPast}
                              title={isPast ? 'Jadwal sudah lewat' : 'Pilih kursi'}
                              style={{
                                background: isPast ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                                border: `1px solid ${isPast ? 'var(--border-glass)' : 'var(--gold-primary)'}`,
                                color: isPast ? 'var(--text-muted)' : 'var(--text-primary)',
                                padding: '10px 18px',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '85px',
                                opacity: isPast ? 0.5 : 1,
                                cursor: isPast ? 'not-allowed' : 'pointer',
                                boxShadow: isPast ? 'none' : '0 4px 10px rgba(0,0,0,0.3)'
                              }}
                              onMouseOver={(e) => { if (!isPast) { e.currentTarget.style.background = 'var(--gold-primary)'; e.currentTarget.style.color = 'var(--text-on-accent)'; }}}
                              onMouseOut={(e) => { if (!isPast) { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                            >
                              <span>{timeStr} WIB</span>
                              <span style={{ fontSize: '0.65rem', color: isPast ? 'var(--text-muted)' : 'var(--gold-primary)', fontWeight: 600 }}>
                                {isPast ? 'LEWAT' : 'PILIH KURSI'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating & Ulasan */}
      <div className="container">
        <ReviewSection movieId={id} />
      </div>

      {/* Trailer Modal — fixed YouTube embed */}
      {trailerOpen && (
        <div className="modal-backdrop" onClick={() => setTrailerOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', padding: '20px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Trailer — {movie.title}</h3>
              <button onClick={() => setTrailerOpen(false)} style={{ background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            </div>
            {getYoutubeEmbedUrl(movie.trailerUrl) ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
                <iframe
                  src={getYoutubeEmbedUrl(movie.trailerUrl)}
                  title={`Trailer ${movie.title}`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <span style={{ fontSize: '3rem' }}>🎬</span>
                <p style={{ marginTop: '16px', fontSize: '1rem' }}>Trailer belum tersedia untuk film ini.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>Periksa kembali nanti atau cari di YouTube secara langsung.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
