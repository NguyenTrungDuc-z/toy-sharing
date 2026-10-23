import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BorrowRequestModal from './BorrowRequestModal';
import ToyReviewsModal from './ToyReviewsModal';

export default function Home({ user, setPage }) {
  const [toys, setToys] = useState([]);
  const [filterAge, setFilterAge] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all'); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [favorites, setFavorites] = useState([]);
  const [reportToy, setReportToy] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  
  
  const [selectedToyForBorrow, setSelectedToyForBorrow] = useState(null);
  const [selectedToyForReviews, setSelectedToyForReviews] = useState(null);

  useEffect(() => {
    let active = true;
    const params = { page: currentPage, limit: 12, sort };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (filterCategory !== 'all' && filterCategory !== 'Khác') params.category = filterCategory;

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
  }, [currentPage, filterCategory, refreshVersion, searchTerm, sort]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/auth/me/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setFavorites((res.data.favorites || []).map(toy => toy._id)))
      .catch(err => console.error('Lỗi lấy danh sách yêu thích:', err));
  }, [user]);

   
   const [toast, setToast] = React.useState(null);

   const showToast = (message, type = 'success') => {
     setToast({ message, type });
     setTimeout(() => setToast(null), 3000);
   };

   const handleBorrowClick = (toy) => {
    
     if (!user) {
       showToast("Bạn cần phải đăng nhập tài khoản để thực hiện mượn đồ chơi này!", "info");
       setPage('login'); 
       return;
     }

    
     setSelectedToyForBorrow(toy);
   };
   
   const handleBorrowSuccess = () => setRefreshVersion(version => version + 1);

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
       showToast(response.data.message || 'Đã gửi báo cáo.');
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

  const filteredToys = toys.filter(toy => {
   
    const matchName = !searchTerm || (toy.name && toy.name.toLowerCase().includes(searchTerm.toLowerCase()));

    
    const matchAge = filterAge === 'all' || (toy.ageRange && toy.ageRange === filterAge);
    
    
    let matchCategory = true;
    if (filterCategory !== 'all') {
      if (filterCategory === 'Khác') {
        const defaultCategories = ['giáo dục', 'hành động', 'xếp hình', 'công nghệ'];
        matchCategory = toy.category && !defaultCategories.includes(toy.category.toLowerCase());
      } else {
        matchCategory = toy.category && toy.category.toLowerCase() === filterCategory.toLowerCase();
      }
    }
    
    return matchName && matchAge && matchCategory;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Đang tải thế giới đồ chơi...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      
     
      <div style={{ display: 'flex', alignItems: 'center', padding: '60px 0 40px 0', gap: '60px' }}>
        <div style={{ flex: 1.2 }}>
          <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '20px', lineHeight: '1.2' }}>
            Chia sẻ đồ chơi,<br />
            <span style={{ color: 'var(--primary-color)' }}>Nhân đôi niềm vui</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '35px', fontSize: '16px', lineHeight: '1.6' }}>
            Tham gia cộng đồng ToyShare để cùng nhau xây dựng môi trường vui chơi bền vững, tiết kiệm và đầy ắp những điều bất ngờ cho bé yêu.
          </p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn-primary" onClick={() => setPage && setPage('my-toys')}>
              Bắt đầu chia sẻ
            </button>
            <button className="btn-secondary">Tìm hiểu thêm</button>
          </div>
        </div>
        <div style={{ flex: 1, height: '380px', backgroundColor: '#eae0d7', borderRadius: '32px', backgroundImage: "url('/images/banner.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      </div>

      
      <div
        style={{
          background: '#fff7ef',
          borderRadius: '28px',
          boxShadow: '0 4px 32px rgba(255, 193, 112, 0.10)',
          padding: '36px 36px 28px 36px',
          margin: '0 0 40px 0'
        }}
      >
       
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0', marginBottom: '28px' }}>
          <div style={{ position: 'relative', width: '480px', maxWidth: '100%' }}>
            <span style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#b08968',
              fontSize: '18px',
              pointerEvents: 'none'
            }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="7"/><path d="M16 16l-3-3"/></svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setCurrentPage(1); setSearchTerm(e.target.value); }}
              placeholder="Bạn đang tìm đồ chơi gì cho bé?"
              style={{
                width: '100%',
                padding: '14px 56px 14px 44px',
                borderRadius: '22px 0 0 22px',
                border: 'none',
                background: '#fff',
                fontSize: '16px',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                color: '#7c5e3b'
              }}
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
            />
          </div>
          <button
            onClick={() => {}}
            style={{
              padding: '0 32px',
              height: '48px',
              borderRadius: '0 22px 22px 0',
              border: 'none',
              background: '#a86a2c',
              color: '#fff',
              fontWeight: '700',
              fontSize: '16px',
              marginLeft: '-2px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(168,106,44,0.08)',
              transition: 'background 0.2s'
            }}
            tabIndex={-1}
          >
            Tìm kiếm
          </button>
        </div>

       
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <span style={{ color: '#a86a2c', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="20" height="20" fill="none" stroke="#a86a2c" strokeWidth="2"><circle cx="10" cy="10" r="8"/><text x="7" y="15" fontSize="10" fill="#a86a2c"></text></svg>
            Độ tuổi
          </span>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: '0-3 tuổi', label: '0-3 tuổi' },
            { key: '3-6 tuổi', label: '3-6 tuổi' },
            { key: '6-12 tuổi', label: '6-12 tuổi' },
            { key: '12+ tuổi', label: '12+ tuổi' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => { setCurrentPage(1); setFilterAge(item.key); }}
              style={{
                padding: '10px 28px',
                borderRadius: '30px',
                border: filterAge === item.key ? '2px solid #a86a2c' : '1px solid #ebdcd0',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer',
                background: filterAge === item.key ? '#fff' : 'transparent',
                color: filterAge === item.key ? '#a86a2c' : '#7c5e3b',
                boxShadow: filterAge === item.key ? '0 2px 8px rgba(168,106,44,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

       
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <span style={{ color: '#4f46e5', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="20" height="20" fill="none" stroke="#4f46e5" strokeWidth="2"><rect x="3" y="3" width="14" height="14" rx="4"/></svg>
            Danh mục đồ chơi
          </span>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'Giáo dục', label: 'Giáo dục'},
            { key: 'Hành động', label: 'Hành động' },
            { key: 'Xếp hình', label: 'Xếp hình'},
            { key: 'Công nghệ', label: 'Công nghệ'},
            { key: 'Khác', label: 'Khác'},
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setCurrentPage(1); setFilterCategory(cat.key); }}
              style={{
                padding: '10px 22px',
                borderRadius: '30px',
                border: filterCategory === cat.key ? '2px solid #4f46e5' : '1px solid #ebdcd0',
                fontWeight: '500',
                fontSize: '15px',
                cursor: 'pointer',
                background: filterCategory === cat.key ? '#f5f3ff' : 'transparent',
                color: filterCategory === cat.key ? '#4f46e5' : '#7c5e3b',
                boxShadow: filterCategory === cat.key ? '0 2px 8px rgba(79,70,229,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s'
              }}
            >
              {cat.icon && <span style={{ fontSize: '17px' }}>{cat.icon}</span>}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      
      <div style={{ margin: '50px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', borderLeft: '6px solid var(--primary-color)', paddingLeft: '15px' }}>Đồ chơi mới cập nhật</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Sắp xếp
            <select value={sort} onChange={event => { setCurrentPage(1); setSort(event.target.value); }} style={{ padding: '10px 12px', border: '1px solid #ebdcd0', borderRadius: '10px', background: '#fff', color: 'var(--text-main)' }}>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="deposit-asc">Tiền cọc thấp nhất</option>
              <option value="deposit-desc">Tiền cọc cao nhất</option>
            </select>
          </label>
        </div>

        {filteredToys.length === 0 ? (
          <div style={{ background: '#fff', padding: '60px', borderRadius: '24px', textAlign: 'center', border: '1px dashed #ebdcd0', color: 'var(--text-muted)' }}>
            Chưa có đồ chơi nào khớp với bộ lọc độ tuổi và danh mục hiện tại.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '30px' }}>
            {filteredToys.map((toy) => (
              <div key={toy._id} className="toy-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '100%', height: '180px', backgroundColor: '#fbf7f4', borderRadius: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', overflow: 'hidden' }}>
                    {toy.images && toy.images.length > 0 ? (
                      <img
                        src={toy.images[0]}
                        alt={toy.name}

                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }}
                      />
                    ) : (
                      toy.category === 'Hành động' ? '🏎️' : toy.category === 'Xếp hình' ? '🧩' : '🧸'
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '700', backgroundColor: '#fff3e0', padding: '4px 12px', borderRadius: '20px' }}>
                      {toy.ageRange && (toy.ageRange.includes('tuổi') || toy.ageRange.includes('tháng')) ? toy.ageRange : `${toy.ageRange} tuổi`}
                    </span>
                    <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '700', backgroundColor: '#eeeeff', padding: '4px 12px', borderRadius: '20px' }}>
                      {toy.category}
                    </span>

                  </div>
                  <h3 style={{ marginTop: '12px', marginBottom: '4px', fontSize: '18px', fontWeight: '600' }}>{toy.name}</h3>
                  <div 
                    onClick={() => setSelectedToyForReviews(toy)}
                    title="Nhấn để xem nhận xét từ phụ huynh"
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
                      ({toy.rating?.count || 0} đánh giá)
                    </span>
                    <span style={{ fontSize: '11px', color: '#85581A', textDecoration: 'underline', marginLeft: '4px' }}>
                      Xem nhận xét
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleToggleFavorite(toy)} aria-label={favorites.includes(toy._id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} title={favorites.includes(toy._id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} style={{ border: '1px solid #ebdcd0', borderRadius: '10px', padding: '7px 10px', background: '#fff', color: favorites.includes(toy._id) ? '#dc2626' : 'var(--text-main)', cursor: 'pointer', fontSize: '14px' }}>
                      {favorites.includes(toy._id) ? '♥ Đã yêu thích' : '♡ Yêu thích'}
                    </button>
                    <button type="button" onClick={() => {
                      if (!user) {
                        showToast('Đăng nhập để báo cáo bài đăng.', 'info');
                        setPage('login');
                        return;
                      }
                      setReportToy(toy);
                    }} style={{ border: '1px solid #ebdcd0', borderRadius: '10px', padding: '7px 10px', background: '#fff', color: '#9f3a38', cursor: 'pointer', fontSize: '14px' }}>
                      Báo cáo
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', height: '40px', overflow: 'hidden' }}>
                    {toy.description || "Không có mô tả sản phẩm từ chủ sở hữu."}
                  </p>
                </div>
                    <div>
                      <p>Tên chủ sở hữu: {toy.ownerId.name}   </p>
                    </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px dashed #f5ede6', marginBottom: '15px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Tiền cọc:</span>
                    <span style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '16px' }}>{toy.depositRequired?.toLocaleString()}đ</span>
                  </div>
                  
                   {isOwnToy(toy) ? (
                     <button 
                       disabled
                       style={{ 
                         width: '100%', 
                         borderRadius: '14px', 
                         justifyContent: 'center',
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
                         justifyContent: 'center',
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
                         justifyContent: 'center',
                         padding: '12px 16px',
                         backgroundColor: '#f3f4f6',
                         color: '#9ca3af',
                         border: 'none',
                         fontWeight: '600',
                         cursor: 'not-allowed',
                         fontSize: '14px'
                       }}
                     >
                       Không sẵn sàng
                     </button>
                   ) : (
                     <button 
                       onClick={() => handleBorrowClick(toy)} 
                       className="btn-primary" 
                       style={{ width: '100%', borderRadius: '14px', justifyContent: 'center' }}
                     >
                       Mượn ngay
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && (
          <nav aria-label="Phân trang đồ chơi" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage <= 1} className="btn-secondary" style={{ padding: '9px 16px', opacity: currentPage <= 1 ? 0.5 : 1 }}>Trang trước</button>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Trang {currentPage} / {pagination.totalPages} · {pagination.total} món</span>
            <button type="button" onClick={() => setCurrentPage(page => Math.min(pagination.totalPages, page + 1))} disabled={currentPage >= pagination.totalPages} className="btn-secondary" style={{ padding: '9px 16px', opacity: currentPage >= pagination.totalPages ? 0.5 : 1 }}>Trang sau</button>
          </nav>
        )}
      </div>

      
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

      {reportToy && (
        <div role="presentation" onClick={() => setReportToy(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, padding: '20px', background: 'rgba(35, 29, 24, 0.48)', display: 'grid', placeItems: 'center' }}>
          <form onSubmit={handleSubmitReport} onClick={event => event.stopPropagation()} style={{ width: 'min(100%, 520px)', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Báo cáo bài đăng</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '18px' }}>{reportToy.name}</p>
            <label style={{ display: 'grid', gap: '7px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
              Lý do báo cáo
              <select required value={reportReason} onChange={event => setReportReason(event.target.value)} style={{ padding: '12px', border: '1px solid #ebdcd0', borderRadius: '10px', background: '#fff' }}>
                <option value="">Chọn lý do</option>
                <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
                <option value="Thông tin sai lệch">Thông tin sai lệch</option>
                <option value="Bài đăng trùng lặp">Bài đăng trùng lặp</option>
                <option value="Dấu hiệu lừa đảo">Dấu hiệu lừa đảo</option>
                <option value="Khác">Khác</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '7px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
              Chi tiết (không bắt buộc)
              <textarea value={reportDetails} onChange={event => setReportDetails(event.target.value)} rows={4} maxLength={1000} style={{ resize: 'vertical', padding: '12px', border: '1px solid #ebdcd0', borderRadius: '10px' }} />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setReportToy(null)} className="btn-secondary" style={{ padding: '10px 16px' }}>Hủy</button>
              <button type="submit" disabled={actionLoading} className="btn-primary" style={{ padding: '10px 16px', background: '#a33b36' }}>{actionLoading ? 'Đang gửi...' : 'Gửi báo cáo'}</button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          animation: 'slideIn 0.3s ease-out',
          zIndex: 9999
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

    </div>
  );
}
