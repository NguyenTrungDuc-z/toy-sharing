import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export default function Profile({ user, onUserUpdated }) {
  const [profile, setProfile] = useState(user || {});
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notice, setNotice] = useState(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, { headers: getAuthHeaders() });
        setProfile(response.data.user);
      } catch (error) {
        setNotice({
          type: 'error',
          message: error.response?.data?.message || 'Không thể tải thông tin tài khoản.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileChange = (event) => {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setNotice(null);

    try {
      const updates = {
        name: profile.name,
        phone: profile.phone,
        address: profile.address || '',
        avatar: profile.avatar || '',
      };
      const response = await axios.put(`${API_URL}/me`, updates, { headers: getAuthHeaders() });
      setProfile(response.data.user);
      onUserUpdated(response.data.user);
      setNotice({ type: 'success', message: response.data.message });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.response?.data?.message || 'Không thể cập nhật thông tin tài khoản.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (event) => {
    setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setNotice(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setNotice({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await axios.patch(
        `${API_URL}/change-password`,
        { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword },
        { headers: getAuthHeaders() },
      );
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice({ type: 'success', message: response.data.message });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.response?.data?.message || 'Không thể đổi mật khẩu.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const fieldStyle = { display: 'grid', gap: '7px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 };
  const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #ebdcd0', borderRadius: '12px', fontSize: '14px', color: 'var(--text-main)', background: 'white' };
  const sectionStyle = { padding: '24px 0', borderTop: '1px solid #f1eae4' };
  const buttonStyle = { border: 'none', borderRadius: '12px', padding: '12px 18px', color: 'white', background: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' };

  if (loading) {
    return <p style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải thông tin...</p>;
  }

  return (
    <main style={{ maxWidth: '760px', margin: '36px auto 64px', padding: '0 20px' }}>
      <header style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>TÀI KHOẢN</p>
        <h1 style={{ fontSize: '30px', color: 'var(--text-main)' }}>Thông tin cá nhân</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>Quản lý hồ sơ và bảo mật tài khoản ToyShare.</p>
      </header>

      {notice && (
        <div role="status" style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', color: notice.type === 'success' ? '#166534' : '#b91c1c', background: notice.type === 'success' ? '#dcfce7' : '#fee2e2' }}>
          {notice.message}
        </div>
      )}

      <form onSubmit={handleSaveProfile}>
        <section style={{ display: 'grid', gap: '18px', paddingBottom: '24px' }}>
          <label style={fieldStyle}>
            Họ và tên
            <input name="name" value={profile.name || ''} onChange={handleProfileChange} style={inputStyle} required />
          </label>
          <label style={fieldStyle}>
            Email
            <input value={profile.email || ''} style={{ ...inputStyle, background: '#f8f6f3' }} disabled />
          </label>
          <label style={fieldStyle}>
            Số điện thoại
            <input name="phone" value={profile.phone || ''} onChange={handleProfileChange} style={inputStyle} required />
          </label>
          <label style={fieldStyle}>
            Địa chỉ
            <input name="address" value={profile.address || ''} onChange={handleProfileChange} style={inputStyle} />
          </label>
          <label style={fieldStyle}>
            Ảnh đại diện (URL)
            <input name="avatar" type="url" value={profile.avatar || ''} onChange={handleProfileChange} style={inputStyle} placeholder="https://example.com/avatar.jpg" />
          </label>
          {profile.avatar && (
            <img src={profile.avatar} alt="Ảnh đại diện hiện tại" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div>
            <button type="submit" style={buttonStyle} disabled={savingProfile}>
              {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </section>
      </form>

      <form onSubmit={handleChangePassword} style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '18px' }}>Đổi mật khẩu</h2>
        <div style={{ display: 'grid', gap: '18px', marginBottom: '18px' }}>
          <label style={fieldStyle}>
            Mật khẩu hiện tại
            <input name="currentPassword" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={handlePasswordChange} style={inputStyle} required />
          </label>
          <label style={fieldStyle}>
            Mật khẩu mới
            <input name="newPassword" type="password" autoComplete="new-password" minLength={8} value={passwords.newPassword} onChange={handlePasswordChange} style={inputStyle} required />
          </label>
          <label style={fieldStyle}>
            Xác nhận mật khẩu mới
            <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} value={passwords.confirmPassword} onChange={handlePasswordChange} style={inputStyle} required />
          </label>
        </div>
        <button type="submit" style={buttonStyle} disabled={savingPassword}>
          {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </main>
  );
}