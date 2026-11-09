import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Button, Input, Image, Typography, Flex, Space } from 'antd';
import ImageUploader from './ImageUploader';

const { Text, Paragraph } = Typography;

// Người mượn phản hồi khiếu nại hư hỏng/mất đồ: Đồng ý hoặc Khiếu nại ngược (kèm ảnh).
export default function ClaimResponseModal({ isOpen, onClose, item, showToast, onSuccess }) {
  const [mode, setMode] = useState(null); // null | 'dispute'
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
      const res = await axios.patch(`/api/borrows/${item._id}/respond-claim`, body, { headers: { Authorization: `Bearer ${token}` } });
      showToast(res.data.message || 'Đã gửi phản hồi!', 'success');
      reset(); onSuccess(); onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally { setSubmitting(false); }
  };

  if (!item) return null;
  const isLost = item.isLostClaim;
  const amount = item.damageAmountRequested || 0;

  return (
    <Modal open={isOpen} onCancel={() => { reset(); onClose(); }} footer={null}
      title={isLost ? 'Phản hồi khai mất đồ' : 'Phản hồi khiếu nại hư hỏng'} width={480}>
      <div style={{ padding: 14, background: '#fff5f5', borderRadius: 10, marginBottom: 16 }}>
        <Paragraph style={{ margin: 0 }}>
          Chủ <strong>"{item.toyId?.name}"</strong> yêu cầu trừ <strong style={{ color: '#9d3b35' }}>{amount.toLocaleString()}đ</strong> tiền cọc.
        </Paragraph>
        {item.damageNote && <Text type="secondary" style={{ fontSize: 13 }}>Lý do: "{item.damageNote}"</Text>}
        {item.damageImages?.length > 0 && (
          <Flex gap={8} wrap style={{ marginTop: 8 }}>
            <Image.PreviewGroup>{item.damageImages.map((img, i) => <Image key={i} src={img} width={64} height={64} style={{ objectFit: 'cover', borderRadius: 8 }} />)}</Image.PreviewGroup>
          </Flex>
        )}
      </div>

      {item.handoverImages?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>Ảnh lúc chủ giao đồ (để đối chiếu):</Text>
          <Flex gap={8} wrap style={{ marginTop: 8 }}>
            <Image.PreviewGroup>{item.handoverImages.map((img, i) => <Image key={i} src={img} width={64} height={64} style={{ objectFit: 'cover', borderRadius: 8 }} />)}</Image.PreviewGroup>
          </Flex>
        </div>
      )}

      {!mode ? (
        <Flex gap={10}>
          <Button type="primary" block loading={submitting} onClick={() => submit(true)} style={{ background: '#16a34a' }}>
            Đồng ý trừ {amount.toLocaleString()}đ
          </Button>
          <Button danger block onClick={() => setMode('dispute')}>Tôi khiếu nại</Button>
        </Flex>
      ) : (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Text type="secondary">Giải thích và tải ảnh chứng minh để admin phân xử:</Text>
          <Input.TextArea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Ví dụ: Tôi đã trả đồ nguyên vẹn, hư hỏng này có từ trước..." />
          <ImageUploader images={images} onChange={setImages} label="Ảnh chứng minh (tuỳ chọn)" />
          <Flex gap={10}>
            <Button block onClick={() => setMode(null)}>Quay lại</Button>
            <Button danger block type="primary" loading={submitting} onClick={() => submit(false)}>Gửi khiếu nại</Button>
          </Flex>
        </Space>
      )}
    </Modal>
  );
}
