import React from 'react';

export default function CommercialFooter({ setPage, onOpenSafetyModal }) {
  return (
    <footer style={{ background: '#251b14', color: '#d5c7bc', paddingTop: '60px', paddingBottom: '30px', marginTop: '80px', borderTop: '4px solid #be6e15' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* HÀNG 1: 4 CỘT CHÍNH */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '40px', marginBottom: '50px' }}>
          
          {/* CỘT 1: VỀ TOYSHARE */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span style={{ fontSize: '32px' }}>🧸</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#ff9a42', letterSpacing: '-0.5px' }}>ToyShare</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#a8988b', marginBottom: '20px' }}>
              Nền tảng kinh tế chia sẻ đồ chơi trẻ em hàng đầu Việt Nam. Giúp các gia đình tiết kiệm đến 80% chi phí, bảo vệ môi trường và mang đến tuổi thơ đầy ắp bất ngờ cho bé yêu.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Facebook', 'YouTube', 'TikTok', 'Zalo'].map(net => (
                <span
                  key={net}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#ffc58d',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={`Theo dõi ToyShare trên ${net}`}
                >
                  {net}
                </span>
              ))}
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ & DANH MỤC */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Danh mục đồ chơi
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', lineHeight: '2.2' }}>
              {[
                'Đồ chơi Giáo dục & STEM',
                'Xếp hình Lego & Gỗ sáng tạo',
                'Xe cộ & Mô hình hành động',
                'Robot & Đồ chơi Công nghệ cao',
                'Gấu bông & Đồ chơi Nhập vai',
                'Đồ chơi Vận động & Ngoài trời'
              ].map(cat => (
                <li key={cat}>
                  <span
                    onClick={() => { if (setPage) setPage('home'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                    style={{ color: '#c4b5a8', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.color = '#ff9a42'}
                    onMouseOut={e => e.currentTarget.style.color = '#c4b5a8'}
                  >
                    › {cat}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: CHÍNH SÁCH & BẢO ĐẢM */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Chính sách an toàn
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', lineHeight: '2.2' }}>
              <li>
                <span
                  onClick={onOpenSafetyModal}
                  style={{ color: '#ffc58d', fontWeight: '600', cursor: 'pointer' }}
                >
                  🛡️ Quy chuẩn Khử trùng UV-C (Chi tiết)
                </span>
              </li>
              {[
                'Cơ chế Ký quỹ VietQR Escrow bảo vệ tiền cọc',
                'Quy định giải quyết tranh chấp & bồi thường',
                'Chính sách đổi trả đồ chơi trong 24h',
                'Bảo mật thông tin khách hàng',
                'Điều khoản dịch vụ cho Chủ đồ chơi'
              ].map(policy => (
                <li key={policy}>
                  <span
                    onClick={onOpenSafetyModal}
                    style={{ color: '#c4b5a8', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.color = '#ff9a42'}
                    onMouseOut={e => e.currentTarget.style.color = '#c4b5a8'}
                  >
                    › {policy}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 4: TRỤ SỞ & HỖ TRỢ KHÁCH HÀNG */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tổng đài phụ huynh
            </h4>
            <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#a8988b' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#ffffff' }}>Hotline CSKH (24/7):</strong><br />
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#ff9a42' }}>1900 8888</span> (Miễn phí)
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#ffffff' }}>Email hỗ trợ:</strong><br />
                support@toyshare.vn
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#ffffff' }}>Trung tâm đối soát & khử khuẩn:</strong><br />
                Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội
              </p>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#16a34a', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>ĐÃ XÁC THỰC</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Chứng nhận an toàn đồ chơi QCVN 3:2019/BKHCN</span>
              </div>
            </div>
          </div>
        </div>

        {/* HÀNG 2: THANH TOÁN BẢO CHỨNG & BẢN QUYỀN */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#7a6a5f' }}>
          <div>
            © 2026 <strong>ToyShare Vietnam</strong>. Giấy phép cung cấp dịch vụ sàn TMĐT số 0316889899/GP-BCT. Toàn bộ đồ chơi đều qua kiểm định an toàn trẻ em.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ color: '#a8988b' }}>Thanh toán bảo chứng qua:</span>
            <span style={{ background: '#fff', color: '#0054a6', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>VietQR</span>
            <span style={{ background: '#fff', color: '#da251d', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>NAPAS</span>
            <span style={{ background: '#fff', color: '#1a1f71', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>VISA / MASTER</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
