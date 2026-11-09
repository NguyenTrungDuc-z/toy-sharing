import React from 'react';
import axios from 'axios';
import { App, Card, Form, Input, Button, Checkbox, Typography, Flex } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text, Link } = Typography;

export default function Register({ setPage }) {
  const { message } = App.useApp();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (v) => {
    if (!v.agree) { message.error('Vui lòng đồng ý với Hướng dẫn an toàn & Điều khoản dịch vụ!'); return; }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name: v.name, email: v.email, password: v.password, phone: v.phone,
      });
      message.success(res.data.message || 'Đăng ký thành công!');
      setPage('login');
    } catch (err) {
      message.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { t: 'Cộng đồng an toàn', d: 'Thành viên được xác minh, đồ chơi kiểm duyệt kỹ.' },
    { t: 'Thân thiện môi trường', d: 'Mỗi món đồ chơi có thêm vòng đời mới, giảm rác thải.' },
    { t: 'Tiết kiệm chi phí', d: 'Mượn hàng trăm đồ chơi mà không tốn tiền mua mới.' },
  ];

  return (
    <Flex justify="center" align="center" style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 16px' }}>
      <Card style={{ width: '100%', maxWidth: 980, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Flex wrap>
          <div style={{ flex: '1 1 360px', background: 'linear-gradient(160deg,#0b6e8f 0%,#0a5e79 100%)', color: '#fff', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>Tham gia cộng đồng chia sẻ</Title>
            <Flex vertical gap={14}>
              {benefits.map(b => (
                <div key={b.t}>
                  <Text strong style={{ color: '#fff' }}>{b.t}</Text>
                  <div style={{ color: '#d6eef4', fontSize: 13 }}>{b.d}</div>
                </div>
              ))}
            </Flex>
          </div>

          <div style={{ flex: '1 1 400px', padding: '40px' }}>
            <Title level={3} style={{ marginBottom: 4 }}>Tạo tài khoản</Title>
            <Text type="secondary">Chỉ một phút để bắt đầu chia sẻ niềm vui.</Text>

            <Form layout="vertical" onFinish={onFinish} requiredMark={false} style={{ marginTop: 24 }}>
              <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                <Input size="large" prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
              </Form.Item>
              <Flex gap={12} wrap>
                <Form.Item name="email" label="Email" style={{ flex: '1 1 200px' }}
                  rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
                  <Input size="large" prefix={<MailOutlined />} placeholder="email@example.com" />
                </Form.Item>
                <Form.Item name="phone" label="Số điện thoại" style={{ flex: '1 1 160px' }}
                  rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                  <Input size="large" prefix={<PhoneOutlined />} placeholder="090xxxxxxx" />
                </Form.Item>
              </Flex>
              <Flex gap={12} wrap>
                <Form.Item name="password" label="Mật khẩu" style={{ flex: '1 1 180px' }}
                  rules={[{ required: true, message: 'Nhập mật khẩu' }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}>
                  <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>
                <Form.Item name="confirmPassword" label="Xác nhận mật khẩu" style={{ flex: '1 1 180px' }} dependencies={['password']}
                  rules={[{ required: true, message: 'Xác nhận mật khẩu' },
                    ({ getFieldValue }) => ({ validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                    } })]}>
                  <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>
              </Flex>
              <Form.Item name="agree" valuePropName="checked" style={{ marginBottom: 16 }}>
                <Checkbox>Tôi đồng ý với Hướng dẫn an toàn & Điều khoản dịch vụ</Checkbox>
              </Form.Item>
              <Button type="primary" size="large" block htmlType="submit" loading={loading}>Tạo tài khoản</Button>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Text type="secondary">Đã có tài khoản? </Text>
              <Link onClick={() => setPage('login')} strong>Đăng nhập</Link>
            </div>
          </div>
        </Flex>
      </Card>
    </Flex>
  );
}
