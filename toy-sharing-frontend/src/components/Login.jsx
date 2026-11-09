import React from 'react';
import axios from 'axios';
import { App, Card, Form, Input, Button, Checkbox, Typography, Divider, Flex } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import GoogleLoginButton from './GoogleLoginButton';

const { Title, Text, Link } = Typography;

export default function Login({ setPage, setUser }) {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = React.useState(false);

  const showToast = (msg, type = 'success') => {
    if (type === 'error') message.error(msg);
    else if (type === 'info') message.info(msg);
    else message.success(msg);
  };

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      showToast(res.data.message || 'Đăng nhập thành công!', 'success');
      if (res.data.token) localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user?.role) localStorage.setItem('role', res.data.user.role);
      if (res.data.user?.id || res.data.user?._id) localStorage.setItem('userId', res.data.user.id || res.data.user._id);
      if (setUser) setUser(res.data.user);
      setPage(res.data.user?.role === 'admin' ? 'admin-dashboard' : 'home');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        modal.confirm({
          title: 'Email chưa được xác thực',
          content: 'Tài khoản của bạn cần xác thực email trước khi đăng nhập. Gửi lại liên kết xác thực tới email của bạn?',
          okText: 'Gửi lại email', cancelText: 'Để sau',
          onOk: async () => {
            try { await axios.post('/api/auth/resend-verification', { email: data.email || email }); showToast('Đã gửi lại liên kết xác thực. Vui lòng kiểm tra email.', 'success'); }
            catch { showToast('Không gửi lại được. Vui lòng thử lại sau.', 'error'); }
          }
        });
      } else {
        showToast(data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex justify="center" align="center" style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 16px' }}>
      <Card style={{ width: '100%', maxWidth: 960, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Flex wrap>
          {/* Panel thương hiệu */}
          <div style={{ flex: '1 1 360px', background: 'linear-gradient(160deg,#0b6e8f 0%,#0a5e79 100%)', color: '#fff', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
            <Text style={{ color: '#bfe3ee', fontWeight: 700, letterSpacing: 0.5 }}>ToyShare</Text>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>Chia sẻ niềm vui, từng món đồ chơi một</Title>
            <Text style={{ color: '#d6eef4', fontSize: 15 }}>
              Cộng đồng phụ huynh Việt cho mượn đồ chơi an toàn — ký quỹ qua VietQR, có bằng chứng bàn giao và hoàn cọc minh bạch.
            </Text>
          </div>

          {/* Panel form */}
          <div style={{ flex: '1 1 380px', padding: '40px' }}>
            <Title level={3} style={{ marginBottom: 4 }}>Chào mừng trở lại</Title>
            <Text type="secondary">Đăng nhập để quản lý đồ chơi và yêu cầu mượn.</Text>

            <Form layout="vertical" onFinish={onFinish} requiredMark={false} style={{ marginTop: 24 }}>
              <Form.Item name="email" label="Email"
                rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="hello@example.com" autoComplete="email" />
              </Form.Item>

              <Form.Item name="password" label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]} style={{ marginBottom: 8 }}>
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
              </Form.Item>

              <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                <Link onClick={() => setPage('forgot-password')}>Quên mật khẩu?</Link>
              </Flex>

              <Button type="primary" size="large" block htmlType="submit" loading={loading}>Đăng nhập</Button>
            </Form>

            <Divider plain style={{ color: '#9fb2ba', fontSize: 12 }}>hoặc tiếp tục với</Divider>

            <GoogleLoginButton
              showToast={showToast}
              onLogin={(u) => {
                if (setUser) setUser(u);
                setPage(u?.role === 'admin' ? 'admin-dashboard' : 'home');
              }}
            />

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Text type="secondary">Chưa có tài khoản? </Text>
              <Link onClick={() => setPage('register')} strong>Đăng ký ngay</Link>
            </div>
          </div>
        </Flex>
      </Card>
    </Flex>
  );
}
