import React, { useState } from 'react';
import axios from 'axios';
import ImageUploader from './ImageUploader';

// Chủ đồ chơi chụp ảnh tình trạng lúc GIAO đồ (bằng chứng "trước")
export default function HandoverModal({ isOpen, onClose, item, showToast, onSuccess }) {
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const hasDeposit = (item?.depositAmount || item?.toyId?.depositRequired || 0) > 0;

  const handleSubmit = async () => {
    if (hasDeposit && images.length === 0) {
      showToast('Vui lòng chụp ít nhất 1 ảnh tình trạng đồ chơi lúc giao!', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/borrows/${item._id}/confirm-deposit`,
        { handoverImages: images },
        { headers: { Authorization: `Bearer ${token}` } });
      showToast('Đã xác nhận giao đồ!', 'success');
      setImages([]);
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,37,32,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>📦 Xác nhận giao đồ</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a19286' }}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
          Chụp ảnh tình trạng <strong>"{item.toyId?.name}"</strong> ngay lúc giao để làm <strong>bằng chứng "trước"</strong>. Nếu sau này có tranh chấp hư hỏng, admin sẽ so sánh với ảnh lúc trả.
        </p>
        <ImageUploader images={images} onChange={setImages} label={hasDeposit ? 'Ảnh tình trạng (bắt buộc)' : 'Ảnh tình trạng (tuỳ chọn)'} />
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ width: '100%', padding: '13px', borderRadius: '14px', justifyContent: 'center', marginTop: '20px' }}>
          {submitting ? 'Đang xử lý...' : '✓ Xác nhận đã giao đồ'}
        </button>
      </div>
    </div>
  );
}
