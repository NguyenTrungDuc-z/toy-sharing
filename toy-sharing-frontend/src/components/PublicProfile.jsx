import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Avatar, Typography, Button, Rate, Tag, Empty, Spin, Flex, Divider, Space } from 'antd';
import { UserOutlined, ArrowLeftOutlined, StarFilled, AppstoreOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const MANGO = '#ffb627';

export default function PublicProfile({ ownerId, setPage, viewToyDetail }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    setLoading(true);
    axios.get(`http://localhost:5000/api/users/${ownerId}`)
      .then(res => { if (active) { setData(res.data); setError(''); } })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Không tải được hồ sơ.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ownerId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
  if (error) return (
    <Flex vertical align="center" gap={16} style={{ padding: '80px 20px' }}>
      <Text type="danger">{error}</Text>
      <Button type="primary" onClick={() => setPage('home')}>Về trang chủ</Button>
    </Flex>
  );
  if (!data) return null;

  const { user, toys, reviews } = data;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px clamp(16px,4vw,24px) 56px' }}>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setPage('home')} style={{ marginBottom: 16 }}>Quay lại</Button>

      <Card style={{ marginBottom: 24 }}>
        <Flex align="center" gap={24} wrap>
          <Avatar size={96} src={user.avatar || undefined} icon={<UserOutlined />} />
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ marginBottom: 6 }}>{user.name}</Title>
            <Space size={20} wrap>
              <Text type="secondary"><StarFilled style={{ color: MANGO }} /> {user.rating?.count > 0 ? `${user.rating.avg.toFixed(1)} (${user.rating.count} đánh giá)` : 'Chưa có đánh giá'}</Text>
              <Text type="secondary"><AppstoreOutlined /> {toys.length} đồ chơi</Text>
              <Text type="secondary">Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</Text>
            </Space>
          </div>
        </Flex>
      </Card>

      <Title level={4}>Đồ chơi đang chia sẻ</Title>
      {toys.length === 0 ? (
        <Empty description="Chưa có đồ chơi nào." style={{ padding: '24px 0' }} />
      ) : (
        <Row gutter={[16, 20]} style={{ marginBottom: 24 }}>
          {toys.map(toy => (
            <Col key={toy._id} xs={12} sm={8} md={6} lg={6} xl={4}>
              <Card hoverable styles={{ body: { padding: 14 } }} onClick={() => viewToyDetail?.(toy._id)}
                cover={
                  <div style={{ aspectRatio: '1/1', background: '#f1f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {toy.images?.[0] ? <img src={toy.images[0]} alt={toy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 44 }}>🧸</span>}
                  </div>
                }>
                <div style={{ fontWeight: 600, fontSize: 14, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{toy.name}</div>
                <Flex justify="space-between" align="center" style={{ marginTop: 6 }}>
                  <strong style={{ color: 'var(--color-primary)' }}>{(toy.depositRequired || 0).toLocaleString()}đ</strong>
                  <Tag color={toy.status === 'available' ? 'green' : 'default'} style={{ margin: 0 }}>{toy.status === 'available' ? 'Sẵn sàng' : 'Đang mượn'}</Tag>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Divider />
      <Title level={4}>Đánh giá nhận được ({reviews.length})</Title>
      {reviews.length === 0 ? (
        <Empty description="Chưa có đánh giá nào." style={{ padding: '24px 0' }} />
      ) : (
        <Row gutter={[16, 16]}>
          {reviews.map(review => (
            <Col xs={24} md={12} key={review._id}>
              <Card styles={{ body: { padding: 18 } }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                  <span><Text strong>{review.reviewerId?.name || 'Ẩn danh'}</Text> <Text type="secondary" style={{ fontSize: 13 }}>· {review.toyId?.name}</Text></span>
                  <Rate disabled value={review.rating} style={{ fontSize: 13, color: MANGO }} />
                </Flex>
                <Paragraph style={{ margin: 0 }}>{review.comment}</Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
