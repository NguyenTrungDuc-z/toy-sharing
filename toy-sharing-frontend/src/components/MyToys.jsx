import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ToyFormModal from './ToyFormModal'; // Đảm bảo import đúng file modal vừa làm ở bước trước

export default function MyToys() {
  const [myToys, setMyToys] = useState([]);
  const [loading, setLoading] = useState(true);
  
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToy, setSelectedToy] = useState(null); // null = Đăng mới | có dữ liệu = Chỉnh sửa
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  
  const fetchToys = () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    axios.get('http://localhost:5000/api/toys/my-toys', {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
      .then(res => {
        setMyToys(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchToys();
  }, []);

  
  const totalToys = myToys.length;
  const borrowingToys = myToys.filter(t => t.status === 'borrowed').length;

  
  const handleCreateOpen = () => {
    setSelectedToy(null); 
    setIsModalOpen(true);  
  };

  
  const handleEditOpen = (toy) => {
    setSelectedToy(toy); 
    setIsModalOpen(true); 
  };

  
  const handleDeleteClick = async (toy) => {
    
    if (toy.status === 'borrowed' || toy.status === 'unavailable') {
      showToast(" Không thể xóa! Món đồ chơi này hiện tại đang được phụ huynh khác mượn.", "error");
      return; 
    }

    const isConfirmed = window.confirm(`Bồ có chắc chắn muốn gỡ bỏ món "${toy.name}" khỏi hệ thống không?`);
    if (isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:5000/api/toys/${toy._id}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        showToast("Đã gỡ đồ chơi thành công!", "success");
        fetchToys(); 
       } catch (err) {
         console.error("Lỗi khi xóa:", err);
         showToast("Có lỗi xảy ra, gỡ sản phẩm thất bại!", "error");
      }
    }
  };


  const handleFormSubmit = async (formData) => {
    try {
      if (selectedToy) {
       
        const token = localStorage.getItem('token');
        await axios.put(
          `http://localhost:5000/api/toys/${selectedToy._id}`,
          formData,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        showToast("Cập nhật thông tin đồ chơi thành công!", "success");
       } else {
       
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/toys',
          formData,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        showToast("Đăng đồ chơi mới lên hệ thống thành công!", "success");
       }
       setIsModalOpen(false); 
       fetchToys(); 
     } catch (err) {
       console.error(err);
       showToast("Lỗi lưu dữ liệu đồ chơi, vui lòng kiểm tra lại!", "error");
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Đang đồng bộ kho đồ chơi...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Quản lý đồ chơi của tôi</h2>
          <p style={{ color: 'var(--text-muted)' }}>Xem danh sách, cập nhật trạng thái và đăng thêm niềm vui mới.</p>
        </div>
        
        <button 
          onClick={handleCreateOpen} 
          className="btn-primary" 
          style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
           Đăng đồ chơi mới
        </button>
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid #f1eae4', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fff4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏠</div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Tổng số đồ chơi</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalToys} món</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid #f1eae4', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🔄</div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Đang cho mượn</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#4f46e5' }}>{borrowingToys} món</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid #f1eae4', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#e6f6ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>⭐</div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Điểm uy tín</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d' }}>4.9 / 5.0</div>
          </div>
        </div>
      </div>

      
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #f1eae4', padding: '20px', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '20px', paddingLeft: '10px' }}>Danh sách đồ chơi</h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #fcf2e9', color: 'var(--text-muted)', fontSize: '14px' }}>
              <th style={{ padding: '14px 16px' }}>ĐỒ CHƠI</th>
              <th style={{ padding: '14px 16px' }}>PHÂN LOẠI</th>
              <th style={{ padding: '14px 16px' }}>TRẠNG THÁI</th>
              <th style={{ padding: '14px 16px' }}>TIỀN CỌC</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {myToys.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Bạn chưa đăng món đồ chơi nào lên hệ thống.</td>
              </tr>
            ) : (
              myToys.map((toy) => (
                <tr key={toy._id} style={{ borderBottom: '1px solid #fdf5ee', fontSize: '15px' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {toy.images && toy.images.length > 0 ? (
                        <img
                          src={toy.images[0]}
                          alt={toy.name}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', background: '#fbf7f4', padding: '4px', borderRadius: '12px' }}
                        />
                      ) : (
                        <span style={{ fontSize: '28px', background: '#fbf7f4', padding: '8px', borderRadius: '12px' }}>🧸</span>
                      )}
                      <div>
                        <div style={{ fontWeight: '600' }}>{toy.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {toy._id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{toy.category}</td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${toy.status === 'available' ? 'badge-available' : toy.status === 'pending' ? 'badge-pending' : toy.status === 'rejected' ? 'badge-rejected' : 'badge-borrowing'}`}>
                      {toy.status === 'available'
                        ? 'Sẵn sàng'
                        : toy.status === 'pending'
                          ? ' Chờ duyệt'
                          : toy.status === 'borrowed'
                            ? ' Đang cho mượn'
                            : toy.status === 'unavailable'
                              ? ' Không sẵn sàng'
                              : toy.status === 'rejected'
                                ? ' Bị từ chối'
                                : toy.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{toy.depositRequired?.toLocaleString()}đ</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    
                    {/* Nút Sửa: Button nổi bật */}
                    <button
                      onClick={() => handleEditOpen(toy)}
                      style={{
                        background: 'var(--primary-color)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 22px',
                        fontWeight: '600',
                        fontSize: '14px',
                        marginRight: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'background 0.2s'
                      }}
                    >
                      Sửa
                    </button>

                    {/* Nút Xóa: Button nổi bật */}
                    <button
                      onClick={() => handleDeleteClick(toy)}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 22px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(239,68,68,0.08)',
                        transition: 'background 0.2s'
                      }}
                    >
                       Xóa
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔥 CHÈN MODAL ĐĂNG/SỬA GỌN GÀNG VÀO ĐÂY */}
      <ToyFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        editingToy={selectedToy}
      />

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
