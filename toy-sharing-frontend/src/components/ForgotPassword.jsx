import React, { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword({ setPage }) {
  const [step, setStep] = useState(1); // 1 = nhập email, 2 = nhập token + mật khẩu mới
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      showToast(res.data.message, 'success');
      // Dev mode: token trả về trực tiếp để điền sẵn
      if (res.data.devResetToken) {
        setToken(res.data.devResetToken);
      }
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Mật khẩu phải có ít nhất 8 ký tự!', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        token, email, newPassword
      });
      showToast(res.data.message, 'success');
      setTimeout(() => setPage('login'), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2d8cf', backgroundColor: '#fff', fontSize: '14px', marginBottom: '16px' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4a3f35' };

  return (
    <div style={{ maxWidth: '460px', margin: '60px auto', background: '#fffbf7', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px rgba(92,77,66,0.06)' }}>
      <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1512', marginBottom: '8px' }}>
        {step === 1 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
      </h2>
      <p style={{ color: '#7c6e65', fontSize: '14px', marginBottom: '28px' }}>
        {step === 1
          ? 'Nhập email để nhận link đặt lại mật khẩu.'
          : 'Nhập mã xác nhận và mật khẩu mới của bạn.'}
      </p>

      {step === 1 ? (
        <form onSubmit={handleRequest}>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="hello@example.com" style={inputStyle} />
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px' }}>
            {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <label style={labelStyle}>Mã xác nhận (token)</label>
          <input type="text" value={token} onChange={e => setToken(e.target.value)} required placeholder="Dán mã token" style={inputStyle} />
          <label style={labelStyle}>Mật khẩu mới</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} placeholder="Tối thiểu 8 ký tự" style={inputStyle} />
          <label style={labelStyle}>Xác nhận mật khẩu</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} style={inputStyle} />
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px' }}>
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#7c6e65' }}>
        <span onClick={() => setPage('login')} style={{ color: '#4f46e5', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>← Quay lại đăng nhập</span>
      </p>

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '16px 24px', borderRadius: '12px', backgroundColor: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#ef4444' : '#3b82f6', color: 'white', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, maxWidth: '360px' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
