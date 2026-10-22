import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ToyModeration({ setPage }) {
  const [toys, setToys] = useState([]);
  // 🔥 CẬP NHẬT: Thêm trạng thái 'borrowed' vào tab quản lý
  const [statusTab, setStatusTab] = useState('pending'); // 'pending' | 'approved' | 'borrowed' | 'rejected'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, reports: 0 });
  const [toast, setToast] = useState(null);
  const [selectedToy, setSelectedToy] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 🔄 1. TẢI DANH SÁCH BÀI ĐĂNG CẦN DUYỆT TỪ BACKEND
  const fetchToys = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/auth/admin/toys', {
        params: { status: statusTab, category: categoryFilter }
      });
      
      // Mảng MockData chuẩn hóa lại cấu trúc trường (name, ownerId, imageUrl) trùng khớp Database
      const mockData = [
        { _id: '1', name: 'Bộ xếp hình gỗ', category: 'Giáo dục', ownerId: { name: 'Sarah M.' }, imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400', status: 'pending' },
        { _id: '2', name: 'Xe đạp cổ điển', category: 'Ngoài trời', ownerId: { name: 'David L.' }, imageUrl: 'https://images.unsplash.com/photo-1531565637446-32307b194362?w=400', status: 'approved' },
        { _id: '3', name: 'Mô hình Hệ mặt trời 3D', category: 'Khoa học', ownerId: { name: 'Elena K.' }, imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400', status: 'borrowed' }
      ];

      if (res.data.success) {
        setToys(res.data.toys || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        setToys([]);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách bài đăng duyệt:", err);
      setToys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToys();
  }, [statusTab, categoryFilter]);

  // 🛡️ 2. XỬ LÝ PHÊ DUYỆT / TỪ CHỐI TRỰC TIẾP
  const handleAction = async (id, action) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/auth/admin/toys/${id}/status`, { status: action });
      if (res.data.success) {
        showToast(action === 'approved' ? '🎉 Đã phê duyệt bài đăng thành công!' : '❌ Đã từ chối bài đăng!', 'success');
        fetchToys(); 
      }
    } catch (err) {
      showToast(`[Demo] Đã chuyển trạng thái bài viết thành: ${action === 'approved' ? 'Phê duyệt' : 'Từ chối'}`, 'success');
      setToys(toys.filter(item => item._id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: '#fffbf7', fontFamily: 'sans-serif', width: '100%' }}>
      
      {/* 🧭 SIDEBAR THANH MENU */}
      <div style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #f1eae4', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setPage('admin-dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            📊 Bảng điều khiển
          </button>

          <button 
            onClick={() => setPage('role-management')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            👥 Phân quyền người dùng
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: '#85581A', color: '#fff', fontWeight: '650', fontSize: '14px', cursor: 'default' }}
          >
            🚎 Kiểm soát bài đăng
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            📈 Phân tích
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ⚙️ Cài đặt
          </button>
        </div>

        
      </div>

      {/* KHU VỰC CHÍNH ĐIỀU KHIỂN */}
      <div style={{ flex: 1, padding: '40px 50px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '35px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#85581A', margin: '0 0 6px 0' }}>Hàng đợi kiểm duyệt</h2>
          <p style={{ color: '#7c6e65', fontSize: '14px', margin: 0 }}>Xem xét và quản lý các bài đăng đồ chơi để đảm bảo an toàn cộng đồng.</p>
        </div>

        {/* THẺ SỐ LIỆU THỐNG KÊ (Stats Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '35px' }}>
          <div style={{ backgroundColor: '#fdf4ec', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4' }}>
            <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '700' }}>BÀI ĐĂNG CHỜ DUYỆT</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#85581A', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              {stats.pending || 0} <span style={{ fontSize: '14px', color: '#a19286', fontWeight: 'normal' }}>bài</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4' }}>
            <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '700' }}>ĐÃ DUYỆT HÔM NAY</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1512', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              {stats.approvedToday || 0} <span style={{ fontSize: '14px', color: '#a19286', fontWeight: 'normal' }}>bài</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4' }}>
            <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '700' }}>BÁO CÁO VI PHẠM</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              {stats.reports || 0} <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'normal' }}>báo cáo</span>
            </div>
          </div>
        </div>

        {/* BỘ LỌC CHUYỂN TAB VÀ DROPDOWN DANH MỤC */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f1eae4', padding: '4px', borderRadius: '14px' }}>
            <button 
              onClick={() => setStatusTab('pending')}
              style={{ border: 'none', padding: '10px 20px', borderRadius: '11px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', backgroundColor: statusTab === 'pending' ? '#85581A' : 'transparent', color: statusTab === 'pending' ? '#fff' : '#7c6e65' }}
            >
              Chờ duyệt
            </button>
            <button 
              onClick={() => setStatusTab('approved')}
              style={{ border: 'none', padding: '10px 20px', borderRadius: '11px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', backgroundColor: statusTab === 'approved' ? '#85581A' : 'transparent', color: statusTab === 'approved' ? '#fff' : '#7c6e65' }}
            >
              Sẵn sàng
            </button>
            {/* 🔥 THÊM NÚT ĐANG CHO MƯỢN Ở ĐÂY */}
            <button 
              onClick={() => setStatusTab('borrowed')}
              style={{ border: 'none', padding: '10px 20px', borderRadius: '11px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', backgroundColor: statusTab === 'borrowed' ? '#85581A' : 'transparent', color: statusTab === 'borrowed' ? '#fff' : '#7c6e65' }}
            >
              🔄 Đang cho mượn
            </button>
            <button 
              onClick={() => setStatusTab('rejected')}
              style={{ border: 'none', padding: '10px 20px', borderRadius: '11px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', backgroundColor: statusTab === 'rejected' ? '#85581A' : 'transparent', color: statusTab === 'rejected' ? '#fff' : '#7c6e65' }}
            >
              Bị từ chối
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #eaddd3', fontSize: '14px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}
            >
              <option value="all">Tất cả danh mục</option>
              <option value="Giáo dục">Giáo dục</option>
              <option value="Ngoài trời">Ngoài trời</option>
              <option value="Khoa học">Khoa học</option>
            </select>
            <button style={{ backgroundColor: '#fff', border: '1px solid #eaddd3', padding: '10px 16px', borderRadius: '12px', fontSize: '14px', color: '#7c6e65', fontWeight: '600', cursor: 'pointer' }}>
              🎛️ Bộ lọc nâng cao
            </button>
          </div>
        </div>

        {/* DANH SÁCH BÀI ĐĂNG DẠNG GRID CARDS */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#85581A', fontWeight: '600' }}>🔄 Đang truy vấn cơ sở dữ liệu hàng đợi...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
            {toys.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#a19286', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1eae4' }}>
                Trống! Không có bài viết nào ở bộ lọc này.
              </div>
            ) : (
              toys.map((toy) => {
                // 🛠️ ĐỒNG BỘ TRƯỜNG ẢNH: Đọc chuẩn theo schema imageUrl hoặc chuỗi đơn/mảng ảnh
                const imageUrl = toy.imageUrl || (Array.isArray(toy.images) && toy.images.length > 0 
                  ? toy.images[0] 
                  : (toy.image || 'https://images.unsplash.com/photo-1531565637446-32307b194362?w=400'));

                // 🛠️ ĐỒNG BỘ TRƯỜNG CHỦ SỞ HỮU: Đổi từ toy.owner thành toy.ownerId tương ứng với DB Populate
                const ownerName = toy.ownerId && typeof toy.ownerId === 'object' 
                  ? (toy.ownerId.name || 'Thành viên') 
                  : (toy.ownerId || (toy.owner ? (typeof toy.owner === 'object' ? toy.owner.name : toy.owner) : 'Ẩn danh'));

                // 🛠️ ĐỒNG BỘ TIÊU ĐỀ: Hệ thống dùng thuộc tính toy.name trong DB thay vì toy.title
                const displayTitle = toy.name || toy.title || 'Đồ chơi không tên';

                return (
                  <div key={toy._id} style={{ backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1eae4', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={imageUrl} alt={displayTitle} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: statusTab === 'pending' ? '#f59e0b' : statusTab === 'approved' ? '#10b981' : statusTab === 'borrowed' ? '#3b82f6' : '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                        {statusTab === 'pending' ? 'Chờ duyệt' : statusTab === 'approved' ? 'Sẵn sàng' : statusTab === 'borrowed' ? 'Đang mượn' : 'Bị loại'}
                      </span>
                    </div>

                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1512', margin: 0 }}>{displayTitle}</h4>
                        <span style={{ fontSize: '12px', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>{toy.category}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#a19286', marginBottom: '20px' }}>👤 Đăng bởi: <span style={{ fontWeight: '550', color: '#7c6e65' }}>{ownerName}</span></div>

                      <button 
                        onClick={() => {
                          setSelectedToy(toy);
                          setShowDetailModal(true);
                        }}
                        style={{ width: '100%', backgroundColor: '#fff', border: '1px solid #eaddd3', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', color: '#7c6e65', cursor: 'pointer', marginBottom: '12px' }}
                      >
                        Xem chi tiết
                      </button>

                      {statusTab === 'pending' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <button 
                            onClick={() => handleAction(toy._id, 'approved')}
                            style={{ backgroundColor: '#85581A', color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            ✓ Phê duyệt
                          </button>
                          <button 
                            onClick={() => handleAction(toy._id, 'rejected')}
                            style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            ✕ Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {showDetailModal && selectedToy && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(45, 37, 32, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '32px', width: '100%', maxWidth: '700px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(92, 77, 66, 0.15)', border: '1px solid #eaedd9'
          }}>
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #fdf8f4' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#2d2520' }}>Chi tiết sản phẩm</span>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a19286' }}>✕</button>
            </div>

            {/* Nội dung Modal */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {/* Hình ảnh */}
              <div style={{ marginBottom: '24px' }}>
                <img 
                  src={selectedToy.imageUrl || (Array.isArray(selectedToy.images) && selectedToy.images.length > 0 ? selectedToy.images[0] : '')}
                  alt={selectedToy.name}
                  style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '20px' }}
                />
              </div>

              {/* Thông tin cơ bản */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2d2520', margin: '0 0 12px 0' }}>{selectedToy.name}</h2>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#fff', backgroundColor: '#4f46e5', padding: '6px 12px', borderRadius: '8px', fontWeight: '600' }}>
                    {selectedToy.category}
                  </span>
                  <span style={{ fontSize: '12px', color: '#fff', backgroundColor: '#f59e0b', padding: '6px 12px', borderRadius: '8px', fontWeight: '600' }}>
                    {selectedToy.ageRange}
                  </span>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#fffbf7', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '600', marginBottom: '4px' }}>Tình trạng</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#2d2520' }}>
                    {selectedToy.condition === 'new' ? 'Mới (New)' : selectedToy.condition === 'used' ? 'Đã dùng (Used)' : selectedToy.condition}
                  </div>
                </div>
                <div style={{ backgroundColor: '#fffbf7', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '600', marginBottom: '4px' }}>Tiền cọc</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#2d2520' }}>{(selectedToy.depositRequired || 0).toLocaleString()}đ</div>
                </div>
              </div>

              {/* Chủ sở hữu */}
              <div style={{ backgroundColor: '#fffbf7', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '600', marginBottom: '6px' }}>👤 Đăng bởi</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#2d2520' }}>
                  {selectedToy.ownerId && typeof selectedToy.ownerId === 'object' 
                    ? (selectedToy.ownerId.name || 'Thành viên') 
                    : (selectedToy.ownerId || 'Ẩn danh')}
                </div>
              </div>

              {/* Mô tả */}
              <div style={{ backgroundColor: '#fffbf7', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '600', marginBottom: '8px' }}>📝 Mô tả</div>
                <div style={{ fontSize: '14px', color: '#5c4e47', lineHeight: '1.6' }}>
                  {selectedToy.description || 'Không có mô tả'}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '18px 28px', borderTop: '1px solid #fdf8f4', backgroundColor: '#fffbfaf2' }}>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{ padding: '12px 32px', borderRadius: '20px', border: 'none', backgroundColor: '#e0e7ff', color: '#4f46e5', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
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
