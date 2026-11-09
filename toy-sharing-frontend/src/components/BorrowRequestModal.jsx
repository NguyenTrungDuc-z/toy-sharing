import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Form, Input, DatePicker, Checkbox, Row, Col, Card, Tag, Typography, Alert, Avatar, Flex } from 'antd';
import { UserOutlined, EnvironmentOutlined, SafetyCertificateOutlined, GiftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

export default function BorrowRequestModal({ isOpen, onClose, toy, user, onBorrowSuccess, showToast }) {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!toy) return null;

  const deposit = Number(toy.depositRequired) || 0;
  const imageUrl = toy.imageUrl || (Array.isArray(toy.images) && toy.images.length > 0 ? toy.images[0] : '');
  const ownerName = toy.ownerId && typeof toy.ownerId === 'object' ? (toy.ownerId.name || 'Thành viên') : (toy.ownerId || 'Ẩn danh');

  const handleSubmit = async (v) => {
    const [from, to] = v.range || [];
    if (!from || !to || !to.isAfter(from, 'day')) {
      showToast('Ngày trả phải sau ngày mượn ít nhất 1 ngày!', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/borrows', {
        toyId: toy._id,
        dueDate: to.toISOString(),
        note: v.note || '',
      }, { headers: { Authorization: `Bearer ${token}` } });
      showToast(res.data.message || 'Gửi yêu cầu mượn thành công! Vui lòng chờ chủ đồ duyệt.', 'success');
      onBorrowSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi gửi yêu cầu mượn đồ!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onCancel={onClose} onOk={() => form.submit()} confirmLoading={isSubmitting}
      okText="Gửi yêu cầu mượn" cancelText="Đóng" title="Yêu cầu mượn đồ chơi" width={860}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}>
      <Row gutter={24}>
        {/* Thông tin đồ chơi */}
        <Col xs={24} md={10}>
          <Card styles={{ body: { padding: 16 } }}>
            <div style={{ aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', background: '#f1f4f6', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imageUrl ? <img src={imageUrl} alt={toy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <GiftOutlined style={{ fontSize: 48, color: 'rgba(22,38,46,0.25)' }} />}
            </div>
            <Title level={5} style={{ marginTop: 0 }}>{toy.name}</Title>
            <div style={{ marginBottom: 12 }}>
              <Tag color="blue">{toy.ageRange}</Tag>
              <Tag>{toy.category}</Tag>
              {toy.location && <Tag color="green"><EnvironmentOutlined /> {toy.location}</Tag>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px dashed var(--color-border)', borderBottom: '1px dashed var(--color-border)', marginBottom: 12 }}>
              <Avatar size={32} icon={<UserOutlined />} src={typeof toy.ownerId === 'object' ? toy.ownerId.avatar : undefined} />
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Chủ sở hữu</Text>
                <div style={{ fontWeight: 600 }}>{ownerName}</div>
              </div>
            </div>
            <div style={{ background: '#f0f7fa', borderRadius: 12, padding: 14 }}>
              <Flex justify="space-between" align="center">
                <Text type="secondary">Tiền cọc</Text>
                <strong style={{ color: 'var(--color-primary)', fontSize: 20 }}>{deposit.toLocaleString()}đ</strong>
              </Flex>
              <Text type="success" style={{ fontSize: 12 }}>Hoàn 100% qua VietQR sau khi trả đồ nguyên vẹn.</Text>
            </div>
          </Card>
          <Alert style={{ marginTop: 12 }} type="success" showIcon icon={<SafetyCertificateOutlined />}
            message="Ký quỹ an toàn" description="Tiền cọc được hệ thống giữ hộ (escrow) và hoàn trả sau khi hoàn tất lượt mượn." />
        </Col>

        {/* Form */}
        <Col xs={24} md={14}>
          <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}
            initialValues={{ name: user?.name, phone: user?.phone, range: [dayjs(), dayjs().add(7, 'day')], agree: true }}>
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item name="name" label="Họ và tên phụ huynh"><Input placeholder="Nguyễn Văn A" /></Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="phone" label="Số điện thoại liên hệ"><Input placeholder="09xx xxx xxx" /></Form.Item>
              </Col>
            </Row>
            <Form.Item name="range" label="Thời gian mượn (từ ngày — đến ngày trả)"
              rules={[{ required: true, message: 'Chọn khoảng thời gian mượn' }]}>
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={d => d && d < dayjs().startOf('day')} />
            </Form.Item>
            <Form.Item name="note" label="Lời nhắn gửi chủ đồ chơi">
              <Input.TextArea rows={3} placeholder="Ví dụ: Bé nhà mình 4 tuổi rất thích món này, mình cam kết bảo quản cẩn thận..." />
            </Form.Item>
            <Form.Item name="agree" valuePropName="checked"
              rules={[{ validator: (_, v) => v ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý cam kết')) }]}>
              <Checkbox>
                Tôi đồng ý với Quy chế thành viên ToyShare: bảo quản đồ chơi sạch sẽ, không làm mất phụ kiện và hoàn trả đúng hẹn.
              </Checkbox>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Modal>
  );
}
