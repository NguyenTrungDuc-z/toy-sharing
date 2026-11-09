import React, { useState } from 'react';

export default function FloatingSupport({ onOpenSafetyModal, onScrollToFaq }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 2900 }}>
      {/* Menu xổ lên khi bấm nút */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '0',
          width: '280px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 12px 35px rgba(66, 48, 35, 0.18)',
          border: '1px solid #fae6d3',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ borderBottom: '1px solid #f4eae1', paddingBottom: '10px', marginBottom: '4px' }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#be6e15' }}>Hỗ trợ Phụ huynh 24/7</div>
            <div style={{ fontSize: '12px', color: '#8a776a' }}>Đội ngũ tư vấn viên luôn sẵn sàng</div>
          </div>

          <a
            href="tel:19008888"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#fff9f4',
              color: '#423023',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
          >
            <span style={{ fontSize: '20px' }}>📞</span>
            <div>
              <div>Gọi Hotline: 1900 8888</div>
              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '500' }}>Miễn phí cuộc gọi</div>
            </div>
          </a>

          <a
            href="https://zalo.me"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#f0f9ff',
              color: '#0369a1',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            <span style={{ fontSize: '20px' }}>💬</span>
            <div>
              <div>Chat qua Zalo OA</div>
              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '500' }}>Phản hồi dưới 3 phút</div>
            </div>
          </a>

          <button
            onClick={() => {
              setIsOpen(false);
              if (onOpenSafetyModal) onOpenSafetyModal();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#ecfdf5',
              color: '#065f46',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>Xem Cam kết Khử trùng UV</div>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              if (onScrollToFaq) onScrollToFaq();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#fdf8f4',
              color: '#7c6e65',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '20px' }}>❓</span>
            <div>Câu hỏi thường gặp (FAQ)</div>
          </button>
        </div>
      )}

      {/* Nút bấm tròn nổi chính */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          backgroundColor: '#be6e15',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(190, 110, 21, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        title="Trợ giúp phụ huynh 24/7"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
