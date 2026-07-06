import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Send, MessageCircle, User, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function StarRating({ value, onChange, readOnly = false, size = 24 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: readOnly ? 'default' : 'pointer',
            padding: '2px',
            transition: 'transform 0.15s ease'
          }}
          onMouseOver={(e) => { if (!readOnly) e.currentTarget.style.transform = 'scale(1.25)'; }}
          onMouseOut={(e) => { if (!readOnly) e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Star
            size={size}
            fill={(hovered || value) >= star ? '#f59e0b' : 'transparent'}
            color={(hovered || value) >= star ? '#f59e0b' : 'var(--text-muted)'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ movieId }) {
  const { user } = useAuth();
  const [data, setData] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [myReview, setMyReview] = useState({ hasReviewed: false, rating: 0, comment: '' });
  const [form, setForm] = useState({ rating: 0, comment: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg }

  const userId = user?.id ?? user?.userId;

  useEffect(() => {
    fetchReviews();
    if (userId) fetchMyReview();
  }, [movieId, userId]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`/api/v1/movies/${movieId}/reviews`);
      setData(res.data);
    } catch (e) {
      console.error('Error fetching reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const res = await axios.get(`/api/v1/movies/${movieId}/reviews/my-review?userId=${userId}`);
      if (res.data.hasReviewed) {
        setMyReview(res.data);
        setForm({ rating: res.data.rating, comment: res.data.comment || '' });
      }
    } catch (e) { /* silent */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) {
      setFeedback({ type: 'error', msg: 'Pilih rating bintang terlebih dahulu!' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await axios.post(`/api/v1/movies/${movieId}/reviews`, {
        rating: form.rating,
        comment: form.comment,
        userId
      });
      setFeedback({ type: 'success', msg: myReview.hasReviewed ? 'Ulasan berhasil diperbarui!' : 'Ulasan berhasil dikirim!' });
      setMyReview({ hasReviewed: true, ...form });
      fetchReviews();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Gagal mengirim ulasan' });
    } finally {
      setSubmitting(false);
    }
  };

  const avgStars = Math.round(data.averageRating);

  return (
    <div style={{ marginTop: '40px', marginBottom: '60px' }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: '16px',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageCircle size={24} color="var(--gold-primary)" />
          <h2 style={{ fontSize: '1.6rem' }}>Rating & Ulasan</h2>
        </div>
        {data.totalReviews > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-tertiary)', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                {data.averageRating.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>dari 5</div>
            </div>
            <div>
              <StarRating value={avgStars} readOnly size={20} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {data.totalReviews} ulasan
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Form */}
      {user ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              {myReview.hasReviewed ? '✏️ Perbarui ulasan Anda' : '⭐ Tulis ulasan Anda'}
            </h3>

            {/* Star Picker */}
            <div style={{ marginBottom: '16px' }}>
              <StarRating value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} size={32} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                {form.rating === 1 ? 'Sangat Buruk' : form.rating === 2 ? 'Buruk' : form.rating === 3 ? 'Biasa' : form.rating === 4 ? 'Bagus' : form.rating === 5 ? 'Luar Biasa!' : 'Pilih rating'}
              </span>
            </div>

            {/* Comment */}
            <textarea
              value={form.comment}
              onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Bagikan pendapat Anda tentang film ini... (opsional)"
              rows={3}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '12px 16px',
                fontSize: '0.9rem',
                resize: 'vertical',
                marginBottom: '16px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--gold-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
            />

            {/* Feedback */}
            {feedback && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px',
                background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: feedback.type === 'success' ? '#10b981' : '#ef4444',
                fontSize: '0.85rem'
              }}>
                {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {feedback.msg}
              </div>
            )}

            <button type="submit" className="btn-gold" disabled={submitting} style={{ padding: '10px 24px' }}>
              {submitting ? <><Loader size={16} className="animate-spin" /> Mengirim...</> : <><Send size={16} /> {myReview.hasReviewed ? 'Perbarui Ulasan' : 'Kirim Ulasan'}</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '28px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <Star size={20} color="var(--gold-primary)" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Silakan <strong style={{ color: 'var(--gold-primary)' }}>login</strong> untuk memberikan rating dan ulasan.
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Loader size={24} className="animate-spin" />
        </div>
      ) : data.reviews.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <MessageCircle size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <p>Belum ada ulasan. Jadilah yang pertama memberikan ulasan!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.reviews.map(review => (
            <div key={review.id} className="glass-card animate-fade-in" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Avatar */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: review.userAvatar ? 'transparent' : 'linear-gradient(135deg, var(--gold-primary), var(--crimson-accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', border: '2px solid var(--border-glass)'
                }}>
                  {review.userAvatar
                    ? <img src={review.userAvatar} alt={review.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={20} color="#fff" />}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{review.userName}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '10px' }}>
                        {new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <StarRating value={review.rating} readOnly size={16} />
                  </div>
                  {review.comment && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
