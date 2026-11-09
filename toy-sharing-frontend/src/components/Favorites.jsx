import { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Card, Button, Typography, Empty, Spin, Flex, Alert } from 'antd';
import { HeartFilled, GiftOutlined } from '@ant-design/icons';

const API_URL = ''; // axios đã có baseURL; giữ biến để tương thích các lời gọi `${API_URL}/api/...`
const { Title, Text } = Typography;

export default function Favorites({ setPage, viewToyDetail }) {
  const [toys, setToys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/auth/me/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (active) setToys(res.data.favorites || []); })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Không thể tải danh sách yêu thích.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const removeFavorite = async (toyId, e) => {
    e?.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/toys/${toyId}/favorite`, { headers: { Authorization: `Bearer ${token}` } });
      setToys(cur => cur.filter(t => t._id !== toyId));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa đồ chơi khỏi danh sách.');
    }
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px clamp(16px,4vw,24px) 56px' }}>
      <Flex justify="space-between" align="center" wrap gap={16} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Đồ chơi yêu thích</Title>
        <Button onClick={() => setPage('home')}>Quay lại khám phá</Button>
      </Flex>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" /></div>
      ) : toys.length === 0 ? (
        <Empty description="Bạn chưa lưu đồ chơi nào." style={{ padding: '60px 0' }}>
          <Button type="primary" onClick={() => setPage('home')}>Khám phá đồ chơi</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 20]}>
          {toys.map(toy => (
            <Col key={toy._id} xs={12} sm={8} md={6} lg={6} xl={4}>
              <Card hoverable styles={{ body: { padding: 14 } }} onClick={() => viewToyDetail?.(toy._id)}
                cover={
                  <div style={{ aspectRatio: '1 / 1', background: '#f1f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {toy.images?.[0]
                      ? <img src={toy.images[0]} alt={toy.name} onError={e => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <GiftOutlined style={{ fontSize: 44, color: 'rgba(22,38,46,0.25)' }} />}
                  </div>
                }>
                <div style={{ fontWeight: 600, fontSize: 14, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{toy.name}</div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', margin: '4px 0 10px' }}>
                  {toy.category || 'Đồ chơi'} · {toy.ownerId?.name || 'Thành viên'}
                </Text>
                <Flex justify="space-between" align="center">
                  <span style={{ fontWeight: 800, color: 'var(--color-foreground)' }}>{(toy.depositRequired || 0).toLocaleString()}đ</span>
                  <Button danger size="small" icon={<HeartFilled />} onClick={(e) => removeFavorite(toy._id, e)}>Bỏ lưu</Button>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
