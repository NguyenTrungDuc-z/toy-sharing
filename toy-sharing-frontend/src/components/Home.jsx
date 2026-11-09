import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BorrowRequestModal from './BorrowRequestModal';
import ToyReviewsModal from './ToyReviewsModal';
import SafetyModal from './SafetyModal';
import { VIETNAM_REGIONS } from '../constants/vietnamLocations';

export default function Home({ user, setPage, viewToyDetail }) {
  const [toys, setToys] = useState([]);
  const [filterAge, setFilterAge] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [favorites, setFavorites] = useState([]);
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Modals
  const [selectedToyForBorrow, setSelectedToyForBorrow] = useState(null);
  const [selectedToyForReviews, setSelectedToyForReviews] = useState(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Copy coupon
  const handleCopyVoucher = (code = 'TOYSHARENEW') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCoupon(true);
        showToast(`Đã sao chép mã "${code}"! Giảm 20.000đ khi cọc.`);
        setTimeout(() => setCopiedCoupon(false), 2500);
      }).catch(() => {
        showToast(`Mã ưu đãi của bạn: ${code}`, 'info');
      });
    } else {
      showToast(`Mã ưu đãi của bạn: ${code}`, 'info');
    }
  };

  // Fetch toys
  useEffect(() => {
    let active = true;
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
      .catch(err => {
        console.error('Lỗi lấy dữ liệu đồ chơi:', err);
        if (active) setToys([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [currentPage, filterCategory, filterLocation, filterAge, filterCondition, refreshVersion, searchTerm, sort]);

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

  const handleBorrowClick = (toy, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      showToast('Vui lòng đăng nhập để mượn món đồ chơi này!', 'info');
      setPage('login');
      return;
    }
    setSelectedToyForBorrow(toy);
  };

  const handleToggleFavorite = async (toy, e) => {
    if (e) e.stopPropagation();
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
        showToast('Đã lưu vào yêu thích.');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể cập nhật danh sách yêu thích.', 'error');
    }
  };

  const isOwnToy = (toy) => {
    if (!user || !toy.ownerId) return false;
    const userId = user.id || user._id;
    const toyOwnerId = typeof toy.ownerId === 'object' ? toy.ownerId._id : toy.ownerId;
    return userId && toyOwnerId && toyOwnerId.toString() === userId.toString();
  };

  // Client-side filtering fallback
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

    return matchName && matchAge && matchCategory && matchLocation && matchCondition;
  });

  const categories = [
    { key: 'all', label: 'Tất cả', icon: '🧸' },
    { key: 'Xếp hình', label: 'Xếp hình & Lego', icon: '🧩' },
    { key: 'Giáo dục', label: 'STEM & Trí tuệ', icon: '🔬' },
    { key: 'Hành động', label: 'Xe & Vận động', icon: '🏎️' },
    { key: 'Công nghệ', label: 'Robot & Công nghệ', icon: '🤖' },
    { key: 'Khác', label: 'Mỹ thuật & Sáng tạo', icon: '🎨' },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px 60px' }}>

      {/* ========================================================
          1. HERO SECTION CHUẨN UI/UX PRO MAX (AIRY, CLEAN, PREMIUM)
          ======================================================== */}
      <section style={{
        padding: '44px 20px 32px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255, 247, 237, 0.7) 0%, rgba(255, 253, 249, 1) 100%)',
        borderRadius: '32px',
        border: '1px solid rgba(254, 215, 170, 0.5)',
        margin: '16px 0 28px'
      }}>
        {/* TRUST BADGE */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '6px 16px',
          borderRadius: '24px',
          border: '1px solid var(--color-primary-border)',
          boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '14px' }}>🛡️</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary-hover)' }}>
            Nền tảng chia sẻ đồ chơi số 1 cho gia đình Việt
          </span>
        </div>

        {/* HERO HEADING */}
        <h1 style={{
          fontSize: '40px',
          fontWeight: '900',
          color: 'var(--color-foreground)',
          lineHeight: '1.25',
          letterSpacing: '-0.8px',
          margin: '0 auto 14px',
          maxWidth: '780px'
        }}>
          Chia sẻ đồ chơi giáo dục cho bé,{' '}
          <span style={{ color: 'var(--color-primary)' }}>Tiết kiệm 80% chi phí</span>
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'var(--color-muted-foreground)',
          lineHeight: '1.6',
          maxWidth: '680px',
          margin: '0 auto 28px'
        }}>
          Khám phá hàng trăm bộ đồ chơi thông minh chính hãng. Quy trình khử trùng <strong>100% UV-C</strong> chuẩn y tế, ký quỹ an toàn tuyệt đối qua VietQR.
        </p>

        {/* CAPSULE SEARCH BAR (AIRBNB-STYLE COMPACT CONTROLS) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '44px',
          padding: '8px 10px 8px 22px',
          boxShadow: '0 8px 30px rgba(41, 37, 36, 0.08)',
          border: '1.5px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          maxWidth: '860px',
          margin: '0 auto'
        }}>
          {/* Ô nhập từ khóa */}
          <div style={{ flex: '2 1 200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-primary)', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setCurrentPage(1); setSearchTerm(e.target.value); }}
              placeholder="Tìm đồ chơi: Lego, xe, robot, montessori..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: 'var(--color-foreground)',
                background: 'transparent'
              }}
            />
            {searchTerm && (
              <span
                onClick={() => setSearchTerm('')}
                style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '13px', paddingRight: '6px' }}
              >
                ✕
              </span>
            )}
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} />

          {/* Chọn Tỉnh / Thành */}
          <div style={{ flex: '1.2 1 150px' }}>
            <select
              value={filterLocation}
              onChange={e => { setCurrentPage(1); setFilterLocation(e.target.value); }}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: filterLocation === 'all' ? 'var(--color-muted-foreground)' : 'var(--color-foreground)',
                fontWeight: filterLocation === 'all' ? '400' : '600',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              <option value="all">📍 Toàn quốc</option>
              {VIETNAM_REGIONS.map(group => (
                <optgroup key={group.region} label={group.region}>
                  {group.provinces.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} />

          {/* Độ tuổi */}
          <div style={{ flex: '1 1 120px' }}>
            <select
              value={filterAge}
              onChange={e => { setCurrentPage(1); setFilterAge(e.target.value); }}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: filterAge === 'all' ? 'var(--color-muted-foreground)' : 'var(--color-foreground)',
                fontWeight: filterAge === 'all' ? '400' : '600',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              <option value="all">👶 Mọi lứa tuổi</option>
              <option value="0-3 tuổi">0-3 tuổi</option>
              <option value="3-6 tuổi">3-6 tuổi</option>
              <option value="6-12 tuổi">6-12 tuổi</option>
              <option value="12+ tuổi">12+ tuổi</option>
            </select>
          </div>

          {/* Nút Tìm kiếm */}
          <button
            onClick={() => {}}
            className="btn-primary"
            style={{
              padding: '11px 24px',
              borderRadius: '30px',
              fontSize: '14px',
              fontWeight: '700',
              flexShrink: 0
            }}
          >
            Tìm kiếm
          </button>
        </div>

        {/* Mã voucher gọn gàng dưới thanh tìm kiếm */}
        <div style={{ marginTop: '14px', fontSize: '13px', color: 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>🎉 Ưu đãi đặc quyền ba mẹ mới:</span>
          <strong
            onClick={() => handleCopyVoucher('TOYSHARENEW')}
            title="Nhấn để sao chép"
            style={{
              color: 'var(--color-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              background: 'var(--color-primary-light)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid var(--color-primary-border)'
            }}
          >
            {copiedCoupon ? '✓ Đã chép TOYSHARENEW' : 'TOYSHARENEW'}
          </strong>
          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>(Giảm 20.000đ tiền cọc)</span>
        </div>
      </section>

      {/* ========================================================
          2. CATEGORY TABS (AIRBNB-STYLE HORIZONTAL SELECTOR)
          ======================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        padding: '8px 0 20px',
        overflowX: 'auto',
        marginBottom: '16px'
      }}>
        {categories.map(cat => {
          const isSelected = filterCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => { setCurrentPage(1); setFilterCategory(cat.key); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '24px',
                border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: isSelected ? 'var(--color-primary-light)' : 'var(--color-card)',
                color: isSelected ? 'var(--color-primary)' : 'var(--color-foreground)',
                fontWeight: isSelected ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                flexShrink: 0,
                boxShadow: isSelected ? '0 2px 8px rgba(234, 88, 12, 0.15)' : 'none'
              }}
            >
              <span style={{ fontSize: '16px' }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          3. SUB-CONTROLS & SORTING HEADER
          ======================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ fontSize: '14px', color: 'var(--color-muted-foreground)', fontWeight: '500' }}>
          Đang hiển thị <strong style={{ color: 'var(--color-foreground)' }}>{filteredToys.length}</strong> món đồ chơi sẵn sàng mượn
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Lọc tình trạng */}
          <select
            value={filterCondition}
            onChange={e => { setCurrentPage(1); setFilterCondition(e.target.value); }}
            style={{
              padding: '7px 14px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: '#ffffff',
              fontSize: '13px',
              color: 'var(--color-foreground)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">Tình trạng: Tất cả</option>
            <option value="new">Mới 100%</option>
            <option value="like_new">Như mới 98%</option>
            <option value="used">Đã dùng tốt</option>
          </select>

          {/* Sắp xếp */}
          <select
            value={sort}
            onChange={e => { setCurrentPage(1); setSort(e.target.value); }}
            style={{
              padding: '7px 14px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: '#ffffff',
              fontSize: '13px',
              color: 'var(--color-foreground)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="newest">Mới cập nhật</option>
            <option value="rating-desc">Đánh giá cao nhất ★</option>
            <option value="deposit-asc">Tiền cọc: Thấp đến cao</option>
            <option value="deposit-desc">Tiền cọc: Cao đến thấp</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          4. PRODUCT GRID (CHUẨN CARD AIRBNB / E-COMMERCE MODERN)
          ======================================================== */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-muted-foreground)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🧸</div>
          <p style={{ fontWeight: '600' }}>Đang tải danh sách đồ chơi...</p>
        </div>
      ) : filteredToys.length === 0 ? (
        <div style={{
          background: 'var(--color-card)',
          padding: '50px 20px',
          borderRadius: '24px',
          textAlign: 'center',
          border: '1px dashed var(--color-border)',
          color: 'var(--color-muted-foreground)',
          margin: '20px 0 40px'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '17px', color: 'var(--color-foreground)', fontWeight: '700', marginBottom: '8px' }}>
            Không tìm thấy đồ chơi phù hợp với bộ lọc hiện tại
          </h3>
          <p style={{ fontSize: '14px', margin: '0 0 20px' }}>
            Hãy thử tìm bằng từ khóa khác hoặc xóa bộ lọc để xem toàn bộ kho đồ chơi.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterLocation('all');
              setFilterAge('all');
              setFilterCategory('all');
              setFilterCondition('all');
            }}
            className="btn-secondary"
            style={{ padding: '8px 22px', fontSize: '13px' }}
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {filteredToys.map((toy) => {
            const isFav = favorites.includes(toy._id);
            const ownerName = typeof toy.ownerId === 'object' ? toy.ownerId?.name : (toy.ownerName || 'Chủ đồ chơi');

            return (
              <div
                key={toy._id}
                onClick={() => viewToyDetail && viewToyDetail(toy._id)}
                style={{
                  background: 'var(--color-card)',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--color-primary-border)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {/* ẢNH ĐỒ CHƠI & BADGES */}
                <div>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '196px',
                    background: '#fbf7f4',
                    overflow: 'hidden'
                  }}>
                    {toy.images && toy.images.length > 0 ? (
                      <img
                        src={toy.images[0]}
                        alt={toy.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px' }}>
                        🧸
                      </div>
                    )}

                    {/* Nút tim yêu thích góc phải */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(toy, e)}
                      title={isFav ? 'Bỏ yêu thích' : 'Yêu thích'}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(4px)',
                        border: 'none',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '17px',
                        color: isFav ? '#dc2626' : '#a8a29e',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isFav ? '♥' : '♡'}
                    </button>

                    {/* Badge Khử khuẩn UV-C */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(22, 163, 74, 0.92)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '14px',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>🛡️</span>
                      <span>100% UV-C</span>
                    </div>

                    {/* Badge địa điểm */}
                    {toy.location && (
                      <span style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        background: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 9px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#44403c',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                      }}>
                        📍 {toy.location}
                      </span>
                    )}
                  </div>

                  {/* THÔNG TIN CHÍNH */}
                  <div style={{ padding: '14px 16px 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700' }}>
                        {toy.category}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                        {toy.ageRange}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: 'var(--color-foreground)',
                      lineHeight: '1.4',
                      height: '42px',
                      overflow: 'hidden',
                      margin: '6px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {toy.name}
                    </h3>

                    {/* Đánh giá sao & Chủ sở hữu */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#f59e0b', fontWeight: '700' }}>
                          ★ {toy.rating?.avg > 0 ? toy.rating.avg.toFixed(1) : '5.0'}
                        </span>
                        <span style={{ color: '#a8a29e' }}>
                          ({toy.rating?.count || 0})
                        </span>
                      </div>
                      <span style={{ color: 'var(--color-muted-foreground)', fontStyle: 'italic', fontSize: '12px' }}>
                        {ownerName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* HÀNG DƯỚI CÙNG: TIỀN CỌC & NÚT MƯỢN */}
                <div style={{
                  padding: '12px 16px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f6f1ea',
                  marginTop: '6px'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted-foreground)', display: 'block' }}>Tiền cọc</span>
                    <strong style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '800' }}>
                      {(toy.depositRequired || 0).toLocaleString()}đ
                    </strong>
                  </div>

                  {isOwnToy(toy) ? (
                    <span style={{ fontSize: '12px', color: 'var(--color-muted-foreground)', fontWeight: '600', background: 'var(--color-muted)', padding: '5px 12px', borderRadius: '16px' }}>
                      Của bạn
                    </span>
                  ) : toy.status === 'borrowed' ? (
                    <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', background: '#fef3c7', padding: '5px 12px', borderRadius: '16px' }}>
                      Đang mượn
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleBorrowClick(toy, e)}
                      className="btn-primary"
                      style={{
                        padding: '7px 18px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      Mượn ngay
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          5. PHÂN TRANG GỌN GÀNG
          ======================================================== */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', margin: '20px 0 50px' }}>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.5 : 1,
              color: 'var(--color-foreground)'
            }}
          >
            ← Trang trước
          </button>
          <span style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: '600' }}>
            Trang {currentPage} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage >= pagination.totalPages}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= pagination.totalPages ? 0.5 : 1,
              color: 'var(--color-foreground)'
            }}
          >
            Trang sau →
          </button>
        </div>
      )}

      {/* ========================================================
          6. CAM KẾT NIỀM TIN 3 TRỤ CỘT (TRUST & SAFETY)
          ======================================================== */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        padding: '32px 28px',
        background: '#ffffff',
        borderRadius: '26px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        marginTop: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
            🛡️
          </div>
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--color-foreground)', margin: '0 0 4px' }}>
              Khử khuẩn UV-C 100%
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', margin: 0, lineHeight: 1.5 }}>
              Làm sạch cồn y tế & tiệt trùng qua buồng sấy UV-C chuyên dụng trước khi bàn giao cho bé.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
            ⚡
          </div>
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--color-foreground)', margin: '0 0 4px' }}>
              Ký quỹ VietQR an toàn
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', margin: 0, lineHeight: 1.5 }}>
              Tiền cọc giữ qua tài khoản bảo chứng tự động, hoàn cọc 100% minh bạch ngay khi trả đồ.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
            🚚
          </div>
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--color-foreground)', margin: '0 0 4px' }}>
              Kết nối ba mẹ toàn quốc
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', margin: 0, lineHeight: 1.5 }}>
              Mạng lưới cộng đồng phụ huynh tại 63 tỉnh thành, nhận đồ tại nhà hoặc qua bưu cục gần nhất.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FOOTER CHUẨN HIỆN ĐẠI
          ======================================================== */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        paddingTop: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        fontSize: '13px',
        color: 'var(--color-muted-foreground)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '800', color: 'var(--color-primary)' }}>🧸 ToyShare Vietnam</span>
          <span>•</span>
          <span>Nền tảng chia sẻ & cho thuê đồ chơi trẻ em</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span
            onClick={() => setIsSafetyModalOpen(true)}
            style={{ cursor: 'pointer', color: 'var(--color-primary-hover)', fontWeight: '600' }}
          >
            Chính sách vệ sinh & hoàn cọc
          </span>
          <span>Hotline hỗ trợ: <strong>1900 8888</strong></span>
        </div>
      </footer>

      {/* ========================================================
          8. MODALS & TOAST
          ======================================================== */}
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

      <SafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 22px',
          borderRadius: '14px',
          backgroundColor: toast.type === 'error' ? 'var(--color-destructive)' : 'var(--color-accent)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 9999
        }}>
          {toast.message}
        </div>
      )}

    </div>
  );
}
