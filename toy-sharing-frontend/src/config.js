// Nguồn duy nhất cho địa chỉ backend. Đổi 1 chỗ qua biến môi trường VITE_API_URL.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${API_BASE}/api`;
