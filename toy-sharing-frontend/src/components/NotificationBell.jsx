import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const typeIcons = {
  borrow_request: '📩',
  borrow_approved: '✅',
  borrow_rejected: '❌',
  borrow_cancelled: '🚫',
  extension_request: '⏳',
  extension_approved: '👍',
  extension_rejected: '👎',
  return_reported: '📦',
  return_confirmed: '🔄',
  overdue: '⏰',
  toy_moderated: '🛡️',
  favorite_available: '💛',
  new_message: '💬',
  new_review: '⭐'
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function NotificationBell({ setPage }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // bỏ qua lỗi nền
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    // Realtime qua socket.io nếu có
    let socket;
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (window.io && userId) {
      socket = window.io('http://localhost:5000', { auth: { token } });
      socket.on('connect', () => socket.emit('join', userId));
      socket.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // bỏ qua
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.isRead) {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:5000/api/notifications/${notif._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      // bỏ qua
    }
    if (notif.link) {
      setOpen(false);
      setPage(notif.link);
    }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '4px', lineHeight: 1 }} aria-label="Thông báo">
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-2px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '42px', width: '340px', maxHeight: '440px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', border: '1px solid #f1eae4', zIndex: 2000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1eae4' }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>Thông báo</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Đánh dấu đã đọc</button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <p style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Chưa có thông báo nào.</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleNotifClick(notif)}
                  style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #f9f5f1', cursor: 'pointer', background: notif.isRead ? '#fff' : '#fffaf0' }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{typeIcons[notif.type] || '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: notif.isRead ? '500' : '700', fontSize: '14px', marginBottom: '2px' }}>{notif.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{notif.message}</div>
                    <div style={{ fontSize: '11px', color: '#bbaa9e', marginTop: '4px' }}>{timeAgo(notif.createdAt)}</div>
                  </div>
                  {!notif.isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0, marginTop: '6px' }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
