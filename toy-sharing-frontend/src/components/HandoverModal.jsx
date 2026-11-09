import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Typography } from 'antd';
import ImageUploader from './ImageUploader';

// Chủ đồ chơi chụp ảnh tình trạng lúc GIAO đồ (bằng chứng "trước")
export default function HandoverModal({ isOpen, onClose, item, showToast, onSuccess }) {
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const hasDeposit = (item?.depositAmount || item?.toyId?.depositRequired || 0) > 0;

  const handleSubmit = async () => {
    if (hasDeposit && images.length === 0) { showToast('Vui lòng chụp ít nhất 1 ảnh tình trạng đồ chơi lúc giao!', 'error'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/borrows/${item._id}/confirm-deposit`,
        { handoverImages: images }, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Đã xác nhận giao đồ!', 'success');
      setImages([]); onSuccess(); onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally { setSubmitting(false); }
  };

  if (!item) return null;

  return (
    <Modal open={isOpen} onCancel={onClose} onOk={handleSubmit} confirmLoading={submitting}
      okText="Xác nhận đã giao đồ" cancelText="Hủy" title="Xác nhận giao đồ" width={460}>
      <Typography.Paragraph type="secondary">
        Chụp ảnh tình trạng <strong>"{item.toyId?.name}"</strong> ngay lúc giao để làm <strong>bằng chứng "trước"</strong>. Nếu sau này có tranh chấp hư hỏng, admin sẽ so sánh với ảnh lúc trả.
      </Typography.Paragraph>
      <ImageUploader images={images} onChange={setImages} label={hasDeposit ? 'Ảnh tình trạng (bắt buộc)' : 'Ảnh tình trạng (tuỳ chọn)'} />
    </Modal>
  );
}
