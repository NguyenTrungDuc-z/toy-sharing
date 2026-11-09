import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Radio, InputNumber, Input, Image, Typography, Alert, Flex, Space } from 'antd';
import ImageUploader from './ImageUploader';

const { Text } = Typography;

// Chủ đồ chơi kiểm tra & xác nhận nhận lại đồ. Điểm DUY NHẤT khởi tạo khiếu nại hư hỏng.
export default function ReturnInspectionModal({ isOpen, onClose, item, showToast, onSuccess }) {
  const [condition, setCondition] = useState('ok');
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
      const res = await axios.patch(`/api/borrows/${item._id}/confirm-return`, body, { headers: { Authorization: `Bearer ${token}` } });
      showToast(res.data.message || 'Thành công!', 'success');
      reset(); onSuccess(); onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally { setSubmitting(false); }
  };

  if (!item) return null;

  const okText = condition === 'ok' ? 'Xác nhận nhận lại (nguyên vẹn)' : condition === 'damaged' ? 'Gửi khiếu nại hư hỏng' : 'Khai báo mất đồ';
  const condOptions = [
    { value: 'ok', label: <div><b>Nguyên vẹn</b><div style={{ fontSize: 12, color: '#8c7664' }}>Trả tốt, hoàn cọc đầy đủ</div></div> },
    { value: 'damaged', label: <div><b>Hư hỏng</b><div style={{ fontSize: 12, color: '#8c7664' }}>Trừ một phần cọc</div></div>, disabled: !hasDeposit },
  ];
  if (isOverdue) condOptions.push({ value: 'lost', label: <div><b>Mất đồ</b><div style={{ fontSize: 12, color: '#8c7664' }}>Trừ toàn bộ cọc</div></div>, disabled: !hasDeposit });

  return (
    <Modal open={isOpen} onCancel={onClose} onOk={handleSubmit} confirmLoading={submitting}
      okText={okText} cancelText="Hủy" okButtonProps={{ danger: condition !== 'ok' }} title="Kiểm tra & nhận lại đồ" width={480}>
      {item.returnImages?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>Ảnh người mượn gửi khi trả:</Text>
          <Flex gap={8} wrap style={{ marginTop: 8 }}>
            <Image.PreviewGroup>
              {item.returnImages.map((img, i) => <Image key={i} src={img} width={64} height={64} style={{ objectFit: 'cover', borderRadius: 8 }} />)}
            </Image.PreviewGroup>
          </Flex>
        </div>
      )}

      <Radio.Group value={condition} onChange={e => setCondition(e.target.value)} style={{ width: '100%', marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {condOptions.map(o => <Radio key={o.value} value={o.value} disabled={o.disabled}>{o.label}</Radio>)}
        </Space>
      </Radio.Group>

      {condition === 'damaged' && (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 13 }}>Số tiền đề nghị trừ (tối đa {deposit.toLocaleString()}đ)</Text>
            <InputNumber min={1} max={deposit} value={amount} onChange={setAmount} placeholder="Ví dụ: 50000" style={{ width: '100%', marginTop: 6 }}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => (v || '').replace(/,/g, '')} />
          </div>
          <ImageUploader images={images} onChange={setImages} label="Ảnh bằng chứng hư hỏng (bắt buộc)" />
          <Input.TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Mô tả cụ thể hư hỏng..." />
        </Space>
      )}

      {condition === 'lost' && (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Alert type="error" message={<span>Khai mất đồ sẽ đề nghị trừ <strong>toàn bộ cọc {deposit.toLocaleString()}đ</strong>. Người mượn có quyền phản hồi, admin sẽ phân xử.</span>} />
          <ImageUploader images={images} onChange={setImages} label="Ảnh/bằng chứng (nếu có)" />
          <Input.TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Lý do / tình huống..." />
        </Space>
      )}
    </Modal>
  );
}
