import React, { useState } from 'react';
import axios from 'axios';

export default function ReviewModal({ isOpen, onClose, toy, borrowRequestId, onSuccess, showToast }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !toy) return null;

  const ratingLabels = {
    1: 'Rất không hài lòng (1 sao)',
    2: 'Chưa hài lòng (2 sao)',
    3: 'Tạm ổn / Bình thường (3 sao)',
    4: 'Hài lòng (4 sao)',
    5: 'Rất hài lòng & Tuyệt vời (5 sao)'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast?.('Vui lòng nhập nhận xét của bạn!', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/reviews',
        {
          toyId: toy._id,
          borrowRequestId: borrowRequestId || undefined,
          rating,
          comment: comment.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showToast?.('🎉 Cảm ơn bạn đã gửi đánh giá và nhận xét!', 'success');
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      console.error('Lỗi khi gửi đánh giá:', err);
      const msg = err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại!';
      showToast?.(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '16px',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '24px',
        padding: '32px',
        width: '520px',
        maxWidth: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'modalFadeIn 0.25s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#3f2e21', margin: 0 }}>
              ⭐ Đánh giá trải nghiệm mượn
            </h2>
            <p style={{ fontSize: '14px', color: '#8c7664', margin: '4px 0 0 0' }}>
              Món đồ: <strong style={{ color: '#85581A' }}>{toy.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: '#f5efe8',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#7c6e65'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Chọn số sao */}
          <div style={{ textAlign: 'center', padding: '16px 0', backgroundColor: '#fff9f2', borderRadius: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '36px', cursor: 'pointer', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    color: (hoverRating || rating) >= star ? '#f59e0b' : '#d1d5db',
                    transition: 'transform 0.15s, color 0.15s',
                    transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                    userSelect: 'none'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#b45309' }}>
              {ratingLabels[hoverRating || rating]}
            </div>
          </div>

          {/* Nhập nhận xét */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#574233', marginBottom: '8px' }}>
              Nhận xét của bạn:
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ về chất lượng đồ chơi, độ sạch sẽ, sự nhiệt tình của chủ đồ chơi..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1.5px solid #ebdcd0',
                fontSize: '14px',
                color: '#333',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'none',
                lineHeight: '1.5'
              }}
              onFocus={(e) => e.target.style.borderColor = '#85581A'}
              onBlur={(e) => e.target.style.borderColor = '#ebdcd0'}
            />
          </div>

          {/* Nút hành động */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid #ebdcd0',
                backgroundColor: '#fff',
                color: '#7c6e65',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#85581A',
                color: '#fff',
                fontWeight: '600',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(133, 88, 26, 0.25)'
              }}
            >
              {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
