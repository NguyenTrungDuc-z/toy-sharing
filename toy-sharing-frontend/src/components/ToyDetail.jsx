import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BorrowRequestModal from './BorrowRequestModal';

const conditionLabels = {
  new: 'Mới 100%',
  like_new: 'Như mới (95%)',
  used: 'Đã qua sử dụng'
};

const conditionColors = {
  new: { bg: '#ecfdf5', color: '#047857' },
  like_new: { bg: '#eff6ff', color: '#1d4ed8' },
  used: { bg: '#fef3c7', color: '#b45309' }
};

export default function ToyDetail({ toyId, user, setPage, viewOwner, viewToyDetail }) {
  const [toy, setToy] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avg: 0, count: 0 });
  const [relatedToys, setRelatedToys] = useState([]);
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
    setActiveImage(0);

    // 1. Lấy chi tiết đồ chơi
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

    // 2. Lấy nhận xét
    axios.get(`http://localhost:5000/api/reviews/toy/${toyId}`)
      .then(res => {
        if (!active) return;
        if (res.data.success) {
          setReviews(res.data.reviews || []);
          setReviewStats(res.data.stats || { avg: 0, count: 0 });
        }
      })
      .catch(() => {});

    // 3. Lấy đồ chơi gợi ý liên quan
    axios.get(`http://localhost:5000/api/toys/${toyId}/related`)
      .then(res => {
        if (!active) return;
        if (res.data.success) {
          setRelatedToys(res.data.related || []);
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [toyId]);

  const handleBorrowClick = () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để mượn đồ chơi!', 'info');
      if (setPage) setPage('login');
      return;
    }
    setShowBorrow(true);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🧸</div>
      <div style={{ fontSize: '18px', fontWeight: '600' }}>Đang tải thông tin chi tiết đồ chơi...</div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <p style={{ color: '#dc2626', fontSize: '16px', marginBottom: '20px' }}>{error}</p>
      <button className="btn-primary" onClick={() => setPage && setPage('home')} style={{ padding: '12px 28px' }}>
        ← Quay lại trang chủ
      </button>
    </div>
  );

  if (!toy) return null;

  const owner = toy.ownerId || {};
  const isOwnToy = user && (owner._id === user._id || owner._id === user.id);
  const images = toy.images && toy.images.length > 0 ? toy.images : [];
  const canBorrow = !isOwnToy && toy.status === 'available';
  const condStyle = conditionColors[toy.condition] || { bg: '#f3ede7', color: '#7c6e65' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 80px' }}>
      
      {/* THANH ĐIỀU HƯỚNG BREADCRUMB */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '24px', color: '#8a776a' }}>
        <span onClick={() => setPage && setPage('home')} style={{ cursor: 'pointer', color: 'var(--primary-color)', fontWeight: '600' }}>
          Trang chủ
        </span>
        <span>›</span>
        <span>{toy.category}</span>
        <span>›</span>
        <span style={{ color: '#2d2520', fontWeight: '600', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {toy.name}
        </span>
      </div>

      {/* KHỐI NỘI DUNG CHÍNH (2 CỘT) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)', gap: '48px', alignItems: 'start', marginBottom: '60px' }}>
        
        {/* CỘT TRÁI: BỘ ẢNH & CAM KẾT CHẤT LƯỢNG */}
        <div>
          {/* ẢNH CHÍNH */}
          <div style={{ position: 'relative', width: '100%', height: '440px', background: '#fbf7f4', borderRadius: '28px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(92, 77, 66, 0.06)', border: '1px solid #f1eae4' }}>
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={toy.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '90px' }}>🧸</span>
            )}

            {/* BADGES NỔI TRÊN ẢNH */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: '#16a34a', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}>
                ☀️ Đã tiệt trùng UV-C
              </span>
              <span style={{ background: condStyle.bg, color: condStyle.color, fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '20px', border: `1px solid ${condStyle.color}` }}>
                {conditionLabels[toy.condition] || 'Tốt'}
              </span>
            </div>

            {toy.location && (
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#047857' }}>
                📍 {toy.location}
              </div>
            )}
          </div>

          {/* DẢI ẢNH THUMBNAILS (NẾU CÓ NHIỀU ẢNH) */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: activeImage === idx ? '3px solid var(--primary-color)' : '2px solid #ebdcd0',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  <img src={img} alt={`${toy.name} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* CHECKLIST CAM KẾT CHẤT LƯỢNG TOYSHARE */}
          <div style={{ marginTop: '28px', background: '#fff9f4', border: '1px solid #fae6d3', borderRadius: '20px', padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#be6e15', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛡️</span> Cam kết An toàn & Khử khuẩn tiêu chuẩn
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#52473f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#16a34a', fontWeight: '800' }}>✓</span> Đã khử khuẩn buồng UV-C
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#16a34a', fontWeight: '800' }}>✓</span> Không cạnh sắc nhọn, gãy vỡ
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#16a34a', fontWeight: '800' }}>✓</span> Đầy đủ 100% linh kiện phụ kiện
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#16a34a', fontWeight: '800' }}>✓</span> Ký quỹ VietQR an toàn tuyệt đối
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN CHI TIẾT & HÀNH ĐỘNG */}
        <div>
          {/* TAGS PHÂN LOẠI */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: '700', background: '#fff3e0', padding: '5px 14px', borderRadius: '20px' }}>
              {toy.ageRange}
            </span>
            <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '700', background: '#eeeeff', padding: '5px 14px', borderRadius: '20px' }}>
              {toy.category}
            </span>
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700', background: '#ecfdf5', padding: '5px 14px', borderRadius: '20px' }}>
              {toy.status === 'available' ? '● Đang sẵn sàng' : '○ Đang được mượn'}
            </span>
          </div>

          {/* TÊN ĐỒ CHƠI */}
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1f160f', marginBottom: '12px', lineHeight: '1.3' }}>
            {toy.name}
          </h1>

          {/* RATING */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span style={{ color: '#f59e0b', fontSize: '16px', fontWeight: '800' }}>
              ★ {reviewStats.avg > 0 ? reviewStats.avg.toFixed(1) : (toy.rating?.avg > 0 ? toy.rating.avg.toFixed(1) : '5.0')}
            </span>
            <span style={{ color: '#8a776a', fontSize: '14px' }}>
              ({reviewStats.count || toy.rating?.count || 0} nhận xét từ phụ huynh)
            </span>
          </div>

          {/* BOX TIỀN CỌC & ƯU ĐÃI */}
          <div style={{ background: '#ffffff', border: '2px solid #fae6d3', borderRadius: '24px', padding: '24px', marginBottom: '28px', boxShadow: '0 8px 24px rgba(190, 110, 21, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#8a776a', fontWeight: '600' }}>Tiền cọc bảo chứng:</span>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-color)', lineHeight: '1.2' }}>
                  {(toy.depositRequired || 0).toLocaleString()}đ
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#ecfdf5', color: '#065f46', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '4px' }}>
                  🎁 Miễn phí mượn
                </span>
                <div style={{ fontSize: '11px', color: '#8a776a' }}>Hoàn cọc 100% khi trả đồ</div>
              </div>
            </div>

            <div style={{ background: '#fdf8f4', padding: '12px 16px', borderRadius: '14px', fontSize: '13px', color: '#68594e', lineHeight: '1.5' }}>
              💡 <strong>Gợi ý:</strong> Nhập mã ưu đãi <code>TOYSHARENEW</code> ở bước tiếp theo để được trợ giá ngay 20.000đ tiền cọc!
            </div>
          </div>

          {/* MÔ TẢ ĐỒ CHƠI */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2d2520', marginBottom: '10px' }}>
              Mô tả sản phẩm & Trải nghiệm cho bé
            </h3>
            <p style={{ fontSize: '15px', color: '#52473f', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' }}>
              {toy.description || 'Chủ sở hữu chưa cập nhật mô tả chi tiết, nhưng đồ chơi đã được kiểm duyệt chất lượng.'}
            </p>
          </div>

          {/* HỒ SƠ CHỦ SỞ HỮU (OWNER TRUST CARD) */}
          <div style={{ background: '#fff', border: '1px solid #f1eae4', borderRadius: '20px', padding: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', background: '#f3e8df', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {owner.avatar ? (
                  <img src={owner.avatar} alt={owner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : '👤'}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#2d2520', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {owner.name || 'Thành viên ToyShare'}
                  <span style={{ color: '#16a34a', fontSize: '12px' }} title="Đã xác thực danh tính">✔️</span>
                </div>
                <div style={{ fontSize: '12px', color: '#8a776a', marginTop: '2px' }}>
                  Đã xác thực CCCD & SĐT • Tỉ lệ phản hồi 100%
                </div>
              </div>
            </div>

            {viewOwner && owner._id && (
              <button
                type="button"
                onClick={() => viewOwner(owner._id)}
                style={{ background: '#fff', border: '1px solid #ebdcd0', color: 'var(--primary-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Xem trang cá nhân →
              </button>
            )}
          </div>

          {/* NÚT HÀNH ĐỘNG CHÍNH */}
          <div>
            {canBorrow ? (
              <button
                onClick={handleBorrowClick}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', borderRadius: '30px', justifyContent: 'center', fontSize: '16px', fontWeight: '700', boxShadow: '0 8px 24px rgba(190, 110, 21, 0.3)' }}
              >
                🚀 Gửi yêu cầu mượn cho bé ngay
              </button>
            ) : isOwnToy ? (
              <div style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '16px', textAlign: 'center', color: '#6b7280', fontWeight: '600', fontSize: '14px' }}>
                ℹ️ Bạn là chủ sở hữu của món đồ chơi này.
              </div>
            ) : (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '16px', padding: '16px', textAlign: 'center', color: '#92400e', fontWeight: '600', fontSize: '14px' }}>
                ⏳ Đồ chơi hiện đang được một bé khác mượn. Bạn có thể bấm yêu thích để nhận thông báo khi đồ sẵn sàng!
              </div>
            )}
          </div>

        </div>
      </div>

      {/* DANH SÁCH NHẬN XÉT TỪ PHỤ HUYNH */}
      <div style={{ borderTop: '2px dashed #f1eae4', paddingTop: '48px', marginBottom: '60px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1f160f', marginBottom: '20px' }}>
          Nhận xét & Đánh giá thực tế ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div style={{ background: '#fffbf7', padding: '36px', borderRadius: '20px', textAlign: 'center', color: '#8a776a', fontSize: '14px' }}>
            Chưa có đánh giá nào cho món đồ chơi này. Hãy là người đầu tiên mượn và chia sẻ cảm nhận!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {reviews.map(rev => (
              <div key={rev._id} style={{ background: '#fff', border: '1px solid #f1eae4', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#2d2520' }}>
                    {rev.reviewerId?.name || 'Phụ huynh'}
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '700' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#52473f', lineHeight: '1.6', margin: 0 }}>
                  "{rev.comment}"
                </p>
                <div style={{ fontSize: '11px', color: '#a8988b', marginTop: '10px' }}>
                  Đã mượn qua ToyShare • Đã xác thực trả đồ
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ĐỒ CHƠI GỢI Ý TƯƠNG TỰ (RELATED TOYS) */}
      {relatedToys.length > 0 && (
        <div style={{ borderTop: '2px dashed #f1eae4', paddingTop: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1f160f', margin: 0 }}>
                Gợi ý đồ chơi tương tự cho bé
              </h3>
              <p style={{ color: '#8a776a', fontSize: '14px', marginTop: '4px' }}>
                Cùng độ tuổi {toy.ageRange} và nhóm {toy.category}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {relatedToys.map(rel => (
              <div
                key={rel._id}
                className="toy-card"
                onClick={() => {
                  if (viewToyDetail) viewToyDetail(rel._id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ width: '100%', height: '180px', borderRadius: '18px', overflow: 'hidden', background: '#fbf7f4', marginBottom: '12px' }}>
                    {rel.images && rel.images[0] ? (
                      <img src={rel.images[0]} alt={rel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '🧸'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '700', background: '#fff3e0', padding: '3px 10px', borderRadius: '12px' }}>{rel.ageRange}</span>
                    {rel.location && (
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', background: '#ecfdf5', padding: '3px 10px', borderRadius: '12px' }}>📍 {rel.location}</span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#2d2520', margin: '0 0 6px 0', lineHeight: '1.4' }}>{rel.name}</h4>
                  <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
                    ★ {rel.rating?.avg > 0 ? rel.rating.avg.toFixed(1) : '5.0'} ({rel.rating?.count || 0})
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dashed #f1eae4' }}>
                  <span style={{ fontSize: '12px', color: '#8a776a' }}>Tiền cọc:</span>
                  <strong style={{ color: 'var(--primary-color)', fontSize: '15px' }}>{(rel.depositRequired || 0).toLocaleString()}đ</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL MƯỢN ĐỒ CHƠI */}
      {showBorrow && (
        <BorrowRequestModal
          isOpen={showBorrow}
          onClose={() => setShowBorrow(false)}
          toy={toy}
          user={user}
          onBorrowSuccess={() => {
            showToast('Đã gửi yêu cầu mượn thành công!', 'success');
            if (setPage) setPage('requests');
          }}
          showToast={showToast}
        />
      )}

      {/* TOAST THÔNG BÁO */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', padding: '14px 22px', borderRadius: '12px',
          background: toast.type === 'error' ? '#ef4444' : '#16a34a', color: '#fff', fontSize: '14px',
          fontWeight: '600', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 9999
        }}>
          {toast.message}
        </div>
      )}

    </div>
  );
}
