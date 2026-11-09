import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const BACKEND_URL = API_URL || 'http://localhost:5000/api';

export default function ForgotPassword({ setPage, initialToken = '', initialEmail = '' }) {
  // Các trạng thái bước:
  // 'input': Form nhập email
  // 'check_email': Thông báo đã gửi mail, hướng dẫn mở mail bấm link
  // 'reset': Form đặt mật khẩu mới (đã có token từ link click)
  const [step, setStep] = useState(initialToken ? 'reset' : 'input');
  const [email, setEmail] = useState(initialEmail || '');
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [devNotice, setDevNotice] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setStep('reset');
    }
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialToken, initialEmail]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Gửi email yêu cầu đặt lại mật khẩu
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/forgot-password`, { email });
      showToast(res.data.message, 'success');

      if (res.data.emailSent) {
        setStep('check_email');
        setDevNotice(false);
      } else if (res.data.devResetToken) {
        // Dev mode fallback
        setToken(res.data.devResetToken);
        setDevNotice(true);
        setStep('reset');
      } else {
        setStep('check_email');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Lưu mật khẩu mới
  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Thiếu mã xác nhận! Vui lòng nhấp vào liên kết trong email.', 'error');
      return;
    }
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
      showToast(res.data.message || 'Đặt lại mật khẩu thành công!', 'success');
      setTimeout(() => setPage('login'), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #e2d8cf',
    backgroundColor: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box'
  };
  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#4a3f35'
  };

  return (
    <div style={{ maxWidth: '480px', margin: '60px auto', background: '#fffbf7', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px rgba(92,77,66,0.06)' }}>

      {/* ==================== BƯỚC 1: NHẬP EMAIL ==================== */}
      {step === 'input' && (
        <>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1512', marginBottom: '8px' }}>
            Quên mật khẩu?
          </h2>
          <p style={{ color: '#7c6e65', fontSize: '14px', marginBottom: '24px' }}>
            Nhập địa chỉ email của bạn. Chúng tôi sẽ gửi một liên kết đặt lại mật khẩu trực tiếp vào hòm thư.
          </p>

          <form onSubmit={handleRequest}>
            <label style={labelStyle}>Email đăng ký</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="hello@example.com"
              style={{ ...inputStyle, marginBottom: '20px' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px' }}
            >
              {loading ? 'Đang gửi email...' : 'Gửi liên kết đặt lại mật khẩu'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#7c6e65' }}>
            <span onClick={() => setPage('login')} style={{ color: '#4f46e5', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
              ← Quay lại đăng nhập
            </span>
          </p>
        </>
      )}

      {/* ==================== BƯỚC 2: MÀN HÌNH CHỜ CLICK EMAIL ==================== */}
      {step === 'check_email' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📬</div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#1a1512', marginBottom: '12px' }}>
            Kiểm tra hộp thư của bạn!
          </h2>
          <p style={{ color: '#52473f', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px' }}>
            Chúng tôi đã gửi email đặt lại mật khẩu đến:<br />
            <strong style={{ color: '#ff6b35', fontSize: '16px' }}>{email}</strong>
          </p>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '16px', marginBottom: '24px', textAlign: 'left', fontSize: '13px', color: '#065f46', lineHeight: '1.6' }}>
            ✨ <strong>Rất đơn giản:</strong> Bạn chỉ cần mở email từ <em>ToyShare</em> và bấm vào nút <strong>"👉 Đặt lại mật khẩu ngay"</strong> để tạo mật khẩu mới mà không cần copy hay gõ bất kỳ mã nào!
          </div>

          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ display: 'flex', width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px', textDecoration: 'none', marginBottom: '14px', boxSizing: 'border-box' }}
          >
            Mở hộp thư Gmail ↗
          </a>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', fontSize: '13px' }}>
            <span
              onClick={() => setStep('input')}
              style={{ color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Gửi lại hoặc đổi email khác
            </span>

            <span
              onClick={() => { setStep('reset'); setShowManualInput(true); }}
              style={{ color: '#9ca3af', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}
            >
              Dán mã thủ công
            </span>
          </div>
        </div>
      )}

      {/* ==================== BƯỚC 3: ĐẶT MẬT KHẨU MỚI (CLICK TỪ LINK) ==================== */}
      {step === 'reset' && (
        <>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1512', marginBottom: '8px' }}>
            Đặt mật khẩu mới
          </h2>
          <p style={{ color: '#7c6e65', fontSize: '14px', marginBottom: '20px' }}>
            Tạo mật khẩu an toàn mới cho tài khoản của bạn.
          </p>

          {/* Banner thông báo click từ link thành công */}
          {token && !showManualInput && (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '13px', color: '#065f46', fontWeight: '700' }}>Đã xác thực liên kết email</div>
                <div style={{ fontSize: '13px', color: '#047857' }}>Tài khoản: <strong>{email}</strong></div>
              </div>
            </div>
          )}

          {/* Thông báo dev mode (nếu có) */}
          {devNotice && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '13px',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              ⚙️ <strong>Chế độ Dev:</strong> Chưa cấu hình Gmail trong <code>.env</code>, hệ thống tự động điền mã để bạn thử nghiệm.
            </div>
          )}

          <form onSubmit={handleReset}>
            {/* Nếu mở qua link trong email: Ô TOKEN VÀ Ô EMAIL ĐƯỢC ẨN ĐI HOÀN TOÀN */}
            {(!token || showManualInput) && (
              <>
                <label style={labelStyle}>Email của bạn</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="hello@example.com"
                  style={{ ...inputStyle, marginBottom: '14px' }}
                />
                <label style={labelStyle}>Mã xác nhận (Token từ email)</label>
                <input
                  type="text"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  required
                  placeholder="Dán mã token"
                  style={{ ...inputStyle, marginBottom: '14px' }}
                />
              </>
            )}

            <label style={labelStyle}>Mật khẩu mới</label>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Tối thiểu 8 ký tự"
                style={{ ...inputStyle, paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#6b7280'
                }}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>

            <label style={labelStyle}>Xác nhận mật khẩu mới</label>
            <div style={{ position: 'relative', marginBottom: '22px' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Nhập lại mật khẩu mới"
                style={{ ...inputStyle, paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#6b7280'
                }}
                title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? '👁️' : '🙈'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'center', fontSize: '15px' }}
            >
              {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#7c6e65' }}>
            <span onClick={() => setPage('login')} style={{ color: '#4f46e5', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
              ← Quay lại đăng nhập
            </span>
          </p>
        </>
      )}

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
