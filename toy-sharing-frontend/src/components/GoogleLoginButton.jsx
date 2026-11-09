import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GSI_SRC = 'https://accounts.google.com/gsi/client';

function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function GoogleLoginButton({ onLogin, showToast }) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Giữ callback trong ref để effect chỉ chạy 1 lần (tránh re-init mỗi lần render)
  const onLoginRef = useRef(onLogin);
  const showToastRef = useRef(showToast);
  onLoginRef.current = onLogin;
  showToastRef.current = showToast;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // chưa cấu hình -> hiển thị nút disabled

    let cancelled = false;
    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              const res = await axios.post('http://localhost:5000/api/auth/google', {
                credential: response.credential
              });
              if (res.data.token) localStorage.setItem('token', res.data.token);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              if (res.data.user?.role) localStorage.setItem('role', res.data.user.role);
              if (res.data.user?.id || res.data.user?._id) {
                localStorage.setItem('userId', res.data.user.id || res.data.user._id);
              }
              if (showToastRef.current) showToastRef.current(res.data.message || 'Đăng nhập Google thành công!', 'success');
              if (onLoginRef.current) onLoginRef.current(res.data.user);
            } catch (err) {
              if (showToastRef.current) showToastRef.current(err.response?.data?.message || 'Đăng nhập Google thất bại!', 'error');
            }
          }
        });
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill'
          });
        }
        setReady(true);
      })
      .catch(() => {
        if (showToastRef.current) showToastRef.current('Không tải được Google Login.', 'error');
      });

    return () => { cancelled = true; };
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        onClick={() => showToast && showToast('Đăng nhập Google chưa được cấu hình (thiếu VITE_GOOGLE_CLIENT_ID).', 'info')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', width: '100%', border: '1px solid #e2d8cf', borderRadius: '12px', backgroundColor: '#fff', fontWeight: '600', fontSize: '13px', color: '#a19286', cursor: 'not-allowed', opacity: 0.7 }}
      >
        Google (chưa cấu hình)
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div ref={buttonRef} />
      {!ready && <span style={{ fontSize: '13px', color: '#a19286' }}>Đang tải Google...</span>}
    </div>
  );
}
