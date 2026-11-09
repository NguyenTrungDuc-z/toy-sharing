import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { App, Row, Col, Card, Segmented, Select, Button, Tag, Statistic, Modal, Descriptions, Empty, Spin, Flex, Typography } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import AdminLayout from './AdminLayout';

const { Text } = Typography;

const tabLabel = { pending: 'Chờ duyệt', approved: 'Sẵn sàng', borrowed: 'Đang cho mượn', rejected: 'Bị từ chối' };
const tabColor = { pending: 'gold', approved: 'green', borrowed: 'blue', rejected: 'red' };
const condLabel = { new: 'Mới', like_new: 'Như mới', used: 'Đã dùng' };

export default function ToyModeration({ setPage }) {
  const { message } = App.useApp();
  const [toys, setToys] = useState([]);
  const [statusTab, setStatusTab] = useState('pending');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, reports: 0 });
  const [selectedToy, setSelectedToy] = useState(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchToys = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/auth/admin/toys', {
        params: { status: statusTab, category: categoryFilter }, headers: authHeaders() });
      if (res.data.success) { setToys(res.data.toys || []); if (res.data.stats) setStats(res.data.stats); }
      else setToys([]);
    } catch { setToys([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchToys(); }, [statusTab, categoryFilter]);

  const handleAction = async (id, action) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/auth/admin/toys/${id}/status`, { status: action }, { headers: authHeaders() });
      if (res.data.success) { message.success(action === 'approved' ? 'Đã phê duyệt bài đăng!' : 'Đã từ chối bài đăng!'); fetchToys(); }
    } catch (err) { message.error(err.response?.data?.message || 'Không thể cập nhật trạng thái bài đăng!'); }
  };

  const extra = (
    <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 180 }}
      options={[{ value: 'all', label: 'Tất cả danh mục' }, ...['Giáo dục', 'Hành động', 'Xếp hình', 'Công nghệ'].map(c => ({ value: c, label: c }))]} />
  );

  return (
    <AdminLayout active="toy-moderation" setPage={setPage} title="Kiểm soát bài đăng" extra={extra}>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}><Card styles={{ body: { padding: 18 } }}><Statistic title="Bài đăng chờ duyệt" value={stats.pending || 0} suffix="bài" valueStyle={{ color: '#d97706', fontWeight: 700 }} /></Card></Col>
        <Col xs={24} sm={8}><Card styles={{ body: { padding: 18 } }}><Statistic title="Đã duyệt / sẵn sàng" value={stats.approvedToday || 0} suffix="bài" valueStyle={{ color: '#15803d', fontWeight: 700 }} /></Card></Col>
        <Col xs={24} sm={8}><Card styles={{ body: { padding: 18 } }}><Statistic title="Báo cáo vi phạm" value={stats.reports || 0} suffix="báo cáo" valueStyle={{ color: '#dc2626', fontWeight: 700 }} /></Card></Col>
      </Row>

      <Segmented value={statusTab} onChange={setStatusTab} style={{ marginBottom: 20 }}
        options={Object.entries(tabLabel).map(([v, l]) => ({ value: v, label: l }))} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
      ) : toys.length === 0 ? (
        <Empty description="Không có bài đăng nào ở bộ lọc này." style={{ padding: '40px 0' }} />
      ) : (
        <Row gutter={[16, 20]}>
          {toys.map(toy => {
            const img = toy.images?.[0];
            const ownerName = typeof toy.ownerId === 'object' ? (toy.ownerId?.name || 'Thành viên') : (toy.ownerId || 'Ẩn danh');
            return (
              <Col key={toy._id} xs={12} sm={8} md={6} lg={6} xl={6}>
                <Card hoverable styles={{ body: { padding: 14 } }}
                  cover={
                    <div style={{ position: 'relative', aspectRatio: '4/3', background: '#f1f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {img ? <img src={img} alt={toy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <GiftOutlined style={{ fontSize: 44, color: 'rgba(22,38,46,0.25)' }} />}
                      <Tag color={tabColor[statusTab]} style={{ position: 'absolute', top: 8, left: 8, margin: 0 }}>{tabLabel[statusTab]}</Tag>
                    </div>
                  }
                  actions={statusTab === 'pending' ? [
                    <Button key="ap" type="link" style={{ color: '#16a34a' }} onClick={() => handleAction(toy._id, 'approved')}>Phê duyệt</Button>,
                    <Button key="rj" type="link" danger onClick={() => handleAction(toy._id, 'rejected')}>Từ chối</Button>,
                  ] : undefined}>
                  <Flex justify="space-between" align="start" gap={8}>
                    <Text strong style={{ fontSize: 15 }}>{toy.name}</Text>
                    <Tag color="blue" style={{ margin: 0 }}>{toy.category}</Tag>
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', margin: '4px 0 10px' }}>Đăng bởi: {ownerName}</Text>
                  <Button block size="small" onClick={() => setSelectedToy(toy)}>Xem chi tiết</Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal open={!!selectedToy} onCancel={() => setSelectedToy(null)} onOk={() => setSelectedToy(null)}
        okText="Đóng" cancelButtonProps={{ style: { display: 'none' } }} title="Chi tiết sản phẩm" width={640}>
        {selectedToy && (
          <>
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/9', background: '#f1f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedToy.images?.[0] ? <img src={selectedToy.images[0]} alt={selectedToy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <GiftOutlined style={{ fontSize: 56, color: 'rgba(22,38,46,0.25)' }} />}
            </div>
            <Typography.Title level={4} style={{ marginTop: 0 }}>{selectedToy.name}</Typography.Title>
            <Flex gap={8} style={{ marginBottom: 16 }}>
              <Tag color="blue">{selectedToy.category}</Tag>
              <Tag color="gold">{selectedToy.ageRange}</Tag>
            </Flex>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}
              items={[
                { key: 'c', label: 'Tình trạng', children: condLabel[selectedToy.condition] || selectedToy.condition },
                { key: 'd', label: 'Tiền cọc', children: `${(selectedToy.depositRequired || 0).toLocaleString()}đ` },
                { key: 'o', label: 'Đăng bởi', children: typeof selectedToy.ownerId === 'object' ? (selectedToy.ownerId?.name || 'Thành viên') : (selectedToy.ownerId || 'Ẩn danh'), span: 2 },
              ]} />
            <Text strong>Mô tả</Text>
            <Typography.Paragraph style={{ color: '#5c4e47' }}>{selectedToy.description || 'Không có mô tả'}</Typography.Paragraph>
          </>
        )}
      </Modal>
    </AdminLayout>
  );
}
