import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ToyReviewsModal({ isOpen, onClose, toy }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !toy?._id) return;

    let active = true;
    setLoading(true);

    axios.get(`http://localhost:5000/api/reviews/toy/${toy._id}`)
      .then((res) => {
        if (!active) return;
        if (res.data.success) {
          setReviews(res.data.reviews || []);
          setStats(res.data.stats || { avg: 0, count: 0 });
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy danh sách đánh giá:', err);
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isOpen, toy]);

  if (!isOpen || !toy) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
        width: '560px',
        maxWidth: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'modalFadeIn 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#3f2e21', margin: 0 }}>
              Đánh giá từ phụ huynh
            </h2>
            <p style={{ fontSize: '14px', color: '#8c7664', margin: '4px 0 0 0' }}>
              Món đồ chơi: <strong style={{ color: '#85581A' }}>{toy.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
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

        {/* Tổng quan sao */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '14px 20px',
          backgroundColor: '#fff8f2',
          borderRadius: '16px',
          marginBottom: '20px',
          border: '1px solid #f6e5d8'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>★</span>
            <span>{stats.avg > 0 ? stats.avg.toFixed(1) : '5.0'}</span>
          </div>
          <div style={{ borderLeft: '1.5px solid #ebdcd0', paddingLeft: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#4a382c' }}>
              {stats.count > 0 ? `${stats.count} lượt đánh giá thực tế` : 'Chưa có đánh giá nào'}
            </div>
            <div style={{ fontSize: '12px', color: '#8c7664' }}>
              Được xác thực từ các phụ huynh đã mượn đồ chơi này
            </div>
          </div>
        </div>

        {/* Danh sách nhận xét */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c7664' }}>
              Đang tải đánh giá...
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8c7664' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: '#574233' }}>Chưa có nhận xét nào</div>
              <p style={{ fontSize: '13px', margin: '6px 0 0 0' }}>
                Hãy là người đầu tiên mượn và để lại đánh giá cho món đồ chơi này nhé!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: '#faf6f2',
                    border: '1px solid #f2e7de'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: '#ebdcd0',
                        color: '#85581A',
                        fontWeight: '700',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {rev.reviewerId?.avatar ? (
                          <img src={rev.reviewerId.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          rev.reviewerId?.name ? rev.reviewerId.name.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '650', color: '#3f2e21' }}>
                          {rev.reviewerId?.name || 'Phụ huynh'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9c8675' }}>
                          {formatDate(rev.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Số sao */}
                    <div style={{ color: '#f59e0b', fontSize: '15px' }}>
                      {'★'.repeat(rev.rating)}
                      <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - rev.rating)}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#4a382c', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1eae4', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#85581A',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>

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
