import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const BACKEND_URL = API_URL || 'http://localhost:5000/api';

export default function ForgotPassword({ setPage, initialToken = '', initialEmail = '' }) {
  const [step, setStep] = useState(initialToken ? 2 : 1); // 1 = nhập email, 2 = nhập token + mật khẩu mới
  const [email, setEmail] = useState(initialEmail || '');
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [devNotice, setDevNotice] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setStep(2);
    }
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialToken, initialEmail]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/forgot-password`, { email });
      showToast(res.data.message, 'success');

      // Nếu backend gửi email thành công
      if (res.data.emailSent) {
        setEmailSentNotice(true);
        setDevNotice(false);
      } else if (res.data.devResetToken) {
        // Dev mode: Chưa cấu hình EMAIL_USER/EMAIL_PASS trong .env
        setToken(res.data.devResetToken);
        setDevNotice(true);
        setEmailSentNotice(false);
      }

      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu!', 'error');
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
      const res = await axios.post(`${BACKEND_URL}/auth/reset-password`, {
        token, email, newPassword
      });
      showToast(res.data.message, 'success');
      setTimeout(() => setPage('login'), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu!', 'error');
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
      <p style={{ color: '#7c6e65', fontSize: '14px', marginBottom: '24px' }}>
        {step === 1
          ? 'Nhập địa chỉ email đăng ký để nhận mã và liên kết đặt lại mật khẩu.'
          : 'Nhập mã xác nhận (đã gửi tới email) và mật khẩu mới của bạn.'}
      </p>

      {/* Thông báo nếu gửi email thật thành công */}
      {step === 2 && emailSentNotice && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '13px',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          📧 <strong>Đã gửi email thành công!</strong> Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác/Spam) của <strong>{email}</strong> để lấy mã xác nhận.
        </div>
      )}

      {/* Thông báo nếu chạy chế độ dev (chưa cấu hình email trong .env) */}
      {step === 2 && devNotice && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '13px',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          ⚙️ <strong>Chế độ phát triển (Dev Mode):</strong> Chưa cấu hình Gmail trong <code>.env</code> backend, mã token đã được tự động điền bên dưới để thử nghiệm.
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequest}>
          <label style={labelStyle}>Email đăng ký</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="hello@example.com"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px' }}
          >
            {loading ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <label style={labelStyle}>Email của bạn</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="hello@example.com"
            style={inputStyle}
          />
          <label style={labelStyle}>Mã xác nhận (token trong email)</label>
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            required
            placeholder="Dán mã token gồm 64 ký tự nhận được từ email"
            style={inputStyle}
          />
          <label style={labelStyle}>Mật khẩu mới</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Tối thiểu 8 ký tự"
            style={inputStyle}
          />
          <label style={labelStyle}>Xác nhận mật khẩu</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Nhập lại mật khẩu mới"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px' }}
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
            <span
              onClick={() => { setStep(1); setToken(''); }}
              style={{ color: '#4b5563', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Nhập lại email khác hoặc gửi lại mã
            </span>
          </p>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#7c6e65' }}>
        <span onClick={() => setPage('login')} style={{ color: '#4f46e5', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
          ← Quay lại đăng nhập
        </span>
      </p>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          maxWidth: '380px'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
