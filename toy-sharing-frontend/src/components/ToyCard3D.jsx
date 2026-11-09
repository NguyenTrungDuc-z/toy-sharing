import React, { useRef, useState } from 'react';

export default function ToyCard3D({
  toy,
  isFavorite,
  onToggleFavorite,
  onClick,
  onBorrowClick,
  isOwnToy,
}) {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Tính toán góc nghiêng 3D (Max 12 độ)
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.28,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  const ownerName = typeof toy.ownerId === 'object' ? toy.ownerId?.name : (toy.ownerName || 'Chủ đồ chơi');

  return (
    <div
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          background: '#ffffff',
          borderRadius: '26px',
          border: isHovered ? '1.5px solid #fed7aa' : '1.5px solid #ede4dc',
          boxShadow: isHovered
            ? '0 20px 40px rgba(234, 88, 12, 0.16), 0 4px 12px rgba(0, 0, 0, 0.04)'
            : '0 4px 16px rgba(41, 37, 36, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transform: isHovered
            ? `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`
            : 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)',
          transition: isHovered
            ? 'transform 0.1s ease-out, box-shadow 0.2s ease, border-color 0.2s ease'
            : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease, border-color 0.4s ease',
          willChange: 'transform',
        }}
      >
        {/* LỚP PHẢN CHIẾU ÁNH SÁNG 3D (HOLOGRAPHIC GLARE) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 6,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${glare.opacity}) 0%, rgba(255, 255, 255, 0) 65%)`,
            transition: 'opacity 0.2s ease',
          }}
        />

        {/* ẢNH ĐỒ CHƠI & BADGES */}
        <div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '196px',
              background: 'radial-gradient(circle at 50% 30%, #fff7ed 0%, #fef3c7 100%)',
              overflow: 'hidden',
            }}
          >
            {toy.images && toy.images.length > 0 ? (
              <img
                src={toy.images[0]}
                alt={toy.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 0.4s ease',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                }}
              >
                🧸
              </div>
            )}

            {/* Nút Tim Yêu Thích 3D */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleFavorite) onToggleFavorite(toy, e);
              }}
              title={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 7,
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(6px)',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: isFavorite ? '#dc2626' : '#a8a29e',
                boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                transition: 'all 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.88)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isFavorite ? '♥' : '♡'}
            </button>

            {/* Badge Khử trùng UV-C VIP */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 7,
                background: 'rgba(22, 163, 74, 0.92)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
              }}
            >
              <span>🛡️</span>
              <span>100% UV-C</span>
            </div>

            {/* Badge địa điểm */}
            {toy.location && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  zIndex: 7,
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(6px)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#44403c',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                }}
              >
                📍 {toy.location}
              </span>
            )}
          </div>

          {/* THÔNG TIN CHÍNH */}
          <div style={{ padding: '16px 16px 8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: '#ea580c',
                  background: '#fff7ed',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  border: '1px solid #fed7aa',
                }}
              >
                {toy.category || 'Đồ chơi'}
              </span>
              <span style={{ fontSize: '12px', color: '#78716c', fontWeight: '600' }}>
                {toy.ageRange || 'Mọi lứa tuổi'}
              </span>
            </div>

            <h3
              style={{
                fontSize: '16px',
                fontWeight: '800',
                color: '#1c1917',
                lineHeight: '1.4',
                height: '44px',
                overflow: 'hidden',
                margin: '8px 0 6px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {toy.name}
            </h3>

            {/* Đánh giá sao & Chủ sở hữu */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#f59e0b', fontWeight: '800' }}>
                  ★ {toy.rating?.avg > 0 ? toy.rating.avg.toFixed(1) : '5.0'}
                </span>
                <span style={{ color: '#a8a29e' }}>
                  ({toy.rating?.count || 0})
                </span>
              </div>
              <span style={{ color: '#78716c', fontStyle: 'italic' }}>
                {ownerName}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER: TIỀN CỌC & NÚT MƯỢN 3D */}
        <div
          style={{
            padding: '12px 16px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #f6f1ea',
            marginTop: '8px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#78716c', display: 'block' }}>
              Tiền cọc an toàn
            </span>
            <strong
              style={{
                fontSize: '16px',
                fontWeight: '900',
                color: '#ea580c',
                letterSpacing: '-0.3px',
              }}
            >
              {(toy.depositRequired || 0).toLocaleString()}đ
            </strong>
          </div>

          {isOwnToy ? (
            <span
              style={{
                fontSize: '12px',
                color: '#78716c',
                fontWeight: '700',
                background: '#f5f0eb',
                padding: '6px 14px',
                borderRadius: '16px',
              }}
            >
              Của bạn
            </span>
          ) : toy.status === 'borrowed' ? (
            <span
              style={{
                fontSize: '12px',
                color: '#b45309',
                fontWeight: '700',
                background: '#fef3c7',
                padding: '6px 14px',
                borderRadius: '16px',
              }}
            >
              Đang mượn
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBorrowClick) onBorrowClick(toy, e);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '24px',
                background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow:
                  '0 3px 0 #9a3412, 0 8px 16px rgba(234, 88, 12, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                transition: 'all 0.12s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(3px)';
                e.currentTarget.style.boxShadow =
                  '0 0 0 #9a3412, 0 2px 4px rgba(234, 88, 12, 0.2)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 3px 0 #9a3412, 0 8px 16px rgba(234, 88, 12, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.4)';
              }}
            >
              Mượn ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
