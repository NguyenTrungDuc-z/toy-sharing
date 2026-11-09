// Ant Design theme cho ToyShare — teal-blue #0B6E8F + mango #FFB627 trên nền trắng mát.
// Giữ status: success xanh lá, warning hổ phách, error đỏ.
export const toyShareTheme = {
  token: {
    colorPrimary: '#0b6e8f',
    colorInfo: '#0b6e8f',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorLink: '#0b6e8f',
    colorLinkHover: '#0a5e79',
    colorTextBase: '#16262e',
    colorBgLayout: '#f6f8fa',
    borderRadius: 10,
    fontFamily: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 68,
      bodyBg: '#f6f8fa',
    },
    Button: {
      fontWeight: 600,
      primaryShadow: '0 2px 8px rgba(11,110,143,0.22)',
    },
    Card: {
      borderRadiusLG: 14,
    },
    Menu: {
      itemSelectedColor: '#0b6e8f',
      itemColor: '#4a5a62',
      horizontalItemSelectedColor: '#0b6e8f',
    },
  },
};

// Màu mango dùng cho sao đánh giá, giá nổi bật, chip đang chọn (nền vàng, chữ tối).
export const MANGO = '#ffb627';
export const MANGO_INK = '#16262e';
