import { useEffect, useState } from 'react';
import axios from 'axios';
import { App, Card, Form, Input, Button, Avatar, Upload, Row, Col, Statistic, Typography, Divider, Flex, Spin } from 'antd';
import {
  UserOutlined, UploadOutlined, AppstoreOutlined, SwapOutlined, InboxOutlined,
  ClockCircleOutlined, StarOutlined,
} from '@ant-design/icons';

const API_URL = 'http://localhost:5000/api/auth';
const { Title, Text } = Typography;

export default function Profile({ user, onUserUpdated }) {
  const { message } = App.useApp();
  const [profileForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [stats, setStats] = useState(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    axios.get(`${API_URL}/me`, { headers: authHeaders() })
      .then(res => {
        const u = res.data.user;
        profileForm.setFieldsValue({ name: u.name, email: u.email, phone: u.phone, address: u.address, avatarUrl: u.avatar?.startsWith('data:') ? '' : (u.avatar || '') });
        setAvatar(u.avatar || '');
      })
      .catch(err => message.error(err.response?.data?.message || 'Không thể tải thông tin tài khoản.'))
      .finally(() => setLoading(false));

    axios.get('http://localhost:5000/api/users/me/stats', { headers: authHeaders() })
      .then(res => setStats(res.data)).catch(() => {});
  }, []);

  const saveProfile = async (v) => {
    setSavingProfile(true);
    try {
      const updates = { name: v.name, phone: v.phone, address: v.address || '', avatar: avatar || v.avatarUrl || '' };
      const res = await axios.put(`${API_URL}/me`, updates, { headers: authHeaders() });
      onUserUpdated(res.data.user);
      setAvatar(res.data.user.avatar || '');
      message.success(res.data.message || 'Đã cập nhật hồ sơ!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể cập nhật thông tin tài khoản.');
    } finally { setSavingProfile(false); }
  };

  const changePassword = async (v) => {
    setSavingPassword(true);
    try {
      const res = await axios.patch(`${API_URL}/change-password`,
        { currentPassword: v.currentPassword, newPassword: v.newPassword }, { headers: authHeaders() });
      pwForm.resetFields();
      message.success(res.data.message || 'Đổi mật khẩu thành công!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể đổi mật khẩu.');
    } finally { setSavingPassword(false); }
  };

  const beforeAvatarUpload = (file) => {
    if (file.size > 2 * 1024 * 1024) { message.error('Ảnh tối đa 2MB'); return Upload.LIST_IGNORE; }
    const reader = new FileReader();
    reader.onloadend = () => { setAvatar(reader.result); profileForm.setFieldValue('avatarUrl', ''); };
    reader.readAsDataURL(file);
    return false;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" /></div>;

  const statItems = stats ? [
    { label: 'Đồ chơi đăng', value: stats.totalToys, icon: <AppstoreOutlined /> },
    { label: 'Đã cho mượn', value: stats.totalLent, icon: <SwapOutlined /> },
    { label: 'Đã đi mượn', value: stats.totalBorrowed, icon: <InboxOutlined /> },
    { label: 'Trả đúng hạn', value: `${stats.onTimeRate}%`, icon: <ClockCircleOutlined /> },
    { label: 'Đánh giá nhận', value: stats.reviewsReceived, icon: <StarOutlined /> },
  ] : [];

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 56px' }}>
      <Title level={3} style={{ marginBottom: 4 }}>Thông tin cá nhân</Title>
      <Text type="secondary">Quản lý hồ sơ và bảo mật tài khoản ToyShare.</Text>

      {stats && (
        <Row gutter={[12, 12]} style={{ margin: '20px 0' }}>
          {statItems.map(s => (
            <Col xs={12} sm={8} md={Math.floor(24 / 5) || 4} key={s.label} style={{ flex: '1 1 140px', maxWidth: '20%' }}>
              <Card styles={{ body: { padding: 16, textAlign: 'center' } }}>
                <div style={{ color: 'var(--color-primary)', fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <Statistic value={s.value} valueStyle={{ fontSize: 22, fontWeight: 700 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card style={{ marginTop: stats ? 0 : 20 }}>
        <Flex align="center" gap={20} wrap style={{ marginBottom: 24 }}>
          <Avatar size={80} src={avatar || undefined} icon={<UserOutlined />} style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }} />
          <Upload accept="image/*" showUploadList={false} beforeUpload={beforeAvatarUpload}>
            <Button icon={<UploadOutlined />}>Tải ảnh đại diện</Button>
          </Upload>
        </Flex>

        <Form form={profileForm} layout="vertical" onFinish={saveProfile} requiredMark={false}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email"><Input size="large" disabled /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="address" label="Địa chỉ"><Input size="large" /></Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="avatarUrl" label="Hoặc nhập URL ảnh đại diện">
                <Input size="large" placeholder="https://..." onChange={e => { if (e.target.value) setAvatar(e.target.value); }} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" size="large" htmlType="submit" loading={savingProfile}>Lưu hồ sơ</Button>
        </Form>

        <Divider />

        <Title level={4}>Đổi mật khẩu</Title>
        <Form form={pwForm} layout="vertical" onFinish={changePassword} requiredMark={false}>
          <Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}>
            <Input.Password size="large" autoComplete="current-password" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="newPassword" label="Mật khẩu mới"
                rules={[{ required: true, message: 'Nhập mật khẩu mới' }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}>
                <Input.Password size="large" autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="confirmPassword" label="Xác nhận mật khẩu mới" dependencies={['newPassword']}
                rules={[{ required: true, message: 'Xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({ validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                  } })]}>
                <Input.Password size="large" autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" size="large" htmlType="submit" loading={savingPassword}>Đổi mật khẩu</Button>
        </Form>
      </Card>
    </div>
  );
}
