import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PublicProfile({ ownerId, setPage, viewToyDetail }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    setLoading(true);
    axios.get(`http://localhost:5000/api/users/${ownerId}`)
      .then(res => { if (active) { setData(res.data); setError(''); } })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Không tải được hồ sơ.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ownerId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Đang tải hồ sơ...</div>;
  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <p style={{ color: '#dc2626', marginBottom: '20px' }}>{error}</p>
      <button className="btn-primary" onClick={() => setPage('home')} style={{ padding: '10px 24px' }}>Về trang chủ</button>
    </div>
  );
  if (!data) return null;

  const { user, toys, reviews } = data;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px 60px' }}>
      <button onClick={() => setPage('home')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>← Quay lại</button>

      {/* Owner header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '30px', background: '#fff', border: '1px solid #f1eae4', borderRadius: '24px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#f8f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>{user.name}</h1>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '14px' }}>
            <span>★ {user.rating?.count > 0 ? `${user.rating.avg.toFixed(1)} (${user.rating.count} đánh giá)` : 'Chưa có đánh giá'}</span>
            <span>🧸 {toys.length} đồ chơi</span>
            <span>Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Toys */}
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '18px', borderLeft: '6px solid var(--primary-color)', paddingLeft: '14px' }}>Đồ chơi đang chia sẻ</h2>
      {toys.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '30px', background: '#fff', borderRadius: '16px', border: '1px dashed #ebdcd0', textAlign: 'center', marginBottom: '30px' }}>Chưa có đồ chơi nào.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {toys.map(toy => (
            <div key={toy._id} onClick={() => viewToyDetail && viewToyDetail(toy._id)} style={{ background: '#fff', border: '1px solid #f1eae4', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: '150px', background: '#fbf7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                {toy.images?.[0] ? <img src={toy.images[0]} alt={toy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🧸'}
              </div>
              <div style={{ padding: '14px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{toy.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{toy.category}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--primary-color)', fontWeight: '700' }}>{toy.depositRequired?.toLocaleString() || 0}đ</span>
                  <span style={{ fontSize: '12px', color: toy.status === 'available' ? '#15803d' : '#9ca3af' }}>{toy.status === 'available' ? 'Sẵn sàng' : 'Đang mượn'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews received */}
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '18px', borderLeft: '6px solid var(--primary-color)', paddingLeft: '14px' }}>Đánh giá nhận được ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '30px', background: '#fff', borderRadius: '16px', border: '1px dashed #ebdcd0', textAlign: 'center' }}>Chưa có đánh giá nào.</p>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {reviews.map(review => (
            <div key={review._id} style={{ padding: '18px 20px', background: '#fff', border: '1px solid #f1eae4', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>{review.reviewerId?.name || 'Ẩn danh'} <span style={{ fontWeight: '400', color: 'var(--text-muted)', fontSize: '13px' }}>• {review.toyId?.name}</span></span>
                <span style={{ color: '#f59e0b', fontWeight: '700' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>{review.comment}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
