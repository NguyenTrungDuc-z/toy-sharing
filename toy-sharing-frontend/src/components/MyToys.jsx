import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { App, Row, Col, Card, Button, Table, Tag, Typography, Avatar, Flex, Statistic, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, SwapOutlined, StarOutlined } from '@ant-design/icons';
import ToyFormModal from './ToyFormModal';

const { Title, Text } = Typography;

const statusTag = {
  available: { text: 'Sẵn sàng', color: 'green' },
  pending: { text: 'Chờ duyệt', color: 'gold' },
  borrowed: { text: 'Đang cho mượn', color: 'blue' },
  unavailable: { text: 'Không sẵn sàng', color: 'default' },
  rejected: { text: 'Bị từ chối', color: 'red' },
};

export default function MyToys() {
  const { message, modal } = App.useApp();
  const [myToys, setMyToys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState({ avg: 0, count: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToy, setSelectedToy] = useState(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchToys = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/toys/my-toys', { headers: authHeaders() })
      .then(res => setMyToys(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchToys();
    axios.get('http://localhost:5000/api/auth/me', { headers: authHeaders() })
      .then(res => { if (res.data.user?.rating) setUserRating(res.data.user.rating); })
      .catch(() => {});
  }, []);

  const handleDelete = (toy) => {
    if (toy.status === 'borrowed' || toy.status === 'unavailable') {
      message.error('Không thể xóa! Món đồ chơi này đang được mượn.');
      return;
    }
    modal.confirm({
      title: 'Gỡ đồ chơi',
      content: `Bạn có chắc muốn gỡ "${toy.name}" khỏi hệ thống?`,
      okText: 'Gỡ bỏ', okButtonProps: { danger: true }, cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/toys/${toy._id}`, { headers: authHeaders() });
          message.success('Đã gỡ đồ chơi thành công!');
          fetchToys();
        } catch (err) {
          message.error(err.response?.data?.message || 'Gỡ sản phẩm thất bại!');
        }
      },
    });
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedToy) {
        await axios.put(`http://localhost:5000/api/toys/${selectedToy._id}`, formData, { headers: authHeaders() });
        message.success('Cập nhật đồ chơi thành công!');
      } else {
        await axios.post('http://localhost:5000/api/toys', formData, { headers: authHeaders() });
        message.success('Đăng đồ chơi mới thành công! Chờ admin duyệt.');
      }
      setIsModalOpen(false);
      fetchToys();
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi lưu dữ liệu đồ chơi!');
    }
  };

  const columns = [
    {
      title: 'Đồ chơi', key: 'toy',
      render: (_, toy) => (
        <Flex align="center" gap={12}>
          <Avatar shape="square" size={48} src={toy.images?.[0] || undefined} style={{ background: '#f1f4f6' }}>
            {!toy.images?.[0] && '🧸'}
          </Avatar>
          <Text strong>{toy.name}</Text>
        </Flex>
      ),
    },
    { title: 'Phân loại', dataIndex: 'category', key: 'category', responsive: ['md'] },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s) => { const t = statusTag[s] || { text: s, color: 'default' }; return <Tag color={t.color}>{t.text}</Tag>; },
    },
    { title: 'Tiền cọc', dataIndex: 'depositRequired', key: 'deposit', responsive: ['sm'],
      render: (d) => `${(d || 0).toLocaleString()}đ` },
    {
      title: 'Thao tác', key: 'actions', align: 'right',
      render: (_, toy) => (
        <Flex gap={8} justify="flex-end">
          <Button icon={<EditOutlined />} onClick={() => { setSelectedToy(toy); setIsModalOpen(true); }}>Sửa</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(toy)}>Xóa</Button>
        </Flex>
      ),
    },
  ];

  const totalToys = myToys.length;
  const borrowingToys = myToys.filter(t => t.status === 'borrowed').length;

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px clamp(16px,4vw,24px) 56px' }}>
      <Flex justify="space-between" align="center" wrap gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý đồ chơi của tôi</Title>
          <Text type="secondary">Xem danh sách, cập nhật và đăng thêm đồ chơi mới.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => { setSelectedToy(null); setIsModalOpen(true); }}>
          Đăng đồ chơi mới
        </Button>
      </Flex>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Flex align="center" gap={16}>
              <Avatar size={44} icon={<AppstoreOutlined />} style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }} />
              <Statistic title="Tổng số đồ chơi" value={totalToys} suffix="món" />
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Flex align="center" gap={16}>
              <Avatar size={44} icon={<SwapOutlined />} style={{ background: '#eef2ff', color: '#4f46e5' }} />
              <Statistic title="Đang cho mượn" value={borrowingToys} suffix="món" valueStyle={{ color: '#4f46e5' }} />
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Flex align="center" gap={16}>
              <Avatar size={44} icon={<StarOutlined />} style={{ background: '#fff7e6', color: '#d48806' }} />
              <Statistic title={`Điểm uy tín (${userRating.count} đánh giá)`}
                value={userRating.count > 0 ? userRating.avg.toFixed(1) : '—'} suffix="/ 5.0" valueStyle={{ color: '#15803d' }} />
            </Flex>
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách đồ chơi">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
        ) : (
          <Table rowKey="_id" columns={columns} dataSource={myToys} pagination={{ pageSize: 8, hideOnSinglePage: true }}
            locale={{ emptyText: 'Bạn chưa đăng món đồ chơi nào.' }} scroll={{ x: 'max-content' }} />
        )}
      </Card>

      <ToyFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} editingToy={selectedToy} />
    </div>
  );
}
