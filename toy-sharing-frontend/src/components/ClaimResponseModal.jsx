import React, { useState } from 'react';
import axios from 'axios';
import ImageUploader from './ImageUploader';

// Người mượn phản hồi khiếu nại hư hỏng/mất đồ: Đồng ý hoặc Khiếu nại ngược (kèm ảnh).
export default function ClaimResponseModal({ isOpen, onClose, item, showToast, onSuccess }) {
  const [mode, setMode] = useState(null); // 'accept' | 'dispute'
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setMode(null); setNote(''); setImages([]); };

  const submit = async (accept) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const body = { accept };
      if (!accept) { body.note = note; body.images = images; }
      const res = await axios.patch(`http://localhost:5000/api/borrows/${item._id}/respond-claim`, body, { headers: { Authorization: `Bearer ${token}` } });
      showToast(res.data.message || 'Đã gửi phản hồi!', 'success');
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  const isLost = item.isLostClaim;
  const amount = item.damageAmountRequested || 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,37,32,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>{isLost ? '❌ Phản hồi khai mất đồ' : '⚠️ Phản hồi khiếu nại hư hỏng'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a19286' }}>✕</button>
        </div>

        {/* Nội dung khiếu nại của chủ */}
        <div style={{ padding: '14px', background: '#fff8f2', borderRadius: '12px', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>
            Chủ <strong>"{item.toyId?.name}"</strong> yêu cầu trừ <strong style={{ color: '#9d3b35' }}>{amount.toLocaleString()}đ</strong> tiền cọc.
          </p>
          {item.damageNote && <p style={{ fontSize: '13px', color: '#7c6e65', marginBottom: '10px' }}>Lý do: "{item.damageNote}"</p>}
          {item.damageImages?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {item.damageImages.map((img, i) => <img key={i} src={img} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #eee' }} />)}
            </div>
          )}
        </div>

        {/* So sánh ảnh lúc giao (nếu có) */}
        {item.handoverImages?.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c6e65', marginBottom: '8px' }}>Ảnh tình trạng lúc chủ giao đồ (để đối chiếu):</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {item.handoverImages.map((img, i) => <img key={i} src={img} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #eee' }} />)}
            </div>
          </div>
        )}

        {!mode && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => submit(true)} disabled={submitting} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#16a34a', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Đồng ý trừ {amount.toLocaleString()}đ
            </button>
            <button onClick={() => setMode('dispute')} disabled={submitting} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#fff', color: '#9d3b35', border: '1px solid #f1c5c0', fontWeight: 600, cursor: 'pointer' }}>
              Tôi khiếu nại
            </button>
          </div>
        )}

        {mode === 'dispute' && (
          <div style={{ display: 'grid', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: '#7c6e65' }}>Giải thích và tải ảnh chứng minh để admin phân xử:</p>
            <textarea rows="3" value={note} onChange={e => setNote(e.target.value)} placeholder="Ví dụ: Tôi đã trả đồ nguyên vẹn, hư hỏng này có từ trước..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ebdcd0', resize: 'none' }} />
            <ImageUploader images={images} onChange={setImages} label="Ảnh chứng minh (tuỳ chọn)" />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMode(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f3f4f6', color: '#374151', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Quay lại</button>
              <button onClick={() => submit(false)} disabled={submitting} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#9d3b35', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
