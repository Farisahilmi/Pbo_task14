import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, Play, Ticket, Calendar } from 'lucide-react';

export default function MovieCard({ movie, onOpenTrailer }) {
  const isNowShowing = movie.status === 'NOW_SHOWING';

  return (
    <div className="glass-card animate-fade-in" style={{
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Poster & Badge */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '145%', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
        <img
          src={movie.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80'}
          alt={movie.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Age Rating Badge */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
          <span className={movie.ageRating === '21+' || movie.ageRating === '17+' ? 'badge badge-crimson' : 'badge badge-gold'} style={{ background: 'rgba(11, 13, 19, 0.85)', backdropFilter: 'blur(8px)' }}>
            {movie.ageRating || '13+'}
          </span>
        </div>

        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
          <span className={isNowShowing ? 'badge badge-gold' : 'badge badge-cyan'} style={{ background: 'rgba(11, 13, 19, 0.85)', backdropFilter: 'blur(8px)' }}>
            {isNowShowing ? 'NOW SHOWING' : 'COMING SOON'}
          </span>
        </div>

        {/* Trailer Button Overlay */}
        {movie.trailerUrl && (
          <button
            onClick={() => onOpenTrailer(movie)}
            title="Tonton Trailer"
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(229, 9, 20, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(229, 9, 20, 0.6)',
              zIndex: 2,
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Play size={18} color="#fff" fill="#fff" />
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {movie.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} color="var(--gold-primary)" /> {movie.durationMinutes || 120} Menit
          </span>
          <span>•</span>
          <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {movie.genre || 'Cinema'}
          </span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '20px', flex: 1 }}>
          {movie.synopsis || 'Saksikan penayangan eksklusif film ini di bioskop favorit Anda.'}
        </p>

        {/* CTA Button */}
        <Link
          to={`/movie/${movie.id}`}
          className={isNowShowing ? 'btn-gold' : 'btn-glass'}
          style={{ width: '100%', textAlign: 'center', padding: '10px 16px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {isNowShowing ? <><Ticket size={16} /> Beli Tiket Sekarang</> : <><Calendar size={16} /> Detail & Jadwal</>}
        </Link>
      </div>
    </div>
  );
}
