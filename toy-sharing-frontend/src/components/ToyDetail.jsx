import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BorrowRequestModal from './BorrowRequestModal';

const conditionLabels = { new: 'Mới', like_new: 'Như mới', used: 'Đã dùng' };

export default function ToyDetail({ toyId, user, setPage, viewOwner }) {
  const [toy, setToy] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showBorrow, setShowBorrow] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!toyId) return;
    let active = true;
    setLoading(true);
    axios.get(`http://localhost:5000/api/toys/${toyId}`)
      .then(res => {
        if (!active) return;
        setToy(res.data);
        setError('');
      })
      .catch(err => {
        if (active) setError(err.response?.data?.message || 'Không tìm thấy đồ chơi.');
      })
      .finally(() => { if (active) setLoading(false); });

    axios.get(`http://localhost:5000/api/reviews/toy/${toyId}`)
      .then(res => {
        if (!active) return;
        if (res.data.success) {
          setReviews(res.data.reviews || []);
          setReviewStats(res.data.stats || { avg: 0, count: 0 });
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [toyId]);

  const handleBorrowClick = () => {
    if (!user) {
      showToast('Bạn cần đăng nhập để mượn đồ chơi!', 'info');
      setPage('login');
      return;
    }
    setShowBorrow(true);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Đang tải chi tiết đồ chơi...</div>;
  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <p style={{ color: '#dc2626', marginBottom: '20px' }}>{error}</p>
      <button className="btn-primary" onClick={() => setPage('home')} style={{ padding: '10px 24px' }}>Về trang chủ</button>
    </div>
  );
  if (!toy) return null;

  const owner = toy.ownerId || {};
  const isOwnToy = user && (owner._id === user._id || owner._id === user.id);
  const images = toy.images && toy.images.length > 0 ? toy.images : [];
  const canBorrow = !isOwnToy && toy.status === 'available';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px 60px' }}>
      <button onClick={() => setPage('home')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>← Quay lại danh sách</button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: '40px', alignItems: 'start' }}>
        {/* Image gallery */}
        <div>
          <div style={{ width: '100%', height: '400px', background: '#fbf7f4', borderRadius: '24px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>
            {images.length > 0 ? (
              <img src={images[activeImage]} alt={toy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : '🧸'}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              {images.map((img, idx) => (
                <div key={idx} onClick={() => setActiveImage(idx)} style={{ width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: activeImage === idx ? '2px solid var(--primary-color)' : '2px solid transparent' }}>
                  <img src={img} alt={`${toy.name} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: '700', background: '#fff3e0', padding: '5px 14px', borderRadius: '20px' }}>{toy.ageRange}</span>
            <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '700', background: '#eeeeff', padding: '5px 14px', borderRadius: '20px' }}>{toy.category}</span>
            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '700', background: '#e6f6ee', padding: '5px 14px', borderRadius: '20px' }}>{conditionLabels[toy.condition] || toy.condition}</span>
          </div>

          <h1 style={{ fontSize: '30px', fontWeight: '700', marginBottom: '10px' }}>{toy.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <span style={{ color: '#f59e0b', fontWeight: '700' }}>★ {reviewStats.count > 0 ? reviewStats.avg.toFixed(1) : '—'}</span>
            <span style={{ color: '#8c7664', fontSize: '14px' }}>({reviewStats.count} đánh giá)</span>
          </div>

          {toy.location && (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>📍 {toy.location}</p>
          )}

          <p style={{ color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '20px' }}>
            {toy.description || 'Không có mô tả từ chủ sở hữu.'}
          </p>

          {/* Owner card */}
          <div
            onClick={() => owner._id && viewOwner(owner._id)}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#fff', border: '1px solid #f1eae4', borderRadius: '16px', marginBottom: '20px', cursor: owner._id ? 'pointer' : 'default' }}
          >
            {owner.avatar ? (
              <img src={owner.avatar} alt={owner.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>👤</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>{owner.name || 'Thành viên'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {owner.rating?.count > 0 ? `★ ${owner.rating.avg.toFixed(1)} uy tín` : 'Chủ sở hữu'}
              </div>
            </div>
            {owner._id && <span style={{ color: 'var(--primary-color)', fontSize: '13px', fontWeight: '600' }}>Xem hồ sơ →</span>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px dashed #f5ede6', borderBottom: '1px dashed #f5ede6', marginBottom: '20px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tiền cọc</span>
            <span style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '22px' }}>{toy.depositRequired?.toLocaleString() || 0}đ</span>
          </div>

          {isOwnToy ? (
            <button disabled style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#e5e7eb', color: '#9ca3af', border: 'none', fontWeight: '600', cursor: 'not-allowed' }}>Đây là đồ chơi của bạn</button>
          ) : canBorrow ? (
            <button onClick={handleBorrowClick} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px' }}>Mượn ngay</button>
          ) : (
            <button disabled style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#f3f4f6', color: '#9ca3af', border: 'none', fontWeight: '600', cursor: 'not-allowed' }}>
              {toy.status === 'borrowed' ? 'Đang được mượn' : 'Không sẵn sàng'}
            </button>
          )}
        </div>
      </div>

      {/* Reviews section */}
      <div style={{ marginTop: '50px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', borderLeft: '6px solid var(--primary-color)', paddingLeft: '14px' }}>
          Đánh giá từ phụ huynh ({reviewStats.count})
        </h2>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '30px', background: '#fff', borderRadius: '16px', border: '1px dashed #ebdcd0', textAlign: 'center' }}>Chưa có đánh giá nào cho đồ chơi này.</p>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {reviews.map(review => (
              <div key={review._id} style={{ padding: '18px 20px', background: '#fff', border: '1px solid #f1eae4', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{review.reviewerId?.name || 'Ẩn danh'}</span>
                  <span style={{ color: '#f59e0b', fontWeight: '700' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>{review.comment || 'Không có nhận xét.'}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BorrowRequestModal
        isOpen={showBorrow}
        onClose={() => setShowBorrow(false)}
        toy={toy}
        user={user}
        onBorrowSuccess={() => showToast('Gửi yêu cầu mượn thành công!', 'success')}
        showToast={showToast}
      />

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '16px 24px', borderRadius: '12px', backgroundColor: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#ef4444' : '#3b82f6', color: 'white', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
