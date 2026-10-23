import React, { useState } from 'react';
import axios from 'axios';

export default function BorrowActionModal({ isOpen, onClose, item, onSuccess, showToast }) {
  // mode: 'menu' | 'extend' | 'return_early' | 'return_on_time'
  const [mode, setMode] = useState('menu');
  const [newDueDate, setNewDueDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !item) return null;

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

  const handleClose = () => {
    setMode('menu');
    setNewDueDate('');
    setNote('');
    onClose();
  };

  // 1. Xử lý gửi yêu cầu MƯỢN THÊM
  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!newDueDate) {
      showToast?.('Vui lòng chọn ngày muốn mượn thêm đến!', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const res = await axios.patch(
        `http://localhost:5000/api/borrows/${item._id}/request-extension`,
        { newDueDate, reason: note.trim(), userId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      showToast?.('🎉 Đã gửi yêu cầu mượn thêm! Vui lòng chờ chủ đồ duyệt.', 'success');
      onSuccess?.(res.data.data);
      handleClose();
    } catch (err) {
      console.error('Lỗi khi xin gia hạn:', err);
      showToast?.(err.response?.data?.message || 'Không thể gửi yêu cầu gia hạn!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Xử lý BÁO TRẢ ĐỒ (Sớm hoặc Đúng hạn)
  const handleReturnSubmit = async (returnType) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const res = await axios.patch(
        `http://localhost:5000/api/borrows/${item._id}/report-return`,
        { returnType, note: note.trim(), userId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      showToast?.(res.data.message || 'Đã gửi thông báo trả đồ thành công!', 'success');
      onSuccess?.(res.data.data);
      handleClose();
    } catch (err) {
      console.error('Lỗi khi báo trả đồ:', err);
      showToast?.(err.response?.data?.message || 'Không thể gửi thông báo trả đồ!', 'error');
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
        width: '520px',
        maxWidth: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'modalFadeIn 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#3f2e21', margin: 0 }}>
              {mode === 'menu' && '⚡ Tùy chọn xử lý khi đang mượn'}
              {mode === 'extend' && '📅 Xin mượn thêm (Gia hạn)'}
              {mode === 'return_early' && '📦 Báo trả đồ sớm'}
              {mode === 'return_on_time' && '🤝 Báo trả đồ đúng hạn'}
            </h2>
            <p style={{ fontSize: '13px', color: '#8c7664', margin: '4px 0 0 0' }}>
              Món đồ: <strong style={{ color: '#85581A' }}>{item.toyId?.name}</strong> | Hạn trả: <span style={{ color: '#b45309', fontWeight: '650' }}>{formatShortDate(item.dueDate)}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
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

        {/* ================= GIAO DIỆN CHÍNH: 3 LỰA CHỌN ================= */}
        {mode === 'menu' && (
          <div>
            <p style={{ fontSize: '13.5px', color: '#665345', marginBottom: '18px' }}>
              Vui lòng chọn thao tác bạn muốn thực hiện cho lượt mượn này:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Lựa chọn 1: Trả đồ sớm */}
              <div
                onClick={() => { setMode('return_early'); setNote('Bé đã chơi xong, mình gửi trả đồ sớm nhé!'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1.5px solid #ebdcd0',
                  backgroundColor: '#fffdfa',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ebdcd0'; e.currentTarget.style.backgroundColor = '#fffdfa'; }}
              >
                <div style={{ fontSize: '28px', backgroundColor: '#dcfce7', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📦
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#166534', marginBottom: '2px' }}>
                    1. Trả đồ sớm
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#6b7280' }}>
                    Bé đã chơi xong hoặc gia đình muốn gửi trả đồ trước hạn thỏa thuận.
                  </div>
                </div>
                <span style={{ fontSize: '18px', color: '#9ca3af' }}>➔</span>
              </div>

              {/* Lựa chọn 2: Mượn thêm (Gia hạn) */}
              <div
                onClick={() => { setMode('extend'); setNote(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1.5px solid #ebdcd0',
                  backgroundColor: '#fffdfa',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#85581A'; e.currentTarget.style.backgroundColor = '#fff8f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ebdcd0'; e.currentTarget.style.backgroundColor = '#fffdfa'; }}
              >
                <div style={{ fontSize: '28px', backgroundColor: '#fef3c7', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📅
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#92400e', marginBottom: '2px' }}>
                    2. Mượn thêm (Gia hạn)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#6b7280' }}>
                    Bé rất thích món này, gửi đề nghị xin chủ đồ chơi cho mượn thêm vài ngày.
                  </div>
                </div>
                <span style={{ fontSize: '18px', color: '#9ca3af' }}>➔</span>
              </div>

              {/* Lựa chọn 3: Trả đồ đúng hạn */}
              <div
                onClick={() => { setMode('return_on_time'); setNote('Đã đến hạn trả, mình gửi trả đồ đầy đủ nhé!'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1.5px solid #ebdcd0',
                  backgroundColor: '#fffdfa',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ebdcd0'; e.currentTarget.style.backgroundColor = '#fffdfa'; }}
              >
                <div style={{ fontSize: '28px', backgroundColor: '#dbeafe', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🤝
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e40af', marginBottom: '2px' }}>
                    3. Trả đồ (Đúng hạn)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#6b7280' }}>
                    Đến lịch hẹn trả, báo chủ đồ để chuẩn bị nhận lại đồ và hoàn cọc.
                  </div>
                </div>
                <span style={{ fontSize: '18px', color: '#9ca3af' }}>➔</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= GIAO DIỆN 1 & 3: FORM XÁC NHẬN BÁO TRẢ ĐỒ ================= */}
        {(mode === 'return_early' || mode === 'return_on_time') && (
          <div>
            <div style={{
              backgroundColor: mode === 'return_early' ? '#f0fdf4' : '#eff6ff',
              border: `1.5px solid ${mode === 'return_early' ? '#bbf7d0' : '#bfdbfe'}`,
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '18px'
            }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: mode === 'return_early' ? '#166534' : '#1e40af', marginBottom: '4px' }}>
                {mode === 'return_early' ? '📦 Xác nhận gửi thông báo Trả đồ sớm' : '🤝 Xác nhận gửi thông báo Trả đồ đúng hạn'}
              </div>
              <div style={{ fontSize: '12.5px', color: '#555' }}>
                Thông báo sẽ được gửi tới chủ đồ chơi để hẹn địa điểm/thời gian nhận lại đồ và hoàn lại tiền cọc cho bạn.
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a382c', marginBottom: '6px' }}>
                Lời nhắn gửi chủ đồ chơi:
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập lời nhắn hoặc ghi chú tình trạng đồ chơi..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid #ebdcd0',
                  fontSize: '13.5px',
                  color: '#333',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setMode('menu')}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#85581A',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                ← Quay lại lựa chọn
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleClose}
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
                  type="button"
                  onClick={() => handleReturnSubmit(mode === 'return_early' ? 'early' : 'on_time')}
                  disabled={loading}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: mode === 'return_early' ? '#16a34a' : '#2563eb',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Đang gửi...' : 'Xác nhận gửi thông báo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= GIAO DIỆN 2: FORM MƯỢN THÊM (GIA HẠN) ================= */}
        {mode === 'extend' && (
          <form onSubmit={handleExtendSubmit}>
            <div style={{
              backgroundColor: '#fff9f2',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '13px', color: '#8c7664' }}>Hạn trả hiện tại:</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#b45309' }}>
                {formatShortDate(item.dueDate)}
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a382c', marginBottom: '6px' }}>
                Ngày muốn mượn thêm đến: <span style={{ color: '#dc2626' }}>*</span>
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
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a382c', marginBottom: '6px' }}>
                Lý do / Lời nhắn xin mượn thêm:
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Bé rất thích món này, cho mình xin mượn thêm vài ngày nhé..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid #ebdcd0',
                  fontSize: '13.5px',
                  color: '#333',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setMode('menu')}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#85581A',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                ← Quay lại lựa chọn
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleClose}
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
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#85581A',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Đang gửi...' : 'Gửi yêu cầu mượn thêm'}
                </button>
              </div>
            </div>
          </form>
        )}

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
