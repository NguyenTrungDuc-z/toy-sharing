import React, { useState } from 'react';
import axios from 'axios';
import ImageUploader from './ImageUploader';

// Chủ đồ chơi kiểm tra & xác nhận nhận lại đồ. Điểm DUY NHẤT khởi tạo khiếu nại hư hỏng.
export default function ReturnInspectionModal({ isOpen, onClose, item, showToast, onSuccess }) {
  const [condition, setCondition] = useState('ok'); // ok | damaged | lost
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const deposit = item?.depositAmount || item?.toyId?.depositRequired || 0;
  const isOverdue = item?.status === 'overdue';
  const hasDeposit = deposit > 0 && item?.depositStatus === 'held';

  const reset = () => { setCondition('ok'); setAmount(''); setNote(''); setImages([]); };

  const handleSubmit = async () => {
    if (condition === 'damaged') {
      if (images.length === 0) { showToast('Vui lòng tải ảnh bằng chứng hư hỏng!', 'error'); return; }
      const n = Number(amount);
      if (!n || n <= 0 || n > deposit) { showToast(`Số tiền đền phải từ 1 đến ${deposit.toLocaleString()}đ!`, 'error'); return; }
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const body = { condition };
      if (condition === 'damaged') { body.amount = Number(amount); body.note = note; body.images = images; }
      if (condition === 'lost') { body.note = note; body.images = images; }
      const res = await axios.patch(`http://localhost:5000/api/borrows/${item._id}/confirm-return`, body, { headers: { Authorization: `Bearer ${token}` } });
      showToast(res.data.message || 'Thành công!', 'success');
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

  const options = [
    { key: 'ok', label: '✓ Nguyên vẹn', desc: 'Đồ chơi được trả tốt, hoàn cọc đầy đủ' },
    { key: 'damaged', label: '⚠️ Hư hỏng', desc: 'Có hư hỏng, đề nghị trừ một phần cọc', disabled: !hasDeposit },
  ];
  if (isOverdue) options.push({ key: 'lost', label: '❌ Mất đồ', desc: 'Người mượn không trả, trừ toàn bộ cọc', disabled: !hasDeposit });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,37,32,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>🔍 Kiểm tra & nhận lại đồ</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a19286' }}>✕</button>
        </div>

        {item.returnImages?.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c6e65', marginBottom: '8px' }}>Ảnh người mượn gửi khi trả:</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {item.returnImages.map((img, i) => <img key={i} src={img} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #eee' }} />)}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
          {options.map(opt => (
            <button key={opt.key} type="button" disabled={opt.disabled} onClick={() => setCondition(opt.key)}
              style={{ textAlign: 'left', padding: '14px', borderRadius: '14px', cursor: opt.disabled ? 'not-allowed' : 'pointer',
                border: condition === opt.key ? '2px solid var(--primary-color)' : '1px solid #ebdcd0',
                background: condition === opt.key ? '#fff8f2' : '#fff', opacity: opt.disabled ? 0.5 : 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{opt.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
            </button>
          ))}
        </div>

        {condition === 'damaged' && (
          <div style={{ display: 'grid', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#7c6e65', marginBottom: '6px' }}>Số tiền đề nghị trừ (tối đa {deposit.toLocaleString()}đ)</label>
              <input type="number" min="1" max={deposit} value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ví dụ: 50000" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ebdcd0' }} />
            </div>
            <ImageUploader images={images} onChange={setImages} label="Ảnh bằng chứng hư hỏng (bắt buộc)" />
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#7c6e65', marginBottom: '6px' }}>Mô tả hư hỏng</label>
              <textarea rows="2" value={note} onChange={e => setNote(e.target.value)} placeholder="Mô tả cụ thể..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ebdcd0', resize: 'none' }} />
            </div>
          </div>
        )}

        {condition === 'lost' && (
          <div style={{ display: 'grid', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '10px', fontSize: '13px', color: '#991b1b' }}>
              Khai mất đồ sẽ đề nghị trừ <strong>toàn bộ cọc {deposit.toLocaleString()}đ</strong>. Người mượn có quyền phản hồi, admin sẽ phân xử.
            </div>
            <ImageUploader images={images} onChange={setImages} label="Ảnh/bằng chứng (nếu có)" />
            <textarea rows="2" value={note} onChange={e => setNote(e.target.value)} placeholder="Lý do / tình huống..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ebdcd0', resize: 'none' }} />
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ width: '100%', padding: '13px', borderRadius: '14px', justifyContent: 'center' }}>
          {submitting ? 'Đang xử lý...' : condition === 'ok' ? 'Xác nhận nhận lại (nguyên vẹn)' : condition === 'damaged' ? 'Gửi khiếu nại hư hỏng' : 'Khai báo mất đồ'}
        </button>
      </div>
    </div>
  );
}
