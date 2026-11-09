import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  App, Row, Col, Image, Tag, Rate, Card, Button, Avatar, Typography, Breadcrumb,
  Divider, Empty, Spin, Flex, Alert, Tooltip,
} from 'antd';
import {
  UserOutlined, EnvironmentOutlined, SafetyCertificateOutlined, HomeOutlined, GiftOutlined,
} from '@ant-design/icons';
import { TOY_CONDITIONS } from '../constants/toyConditions';
import BorrowRequestModal from './BorrowRequestModal';

const conditionMeta = Object.fromEntries(
  TOY_CONDITIONS.map(c => [c.value, { label: c.label, color: c.color, rubric: c.rubric }])
);
const MANGO = '#ffb627';

export default function ToyDetail({ toyId, user, setPage, viewOwner, viewToyDetail, viewCategory }) {
  const { message } = App.useApp();
  const [toy, setToy] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avg: 0, count: 0 });
  const [relatedToys, setRelatedToys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBorrow, setShowBorrow] = useState(false);

  const showToast = (msg, type = 'success') => {
    if (type === 'error') message.error(msg);
    else if (type === 'info') message.info(msg);
    else message.success(msg);
  };

  useEffect(() => {
    if (!toyId) return;
    let active = true;
    setLoading(true);
    axios.get(`/api/toys/${toyId}`)
      .then(res => { if (active) { setToy(res.data); setError(''); } })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Không tìm thấy đồ chơi.'); })
      .finally(() => { if (active) setLoading(false); });
    axios.get(`/api/reviews/toy/${toyId}`)
      .then(res => { if (active && res.data.success) { setReviews(res.data.reviews || []); setReviewStats(res.data.stats || { avg: 0, count: 0 }); } })
      .catch(() => {});
    axios.get(`/api/toys/${toyId}/related`)
      .then(res => { if (active && res.data.success) setRelatedToys(res.data.related || []); })
      .catch(() => {});
    return () => { active = false; };
  }, [toyId]);

  const handleBorrowClick = () => {
    if (!user) { showToast('Vui lòng đăng nhập để mượn đồ chơi!', 'info'); setPage?.('login'); return; }
    setShowBorrow(true);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
  if (error) return (
    <Flex vertical align="center" gap={16} style={{ padding: '80px 20px' }}>
      <Typography.Text type="danger">{error}</Typography.Text>
      <Button type="primary" onClick={() => setPage?.('home')}>Quay lại trang chủ</Button>
    </Flex>
  );
  if (!toy) return null;

  const owner = toy.ownerId || {};
  const isOwnToy = user && (owner._id === user._id || owner._id === user.id);
  const images = toy.images?.length > 0 ? toy.images : [];
  const canBorrow = !isOwnToy && toy.status === 'available';
  const cond = conditionMeta[toy.condition] || { label: 'Tốt', color: 'default' };
  const rating = reviewStats.count > 0 ? reviewStats.avg : (toy.rating?.avg || 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px clamp(16px,4vw,24px) 72px' }}>
      <Breadcrumb style={{ marginBottom: 20 }} items={[
        { title: <a onClick={() => setPage?.('home')}><HomeOutlined /> Trang chủ</a> },
        { title: viewCategory ? <a onClick={() => viewCategory(toy.category)}>{toy.category}</a> : toy.category },
        { title: toy.name },
      ]} />

      <Row gutter={[40, 32]} align="top">
        {/* Ảnh */}
        <Col xs={24} md={13}>
          <Image.PreviewGroup>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)', background: '#f1f4f6', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {images.length > 0
                ? <Image src={images[0]} alt={toy.name} width="100%" height="100%" style={{ objectFit: 'cover' }} />
                : <GiftOutlined style={{ fontSize: 72, color: 'rgba(22,38,46,0.25)' }} />}
            </div>
            {images.length > 1 && (
              <Flex gap={10} wrap style={{ marginTop: 12 }}>
                {images.slice(1).map((img, i) => (
                  <div key={i} style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <Image src={img} alt={`${toy.name} ${i + 2}`} width={80} height={80} style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </Flex>
            )}
          </Image.PreviewGroup>

          <Alert style={{ marginTop: 20 }} type="success" showIcon icon={<SafetyCertificateOutlined />}
            message="Cam kết an toàn ToyShare"
            description="Đồ chơi được chủ cam kết vệ sinh sạch sẽ, đầy đủ linh kiện. Tiền cọc ký quỹ qua VietQR và được hoàn 100% khi trả đồ nguyên vẹn." />
        </Col>

        {/* Thông tin */}
        <Col xs={24} md={11}>
          <Flex gap={8} wrap style={{ marginBottom: 12 }}>
            <Tag color="blue">{toy.ageRange}</Tag>
            <Tag>{toy.category}</Tag>
            <Tooltip title={cond.rubric}><Tag color={cond.color} style={{ cursor: 'help' }}>Tình trạng: {cond.label}</Tag></Tooltip>
            <Tag color={toy.status === 'available' ? 'green' : 'default'}>
              {toy.status === 'available' ? 'Đang sẵn sàng' : 'Đang được mượn'}
            </Tag>
          </Flex>

          <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 10 }}>{toy.name}</Typography.Title>

          <Flex align="center" gap={8} style={{ marginBottom: 20 }}>
            <Rate disabled allowHalf value={rating || 5} style={{ fontSize: 15, color: MANGO }} />
            <Typography.Text strong>{rating > 0 ? rating.toFixed(1) : '5.0'}</Typography.Text>
            <Typography.Text type="secondary">({reviewStats.count || toy.rating?.count || 0} nhận xét)</Typography.Text>
          </Flex>

          <Card style={{ marginBottom: 24, background: '#f0f7fa', border: '1px solid var(--color-primary-border)' }} styles={{ body: { padding: 20 } }}>
            <Typography.Text type="secondary">Tiền cọc bảo chứng</Typography.Text>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.2 }}>
              {(toy.depositRequired || 0).toLocaleString()}đ
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>Mượn miễn phí — hoàn cọc 100% khi trả đồ nguyên vẹn.</Typography.Text>
          </Card>

          <Typography.Title level={5}>Mô tả</Typography.Title>
          <Typography.Paragraph style={{ color: '#52473f', whiteSpace: 'pre-line' }}>
            {toy.description || 'Chủ sở hữu chưa cập nhật mô tả chi tiết.'}
          </Typography.Paragraph>

          {/* Chủ sở hữu */}
          <Card style={{ marginBottom: 24 }} styles={{ body: { padding: 16 } }}>
            <Flex align="center" justify="space-between" wrap gap={12}>
              <Flex align="center" gap={12}>
                <Avatar size={48} src={owner.avatar || undefined} icon={<UserOutlined />} />
                <div>
                  <Typography.Text strong>{owner.name || 'Thành viên ToyShare'}</Typography.Text>
                  {owner.rating?.count > 0 && (
                    <div style={{ fontSize: 13, color: '#8a776a' }}>★ {owner.rating.avg.toFixed(1)} uy tín · {owner.rating.count} đánh giá</div>
                  )}
                </div>
              </Flex>
              {viewOwner && owner._id && (
                <Button onClick={() => viewOwner(owner._id)}>Xem trang cá nhân</Button>
              )}
            </Flex>
          </Card>

          {canBorrow ? (
            <Button type="primary" size="large" block onClick={handleBorrowClick}>Gửi yêu cầu mượn</Button>
          ) : isOwnToy ? (
            <Alert type="info" showIcon message="Bạn là chủ sở hữu của món đồ chơi này." />
          ) : (
            <Alert type="warning" showIcon message="Đồ chơi đang được mượn. Bấm yêu thích để nhận thông báo khi sẵn sàng." />
          )}
        </Col>
      </Row>

      <Divider />

      {/* Nhận xét */}
      <Typography.Title level={4}>Nhận xét & đánh giá ({reviews.length})</Typography.Title>
      {reviews.length === 0 ? (
        <Empty description="Chưa có đánh giá nào cho món đồ chơi này." style={{ padding: '32px 0' }} />
      ) : (
        <Row gutter={[16, 16]}>
          {reviews.map(rev => (
            <Col xs={24} md={12} key={rev._id}>
              <Card styles={{ body: { padding: 18 } }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                  <Typography.Text strong>{rev.reviewerId?.name || 'Phụ huynh'}</Typography.Text>
                  <Rate disabled value={rev.rating} style={{ fontSize: 13, color: MANGO }} />
                </Flex>
                <Typography.Paragraph style={{ margin: 0, color: '#52473f' }}>{rev.comment}</Typography.Paragraph>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                </Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Liên quan */}
      {relatedToys.length > 0 && (
        <>
          <Divider />
          <Typography.Title level={4}>Đồ chơi tương tự</Typography.Title>
          <Row gutter={[16, 20]}>
            {relatedToys.map(rel => (
              <Col key={rel._id} xs={12} sm={8} md={6} lg={6} xl={4}>
                <Card hoverable styles={{ body: { padding: 14 } }}
                  onClick={() => { viewToyDetail?.(rel._id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  cover={
                    <div style={{ aspectRatio: '1/1', background: '#f1f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {rel.images?.[0] ? <img src={rel.images[0]} alt={rel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <GiftOutlined style={{ fontSize: 40, color: 'rgba(22,38,46,0.25)' }} />}
                    </div>
                  }>
                  <div style={{ fontWeight: 600, fontSize: 14, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rel.name}</div>
                  <Flex align="center" gap={4} style={{ margin: '6px 0' }}>
                    <span style={{ color: MANGO }}>★</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{rel.rating?.avg > 0 ? rel.rating.avg.toFixed(1) : '5.0'}</span>
                  </Flex>
                  <strong style={{ color: 'var(--color-foreground)' }}>{(rel.depositRequired || 0).toLocaleString()}đ</strong>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {showBorrow && (
        <BorrowRequestModal
          isOpen={showBorrow}
          onClose={() => setShowBorrow(false)}
          toy={toy}
          user={user}
          onBorrowSuccess={() => { showToast('Đã gửi yêu cầu mượn thành công!', 'success'); setPage?.('requests'); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
