import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, Result, Button, Spin, Input, Flex, Typography } from 'antd';

const { Text } = Typography;

export default function VerifyEmail({ setPage, token, email }) {
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [msg, setMsg] = useState('');
  const [resendEmail, setResendEmail] = useState(email || '');
  const [resending, setResending] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; ran.current = true;
    if (!token || !email) { setStatus('error'); setMsg('Liên kết xác thực không hợp lệ.'); return; }
    axios.post('/api/auth/verify-email', { token, email })
      .then(res => { setStatus('success'); setMsg(res.data.message || 'Xác thực email thành công!'); })
      .catch(err => { setStatus('error'); setMsg(err.response?.data?.message || 'Xác thực thất bại.'); });
  }, [token, email]);

  const handleResend = async () => {
    if (!resendEmail.trim()) return;
    setResending(true);
    try {
      const res = await axios.post('/api/auth/resend-verification', { email: resendEmail.trim() });
      setMsg(res.data.message || 'Đã gửi lại liên kết xác thực (nếu email cần xác thực).');
    } catch { setMsg('Không gửi lại được. Vui lòng thử lại sau.'); }
    finally { setResending(false); }
  };

  return (
    <Flex justify="center" style={{ padding: '48px 16px' }}>
      <Card style={{ maxWidth: 520, width: '100%' }}>
        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin size="large" /><div style={{ marginTop: 16 }}>Đang xác thực email...</div></div>
        )}
        {status === 'success' && (
          <Result status="success" title="Xác thực email thành công!" subTitle={msg}
            extra={<Button type="primary" onClick={() => setPage('login')}>Đăng nhập ngay</Button>} />
        )}
        {status === 'error' && (
          <Result status="warning" title="Không xác thực được email" subTitle={msg}
            extra={
              <Flex vertical gap={10} align="center">
                <Text type="secondary">Nhập email để gửi lại liên kết xác thực:</Text>
                <Flex gap={8}>
                  <Input placeholder="Email của bạn" value={resendEmail} onChange={e => setResendEmail(e.target.value)} style={{ width: 240 }} />
                  <Button onClick={handleResend} loading={resending}>Gửi lại</Button>
                </Flex>
                <Button type="link" onClick={() => setPage('login')}>Về trang đăng nhập</Button>
              </Flex>
            } />
        )}
      </Card>
    </Flex>
  );
}
