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
  const [reportToy, setReportToy] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
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
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedCoupon(true);
      showToast(`Đã sao chép mã "${code}"! Giảm 20.000đ khi cọc.`);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }).catch(() => {
      showToast(`Mã ưu đãi của bạn: ${code}`, 'info');
    });
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
        console.error("Lỗi lấy dữ liệu:", err);
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
      showToast("Vui lòng đăng nhập để mượn món đồ chơi này!", "info");
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
    { key: 'Xếp hình', label: 'Xếp hình', icon: '🧩' },
    { key: 'Giáo dục', label: 'STEM & Giáo dục', icon: '🔬' },
    { key: 'Hành động', label: 'Xe & Hành động', icon: '🏎️' },
    { key: 'Công nghệ', label: 'Công nghệ', icon: '🤖' },
    { key: 'Khác', label: 'Sáng tạo & Khác', icon: '🎨' },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px 60px' }}>

      {/* 1. HERO COMPACT & CAPSULE SEARCH BAR */}
      <div style={{
        textAlign: 'center',
        padding: '36px 16px 28px',
        maxWidth: '860px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: '38px',
          fontWeight: '800',
          color: 'var(--text-main)',
          marginBottom: '10px',
          letterSpacing: '-0.5px',
          lineHeight: '1.25'
        }}>
          Chia sẻ đồ chơi, <span style={{ color: 'var(--primary-color)' }}>Nhân đôi niềm vui</span>
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'var(--text-muted)',
          marginBottom: '26px',
          lineHeight: '1.5'
        }}>
          Khám phá hàng trăm bộ đồ chơi giáo dục chính hãng cho bé với chi phí tiết kiệm 80%. Đảm bảo 100% khử trùng UV-C an toàn.
        </p>

        {/* CAPSULE SEARCH BAR: TẤT CẢ TRONG 1 THANH GỌN GÀNG */}
        <div style={{
          background: '#ffffff',
          borderRadius: '40px',
          padding: '6px 8px 6px 18px',
          boxShadow: '0 8px 28px rgba(190, 110, 21, 0.1)',
          border: '1px solid #ebdcd0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          maxWidth: '820px',
          margin: '0 auto'
        }}>
          {/* Ô nhập từ khóa */}
          <div style={{ flex: '2 1 200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#be6e15', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setCurrentPage(1); setSearchTerm(e.target.value); }}
              placeholder="Tìm đồ chơi: Lego, xe, robot..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: 'var(--text-main)',
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

          <div style={{ width: '1px', height: '24px', background: '#ebdcd0', display: 'none', mdDisplay: 'block' }} />

          {/* Chọn Tỉnh / Thành */}
          <div style={{ flex: '1.2 1 150px' }}>
            <select
              value={filterLocation}
              onChange={e => { setCurrentPage(1); setFilterLocation(e.target.value); }}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b584a',
                cursor: 'pointer'
              }}
            >
              <option value="all">📍 Toàn quốc</option>
              {VIETNAM_REGIONS.map(reg => (
                <optgroup key={reg.region} label={reg.region}>
                  {reg.provinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#ebdcd0', display: 'none', mdDisplay: 'block' }} />

          {/* Chọn Độ tuổi */}
          <div style={{ flex: '1 1 120px' }}>
            <select
              value={filterAge}
              onChange={e => { setCurrentPage(1); setFilterAge(e.target.value); }}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b584a',
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
              padding: '10px 22px',
              borderRadius: '30px',
              fontSize: '14px',
              fontWeight: '600',
              flexShrink: 0
            }}
          >
            Tìm kiếm
          </button>
        </div>

        {/* Mã voucher gọn gàng dưới thanh tìm kiếm */}
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#8a776a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>🎉 Mã giảm 20k tiền cọc cho ba mẹ mới:</span>
          <strong
            onClick={() => handleCopyVoucher('TOYSHARENEW')}
            title="Nhấn để sao chép"
            style={{
              color: '#be6e15',
              cursor: 'pointer',
              textDecoration: 'underline',
              background: '#fff3e0',
              padding: '2px 8px',
              borderRadius: '6px'
            }}
          >
            {copiedCoupon ? '✓ Đã chép TOYSHARENEW' : 'TOYSHARENEW'}
          </strong>
        </div>
      </div>

      {/* 2. CATEGORY TABS (THANH DANH MỤC NGANG AIRBNB-STYLE) */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 0 24px',
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
                padding: '10px 18px',
                borderRadius: '24px',
                border: isSelected ? '1px solid #be6e15' : '1px solid #ebdcd0',
                background: isSelected ? '#fff5ec' : '#ffffff',
                color: isSelected ? '#be6e15' : '#52473f',
                fontWeight: isSelected ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '16px' }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. SUB-CONTROLS HEADER (SỐ LƯỢNG & SẮP XẾP GỌN GÀNG) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid #f3ede7',
        paddingBottom: '12px'
      }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
          Kho đồ chơi ({filteredToys.length})
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Lọc tình trạng nhanh */}
          <select
            value={filterCondition}
            onChange={e => { setCurrentPage(1); setFilterCondition(e.target.value); }}
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #ebdcd0',
              background: '#fff',
              fontSize: '13px',
              color: '#52473f',
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
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #ebdcd0',
              background: '#fff',
              fontSize: '13px',
              color: '#52473f',
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

      {/* 4. TOYS FEED (LƯỚI ĐỒ CHƠI THIẾT KẾ HIỆN ĐẠI, THOÁNG ĐÃNG) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧸</div>
          Đang tải kho đồ chơi...
        </div>
      ) : filteredToys.length === 0 ? (
        <div style={{
          background: '#ffffff',
          padding: '48px 20px',
          borderRadius: '20px',
          textAlign: 'center',
          border: '1px dashed #ebdcd0',
          color: 'var(--text-muted)',
          margin: '20px 0 40px'
        }}>
          <p style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '600', marginBottom: '10px' }}>
            Không tìm thấy đồ chơi phù hợp với bộ lọc hiện tại.
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
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
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
                  background: '#ffffff',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1px solid #f3ede7',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(190, 110, 21, 0.08)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)';
                }}
              >
                {/* ẢNH ĐỒ CHƠI & NÚT YÊU THÍCH */}
                <div>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '190px',
                    background: '#fbf7f4',
                    overflow: 'hidden'
                  }}>
                    {toy.images && toy.images.length > 0 ? (
                      <img
                        src={toy.images[0]}
                        alt={toy.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                        🧸
                      </div>
                    )}

                    {/* Nút tim yêu thích góc phải */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(toy, e)}
                      title={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: isFav ? '#dc2626' : '#9ca3af',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isFav ? '♥' : '♡'}
                    </button>

                    {/* Badge địa điểm nhỏ góc dưới */}
                    {toy.location && (
                      <span style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        background: 'rgba(255, 255, 255, 0.92)',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#4b5563'
                      }}>
                        📍 {toy.location}
                      </span>
                    )}
                  </div>

                  {/* THÔNG TIN CHÍNH */}
                  <div style={{ padding: '14px 14px 8px' }}>
                    <div style={{ fontSize: '12px', color: '#8a776a', marginBottom: '4px', fontWeight: '500' }}>
                      {toy.category} • {toy.ageRange}
                    </div>

                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      lineHeight: '1.4',
                      height: '42px',
                      overflow: 'hidden',
                      margin: '0 0 6px 0'
                    }}>
                      {toy.name}
                    </h3>

                    {/* Đánh giá sao */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#f59e0b', fontWeight: '700' }}>
                        ★ {toy.rating?.avg > 0 ? toy.rating.avg.toFixed(1) : '5.0'}
                      </span>
                      <span style={{ color: '#9ca3af' }}>
                        ({toy.rating?.count || 0})
                      </span>
                    </div>
                  </div>
                </div>

                {/* HÀNG DƯỚI CÙNG: TIỀN CỌC & NÚT MƯỢN */}
                <div style={{
                  padding: '10px 14px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f9f5f1'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#8a776a', display: 'block' }}>Tiền cọc</span>
                    <strong style={{ fontSize: '15px', color: 'var(--primary-color)' }}>
                      {(toy.depositRequired || 0).toLocaleString()}đ
                    </strong>
                  </div>

                  {isOwnToy(toy) ? (
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                      Của bạn
                    </span>
                  ) : toy.status === 'borrowed' ? (
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                      Đang mượn
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleBorrowClick(toy, e)}
                      className="btn-primary"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
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

      {/* 5. PHÂN TRANG GỌN GÀNG */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', margin: '20px 0 50px' }}>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid #ebdcd0',
              background: '#fff',
              fontSize: '13px',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.5 : 1
            }}
          >
            ← Trước
          </button>
          <span style={{ fontSize: '13px', color: '#8a776a', fontWeight: '500' }}>
            Trang {currentPage} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage >= pagination.totalPages}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid #ebdcd0',
              background: '#fff',
              fontSize: '13px',
              cursor: currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= pagination.totalPages ? 0.5 : 1
            }}
          >
            Sau →
          </button>
        </div>
      )}

      {/* 6. CAM KẾT NIỀM TIN 3 TRỤ CỘT (TINH GỌN, SANG TRỌNG) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        padding: '30px 24px',
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #f3ede7',
        marginTop: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '32px' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginBottom: '2px' }}>
              Khử khuẩn UV-C 100%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Làm sạch cồn y tế & tiệt trùng an toàn trước khi bàn giao cho bé.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '32px' }}>⚡</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginBottom: '2px' }}>
              Ký quỹ VietQR an toàn
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Tiền cọc giữ qua tài khoản bảo chứng, hoàn cọc 100% khi trả đồ.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '32px' }}>🚚</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginBottom: '2px' }}>
              Giao nhận toàn quốc
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Kết nối ba mẹ tại 63 tỉnh thành, nhận đồ tại nhà hoặc qua bưu cục.
            </div>
          </div>
        </div>
      </div>

      {/* 7. FOOTER TINH GỌN, HIỆN ĐẠI */}
      <footer style={{
        borderTop: '1px solid #f1eae4',
        paddingTop: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '13px',
        color: '#8a776a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>🧸 ToyShare Vietnam</span>
          <span>•</span>
          <span>Nền tảng chia sẻ đồ chơi trẻ em</span>
        </div>

        <div style={{ display: 'flex', gap: '18px' }}>
          <span
            onClick={() => setIsSafetyModalOpen(true)}
            style={{ cursor: 'pointer', color: '#be6e15', fontWeight: '500' }}
          >
            Chính sách vệ sinh & hoàn cọc
          </span>
          <span>Hotline: 1900 8888</span>
        </div>
      </footer>

      {/* MODALS */}
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

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#15803d',
          color: 'white',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
          zIndex: 9999
        }}>
          {toast.message}
        </div>
      )}

    </div>
  );
}
