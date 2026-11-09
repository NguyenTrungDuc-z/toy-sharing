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
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !toy) return null;

  const rawDeposit = Number(toy.depositRequired) || 0;
  const currentDeposit = appliedVoucher ? appliedVoucher.finalAmount : rawDeposit;

  const durationDays = Math.max(
    1,
    Math.ceil((new Date(formData.toDate) - new Date(formData.fromDate)) / (1000 * 60 * 60 * 24))
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherMsg({ type: 'error', text: 'Vui lòng nhập mã ưu đãi!' });
      return;
    }
    setVoucherLoading(true);
    setVoucherMsg(null);
    try {
      const res = await axios.post('http://localhost:5000/api/borrows/validate-voucher', {
        code: voucherCode.trim(),
        depositAmount: rawDeposit
      });
      setAppliedVoucher(res.data);
      setVoucherMsg({ type: 'success', text: `Áp dụng thành công: ${res.data.description}!` });
    } catch (err) {
      setAppliedVoucher(null);
      setVoucherMsg({ type: 'error', text: err.response?.data?.message || 'Mã ưu đãi không hợp lệ!' });
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.toDate) <= new Date(formData.fromDate)) {
      showToast("Ngày trả đồ phải sau ngày mượn ít nhất 1 ngày!", "error");
      return;
    }
    if (!agreeTerms) {
      showToast("Vui lòng đồng ý với Cam kết giữ gìn vệ sinh và an toàn đồ chơi!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const noteContent = appliedVoucher
        ? `${formData.note ? formData.note + ' | ' : ''}[Mã ưu đãi: ${appliedVoucher.code} - Giảm ${appliedVoucher.discount.toLocaleString()}đ]`
        : formData.note;

      const response = await axios.post('http://localhost:5000/api/borrows', {
        toyId: toy._id,
        dueDate: new Date(formData.toDate).toISOString(),
        note: noteContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast(response.data.message || "Gửi yêu cầu mượn thành công! Vui lòng chờ chủ đồ duyệt.", 'success');
      onBorrowSuccess();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi khi gửi yêu cầu mượn đồ!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const imageUrl = toy.imageUrl || (Array.isArray(toy.images) && toy.images.length > 0 ? toy.images[0] : '');
  const ownerName = toy.ownerId && typeof toy.ownerId === 'object' ? (toy.ownerId.name || 'Thành viên') : (toy.ownerId || 'Ẩn danh');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(45, 37, 32, 0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px'
    }}>
      <div style={{
        background: '#fffbf7', borderRadius: '32px', width: '100%', maxWidth: '920px',
        maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(92, 77, 66, 0.2)', border: '1px solid #fdf8f4', padding: '36px'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#be6e15', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              XÁC NHẬN ĐƠN MƯỢN ĐỒ CHƠI
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#2d2520', margin: '4px 0 0 0' }}>
              Yêu cầu mượn cho bé
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3ede7', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', color: '#423023' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '28px', alignItems: 'start' }}>
          
          {/* CỘT TRÁI: THÔNG TIN ĐỒ CHƠI & BẢO CHỨNG */}
          <div>
            <div style={{ backgroundColor: '#fff', borderRadius: '22px', padding: '18px', border: '1px solid #f1eae4', marginBottom: '18px' }}>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={toy.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px', backgroundColor: '#f9f5f1' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '200px', borderRadius: '16px', backgroundColor: '#f9f5f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>🧸</div>
                )}
                <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#16a34a', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
                  ✓ Đã khử trùng UV
                </span>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2d2520', margin: '0 0 6px 0', lineHeight: '1.4' }}>{toy.name}</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: '#be6e15', fontWeight: '700', background: '#fff3e0', padding: '3px 10px', borderRadius: '12px' }}>{toy.ageRange}</span>
                <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '700', background: '#eeeeff', padding: '3px 10px', borderRadius: '12px' }}>{toy.category}</span>
                {toy.location && (
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', background: '#ecfdf5', padding: '3px 10px', borderRadius: '12px' }}>📍 {toy.location}</span>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderTop: '1px dashed #f1eae4', borderBottom: '1px dashed #f1eae4', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', backgroundColor: '#f3e8df', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#a19286' }}>Chủ sở hữu đồ chơi:</div>
                  <div style={{ fontWeight: '700', color: '#2d2520', fontSize: '14px' }}>{ownerName} ✔️</div>
                </div>
              </div>

              {/* BẢNG TÍNH TIỀN CỌC */}
              <div style={{ backgroundColor: '#fff9f4', borderRadius: '16px', padding: '16px', border: '1px solid #fae6d3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#7c6e65' }}>
                  <span>Tiền cọc gốc:</span>
                  <span style={{ fontWeight: '600' }}>{rawDeposit.toLocaleString()}đ</span>
                </div>
                {appliedVoucher && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                    <span>Ưu đãi ({appliedVoucher.code}):</span>
                    <span>-{appliedVoucher.discount.toLocaleString()}đ</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #ebdcd0', fontSize: '15px' }}>
                  <strong style={{ color: '#2d2520' }}>Tiền cọc thực tế:</strong>
                  <strong style={{ color: '#be6e15', fontSize: '20px' }}>{currentDeposit.toLocaleString()}đ</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', marginTop: '6px' }}>
                  ✓ Hoàn trả tự động 100% qua VietQR sau khi trả đồ
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ecfdf5', borderRadius: '16px', padding: '14px', border: '1px solid #bbf7d0', display: 'flex', gap: '10px', fontSize: '12px', color: '#065f46', lineHeight: '1.5' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div>
                <strong>Bảo chứng Ký quỹ ToyShare Escrow:</strong> Tiền cọc được giữ tại hệ thống trung gian và chỉ hoàn trả khi bạn đã nhận đồ chơi đúng chất lượng.
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: FORM ĐIỀN THÔNG TIN & VOUCHER */}
          <div style={{ backgroundColor: '#fff', borderRadius: '22px', padding: '28px', border: '1px solid #f1eae4' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d2520', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📋</span> Thông tin nhận đồ & Thời gian mượn
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>Họ và Tên phụ huynh</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Nguyễn Văn A"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '13px', color: '#2d2520', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>Số điện thoại liên hệ</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="09xx xxx xxx"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '13px', color: '#2d2520', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* CHỌN NGÀY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>Từ ngày nhận</label>
                  <input 
                    type="date" 
                    name="fromDate" 
                    value={formData.fromDate} 
                    onChange={handleChange} 
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '13px', color: '#2d2520', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>Đến ngày trả</label>
                  <input 
                    type="date" 
                    name="toDate" 
                    value={formData.toDate} 
                    onChange={handleChange} 
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '13px', color: '#2d2520', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                ⏱️ Thời gian mượn dự kiến: <strong>{durationDays} ngày</strong> (Có thể gia hạn thêm sau nếu có nhu cầu).
              </div>

              {/* MÃ ƯU ĐÃI (VOUCHER) */}
              <div style={{ marginBottom: '18px', background: '#fffbf7', padding: '14px', borderRadius: '14px', border: '1px dashed #ebdcd0' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#be6e15', marginBottom: '6px' }}>
                  🏷️ Mã giảm giá / Ưu đãi (Voucher)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Nhập TOYSHARENEW hoặc FREESHIP"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #eaddd3', outline: 'none', fontSize: '13px', textTransform: 'uppercase', fontWeight: '700' }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading}
                    style={{ background: '#be6e15', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {voucherLoading ? 'Đang ktra...' : 'Áp dụng'}
                  </button>
                </div>
                {voucherMsg && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: voucherMsg.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                    {voucherMsg.text}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', fontSize: '11px', color: '#8a776a' }}>
                  <span>Gợi ý mã:</span>
                  <span onClick={() => setVoucherCode('TOYSHARENEW')} style={{ color: '#be6e15', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>TOYSHARENEW</span>
                  <span>•</span>
                  <span onClick={() => setVoucherCode('FREESHIP')} style={{ color: '#be6e15', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>FREESHIP</span>
                  <span>•</span>
                  <span onClick={() => setVoucherCode('VIPKIDS')} style={{ color: '#be6e15', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>VIPKIDS</span>
                </div>
              </div>

              {/* LỜI NHẮN */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>Lời nhắn gửi chủ đồ chơi</label>
                <textarea 
                  name="note" 
                  value={formData.note} 
                  onChange={handleChange} 
                  placeholder="Ví dụ: Bé nhà mình 4 tuổi rất thích món này, mình cam kết bảo quản cẩn thận..."
                  rows="2"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid #eaddd3', outline: 'none', fontSize: '13px', color: '#2d2520', resize: 'none', boxSizing: 'border-box' }}
                ></textarea>
              </div>

              {/* CHECKBOX CAM KẾT */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#52473f', cursor: 'pointer', marginBottom: '22px' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <span>
                  Tôi đồng ý với <strong style={{ color: '#be6e15' }}>Quy chế thành viên ToyShare</strong>, cam kết bảo quản đồ chơi sạch sẽ, không làm mất phụ kiện và hoàn trả đúng hẹn cho bé tiếp theo.
                </span>
              </label>

              {/* NÚT SUBMIT */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ flex: 2, padding: '14px', justifyContent: 'center', fontSize: '15px', fontWeight: '700' }}
                >
                  {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu mượn đồ'}
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  style={{ flex: 1, backgroundColor: '#fff', color: '#7c6e65', border: '1px solid #eaddd3', padding: '14px', borderRadius: '30px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
