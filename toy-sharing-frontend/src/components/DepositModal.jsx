import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Descriptions, Button, Spin, Alert, Typography, Flex } from 'antd';

const { Text } = Typography;

export default function DepositModal({ isOpen, onClose, borrowRequest, showToast, onSuccess }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!isOpen || !borrowRequest?._id) return;
    let active = true;
    setLoading(true); setError('');
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:5000/api/deposits/${borrowRequest._id}/qr`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (active) setQrData(res.data); })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Không tải được mã thanh toán.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, borrowRequest]);

  const handleReportPaid = async () => {
    setReporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/deposits/${borrowRequest._id}/report-paid`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast(res.data.message || 'Đã báo chuyển cọc!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally { setReporting(false); }
  };

  if (!borrowRequest) return null;
  const alreadyReported = qrData?.depositStatus === 'awaiting_confirmation';

  return (
    <Modal open={isOpen} onCancel={onClose} footer={null} title="Thanh toán tiền cọc" width={440}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin /></div>
      ) : error ? (
        <Alert type="error" showIcon message={error} />
      ) : (
        <>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
            Quét mã VietQR bằng app ngân hàng để chuyển cọc vào tài khoản <strong>ký quỹ của ToyShare</strong>.
          </Text>
          {qrData?.qrUrl && (
            <Flex justify="center" style={{ marginBottom: 16 }}>
              <img src={qrData.qrUrl} alt="VietQR" style={{ width: 240, border: '1px solid var(--color-border)', borderRadius: 12 }} />
            </Flex>
          )}
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}
            items={[
              { key: 'amount', label: 'Số tiền cọc', children: <strong style={{ color: '#a86a2c' }}>{(qrData?.amount || 0).toLocaleString()}đ</strong> },
              { key: 'acc', label: 'Số tài khoản', children: qrData?.bank?.accountNo },
              { key: 'name', label: 'Chủ tài khoản', children: qrData?.bank?.accountName },
              { key: 'info', label: 'Nội dung CK', children: <strong style={{ color: 'var(--color-primary)' }}>{qrData?.addInfo}</strong> },
            ]} />
          <Text type="secondary" italic style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
            (*) Giữ nguyên nội dung chuyển khoản để admin đối soát. Chuyển xong bấm nút bên dưới để admin xác nhận.
          </Text>
          {alreadyReported ? (
            <Alert type="warning" showIcon message="Đã báo chuyển cọc. Đang chờ admin xác nhận." />
          ) : (
            <Button type="primary" block size="large" loading={reporting} onClick={handleReportPaid}>Tôi đã chuyển khoản</Button>
          )}
        </>
      )}
    </Modal>
  );
}
