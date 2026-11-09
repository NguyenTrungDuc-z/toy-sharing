import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  App, Row, Col, Card, Input, Select, Segmented, Button, Tag,
  Pagination, Empty, Spin, Tooltip, Space, Flex, Modal,
} from 'antd';
import {
  HeartOutlined, HeartFilled, FlagOutlined, SafetyCertificateOutlined,
  StarFilled, EnvironmentOutlined,
  AppstoreOutlined, ExperimentOutlined, CarOutlined, RobotOutlined, GiftOutlined,
} from '@ant-design/icons';
import BorrowRequestModal from './BorrowRequestModal';
import ToyReviewsModal from './ToyReviewsModal';
import SafetyModal from './SafetyModal';
import { VIETNAM_REGIONS } from '../constants/vietnamLocations';
import { TOY_CONDITIONS } from '../constants/toyConditions';

const MANGO = '#ffb627';

const conditionTag = Object.fromEntries(
  TOY_CONDITIONS.map(c => [c.value, { text: c.label, color: c.color }])
);

// Placeholder đẹp theo danh mục khi đồ chơi thiếu ảnh / ảnh hỏng
const categoryVisual = {
  'Xếp hình': { icon: <AppstoreOutlined />, bg: 'linear-gradient(135deg,#e0f2f7 0%,#c6e7f0 100%)' },
  'Giáo dục': { icon: <ExperimentOutlined />, bg: 'linear-gradient(135deg,#e8f0fe 0%,#d2e3fc 100%)' },
  'Hành động': { icon: <CarOutlined />, bg: 'linear-gradient(135deg,#fff1e6 0%,#ffe0c2 100%)' },
  'Công nghệ': { icon: <RobotOutlined />, bg: 'linear-gradient(135deg,#eef2f6 0%,#dbe3ea 100%)' },
  _default: { icon: <GiftOutlined />, bg: 'linear-gradient(135deg,#fdf0e3 0%,#fbe3c9 100%)' },
};

