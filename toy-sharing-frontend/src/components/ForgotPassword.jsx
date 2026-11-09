import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { App, Card, Form, Input, Button, Typography, Result, Alert, Flex } from 'antd';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { API_URL } from '../config';

const { Title, Text, Link } = Typography;
const BACKEND_URL = API_URL || '/api';

export default function ForgotPassword({ setPage, initialToken = '', initialEmail = '' }) {
  const { message } = App.useApp();
  const [step, setStep] = useState(initialToken ? 'reset' : 'input');
  const [email, setEmail] = useState(initialEmail || '');
  const [token, setToken] = useState(initialToken || '');
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [devNotice, setDevNotice] = useState(false);

  useEffect(() => {
    if (initialToken) { setToken(initialToken); setStep('reset'); }
    if (initialEmail) setEmail(initialEmail);
  }, [initialToken, initialEmail]);

  const handleRequest = async ({ email: em }) => {
    setLoading(true);
    setEmail(em);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/forgot-password`, { email: em });
      message.success(res.data.message);
      if (res.data.emailSent) { setStep('check_email'); setDevNotice(false); }
      else if (res.data.devResetToken) { setToken(res.data.devResetToken); setDevNotice(true); setStep('reset'); }
      else setStep('check_email');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu!');
    } finally { setLoading(false); }
  };

  const handleReset = async (v) => {
    const tk = v.token || token;
    if (!tk) { message.error('Thiếu mã xác nhận! Vui lòng bấm liên kết trong email.'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/reset-password`, { token: tk, email: v.email || email, newPassword: v.newPassword });
      message.success(res.data.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => setPage('login'), 1200);
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu!');
    } finally { setLoading(false); }
  };

  return (
    <Flex justify="center" style={{ padding: '48px 16px' }}>
      <Card style={{ width: '100%', maxWidth: 460 }}>
        {step === 'input' && (
          <>
            <Title level={3} style={{ marginBottom: 4 }}>Quên mật khẩu?</Title>
            <Text type="secondary">Nhập email đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu vào hòm thư.</Text>
            <Form layout="vertical" onFinish={handleRequest} requiredMark={false} style={{ marginTop: 24 }} initialValues={{ email }}>
              <Form.Item name="email" label="Email đăng ký"
                rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="hello@example.com" />
              </Form.Item>
              <Button type="primary" size="large" block htmlType="submit" loading={loading}>Gửi liên kết đặt lại</Button>
            </Form>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link onClick={() => setPage('login')}>Quay lại đăng nhập</Link>
            </div>
          </>
        )}

        {step === 'check_email' && (
          <Result
            status="success"
            title="Kiểm tra hộp thư của bạn"
            subTitle={<span>Chúng tôi đã gửi email đặt lại mật khẩu đến <strong>{email}</strong>. Mở email từ ToyShare và bấm nút đặt lại mật khẩu.</span>}
            extra={[
              <Button type="primary" key="gmail" href="https://mail.google.com" target="_blank">Mở hộp thư Gmail</Button>,
              <Button key="manual" onClick={() => { setStep('reset'); setShowManualInput(true); }}>Dán mã thủ công</Button>,
              <div key="back" style={{ marginTop: 12 }}>
                <Link onClick={() => setStep('input')}>Gửi lại hoặc đổi email khác</Link>
              </div>,
            ]}
          />
        )}

        {step === 'reset' && (
          <>
            <Title level={3} style={{ marginBottom: 4 }}>Đặt mật khẩu mới</Title>
            <Text type="secondary">Tạo mật khẩu an toàn mới cho tài khoản của bạn.</Text>

            {token && !showManualInput && (
              <Alert style={{ marginTop: 16 }} type="success" showIcon icon={<SafetyCertificateOutlined />}
                message="Đã xác thực liên kết email" description={<span>Tài khoản: <strong>{email}</strong></span>} />
            )}
            {devNotice && (
              <Alert style={{ marginTop: 16 }} type="info" showIcon
                message="Chế độ Dev" description="Chưa cấu hình Gmail trong .env, hệ thống tự điền mã để bạn thử nghiệm." />
            )}

            <Form layout="vertical" onFinish={handleReset} requiredMark={false} style={{ marginTop: 20 }} initialValues={{ email, token }}>
              {(!token || showManualInput) && (
                <>
                  <Form.Item name="email" label="Email của bạn"
                    rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
                    <Input size="large" prefix={<MailOutlined />} placeholder="hello@example.com" />
                  </Form.Item>
                  <Form.Item name="token" label="Mã xác nhận (Token từ email)" rules={[{ required: true, message: 'Dán mã token' }]}>
                    <Input size="large" placeholder="Dán mã token" />
                  </Form.Item>
                </>
              )}
              <Form.Item name="newPassword" label="Mật khẩu mới"
                rules={[{ required: true, message: 'Nhập mật khẩu mới' }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}>
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="Tối thiểu 8 ký tự" />
              </Form.Item>
              <Form.Item name="confirmPassword" label="Xác nhận mật khẩu mới" dependencies={['newPassword']}
                rules={[{ required: true, message: 'Xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({ validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                  } })]}>
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
              </Form.Item>
              <Button type="primary" size="large" block htmlType="submit" loading={loading}>Lưu mật khẩu mới</Button>
            </Form>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link onClick={() => setPage('login')}>Quay lại đăng nhập</Link>
            </div>
          </>
        )}
      </Card>
    </Flex>
  );
}
