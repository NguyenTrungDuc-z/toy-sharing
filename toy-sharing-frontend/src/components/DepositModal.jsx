import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DepositModal({ isOpen, onClose, borrowRequest, showToast, onSuccess }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!isOpen || !borrowRequest?._id) return;
    let active = true;
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:5000/api/deposits/${borrowRequest._id}/qr`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => { if (active) setQrData(res.data); })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Không tải được mã thanh toán.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, borrowRequest]);

  const handleReportPaid = async () => {
    setReporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/deposits/${borrowRequest._id}/report-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(res.data.message || 'Đã báo chuyển cọc!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally {
      setReporting(false);
    }
  };

  if (!isOpen || !borrowRequest) return null;

  const alreadyReported = qrData?.depositStatus === 'awaiting_confirmation';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(45,37,32,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 50px rgba(92,77,66,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1eae4' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>💳 Thanh toán tiền cọc</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a19286' }}>✕</button>
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>Đang tải mã QR...</p>
          ) : error ? (
            <p style={{ textAlign: 'center', color: '#dc2626', padding: '20px' }}>{error}</p>
          ) : (
            <>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                Quét mã VietQR dưới đây bằng app ngân hàng để chuyển cọc vào tài khoản <strong>của hệ thống (ToyShare giữ hộ)</strong>.
              </p>

              {qrData?.qrUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <img src={qrData.qrUrl} alt="VietQR" style={{ width: '260px', height: 'auto', border: '1px solid #f1eae4', borderRadius: '16px' }} />
                </div>
              )}

              <div style={{ background: '#fff8f2', borderRadius: '14px', padding: '16px', marginBottom: '18px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#7c6e65' }}>Số tiền cọc:</span>
                  <strong style={{ color: '#a86a2c' }}>{(qrData?.amount || 0).toLocaleString()}đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#7c6e65' }}>Số tài khoản:</span>
                  <strong>{qrData?.bank?.accountNo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#7c6e65' }}>Chủ tài khoản:</span>
                  <strong>{qrData?.bank?.accountName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7c6e65' }}>Nội dung CK:</span>
                  <strong style={{ color: '#4f46e5' }}>{qrData?.addInfo}</strong>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#a19286', fontStyle: 'italic', marginBottom: '18px', lineHeight: '1.5' }}>
                (*) Vui lòng giữ nguyên nội dung chuyển khoản để admin đối soát. Sau khi chuyển xong, bấm nút bên dưới để admin xác nhận.
              </p>

              {alreadyReported ? (
                <div style={{ textAlign: 'center', padding: '12px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontWeight: '600', fontSize: '14px' }}>
                  ⏳ Đã báo chuyển cọc. Đang chờ admin xác nhận.
                </div>
              ) : (
                <button onClick={handleReportPaid} disabled={reporting} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px' }}>
                  {reporting ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