function ToyCover({ toy }) {
  const [broken, setBroken] = React.useState(false);
  const src = toy.images?.[0];
  const vis = categoryVisual[toy.category] || categoryVisual._default;
  if (src && !broken) {
    return <img src={src} alt={toy.name} loading="lazy" onError={() => setBroken(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return (
    <div style={{ width: '100%', height: '100%', background: vis.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <span style={{ fontSize: 48, lineHeight: 1, color: 'rgba(22,38,46,0.35)' }}>{vis.icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(22,38,46,0.45)' }}>{toy.category || 'Đồ chơi'}</span>
    </div>
  );
}

const categories = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Xếp hình', label: 'Xếp hình & Lego' },
  { value: 'Giáo dục', label: 'STEM & Trí tuệ' },
  { value: 'Hành động', label: 'Xe & Vận động' },
  { value: 'Công nghệ', label: 'Robot & Công nghệ' },
  { value: 'Khác', label: 'Mỹ thuật & Sáng tạo' },
];

const locationOptions = [
  { value: 'all', label: 'Toàn quốc' },
  ...VIETNAM_REGIONS.map(group => ({
    label: group.region,
    title: group.region,
    options: group.provinces.map(p => ({ value: p, label: p })),
  })),
];

export default function Home({ user, setPage, viewToyDetail, initialCategory = 'all' }) {
  const { message } = App.useApp();
  const [toys, setToys] = useState([]);
  const [filterAge, setFilterAge] = useState('all');
  const [filterCategory, setFilterCategory] = useState(initialCategory || 'all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [favorites, setFavorites] = useState([]);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [selectedToyForBorrow, setSelectedToyForBorrow] = useState(null);
  const [selectedToyForReviews, setSelectedToyForReviews] = useState(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [reportToy, setReportToy] = useState(null);

  const showToast = (msg, type = 'success') => {
    if (type === 'error') message.error(msg);
    else if (type === 'info') message.info(msg);
    else message.success(msg);
  };

  // Fetch toys
  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { page: currentPage, limit: 12, sort };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (filterLocation.trim() && filterLocation !== 'all') params.location = filterLocation.trim();
    if (filterCategory !== 'all' && filterCategory !== 'Khác') params.category = filterCategory;
    if (filterAge !== 'all') params.ageRange = filterAge;
    if (filterCondition !== 'all') params.condition = filterCondition;

    axios.get('http://localhost:5000/api/toys', { params })
      .then(res => {
        if (!active) return;
        setToys(res.data.toys || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 1 });
      })
      .catch(() => { if (active) setToys([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [currentPage, filterCategory, filterLocation, filterAge, filterCondition, refreshVersion, searchTerm, sort]);

  // Fetch favorites
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/auth/me/favorites', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setFavorites((res.data.favorites || []).map(t => t._id)))
      .catch(() => {});
  }, [user, refreshVersion]);

  const handleBorrowClick = (toy, e) => {
    e?.stopPropagation();
    if (!user) { showToast('Vui lòng đăng nhập để mượn món đồ chơi này!', 'info'); setPage('login'); return; }
    setSelectedToyForBorrow(toy);
  };

  const handleToggleFavorite = async (toy, e) => {
    e?.stopPropagation();
    if (!user) { showToast('Đăng nhập để lưu đồ chơi yêu thích.', 'info'); setPage('login'); return; }
    const token = localStorage.getItem('token');
    const isFav = favorites.includes(toy._id);
    try {
      if (isFav) {
        await axios.delete(`http://localhost:5000/api/toys/${toy._id}/favorite`, { headers: { Authorization: `Bearer ${token}` } });
        setFavorites(cur => cur.filter(id => id !== toy._id));
      } else {
        await axios.post(`http://localhost:5000/api/toys/${toy._id}/favorite`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setFavorites(cur => [...cur, toy._id]);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể cập nhật danh sách yêu thích.', 'error');
    }
  };

  const handleReport = async (toy, e) => {
    e?.stopPropagation();
    if (!user) { showToast('Đăng nhập để báo cáo bài đăng.', 'info'); setPage('login'); return; }
    setReportToy(toy);
  };

  const isOwnToy = (toy) => {
    if (!user || !toy.ownerId) return false;
    const uid = user.id || user._id;
    const oid = typeof toy.ownerId === 'object' ? toy.ownerId._id : toy.ownerId;
    return uid && oid && oid.toString() === uid.toString();
  };

  const onSearch = (val) => { setCurrentPage(1); setSearchTerm(val); };
  const resetFilters = () => {
    setFilterCategory('all'); setFilterAge('all'); setFilterCondition('all');
    setFilterLocation('all'); setSearchInput(''); setSearchTerm(''); setCurrentPage(1);
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '20px clamp(16px,4vw,24px) 56px' }}>
      {/* Trust strip */}
      <Flex align="center" justify="space-between" wrap gap={12}
        style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, padding: '10px 16px', marginBottom: 16 }}>
        <Space size={8} wrap>
          <SafetyCertificateOutlined style={{ color: 'var(--color-primary)', fontSize: 18 }} />
          <span style={{ fontSize: 13, color: 'var(--color-muted-foreground)' }}>
            Đồ chơi khử khuẩn, <b style={{ color: 'var(--color-foreground)' }}>ký quỹ an toàn qua VietQR</b> — hoàn cọc đầy đủ khi trả nguyên vẹn.
          </span>
        </Space>
        <Button type="link" size="small" onClick={() => setIsSafetyModalOpen(true)} style={{ padding: 0 }}>
          Quy trình an toàn
        </Button>
      </Flex>

      {/* Search + location */}
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Input.Search
          size="large"
          allowClear
          placeholder="Tìm đồ chơi cho bé: Lego, robot, xếp hình..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onSearch={onSearch}
          enterButton="Tìm"
          style={{ flex: '1 1 320px' }}
        />
        <Select
          size="large"
          value={filterLocation}
          onChange={v => { setCurrentPage(1); setFilterLocation(v); }}
          options={locationOptions}
          suffixIcon={<EnvironmentOutlined />}
          style={{ width: 200 }}
          showSearch
          optionFilterProp="label"
        />
        <Select
          size="large"
          value={filterAge}
          onChange={v => { setCurrentPage(1); setFilterAge(v); }}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'Mọi lứa tuổi' },
            { value: '0-3 tuổi', label: '0-3 tuổi' },
            { value: '3-6 tuổi', label: '3-6 tuổi' },
            { value: '6-12 tuổi', label: '6-12 tuổi' },
            { value: '12+ tuổi', label: '12+ tuổi' },
          ]}
        />
      </Flex>

      {/* Category segmented */}
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <Segmented
          size="large"
          value={filterCategory}
          onChange={v => { setCurrentPage(1); setFilterCategory(v); }}
          options={categories}
        />
      </div>

      {/* Result count + condition + sort */}
      <Flex align="center" justify="space-between" wrap gap={12}
        style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 14, color: 'var(--color-muted-foreground)' }}>
          <b style={{ color: 'var(--color-foreground)' }}>{pagination.total ?? toys.length}</b> món đồ chơi sẵn sàng cho mượn
        </span>
        <Space size={10} wrap>
          <Select
            value={filterCondition}
            onChange={v => { setCurrentPage(1); setFilterCondition(v); }}
            style={{ width: 170 }}
            options={[
              { value: 'all', label: 'Tình trạng: Tất cả' },
              { value: 'new', label: 'Mới 100%' },
              { value: 'like_new', label: 'Như mới' },
              { value: 'used', label: 'Đã dùng tốt' },
            ]}
          />
          <Select
            value={sort}
            onChange={v => { setCurrentPage(1); setSort(v); }}
            style={{ width: 190 }}
            options={[
              { value: 'newest', label: 'Mới cập nhật' },
              { value: 'rating-desc', label: 'Đánh giá cao nhất' },
              { value: 'deposit-asc', label: 'Tiền cọc: Thấp → cao' },
              { value: 'deposit-desc', label: 'Tiền cọc: Cao → thấp' },
            ]}
          />
        </Space>
      </Flex>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" /></div>
      ) : toys.length === 0 ? (
        <Empty style={{ padding: '60px 0' }} description="Không tìm thấy đồ chơi phù hợp với bộ lọc.">
          <Button type="primary" onClick={resetFilters}>Xóa bộ lọc</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 20]}>
          {toys.map(toy => {
            const isFav = favorites.includes(toy._id);
            const own = isOwnToy(toy);
            const cond = conditionTag[toy.condition] || conditionTag.used;
            const avail = toy.status === 'available';
            return (
              <Col key={toy._id} xs={12} sm={8} md={6} lg={6} xl={4}>
                <Card
                  hoverable
                  styles={{ body: { padding: 14 } }}
                  onClick={() => viewToyDetail?.(toy._id)}
                  cover={
                    <div style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', background: '#f1f4f6' }}>
                      <ToyCover toy={toy} />
                      <Tooltip title={isFav ? 'Bỏ yêu thích' : 'Lưu yêu thích'}>
                        <Button
                          shape="circle"
                          size="small"
                          icon={isFav ? <HeartFilled style={{ color: '#e8294b' }} /> : <HeartOutlined />}
                          onClick={(e) => handleToggleFavorite(toy, e)}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.92)', border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                        />
                      </Tooltip>
                      {!avail && (
                        <Tag color="default" style={{ position: 'absolute', top: 8, left: 8, margin: 0 }}>Đang được mượn</Tag>
                      )}
                    </div>
                  }
                >
                  <Flex gap={6} wrap style={{ marginBottom: 6 }}>
                    <Tag color={cond.color} style={{ margin: 0, fontSize: 11 }}>{cond.text}</Tag>
                    {toy.ageRange && <Tag bordered={false} style={{ margin: 0, fontSize: 11, background: 'var(--color-muted)' }}>{toy.ageRange}</Tag>}
                  </Flex>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {toy.name}
                  </div>
                  <Flex align="center" gap={4} style={{ margin: '6px 0' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedToyForReviews(toy); }}>
                    <StarFilled style={{ color: MANGO, fontSize: 13 }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{toy.rating?.avg > 0 ? toy.rating.avg.toFixed(1) : '5.0'}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>({toy.rating?.count || 0})</span>
                  </Flex>
                  {toy.location && (
                    <div style={{ fontSize: 12, color: 'var(--color-muted-foreground)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <EnvironmentOutlined /> {toy.location}
                    </div>
                  )}
                  <Flex align="baseline" justify="space-between" style={{ marginBottom: 10 }}>
                    <span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-foreground)' }}>{(toy.depositRequired || 0).toLocaleString()}đ</span>
                      <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)' }}> cọc</span>
                    </span>
                  </Flex>
                  {own ? (
                    <Button block disabled>Đồ chơi của bạn</Button>
                  ) : avail ? (
                    <Button block type="primary" onClick={(e) => handleBorrowClick(toy, e)}>Mượn ngay</Button>
                  ) : (
                    <Button block disabled>Không sẵn sàng</Button>
                  )}
                  <Button block type="text" size="small" icon={<FlagOutlined />} onClick={(e) => handleReport(toy, e)}
                    style={{ marginTop: 4, color: 'var(--color-muted-foreground)', fontSize: 12 }}>
                    Báo cáo
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Flex justify="center" style={{ marginTop: 32 }}>
          <Pagination
            current={currentPage}
            total={pagination.total || 0}
            pageSize={12}
            showSizeChanger={false}
            onChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </Flex>
      )}

      {/* Modals */}
      <BorrowRequestModal
        isOpen={!!selectedToyForBorrow}
        onClose={() => setSelectedToyForBorrow(null)}
        toy={selectedToyForBorrow}
        user={user}
        onBorrowSuccess={() => setRefreshVersion(v => v + 1)}
        showToast={showToast}
      />
      <ToyReviewsModal
        isOpen={!!selectedToyForReviews}
        onClose={() => setSelectedToyForReviews(null)}
        toy={selectedToyForReviews}
      />
      <SafetyModal isOpen={isSafetyModalOpen} onClose={() => setIsSafetyModalOpen(false)} />
      <ReportToyModal toy={reportToy} onClose={() => setReportToy(null)} showToast={showToast} />
    </div>
  );
}

