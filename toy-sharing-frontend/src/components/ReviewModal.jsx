import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Rate, Input, Typography, Flex } from 'antd';

const { Text } = Typography;
const MANGO = '#ffb627';
const ratingLabels = {
  1: 'Rất không hài lòng', 2: 'Chưa hài lòng', 3: 'Bình thường', 4: 'Hài lòng', 5: 'Rất hài lòng',
};

export default function ReviewModal({ isOpen, onClose, toy, borrowRequestId, onSuccess, showToast, mode = 'borrower', targetName }) {
  const isOwnerReview = mode === 'owner';
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!toy) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) { showToast?.('Vui lòng nhập nhận xét của bạn!', 'error'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/reviews',
        { toyId: toy._id, borrowRequestId: borrowRequestId || undefined, rating, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } });
      showToast?.('Cảm ơn bạn đã gửi đánh giá!', 'success');
      onSuccess?.(res.data);
      setComment(''); setRating(5);
      onClose();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại!', 'error');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={isOpen} onCancel={onClose} onOk={handleSubmit} confirmLoading={loading}
      okText="Gửi đánh giá" cancelText="Hủy"
      title={isOwnerReview ? `Đánh giá người mượn: ${targetName || ''}` : `Đánh giá: ${toy.name}`}>
      <Flex vertical align="center" gap={4} style={{ background: '#fff8ec', borderRadius: 12, padding: '16px 0', marginBottom: 16 }}>
        <Rate value={rating} onChange={setRating} style={{ fontSize: 32, color: MANGO }} />
        <Text strong style={{ color: '#b45309' }}>{ratingLabels[rating]}</Text>
      </Flex>
      <Text strong>Nhận xét của bạn</Text>
      <Input.TextArea rows={4} value={comment} onChange={e => setComment(e.target.value)} maxLength={1000}
        placeholder={isOwnerReview
          ? 'Người mượn có giữ gìn đồ cẩn thận, trả đúng hạn, trao đổi lịch sự không?...'
          : 'Chia sẻ về chất lượng đồ chơi, độ sạch sẽ, sự nhiệt tình của chủ đồ chơi...'}
        style={{ marginTop: 8 }} />
    </Modal>
  );
}
