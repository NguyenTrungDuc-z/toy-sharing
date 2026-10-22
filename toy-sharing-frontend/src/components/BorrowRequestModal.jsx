import React, { useState } from 'react';
import axios from 'axios';

export default function BorrowRequestModal({ isOpen, onClose, toy, user, onBorrowSuccess, showToast }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !toy) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.toDate) <= new Date(formData.fromDate)) {
      showToast("Ngày trả đồ phải sau ngày mượn", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:5000/api/borrows', {
        toyId: toy._id,
        borrowerId: user.id || user._id,
        dueDate: new Date(formData.toDate).toISOString(),
        note: formData.note
      });
      showToast(response.data.message || "Gửi yêu cầu mượn thành công!", 'success');
      onBorrowSuccess();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi khi gửi yêu cầu mượn đồ", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const imageUrl = toy.imageUrl || (Array.isArray(toy.images) && toy.images.length > 0 ? toy.images[0] : '');
  const ownerName = toy.ownerId && typeof toy.ownerId === 'object' ? (toy.ownerId.name || 'Thành viên') : (toy.ownerId || 'Ẩn danh');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(45, 37, 32, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px'
    }}>
      <div style={{
        background: '#fffbf7', borderRadius: '32px', width: '100%', maxWidth: '900px',
        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 50px rgba(92, 77, 66, 0.15)', border: '1px solid #fdf8f4', padding: '40px'
      }}>
        
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#2d2520', margin: '0 0 8px 0' }}>Yêu cầu Mượn Đồ chơi</h2>
          <p style={{ color: '#7c6e65', fontSize: '15px', margin: 0 }}>Vui lòng điền thông tin để gửi yêu cầu đến chủ sở hữu đồ chơi.</p>
        </div>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1', minWidth: '300px', maxWidth: '350px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '16px', border: '1px solid #f1eae4', marginBottom: '20px' }}>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#f59e0b', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', zIndex: 1 }}>
                  Hot item
                </span>
                <img 
                  src={imageUrl || 'https://via.placeholder.com/400x300'} 
                  alt={toy.name}
                  style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '16px', backgroundColor: '#f9f5f1' }}
                />
              </div>
              
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#2d2520', margin: '0 0 8px 0' }}>{toy.name}</h3>
              <p style={{ color: '#4f46e5', fontSize: '13px', margin: '0 0 20px 0', fontWeight: '600' }}>Thể loại: {toy.category}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderTop: '1px dashed #f1eae4', borderBottom: '1px dashed #f1eae4', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#f3e8df', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#a19286' }}>Chủ sở hữu: <span style={{ fontWeight: '700', color: '#2d2520' }}>{ownerName}</span></div>
                  <div style={{ fontSize: '11px', color: '#a19286', marginTop: '2px' }}>Thành viên từ 2023 - 15+ Đồ chơi</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#fff8f2', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#7c6e65', fontWeight: '600' }}>Phí cọc bảo trì:</span>
                  <span style={{ fontSize: '18px', color: '#a86a2c', fontWeight: '700' }}>{(toy.depositRequired || 0).toLocaleString()}đ</span>
                </div>
                <div style={{ fontSize: '11px', color: '#a19286', fontStyle: 'italic' }}>(*) Số tiền này sẽ được hoàn trả 100% khi trả đồ chơi nguyên vẹn.</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#eef2ff', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
              <div style={{ color: '#4f46e5', fontSize: '18px' }}>🛡️</div>
              <div>
                <div style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '700', marginBottom: '4px' }}>Cam kết An toàn</div>
                <div style={{ fontSize: '11px', color: '#6366f1', lineHeight: '1.4' }}>Mọi đồ chơi trên ToyShare đều được kiểm duyệt kỹ lưỡng về tính an toàn và vệ sinh trước khi đăng tải.</div>
              </div>
            </div>
          </div>

        
          <div style={{ flex: '2', minWidth: '350px', backgroundColor: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1eae4' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <div style={{ color: '#4f46e5', fontSize: '18px' }}>📋</div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#4f46e5', margin: 0 }}>Thông tin người mượn</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '8px' }}>Họ và Tên</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Nhập tên của bạn"
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '14px', color: '#2d2520' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '8px' }}>Số điện thoại</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="0xxx xxx xxx"
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '14px', color: '#2d2520' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '8px' }}>Từ ngày</label>
                  <input 
                    type="date" 
                    name="fromDate" 
                    value={formData.fromDate} 
                    onChange={handleChange} 
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '14px', color: '#2d2520' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '8px' }}>Đến ngày</label>
                  <input 
                    type="date" 
                    name="toDate" 
                    value={formData.toDate} 
                    onChange={handleChange} 
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '14px', color: '#2d2520' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '8px' }}>Lời nhắn đến chủ sở hữu</label>
                <textarea 
                  name="note" 
                  value={formData.note} 
                  onChange={handleChange} 
                  placeholder="Chia sẻ lý do bạn muốn mượn món đồ chơi này hoặc cách bạn sẽ bảo quản nó..."
                  rows="3"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '14px', color: '#2d2520', resize: 'none' }}
                ></textarea>
                <div style={{ fontSize: '11px', color: '#a19286', marginTop: '6px' }}>Lời nhắn thân thiện sẽ giúp yêu cầu của bạn dễ được chấp nhận hơn!</div>
              </div>

              <div style={{ backgroundColor: '#fff8f2', borderLeft: '4px solid #a86a2c', borderRadius: '0 12px 12px 0', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#eaddd3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  💳
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#7c6e65', fontWeight: '600', marginBottom: '2px' }}>Tiền đặt cọc: <span style={{ color: '#2d2520', fontWeight: '700' }}>{(toy.depositRequired || 0).toLocaleString()} VNĐ</span></div>
                  <div style={{ fontSize: '12px', color: '#a19286' }}>Vui lòng thanh toán sau khi yêu cầu được chấp nhận.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{ flex: 2, backgroundColor: '#85581A', color: '#fff', border: 'none', padding: '16px', borderRadius: '30px', fontSize: '15px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(133, 88, 26, 0.2)' }}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu mượn'}
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  style={{ flex: 1, backgroundColor: '#fff', color: '#7c6e65', border: '1px solid #eaddd3', padding: '16px', borderRadius: '30px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}