// Modal báo cáo đồ chơi (giữ logic gọi API /report)
function ReportToyModal({ toy, onClose, showToast }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (toy) { setReason(''); setDetails(''); } }, [toy]);

  const submit = async () => {
    if (!reason) { showToast('Vui lòng chọn lý do báo cáo.', 'error'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/toys/${toy._id}/report`,
        { reason, details }, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Đã gửi báo cáo tới quản trị viên. Cảm ơn bạn!', 'success');
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể gửi báo cáo.', 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal open={!!toy} onCancel={onClose} onOk={submit} confirmLoading={submitting}
      title={`Báo cáo: ${toy?.name || ''}`} okText="Gửi báo cáo" cancelText="Hủy" okButtonProps={{ danger: true }}>
      <div style={{ marginBottom: 12 }}>
        <Select value={reason || undefined} onChange={setReason} style={{ width: '100%' }} placeholder="Chọn lý do"
          options={[
            { value: 'Nội dung không phù hợp', label: 'Nội dung không phù hợp' },
            { value: 'Hình ảnh sai sự thật', label: 'Hình ảnh sai sự thật' },
            { value: 'Đồ chơi không an toàn', label: 'Đồ chơi không an toàn' },
            { value: 'Nghi ngờ lừa đảo', label: 'Nghi ngờ lừa đảo' },
            { value: 'Khác', label: 'Khác' },
          ]} />
      </div>
      <Input.TextArea rows={3} value={details} onChange={e => setDetails(e.target.value)}
        placeholder="Mô tả chi tiết (tuỳ chọn)..." maxLength={500} />
    </Modal>
  );
}
