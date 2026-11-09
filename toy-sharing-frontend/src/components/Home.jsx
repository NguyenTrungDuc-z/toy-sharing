import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BorrowRequestModal from './BorrowRequestModal';
import ToyReviewsModal from './ToyReviewsModal';
import CommercialFooter from './CommercialFooter';
import SafetyModal from './SafetyModal';
import FloatingSupport from './FloatingSupport';
import { VIETNAM_REGIONS } from '../constants/vietnamLocations';

export default function Home({ user, setPage, viewToyDetail }) {
  const [toys, setToys] = useState([]);
  const [filterAge, setFilterAge] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterDepositRange, setFilterDepositRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [favorites, setFavorites] = useState([]);
  const [reportToy, setReportToy] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Modals & widgets
  const [selectedToyForBorrow, setSelectedToyForBorrow] = useState(null);
  const [selectedToyForReviews, setSelectedToyForReviews] = useState(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Copy voucher
  const handleCopyVoucher = (code = 'TOYSHARENEW') => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedCoupon(true);
      showToast(`Đã sao chép mã ưu đãi "${code}"! Giảm ngay 20.000đ khi đặt cọc.`);
      setTimeout(() => setCopiedCoupon(false), 3000);
    }).catch(() => {
      showToast(`Mã ưu đãi của bạn: ${code}`, 'info');
    });
  };

  // Fetch toys with dynamic backend query
  useEffect(() => {
    let active = true;
    const params = { page: currentPage, limit: 12, sort };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (filterLocation.trim() && filterLocation !== 'all') params.location = filterLocation.trim();
    if (filterCategory !== 'all' && filterCategory !== 'Khác') params.category = filterCategory;
    if (filterAge !== 'all') params.ageRange = filterAge;
    if (filterCondition !== 'all') params.condition = filterCondition;

    if (filterDepositRange === 'under100') {
      params.maxDeposit = 99999;
    } else if (filterDepositRange === '100to200') {
      params.minDeposit = 100000;
      params.maxDeposit = 200000;
    } else if (filterDepositRange === 'over200') {
      params.minDeposit = 200001;
    }

    axios.get('http://localhost:5000/api/toys', { params })
      .then(res => {
        if (!active) return;
        setToys(res.data.toys || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 1 });
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu đồ chơi:", err);
        if (active) setToys([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [currentPage, filterCategory, filterLocation, filterAge, filterCondition, filterDepositRange, refreshVersion, searchTerm, sort]);

  // Fetch user favorites
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/auth/me/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setFavorites((res.data.favorites || []).map(toy => toy._id)))
      .catch(err => console.error('Lỗi lấy danh sách yêu thích:', err));
  }, [user]);

  const handleBorrowClick = (toy) => {
    if (!user) {
      showToast("Vui lòng đăng nhập để gửi yêu cầu mượn đồ chơi này!", "info");
      setPage('login');
      return;
    }
    setSelectedToyForBorrow(toy);
  };

  const handleBorrowSuccess = () => {
    setRefreshVersion(version => version + 1);
  };

  const handleToggleFavorite = async (toy) => {
    if (!user) {
      showToast('Đăng nhập để lưu đồ chơi yêu thích.', 'info');
      setPage('login');
      return;
    }

    const token = localStorage.getItem('token');
    const isFavorite = favorites.includes(toy._id);
    try {
      if (isFavorite) {
        await axios.delete(`http://localhost:5000/api/toys/${toy._id}/favorite`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(current => current.filter(id => id !== toy._id));
        showToast('Đã xóa khỏi danh sách yêu thích.');
      } else {
        await axios.post(`http://localhost:5000/api/toys/${toy._id}/favorite`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(current => [...current, toy._id]);
        showToast('Đã lưu vào danh sách yêu thích.');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể cập nhật danh sách yêu thích.', 'error');
    }
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!reportToy || !reportReason) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/toys/${reportToy._id}/report`,
        { reason: reportReason, details: reportDetails },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showToast(response.data.message || 'Đã gửi báo cáo kiểm duyệt.');
      setReportToy(null);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể gửi báo cáo.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isOwnToy = (toy) => {
    if (!user || !toy.ownerId) return false;
    const userId = user.id || user._id;
    const toyOwnerId = typeof toy.ownerId === 'object' ? toy.ownerId._id : toy.ownerId;
    return userId && toyOwnerId && toyOwnerId.toString() === userId.toString();
  };

  // Client-side fallback filtering
  const filteredToys = toys.filter(toy => {
    const matchName = !searchTerm || (toy.name && toy.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchAge = filterAge === 'all' || (toy.ageRange && toy.ageRange.toLowerCase().includes(filterAge.toLowerCase().replace(' tuổi', '')));
    let matchCategory = true;
    if (filterCategory !== 'all') {
      if (filterCategory === 'Khác') {
        const defaultCategories = ['giáo dục', 'hành động', 'xếp hình', 'công nghệ'];
        matchCategory = toy.category && !defaultCategories.includes(toy.category.toLowerCase());
      } else {
        matchCategory = toy.category && toy.category.toLowerCase() === filterCategory.toLowerCase();
      }
    }
    const matchLocation = !filterLocation || filterLocation === 'all' || (toy.location && toy.location.toLowerCase().includes(filterLocation.toLowerCase()));
    const matchCondition = filterCondition === 'all' || toy.condition === filterCondition || (filterCondition === 'new' && (toy.condition === 'new' || toy.condition?.includes('Mới'))) || (filterCondition === 'like_new' && (toy.condition === 'like_new' || toy.condition?.includes('Như')));
    let matchDeposit = true;
    const dep = Number(toy.depositRequired) || 0;
    if (filterDepositRange === 'under100') matchDeposit = dep < 100000;
    else if (filterDepositRange === '100to200') matchDeposit = dep >= 100000 && dep <= 200000;
    else if (filterDepositRange === 'over200') matchDeposit = dep > 200000;

    return matchName && matchAge && matchCategory && matchLocation && matchCondition && matchDeposit;
  });

  const hasActiveFilters = searchTerm !== '' || filterLocation !== 'all' || filterCategory !== 'all' || filterAge !== 'all' || filterCondition !== 'all' || filterDepositRange !== 'all' || sort !== 'newest';

  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterLocation('all');
    setFilterCategory('all');
    setFilterAge('all');
    setFilterCondition('all');
    setFilterDepositRange('all');
    setSort('newest');
    setCurrentPage(1);
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFaq = () => {
    const el = document.getElementById('faq-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const categoriesShowcase = [
    { key: 'Xếp hình', icon: '🧩', title: 'Xếp hình & Trí tuệ', desc: 'Lego, tangram gỗ, domino kích thích tư duy logic' },
    { key: 'Giáo dục', icon: '🔬', title: 'Giáo dục & STEM', desc: 'Kính hiển vi, mạch điện, mô hình vũ trụ, toán học' },
    { key: 'Hành động', icon: '🏎️', title: 'Hành động & Xe cộ', desc: 'Đường ray tàu hỏa, xe trớn, siêu anh hùng khám phá' },
    { key: 'Công nghệ', icon: '🤖', title: 'Công nghệ & Âm nhạc', desc: 'Máy đọc truyện tiếng Anh, đàn piano mini, robot' },
    { key: 'all', icon: '🧸', title: 'Sơ sinh & Vận động', desc: 'Vịt dây cót, vòng xếp chồng rèn luyện xúc giác' },
    { key: 'Khác', icon: '🎨', title: 'Sáng tạo & Nhập vai', desc: 'Bộ làm bếp, bác sĩ, tranh ghép, đất nặn hữu cơ' }
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px' }}>

      {/* 1. TOP ANNOUNCEMENT / PROMO RIBBON */}
      <div style={{
        marginTop: '16px',
        marginBottom: '24px',
        padding: '12px 20px',
        background: 'linear-gradient(90deg, #be6e15 0%, #e07a16 50%, #be6e15 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 15px rgba(190, 110, 21, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500' }}>
          <span style={{ fontSize: '18px' }}>🎁</span>
          <span>
            Khuyến mãi chào đón ba mẹ mới: Nhập mã <strong style={{ textDecoration: 'underline', letterSpacing: '0.5px' }}>TOYSHARENEW</strong> giảm ngay <strong>20.000đ</strong> tiền cọc!
          </span>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
            🛡️ 100% Khử trùng UV-C
          </span>
        </div>
        <button
          onClick={() => handleCopyVoucher('TOYSHARENEW')}
          style={{
            background: '#ffffff',
            color: '#be6e15',
            border: 'none',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {copiedCoupon ? '✓ Đã chép mã!' : '📋 Sao chép mã'}
        </button>
      </div>

      {/* 2. HERO SECTION */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '30px 0 40px 0',
        gap: '50px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 500px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: '#fef3c7',
            color: '#b45309',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            marginBottom: '18px'
          }}>
            <span>✨ Nền tảng chia sẻ đồ chơi số 1 Việt Nam</span>
          </div>
          <h1 style={{ fontSize: '46px', fontWeight: '800', marginBottom: '18px', lineHeight: '1.2', color: 'var(--text-main)' }}>
            Chia sẻ đồ chơi,<br />
            <span style={{ color: 'var(--primary-color)' }}>Nhân đôi niềm vui</span> cho bé yêu
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '16px', lineHeight: '1.7' }}>
            Hàng ngàn gia đình văn minh kết nối và trao đổi đồ chơi giáo dục chính hãng. Tiết kiệm tới 80% chi phí, nhà cửa luôn gọn gàng và trẻ được kích hoạt trí thông minh đa chiều với đồ chơi khử trùng UV-C an toàn tuyệt đối.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={scrollToCatalog} style={{ padding: '14px 28px', fontSize: '15px' }}>
              🚀 Khám phá đồ chơi ngay
            </button>
            <button
              className="btn-secondary"
              onClick={() => setPage && setPage('my-toys')}
              style={{ padding: '14px 26px', fontSize: '15px', background: '#fff', border: '1px solid #ebdcd0', color: '#be6e15' }}
            >
              🧸 Đăng đồ chơi của con
            </button>
            <button
              onClick={() => setIsSafetyModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              🛡️ Cam kết khử trùng 4 lớp
            </button>
          </div>
        </div>

        {/* Visual Hero Image & Trust Card */}
        <div style={{
          flex: '1 1 420px',
          height: '380px',
          position: 'relative',
          borderRadius: '32px',
          backgroundImage: "url('/images/banner.png')",
          backgroundColor: '#faede1',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 20px 40px rgba(190, 110, 21, 0.12)'
        }}>
          {/* Top-Right Badge: UV Sanitized */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '10px 16px',
            borderRadius: '20px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '700',
            color: '#059669'
          }}>
            <span style={{ fontSize: '18px' }}>🛡️</span> Khử khuẩn UV-C 100%
          </div>

          {/* Bottom-Left Floating Stats Card */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '14px 20px',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              ⭐
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>4.9 / 5.0 Điểm hài lòng</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Từ hơn 3.500+ ba mẹ toàn quốc</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HERO TRUST METRICS BAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '48px',
        padding: '24px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 8px 28px rgba(190, 110, 21, 0.06)',
        border: '1px solid #f9eee5'
      }}>
        {[
          { icon: '🧸', title: '500+ Món đồ chơi', sub: 'Chính hãng LEGO, Hape, Fisher-Price' },
          { icon: '🛡️', title: '100% Khử trùng UV-C', sub: 'Quy trình 4 cấp độ chuẩn y tế' },
          { icon: '⚡', title: 'Hoàn cọc tức thì', sub: 'Bảo chứng tài khoản VietQR Escrow' },
          { icon: '💰', title: 'Tiết kiệm ~6.5tr/năm', sub: 'Giảm 80% lãng phí mua đồ chơi mới' }
        ].map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: '#fff7ef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. FEATURED CATEGORIES SHOWCASE CARDS */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px' }}>
          <div>
            <div style={{ color: '#be6e15', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Danh mục tuyển chọn
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              Khám phá đồ chơi theo sở thích của bé
            </h2>
          </div>
          <button
            onClick={() => { setFilterCategory('all'); scrollToCatalog(); }}
            style={{ background: 'none', border: 'none', color: '#be6e15', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            Xem tất cả đồ chơi →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {categoriesShowcase.map((cat) => {
            const isSelected = filterCategory === cat.key;
            return (
              <div
                key={cat.title}
                onClick={() => {
                  setCurrentPage(1);
                  setFilterCategory(cat.key);
                  scrollToCatalog();
                }}
                style={{
                  background: isSelected ? '#fff4ea' : '#ffffff',
                  border: isSelected ? '2px solid #be6e15' : '1px solid #f5ede6',
                  borderRadius: '20px',
                  padding: '20px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  textAlign: 'center',
                  boxShadow: isSelected ? '0 8px 20px rgba(190, 110, 21, 0.12)' : '0 4px 12px rgba(0,0,0,0.02)'
                }}
                onMouseOver={e => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#e7c6aa';
                  }
                }}
                onMouseOut={e => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#f5ede6';
                  }
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>{cat.icon}</div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: isSelected ? '#be6e15' : 'var(--text-main)', marginBottom: '4px' }}>
                  {cat.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {cat.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. COMPREHENSIVE FILTER & SEARCH BAR */}
      <div
        id="catalog-section"
        style={{
          background: '#ffffff',
          borderRadius: '28px',
          boxShadow: '0 8px 32px rgba(190, 110, 21, 0.08)',
          border: '1px solid #faeee4',
          padding: '32px 32px 24px 32px',
          margin: '0 0 40px 0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔍 Bộ lọc thông minh</span>
              {hasActiveFilters && (
                <span style={{ fontSize: '12px', background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '12px', fontWeight: '600' }}>
                  Đang lọc kết quả
                </span>
              )}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Dễ dàng tìm kiếm món đồ chơi phù hợp với độ tuổi, ngân sách và khu vực của bạn
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ✕ Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        {/* Hàng 1: Tìm kiếm từ khóa + Lọc Tỉnh/Thành 63 tỉnh Việt Nam */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* Ô tìm kiếm */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#be6e15',
              fontSize: '18px',
              pointerEvents: 'none'
            }}>
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setCurrentPage(1); setSearchTerm(e.target.value); }}
              placeholder="Tìm kiếm: Lego, xếp hình gỗ, robot STEM, xe đua..."
              style={{
                width: '100%',
                padding: '14px 40px 14px 44px',
                borderRadius: '16px',
                border: '1px solid #ebdcd0',
                background: '#fcfaf8',
                fontSize: '15px',
                outline: 'none',
                color: 'var(--text-main)'
              }}
            />
            {searchTerm && (
              <span
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}
              >
                ✕
              </span>
            )}
          </div>

          {/* Chọn 63 tỉnh/thành chuẩn Việt Nam */}
          <div style={{ position: 'relative' }}>
            <select
              value={filterLocation}
              onChange={event => {
                setCurrentPage(1);
                setFilterLocation(event.target.value);
              }}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #ebdcd0',
                borderRadius: '16px',
                background: '#fcfaf8',
                color: 'var(--text-main)',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">📍 Toàn quốc (Tất cả 63 tỉnh thành)</option>
              {VIETNAM_REGIONS.map(reg => (
                <optgroup key={reg.region} label={reg.region}>
                  {reg.provinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Hàng 2: Bộ lọc độ tuổi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: '#be6e15', fontWeight: '700', fontSize: '14px', minWidth: '110px' }}>
            👶 Độ tuổi:
          </span>
          {[
            { key: 'all', label: 'Tất cả lứa tuổi' },
            { key: '0-3 tuổi', label: '0-3 tuổi (Sơ sinh)' },
            { key: '3-6 tuổi', label: '3-6 tuổi (Mầm non)' },
            { key: '6-12 tuổi', label: '6-12 tuổi (Tiểu học)' },
            { key: '12+ tuổi', label: '12+ tuổi' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => { setCurrentPage(1); setFilterAge(item.key); }}
              style={{
                padding: '8px 18px',
                borderRadius: '24px',
                border: filterAge === item.key ? '2px solid #be6e15' : '1px solid #ebdcd0',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                background: filterAge === item.key ? '#fff4ea' : 'transparent',
                color: filterAge === item.key ? '#be6e15' : '#7c5e3b',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Hàng 3: Tình trạng đồ chơi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: '#059669', fontWeight: '700', fontSize: '14px', minWidth: '110px' }}>
            ✨ Tình trạng:
          </span>
          {[
            { key: 'all', label: 'Tất cả tình trạng' },
            { key: 'new', label: 'Mới 100% nguyên hộp' },
            { key: 'like_new', label: 'Như mới (95-99%)' },
            { key: 'used', label: 'Đã dùng tốt (85-90%)' }
          ].map((cond) => (
            <button
              key={cond.key}
              onClick={() => { setCurrentPage(1); setFilterCondition(cond.key); }}
              style={{
                padding: '8px 16px',
                borderRadius: '24px',
                border: filterCondition === cond.key ? '2px solid #059669' : '1px solid #ebdcd0',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                background: filterCondition === cond.key ? '#ecfdf5' : 'transparent',
                color: filterCondition === cond.key ? '#059669' : '#7c5e3b',
                transition: 'all 0.2s'
              }}
            >
              {cond.label}
            </button>
          ))}
        </div>

        {/* Hàng 4: Mức tiền cọc */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: '#4f46e5', fontWeight: '700', fontSize: '14px', minWidth: '110px' }}>
            💰 Tiền cọc:
          </span>
          {[
            { key: 'all', label: 'Tất cả mức cọc' },
            { key: 'under100', label: 'Dưới 100.000đ' },
            { key: '100to200', label: '100.000đ - 200.000đ' },
            { key: 'over200', label: 'Trên 200.000đ' }
          ].map((dep) => (
            <button
              key={dep.key}
              onClick={() => { setCurrentPage(1); setFilterDepositRange(dep.key); }}
              style={{
                padding: '8px 16px',
                borderRadius: '24px',
                border: filterDepositRange === dep.key ? '2px solid #4f46e5' : '1px solid #ebdcd0',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                background: filterDepositRange === dep.key ? '#f5f3ff' : 'transparent',
                color: filterDepositRange === dep.key ? '#4f46e5' : '#7c5e3b',
                transition: 'all 0.2s'
              }}
            >
              {dep.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. TOY CATALOG HEADER & SORTING */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', borderLeft: '6px solid var(--primary-color)', paddingLeft: '14px' }}>
            Kho đồ chơi an toàn cho bé
          </h2>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '20px' }}>
            Hiển thị <strong>{filteredToys.length}</strong> món đồ chơi phù hợp tiêu chí
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <span>Sắp xếp:</span>
            <select
              value={sort}
              onChange={event => { setCurrentPage(1); setSort(event.target.value); }}
              style={{
                padding: '10px 14px',
                border: '1px solid #ebdcd0',
                borderRadius: '12px',
                background: '#fff',
                color: 'var(--text-main)',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="newest">Mới cập nhật</option>
              <option value="rating-desc">Đánh giá cao nhất ★</option>
              <option value="deposit-asc">Tiền cọc thấp nhất</option>
              <option value="deposit-desc">Tiền cọc cao nhất</option>
              <option value="name-asc">Tên từ A đến Z</option>
            </select>
          </label>
        </div>
      </div>

      {/* 7. TOYS GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧸</div>
          Đang tải kho đồ chơi ToyShare...
        </div>
      ) : filteredToys.length === 0 ? (
        <div style={{
          background: '#ffffff',
          padding: '60px 20px',
          borderRadius: '24px',
          textAlign: 'center',
          border: '1px dashed #ebdcd0',
          color: 'var(--text-muted)',
          marginBottom: '50px'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '14px' }}>🧩</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
            Chưa tìm thấy đồ chơi phù hợp với bộ lọc hiện tại
          </h3>
          <p style={{ fontSize: '14px', maxWidth: '450px', margin: '0 auto 20px auto' }}>
            Ba mẹ thử thay đổi hoặc xóa bớt tiêu chí lọc để khám phá thêm nhiều món đồ chơi hấp dẫn khác nhé.
          </p>
          <button className="btn-primary" onClick={resetAllFilters}>
            Xóa bộ lọc & Xem tất cả đồ chơi
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {filteredToys.map((toy) => {
            const ownerName = typeof toy.ownerId === 'object' ? toy.ownerId?.name : (toy.ownerName || 'Chủ sở hữu');
            return (
              <div
                key={toy._id}
                className="toy-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '24px',
                  background: '#ffffff',
                  boxShadow: '0 4px 20px rgba(190, 110, 21, 0.05)',
                  border: '1px solid #f6eee6',
                  padding: '16px'
                }}
              >
                <div>
                  {/* Ảnh sản phẩm */}
                  <div
                    onClick={() => viewToyDetail && viewToyDetail(toy._id)}
                    title="Nhấn để xem chi tiết & cam kết khử khuẩn"
                    style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#fbf7f4',
                      borderRadius: '18px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '44px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {toy.images && toy.images.length > 0 ? (
                      <img
                        src={toy.images[0]}
                        alt={toy.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
                      />
                    ) : (
                      toy.category === 'Hành động' ? '🏎️' : toy.category === 'Xếp hình' ? '🧩' : '🧸'
                    )}

                    {/* Badge: Khử trùng UV-C */}
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(255, 255, 255, 0.92)',
                      color: '#059669',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      🛡️ Khử trùng UV-C
                    </span>
                  </div>

                  {/* Nhãn Tag phân loại */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#be6e15', fontWeight: '700', backgroundColor: '#fff4ea', padding: '3px 10px', borderRadius: '16px' }}>
                      {toy.ageRange && (toy.ageRange.includes('tuổi') || toy.ageRange.includes('tháng')) ? toy.ageRange : `${toy.ageRange} tuổi`}
                    </span>
                    <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '700', backgroundColor: '#f5f3ff', padding: '3px 10px', borderRadius: '16px' }}>
                      {toy.category}
                    </span>
                    {toy.condition && (
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', backgroundColor: '#ecfdf5', padding: '3px 10px', borderRadius: '16px' }}>
                        ✨ {toy.condition === 'new' ? 'Mới 100%' : toy.condition === 'like_new' ? 'Như mới 98%' : 'Đã sử dụng tốt'}
                      </span>
                    )}
                    {toy.location && (
                      <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: '600', backgroundColor: '#f3f4f6', padding: '3px 10px', borderRadius: '16px' }}>
                        📍 {toy.location}
                      </span>
                    )}
                  </div>

                  {/* Tên đồ chơi */}
                  <h3
                    onClick={() => viewToyDetail && viewToyDetail(toy._id)}
                    style={{
                      marginTop: '6px',
                      marginBottom: '6px',
                      fontSize: '17px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      lineHeight: '1.4',
                      color: 'var(--text-main)'
                    }}
                  >
                    {toy.name}
                  </h3>

                  {/* Đánh giá sao */}
                  <div
                    onClick={() => setSelectedToyForReviews(toy)}
                    title="Nhấn để xem nhận xét thực tế từ phụ huynh"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      width: 'fit-content'
                    }}
                  >
                    <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '700' }}>
                      ★ {toy.rating?.avg > 0 ? toy.rating.avg.toFixed(1) : '5.0'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#8c7664' }}>
                      ({toy.rating?.count || 0} nhận xét)
                    </span>
                  </div>

                  {/* Nút yêu thích & Báo cáo */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(toy)}
                      aria-label={favorites.includes(toy._id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                      style={{
                        border: '1px solid #ebdcd0',
                        borderRadius: '10px',
                        padding: '5px 10px',
                        background: favorites.includes(toy._id) ? '#fef2f2' : '#fff',
                        color: favorites.includes(toy._id) ? '#dc2626' : 'var(--text-main)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {favorites.includes(toy._id) ? '♥ Đã lưu' : '♡ Yêu thích'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          showToast('Đăng nhập để báo cáo bài đăng.', 'info');
                          setPage('login');
                          return;
                        }
                        setReportToy(toy);
                      }}
                      style={{
                        border: '1px solid #ebdcd0',
                        borderRadius: '10px',
                        padding: '5px 10px',
                        background: '#fff',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Báo cáo
                    </button>
                  </div>

                  {/* Mô tả ngắn */}
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    marginBottom: '12px',
                    height: '38px',
                    overflow: 'hidden',
                    lineHeight: '1.4'
                  }}>
                    {toy.description || "Đồ chơi chính hãng được vệ sinh và khử trùng sạch sẽ trước khi bàn giao."}
                  </p>

                  {/* Chủ đồ chơi */}
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '12px'
                  }}>
                    <span>Chủ đồ chơi:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{ownerName}</strong>
                    <span style={{ color: '#059669', fontSize: '11px' }}>✓ Đã xác minh</span>
                  </div>
                </div>

                {/* Phần dưới cùng: Tiền cọc & Nút hành động */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderTop: '1px dashed #f5ede6',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Tiền cọc đảm bảo:</div>
                      <div style={{ color: '#be6e15', fontWeight: '800', fontSize: '18px' }}>
                        {toy.depositRequired?.toLocaleString()}đ
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600', textAlign: 'right' }}>
                      ⚡ Hoàn cọc 100%<br />khi trả đồ chơi
                    </div>
                  </div>

                  {isOwnToy(toy) ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        backgroundColor: '#e5e7eb',
                        color: '#9ca3af',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'not-allowed',
                        fontSize: '14px'
                      }}
                    >
                      Đây là đồ chơi của bạn
                    </button>
                  ) : toy.status === 'borrowed' ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        backgroundColor: '#f3f4f6',
                        color: '#9ca3af',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'not-allowed',
                        fontSize: '14px'
                      }}
                    >
                      Đang được mượn
                    </button>
                  ) : toy.status === 'unavailable' ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        backgroundColor: '#f3f4f6',
                        color: '#9ca3af',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'not-allowed',
                        fontSize: '14px'
                      }}
                    >
                      Tạm ngưng mượn
                    </button>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => viewToyDetail && viewToyDetail(toy._id)}
                        style={{
                          borderRadius: '14px',
                          padding: '10px',
                          border: '1px solid #ebdcd0',
                          background: '#fff',
                          color: '#be6e15',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => handleBorrowClick(toy)}
                        className="btn-primary"
                        style={{
                          borderRadius: '14px',
                          justifyContent: 'center',
                          padding: '10px',
                          fontSize: '13px'
                        }}
                      >
                        Mượn ngay
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. PAGINATION */}
      {pagination.totalPages > 1 && (
        <nav aria-label="Phân trang đồ chơi" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '60px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setCurrentPage(page => Math.max(1, page - 1)); scrollToCatalog(); }}
            disabled={currentPage <= 1}
            className="btn-secondary"
            style={{ padding: '9px 18px', opacity: currentPage <= 1 ? 0.5 : 1 }}
          >
            ← Trang trước
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>
            Trang {currentPage} / {pagination.totalPages} · {pagination.total} món đồ chơi
          </span>
          <button
            type="button"
            onClick={() => { setCurrentPage(page => Math.min(pagination.totalPages, page + 1)); scrollToCatalog(); }}
            disabled={currentPage >= pagination.totalPages}
            className="btn-secondary"
            style={{ padding: '9px 18px', opacity: currentPage >= pagination.totalPages ? 0.5 : 1 }}
          >
            Trang sau →
          </button>
        </nav>
      )}

      {/* 9. SECTION: QUY TRÌNH 4 BƯỚC MƯỢN ĐỒ CHƠI ĐƠN GIẢN (HOW IT WORKS) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '32px',
        padding: '50px 36px',
        marginBottom: '60px',
        boxShadow: '0 8px 32px rgba(190, 110, 21, 0.05)',
        border: '1px solid #faeee4'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 40px auto' }}>
          <div style={{ color: '#be6e15', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Minh bạch & An tâm tuyệt đối
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '10px' }}>
            Quy trình mượn đồ chơi an toàn chỉ với 4 bước
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Được bảo chứng bởi hệ thống ký quỹ VietQR Escrow và quy trình khử trùng UV-C chuẩn y khoa.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px', position: 'relative' }}>
          {[
            {
              step: '01',
              icon: '🔍',
              title: 'Tìm & Chọn Đồ Chơi',
              desc: 'Lọc đồ chơi theo độ tuổi, vị trí địa lý gần nhà và loại hình trí tuệ kích thích não bộ cho bé.'
            },
            {
              step: '02',
              icon: '📱',
              title: 'Đặt Cọc & Áp Mã Giảm',
              desc: 'Gửi yêu cầu, áp mã voucher TOYSHARENEW giảm 20k. Tiền cọc giữ an toàn tại tài khoản bảo chứng.'
            },
            {
              step: '03',
              icon: '🛡️',
              title: 'Nhận Đồ Đã Khử UV-C',
              desc: 'Đồ chơi được vệ sinh 4 bước, chiếu tia UV-C 254nm diệt khuẩn 99.9% và bọc túi kháng khuẩn.'
            },
            {
              step: '04',
              icon: '🔄',
              title: 'Trả Đồ & Nhận Lại Cọc',
              desc: 'Bé chơi thỏa thích theo thời hạn đã đăng ký. Khi hoàn trả, ToyShare hoàn lại 100% tiền cọc trong 15 phút.'
            }
          ].map((item) => (
            <div
              key={item.step}
              style={{
                background: '#fffbf7',
                borderRadius: '20px',
                padding: '28px 20px',
                border: '1px solid #fae7d6',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '28px',
                fontWeight: '900',
                color: '#f5d5b8',
                lineHeight: 1
              }}>
                {item.step}
              </div>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 10. SECTION: SO SÁNH "MUA MỚI VS THUÊ QUA TOYSHARE" */}
      <div style={{
        background: 'linear-gradient(135deg, #fff7ef 0%, #fff 100%)',
        borderRadius: '32px',
        padding: '50px 36px',
        marginBottom: '60px',
        border: '1px solid #ebdcd0'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 36px auto' }}>
          <div style={{ color: '#be6e15', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Bài toán kinh tế thông minh
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '10px' }}>
            Tại sao phụ huynh hiện đại chọn ToyShare thay vì Mua mới?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Giải phóng không gian sống và tối ưu chi phí nuôi dạy con thông minh.
          </p>
        </div>

        <div style={{
          overflowX: 'auto',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #faeee4'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#fdf9f5', borderBottom: '2px solid #ebdcd0' }}>
                <th style={{ padding: '18px 24px', fontWeight: '700', color: 'var(--text-main)' }}>Tiêu chí so sánh</th>
                <th style={{ padding: '18px 24px', fontWeight: '700', color: '#9ca3af' }}>❌ Mua đồ chơi mới truyền thống</th>
                <th style={{ padding: '18px 24px', fontWeight: '800', color: '#be6e15', background: '#fff4ea' }}>✨ Giải pháp chia sẻ ToyShare</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  criteria: 'Chi phí hàng năm',
                  buy: 'Tốn 5 - 12 triệu/năm mua các bộ Lego, STEM đắt đỏ',
                  share: 'Chỉ từ vài chục nghìn/món, tiết kiệm tới 85% chi phí'
                },
                {
                  criteria: 'Không gian sống trong nhà',
                  buy: 'Nhà cửa bừa bộn, ngập tràn đồ chơi bé không còn chơi',
                  share: 'Nhà cửa luôn tinh gọn, chơi xong gửi trả đồ chơi khác'
                },
                {
                  criteria: 'Tâm lý bé nhanh chán',
                  buy: 'Bé chỉ hào hứng 1-2 tuần rồi bỏ xó không ngó ngàng',
                  share: 'Luôn có đồ chơi mới kích thích não bộ liên tục không chán'
                },
                {
                  criteria: 'Tiêu chuẩn vệ sinh',
                  buy: 'Đồ để bụi bặm lâu ngày trong nhà không khử trùng thường xuyên',
                  share: 'Quy trình 4 cấp độ khử UV-C 254nm & cồn y tế trước khi giao'
                },
                {
                  criteria: 'Bảo vệ môi trường',
                  buy: 'Tạo hàng triệu tấn rác thải nhựa tích tụ',
                  share: 'Kinh tế tuần hoàn, kéo dài vòng đời đồ chơi, sống xanh'
                }
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f6eee6' }}>
                  <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--text-main)' }}>{row.criteria}</td>
                  <td style={{ padding: '16px 24px', color: '#6b7280' }}>{row.buy}</td>
                  <td style={{ padding: '16px 24px', color: '#be6e15', fontWeight: '600', background: '#fffaf5' }}>✓ {row.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 11. SECTION: CAM KẾT VỆ SINH UV-C 4 CẤP ĐỘ */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        color: '#ffffff',
        borderRadius: '32px',
        padding: '50px 36px',
        marginBottom: '60px',
        boxShadow: '0 12px 36px rgba(6, 78, 59, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '30px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
            <span>🛡️ TIÊU CHUẨN AN TOÀN SỐ 1</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.3', marginBottom: '14px' }}>
            Quy trình khử trùng 4 cấp độ UV-C chuẩn Y Tế
          </h2>
          <p style={{ fontSize: '15px', color: '#a7f3d0', lineHeight: '1.7', marginBottom: '24px' }}>
            Mỗi món đồ chơi khi gửi đến bé đều trải qua quá trình làm sạch sâu bằng dung dịch hữu cơ sinh học, chiếu đèn cực tím UV-C bước sóng 254nm tiêu diệt 99.9% vi khuẩn và niêm phong trong túi kháng khuẩn hút chân không.
          </p>
          <button
            onClick={() => setIsSafetyModalOpen(true)}
            style={{
              background: '#ffffff',
              color: '#064e3b',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '24px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
            }}
          >
            🔍 Xem chi tiết cam kết an toàn & khử khuẩn
          </button>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          width: 'min(100%, 380px)'
        }}>
          {[
            { icon: '🧼', name: 'Vệ sinh hữu cơ', desc: 'Lau sạch xà phòng sinh học' },
            { icon: '⚡', name: 'Chiếu xạ UV-C', desc: 'Diệt 99.9% mầm bệnh' },
            { icon: '🧪', name: 'Cồn thực phẩm 70°', desc: 'An toàn tuyệt đối cho bé' },
            { icon: '📦', name: 'Túi Zip niêm phong', desc: 'Chống bụi khuẩn vận chuyển' }
          ].map((item, idx) => (
            <div key={idx} style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{item.icon}</div>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#ffffff' }}>{item.name}</div>
              <div style={{ fontSize: '11px', color: '#d1fae5' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 12. SECTION: PHỤ HUYNH NÓI GÌ VỀ TOYSHARE (TESTIMONIALS) */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 36px auto' }}>
          <div style={{ color: '#be6e15', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Cộng đồng văn minh
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '10px' }}>
            Đánh giá thực tế từ các phụ huynh ToyShare
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Hơn 3.500 gia đình tại Hà Nội, TP.HCM, Đà Nẵng đã và đang tin dùng nền tảng mỗi ngày.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            {
              avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
              name: 'Chị Thanh Hương',
              role: 'Mẹ bé Bắp (4 tuổi) · Cầu Giấy, Hà Nội',
              rating: 5,
              text: 'Bé nhà mình mê mẩn Lego nhưng bộ nào cũng 1-2 triệu, chơi 2 tuần là chán để xó. Từ khi biết ToyShare, mỗi tháng đổi 2 bộ Lego mới, con mê tít mà gia đình tiết kiệm được cả chục triệu mỗi năm!'
            },
            {
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
              name: 'Anh Hoàng Dũng',
              role: 'Bố bé Sâu (2 tuổi) · Quận 1, TP.HCM',
              rating: 5,
              text: 'Lúc đầu tôi lo nhất là vấn đề vệ sinh vì con còn nhỏ hay ngậm đồ chơi. Sau khi nhận đồ chơi đóng túi niêm phong thơm tho, có tem kiểm định UV-C, tôi hoàn toàn an tâm cho con chơi.'
            },
            {
              avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
              name: 'Chị Mai Anh',
              role: 'Mẹ bé Kem (5 tuổi) · Hải Châu, Đà Nẵng',
              rating: 5,
              text: 'Quy trình đặt cọc VietQR cực nhanh, khi gửi trả đồ chơi là nhận lại tiền cọc trong vòng 15 phút. Nền tảng rất văn minh, chủ đồ chơi thân thiện và hỗ trợ chu đáo.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid #f6eee6',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ color: '#f59e0b', fontSize: '16px', marginBottom: '12px' }}>
                  {'★'.repeat(item.rating)}
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#554236', marginBottom: '20px', fontStyle: 'italic' }}>
                  "{item.text}"
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={item.avatar}
                  alt={item.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 13. SECTION: CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) */}
      <div id="faq-section" style={{
        background: '#ffffff',
        borderRadius: '32px',
        padding: '50px 36px',
        marginBottom: '60px',
        boxShadow: '0 8px 32px rgba(190, 110, 21, 0.05)',
        border: '1px solid #faeee4'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 36px auto' }}>
          <div style={{ color: '#be6e15', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Giải đáp thắc mắc
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '10px' }}>
            Câu hỏi thường gặp từ phụ huynh
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Mọi điều ba mẹ cần biết trước khi bắt đầu mượn đồ chơi cho bé yêu.
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            {
              q: 'Làm thế nào để tôi yên tâm đồ chơi sạch và không lây nhiễm bệnh cho con?',
              a: '100% đồ chơi trên ToyShare đều bắt buộc trải qua quy trình vệ sinh 4 lớp: rửa nước kháng khuẩn sinh học, khử trùng bằng tia cực tím UV-C 254nm, lau cồn y tế an toàn thực phẩm và niêm phong túi Zip kháng khuẩn trước khi gửi.'
            },
            {
              q: 'Tiền cọc được thanh toán và hoàn trả như thế nào?',
              a: 'Tiền cọc được chuyển vào tài khoản bảo chứng ToyShare Escrow thông qua VietQR tự động. Sau khi bạn gửi trả đồ chơi và chủ đồ chơi xác nhận nhận lại nguyên vẹn, hệ thống sẽ hoàn trả 100% tiền cọc về tài khoản ngân hàng của bạn trong vòng 15 phút.'
            },
            {
              q: 'Nếu bé vô tình làm trầy xước nhẹ hoặc mất 1 mảnh ghép nhỏ thì sao?',
              a: 'ToyShare thấu hiểu trẻ em có thể làm xước nhẹ trong quá trình vui chơi bình thường. Hao mòn tự nhiên được hoàn toàn miễn phí. Trong trường hợp mất phụ kiện nhỏ của bộ đồ chơi, ban quản trị sẽ hỗ trợ định giá linh kiện bù trừ hợp lý và công bằng nhất.'
            },
            {
              q: 'Phí giao nhận đồ chơi được tính thế nào?',
              a: 'Ba mẹ có thể tự qua lấy trực tiếp miễn phí hoặc đặt các dịch vụ giao hàng Ahamove, GrabExpress, ViettelPost. Hiện tại mã giảm cọc TOYSHARENEW hỗ trợ tối đa chi phí vận chuyển cho ba mẹ.'
            },
            {
              q: 'Tôi có nhiều đồ chơi con đã lớn không dùng đến, tôi có thể đăng chia sẻ không?',
              a: 'Hoàn toàn được! Bạn chỉ cần nhấn vào "Đăng đồ chơi của tôi", chụp ảnh sản phẩm và đặt mức tiền cọc mong muốn. Sau khi đội ngũ ToyShare duyệt nội dung, đồ chơi sẽ xuất hiện trên hệ thống và bạn có thể nhận thu nhập thụ động mỗi tháng.'
            }
          ].map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  border: isOpen ? '1px solid #be6e15' : '1px solid #ebdcd0',
                  borderRadius: '16px',
                  background: isOpen ? '#fffaf5' : '#ffffff',
                  overflow: 'hidden',
                  transition: 'all 0.25s'
                }}
              >
                <div
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  style={{
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '16px',
                    color: isOpen ? '#be6e15' : 'var(--text-main)'
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ fontSize: '20px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                    ▾
                  </span>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 24px 20px 24px', fontSize: '14px', lineHeight: '1.7', color: '#6b7280' }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 14. SECTION: OWNER CTA BANNER (GIA NHẬP MẠNG LƯỚI CHỦ ĐỒ CHƠI) */}
      <div style={{
        background: 'linear-gradient(135deg, #be6e15 0%, #e07a16 100%)',
        borderRadius: '32px',
        padding: '50px 36px',
        marginBottom: '60px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '30px',
        boxShadow: '0 12px 35px rgba(190, 110, 21, 0.25)'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', opacity: 0.9 }}>
            Kiếm thêm thu nhập thụ động cùng ToyShare
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: '800', lineHeight: '1.25', marginBottom: '14px' }}>
            Nhà bạn có đồ chơi bé đã lớn không dùng đến?
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.7', opacity: 0.95, marginBottom: '24px' }}>
            Đừng để đồ chơi đóng bụi trong kho! Hãy đăng tải lên ToyShare để mang niềm vui tới các em nhỏ khác và nhận thu nhập thụ động 1-3 triệu đồng mỗi tháng từ cộng đồng.
          </p>
          <button
            onClick={() => {
              if (!user) {
                showToast('Vui lòng đăng nhập để đăng đồ chơi của bạn.', 'info');
                setPage('login');
              } else {
                setPage('my-toys');
              }
            }}
            style={{
              background: '#ffffff',
              color: '#be6e15',
              border: 'none',
              padding: '14px 30px',
              borderRadius: '28px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🧸 Bắt đầu đăng đồ chơi ngay hôm nay
          </button>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          textAlign: 'center',
          width: 'min(100%, 300px)'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>💰</div>
          <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>~2.500.000đ</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Thu nhập trung bình/tháng của chủ đồ chơi tích cực trên ToyShare</div>
        </div>
      </div>

      {/* 15. COMMERCIAL FOOTER */}
      <CommercialFooter setPage={setPage} onOpenSafetyModal={() => setIsSafetyModalOpen(true)} />

      {/* 16. FLOATING SUPPORT WIDGET */}
      <FloatingSupport
        onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
        onScrollToFaq={scrollToFaq}
      />

      {/* 17. SAFETY & HYGIENE MODAL */}
      <SafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />

      {/* 18. MODALS: BORROW & REVIEWS */}
      <BorrowRequestModal
        isOpen={!!selectedToyForBorrow}
        onClose={() => setSelectedToyForBorrow(null)}
        toy={selectedToyForBorrow}
        user={user}
        onBorrowSuccess={handleBorrowSuccess}
        showToast={showToast}
      />

      <ToyReviewsModal
        isOpen={!!selectedToyForReviews}
        onClose={() => setSelectedToyForReviews(null)}
        toy={selectedToyForReviews}
      />

      {/* 19. REPORT MODAL */}
      {reportToy && (
        <div role="presentation" onClick={() => setReportToy(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, padding: '20px', background: 'rgba(35, 29, 24, 0.55)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center' }}>
          <form onSubmit={handleSubmitReport} onClick={event => event.stopPropagation()} style={{ width: 'min(100%, 520px)', background: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)' }}>Báo cáo bài đăng đồ chơi</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '18px', fontSize: '14px' }}>Món đồ chơi: <strong>{reportToy.name}</strong></p>
            <label style={{ display: 'grid', gap: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
              Lý do báo cáo
              <select required value={reportReason} onChange={event => setReportReason(event.target.value)} style={{ padding: '12px', border: '1px solid #ebdcd0', borderRadius: '12px', background: '#fff' }}>
                <option value="">Chọn lý do phù hợp</option>
                <option value="Đồ chơi hỏng hóc hoặc không đúng mô tả">Đồ chơi hỏng hóc hoặc không đúng mô tả</option>
                <option value="Nội dung không phù hợp cho trẻ em">Nội dung không phù hợp cho trẻ em</option>
                <option value="Thông tin người bán có dấu hiệu giả mạo">Thông tin người bán có dấu hiệu giả mạo</option>
                <option value="Tiền đặt cọc bất thường">Tiền đặt cọc bất thường</option>
                <option value="Khác">Lý do khác</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
              Chi tiết bổ sung (tùy chọn)
              <textarea value={reportDetails} onChange={event => setReportDetails(event.target.value)} rows={4} maxLength={1000} placeholder="Mô tả cụ thể vấn đề để ban quản trị hỗ trợ nhanh chóng..." style={{ resize: 'vertical', padding: '12px', border: '1px solid #ebdcd0', borderRadius: '12px' }} />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setReportToy(null)} className="btn-secondary" style={{ padding: '10px 20px' }}>Hủy bỏ</button>
              <button type="submit" disabled={actionLoading} className="btn-primary" style={{ padding: '10px 20px', background: '#dc2626' }}>
                {actionLoading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 20. TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          padding: '16px 24px',
          borderRadius: '16px',
          backgroundColor: toast.type === 'success' ? '#15803d' : toast.type === 'error' ? '#dc2626' : '#be6e15',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          animation: 'slideIn 0.3s ease-out',
          zIndex: 9999
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

    </div>
  );
}
