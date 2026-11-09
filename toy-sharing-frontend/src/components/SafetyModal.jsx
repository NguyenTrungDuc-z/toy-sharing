import React from 'react';

export default function SafetyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(26, 20, 16, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '750px',
        width: '100%',
        maxHeight: '88vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        padding: '36px'
      }}>
        {/* Nút đóng */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#f3ede7',
            border: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#423023'
          }}
        >
          ✕
        </button>

        {/* TIÊU ĐỀ */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>🛡️</span>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1f160f', margin: 0 }}>
            Cam kết An toàn & Khử trùng ToyShare
          </h2>
          <p style={{ color: '#7c6e65', fontSize: '15px', marginTop: '6px' }}>
            Sức khỏe và nụ cười của bé luôn là ưu tiên cao nhất tại ToyShare Vietnam
          </p>
        </div>

        {/* KHỐI 1: QUY TRÌNH 4 BƯỚC KHỬ TRÙNG CHUẨN Y TẾ */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#be6e15', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧼</span> Quy chuẩn Khử khuẩn 4 Cấp độ
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              {
                step: 'Bước 1: Làm sạch sinh học',
                icon: '🧴',
                desc: 'Lau sạch toàn diện bằng dung dịch enzym hữu cơ chiết xuất tự nhiên, loại bỏ vết bẩn và mồ hôi mà không chứa hóa chất độc hại.'
              },
              {
                step: 'Bước 2: Chiếu xạ cực tím UV-C',
                icon: '☀️',
                desc: 'Khử khuẩn bằng buồng chiếu tia UV-C bước sóng 254nm trong 15 phút, tiêu diệt 99.9% vi khuẩn, virus và mầm bệnh cứng đầu.'
              },
              {
                step: 'Bước 3: Kiểm định kết cấu vật lý',
                icon: '🔍',
                desc: 'Kiểm tra độ chắc chắn, mài nhẵn góc nhọn, kiểm tra pin sạc và dây buộc để đảm bảo an toàn tuyệt đối cho bàn tay non nớt của bé.'
              },
              {
                step: 'Bước 4: Niêm phong túi khí vô trùng',
                icon: '📦',
                desc: 'Đóng gói trong túi chống ẩm kháng khuẩn có dán tem niêm phong ToyShare Certified trước khi vận chuyển tới phụ huynh.'
              }
            ].map(item => (
              <div key={item.step} style={{ background: '#fff9f4', border: '1px solid #fae6d3', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  <strong style={{ fontSize: '15px', color: '#2d2520' }}>{item.step}</strong>
                </div>
                <p style={{ fontSize: '13px', color: '#68594e', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KHỐI 2: CƠ CHẾ BẢO VỆ TIỀN CỌC VIETQR ESCROW */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#be6e15', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💳</span> Cơ chế Ký quỹ Bảo chứng Tiền cọc (VietQR Escrow)
          </h3>
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '16px', padding: '20px', color: '#065f46', fontSize: '14px', lineHeight: '1.7' }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>1. Tiền cọc KHÔNG chuyển trực tiếp cho chủ đồ:</strong> Toàn bộ tiền cọc được lưu giữ tại tài khoản ký quỹ trung gian an toàn của hệ thống ToyShare.
            </p>
            <p style={{ marginBottom: '10px' }}>
              <strong>2. Minh chứng ảnh 3 bước rõ ràng:</strong> Khi giao đồ và trả đồ, cả 2 bên đều có bước chụp ảnh ghi nhận hiện trạng trên hệ thống để tránh tranh chấp vô lý.
            </p>
            <p style={{ margin: 0 }}>
              <strong>3. Hoàn tiền tự động 100%:</strong> Ngay sau khi chủ đồ xác nhận nhận lại đồ hoặc sau 24h không có khiếu nại, tiền cọc được hoàn về tài khoản ngân hàng của bạn.
            </p>
          </div>
        </div>

        {/* KHỐI 3: CAM KẾT BỒI THƯỜNG RỦI RO */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#be6e15', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤝</span> Chính sách Xử lý Hỏng hóc Thấu đáo
          </h3>
          <p style={{ fontSize: '14px', color: '#52473f', lineHeight: '1.7', margin: 0 }}>
            Chúng tôi hiểu trẻ em vui chơi khó tránh khỏi hao mòn tự nhiên (xước nhẹ, mòn sơn...). ToyShare <strong>miễn trừ trách nhiệm</strong> cho các hao mòn thông thường. Chỉ trường hợp gãy vỡ nặng hoặc mất linh kiện quan trọng mới áp dụng khấu trừ tiền cọc theo bảng giá linh kiện thực tế, có sự can thiệp và phân xử minh bạch của ban quản trị ToyShare.
          </p>
        </div>

        {/* NÚT ĐÓNG */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '14px 40px', fontSize: '16px', borderRadius: '30px' }}
          >
            Tôi đã hiểu & Tin tưởng ToyShare ✓
          </button>
        </div>

      </div>
    </div>
  );
}
