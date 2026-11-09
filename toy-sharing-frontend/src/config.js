// Nguồn duy nhất cho địa chỉ backend. Đổi 1 chỗ qua biến môi trường VITE_API_URL.
// Chuẩn hoá: chấp nhận cả giá trị cũ có "/api" ở cuối, luôn quy về GỐC (không có /api)
// để tránh lặp "/api/api".
const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = raw.replace(/\/+$/, '').replace(/\/api$/, '');
export const API_URL = `${API_BASE}/api`;
