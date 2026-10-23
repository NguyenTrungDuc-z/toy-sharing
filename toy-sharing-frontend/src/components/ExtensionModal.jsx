import React, { useState } from 'react';
import axios from 'axios';

export default function ExtensionModal({ isOpen, onClose, item, onSuccess, showToast }) {
  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !item) return null;

  // Tính ngày tối thiểu cho phép chọn (ngày mai hoặc ngày sau hạn hiện tại)
  const currentDue = item.dueDate ? new Date(item.dueDate) : new Date();
  const minDateObj = new Date(currentDue);
  minDateObj.setDate(minDateObj.getDate() + 1);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDueDate) {
      showToast?.('Vui lòng chọn ngày gia hạn mới!', 'error');
      return;
    }

    const selectedDate = new Date(newDueDate);
    if (selectedDate <= currentDue) {
      showToast?.('Ngày mượn thêm phải sau ngày hạn trả hiện tại!', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const res = await axios.patch(
        `http://localhost:5000/api/borrows/${item._id}/request-extension`,
        {
          newDueDate,
          reason: reason.trim(),
          userId
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      showToast?.('🎉 Đã gửi yêu cầu mượn thêm! Vui lòng chờ chủ đồ duyệt.', 'success');
      onSuccess?.(res.data.data);
      onClose();
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu gia hạn:', err);
      const msg = err.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại!';
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
        padding: '30px',
        width: '480px',
        maxWidth: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'modalFadeIn 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: '700', color: '#3f2e21', margin: 0 }}>
              📅 Xin mượn thêm thời gian
            </h2>
            <p style={{ fontSize: '13px', color: '#8c7664', margin: '4px 0 0 0' }}>
              Đồ chơi: <strong style={{ color: '#85581A' }}>{item.toyId?.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: '#f5efe8',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#7c6e65'
            }}
          >
            ✕
          </button>
        </div>

        {/* Thông tin hạn cũ */}
        <div style={{
          backgroundColor: '#fff8f2',
          border: '1px dashed #f1cdb5',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', color: '#8c7664' }}>Hạn trả hiện tại:</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#b45309' }}>
            {formatShortDate(item.dueDate)}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Chọn ngày mới */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a382c', marginBottom: '6px' }}>
              Ngày muốn gia hạn đến: <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1.5px solid #ebdcd0',
                fontSize: '14px',
                color: '#333',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#85581A'}
              onBlur={(e) => e.target.style.borderColor = '#ebdcd0'}
            />
          </div>

          {/* Lý do / Lời nhắn */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a382c', marginBottom: '6px' }}>
              Lời nhắn gửi chủ đồ chơi (lý do):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Bé nhà mình rất thích món đồ chơi này, cho mình xin phép mượn thêm vài ngày nhé..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1.5px solid #ebdcd0',
                fontSize: '13px',
                color: '#333',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#85581A'}
              onBlur={(e) => e.target.style.borderColor = '#ebdcd0'}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid #ebdcd0',
                backgroundColor: '#fff',
                color: '#7c6e65',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 22px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#85581A',
                color: '#fff',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 10px rgba(133, 88, 26, 0.2)'
              }}
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
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
