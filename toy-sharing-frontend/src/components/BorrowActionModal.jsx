import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Button, Input, DatePicker, Typography, Card, Flex, Space } from 'antd';
import { InboxOutlined, CalendarOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ImageUploader from './ImageUploader';

const { Text, Paragraph } = Typography;

export default function BorrowActionModal({ isOpen, onClose, item, onSuccess, showToast }) {
  const [mode, setMode] = useState('menu'); // menu | extend | return_early | return_on_time
  const [newDueDate, setNewDueDate] = useState(null);
  const [note, setNote] = useState('');
  const [returnImages, setReturnImages] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const fmt = (d) => d ? dayjs(d).format('DD/MM/YYYY') : '';

  const handleClose = () => { setMode('menu'); setNewDueDate(null); setNote(''); setReturnImages([]); onClose(); };

  const handleExtendSubmit = async () => {
    if (!newDueDate) { showToast?.('Vui lòng chọn ngày muốn mượn thêm đến!', 'error'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`http://localhost:5000/api/borrows/${item._id}/request-extension`,
        { newDueDate: newDueDate.toISOString(), reason: note.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      showToast?.('Đã gửi yêu cầu mượn thêm! Vui lòng chờ chủ đồ duyệt.', 'success');
      onSuccess?.(res.data.data); handleClose();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Không thể gửi yêu cầu gia hạn!', 'error');
    } finally { setLoading(false); }
  };

  const handleReturnSubmit = async (returnType) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`http://localhost:5000/api/borrows/${item._id}/report-return`,
        { returnType, note: note.trim(), returnImages }, { headers: { Authorization: `Bearer ${token}` } });
      showToast?.(res.data.message || 'Đã gửi thông báo trả đồ thành công!', 'success');
      onSuccess?.(res.data.data); handleClose();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Không thể gửi thông báo trả đồ!', 'error');
    } finally { setLoading(false); }
  };

  const title = mode === 'menu' ? 'Tùy chọn khi đang mượn'
    : mode === 'extend' ? 'Xin mượn thêm (gia hạn)'
    : mode === 'return_early' ? 'Báo trả đồ sớm' : 'Báo trả đồ đúng hạn';

  const menuChoices = [
    { key: 'return_early', icon: <InboxOutlined />, title: 'Trả đồ sớm', desc: 'Bé đã chơi xong, gửi trả trước hạn.', note: 'Bé đã chơi xong, mình gửi trả đồ sớm nhé!' },
    { key: 'extend', icon: <CalendarOutlined />, title: 'Mượn thêm (gia hạn)', desc: 'Xin chủ đồ cho mượn thêm vài ngày.', note: '' },
    { key: 'return_on_time', icon: <CheckCircleOutlined />, title: 'Trả đồ đúng hạn', desc: 'Đến lịch hẹn, báo chủ đồ nhận lại.', note: 'Đã đến hạn trả, mình gửi trả đồ đầy đủ nhé!' },
  ];

  const footer = mode === 'menu' ? null
    : mode === 'extend'
      ? [<Button key="back" icon={<ArrowLeftOutlined />} onClick={() => setMode('menu')}>Quay lại</Button>,
         <Button key="ok" type="primary" loading={loading} onClick={handleExtendSubmit}>Gửi yêu cầu mượn thêm</Button>]
      : [<Button key="back" icon={<ArrowLeftOutlined />} onClick={() => setMode('menu')}>Quay lại</Button>,
         <Button key="ok" type="primary" loading={loading} onClick={() => handleReturnSubmit(mode === 'return_early' ? 'early' : 'on_time')}>Xác nhận gửi thông báo</Button>];

  return (
    <Modal open={isOpen} onCancel={handleClose} title={title} footer={footer} width={520}>
      <Paragraph type="secondary" style={{ marginTop: -4 }}>
        {item.toyId?.name} · Hạn trả: <Text strong>{fmt(item.dueDate)}</Text>
      </Paragraph>

      {mode === 'menu' && (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {menuChoices.map(c => (
            <Card key={c.key} hoverable styles={{ body: { padding: 16 } }} onClick={() => { setMode(c.key); setNote(c.note); }}>
              <Flex align="center" gap={14}>
                <div style={{ fontSize: 24, color: 'var(--color-primary)' }}>{c.icon}</div>
                <div><Text strong>{c.title}</Text><div style={{ fontSize: 13, color: '#8c7664' }}>{c.desc}</div></div>
              </Flex>
            </Card>
          ))}
        </Space>
      )}

      {(mode === 'return_early' || mode === 'return_on_time') && (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <div>
            <Text strong>Lời nhắn gửi chủ đồ chơi</Text>
            <Input.TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} style={{ marginTop: 6 }} placeholder="Ghi chú tình trạng đồ chơi..." />
          </div>
          <ImageUploader images={returnImages} onChange={setReturnImages} label="Ảnh tình trạng đồ chơi khi trả (khuyến khích - bảo vệ bạn nếu có tranh chấp)" />
        </Space>
      )}

      {mode === 'extend' && (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <div>
            <Text strong>Ngày muốn mượn thêm đến</Text>
            <DatePicker style={{ width: '100%', marginTop: 6 }} format="DD/MM/YYYY" value={newDueDate} onChange={setNewDueDate}
              disabledDate={d => d && d <= dayjs(item.dueDate).endOf('day')} />
          </div>
          <div>
            <Text strong>Lý do xin mượn thêm</Text>
            <Input.TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} style={{ marginTop: 6 }} placeholder="Bé rất thích món này, cho mình xin mượn thêm vài ngày nhé..." />
          </div>
        </Space>
      )}
    </Modal>
  );
}
