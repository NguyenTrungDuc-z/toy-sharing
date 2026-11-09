import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, List, Rate, Avatar, Typography, Flex, Empty, Spin, Statistic } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;
const MANGO = '#ffb627';

export default function ToyReviewsModal({ isOpen, onClose, toy }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !toy?._id) return;
    let active = true;
    setLoading(true);
    axios.get(`/api/reviews/toy/${toy._id}`)
      .then(res => { if (active && res.data.success) { setReviews(res.data.reviews || []); setStats(res.data.stats || { avg: 0, count: 0 }); } })
      .catch(() => { if (active) setReviews([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, toy]);

  if (!toy) return null;

  return (
    <Modal open={isOpen} onCancel={onClose} onOk={onClose} okText="Đóng" cancelButtonProps={{ style: { display: 'none' } }}
      width={560} title={`Đánh giá: ${toy.name}`}>
      <Flex align="center" gap={20} style={{ background: '#fff8ec', border: '1px solid #ffe9bf', borderRadius: 12, padding: '14px 20px', marginBottom: 16 }}>
        <Statistic value={stats.avg > 0 ? stats.avg.toFixed(1) : '5.0'} prefix={<span style={{ color: MANGO }}>★</span>} valueStyle={{ fontWeight: 800, color: '#b45309' }} />
        <div>
          <Text strong>{stats.count > 0 ? `${stats.count} lượt đánh giá` : 'Chưa có đánh giá'}</Text>
          <div><Text type="secondary" style={{ fontSize: 12 }}>Từ phụ huynh đã mượn và trả đồ chơi này</Text></div>
        </div>
      </Flex>

      <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin /></div>
        ) : reviews.length === 0 ? (
          <Empty description="Chưa có nhận xét nào. Hãy là người đầu tiên!" style={{ padding: '24px 0' }} />
        ) : (
          <List
            dataSource={reviews}
            renderItem={(rev) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={rev.reviewerId?.avatar || undefined} icon={<UserOutlined />}>{rev.reviewerId?.name?.charAt(0)}</Avatar>}
                  title={
                    <Flex justify="space-between" align="center">
                      <span>{rev.reviewerId?.name || 'Phụ huynh'}</span>
                      <Rate disabled value={rev.rating} style={{ fontSize: 13, color: MANGO }} />
                    </Flex>
                  }
                  description={
                    <>
                      <div style={{ color: '#4a382c', whiteSpace: 'pre-wrap' }}>{rev.comment}</div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
}
