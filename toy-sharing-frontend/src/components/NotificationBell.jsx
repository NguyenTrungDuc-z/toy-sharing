import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Badge, Button, Popover, List, Empty, Typography } from 'antd';
import {
  BellOutlined, InboxOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined,
  ClockCircleOutlined, LikeOutlined, DislikeOutlined, SyncOutlined, FieldTimeOutlined,
  SafetyOutlined, HeartOutlined, MessageOutlined, StarOutlined,
} from '@ant-design/icons';

const typeIcon = {
  borrow_request: <InboxOutlined style={{ color: '#0b6e8f' }} />,
  borrow_approved: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
  borrow_rejected: <CloseCircleOutlined style={{ color: '#dc2626' }} />,
  borrow_cancelled: <StopOutlined style={{ color: '#6b7280' }} />,
  extension_request: <ClockCircleOutlined style={{ color: '#d97706' }} />,
  extension_approved: <LikeOutlined style={{ color: '#16a34a' }} />,
  extension_rejected: <DislikeOutlined style={{ color: '#dc2626' }} />,
  return_reported: <InboxOutlined style={{ color: '#0b6e8f' }} />,
  return_confirmed: <SyncOutlined style={{ color: '#0b6e8f' }} />,
  overdue: <FieldTimeOutlined style={{ color: '#dc2626' }} />,
  toy_moderated: <SafetyOutlined style={{ color: '#0b6e8f' }} />,
  favorite_available: <HeartOutlined style={{ color: '#e8294b' }} />,
  new_message: <MessageOutlined style={{ color: '#0b6e8f' }} />,
  new_review: <StarOutlined style={{ color: '#ffb627' }} />,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function NotificationBell({ setPage }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* bỏ qua lỗi nền */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
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
    return () => { clearInterval(interval); if (socket) socket.disconnect(); };
  }, []);

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* bỏ qua */ }
  };

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.isRead) {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:5000/api/notifications/${notif._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { /* bỏ qua */ }
    if (notif.link) { setOpen(false); setPage(notif.link); }
  };

  const content = (
    <div style={{ width: 340, maxHeight: 440, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
        <Typography.Text strong>Thông báo</Typography.Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead} style={{ padding: 0 }}>Đánh dấu đã đọc</Button>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1, margin: '0 -16px' }}>
        {notifications.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo nào" style={{ padding: '24px 0' }} />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notif) => (
              <List.Item
                onClick={() => handleNotifClick(notif)}
                style={{ padding: '10px 16px', cursor: 'pointer', background: notif.isRead ? '#fff' : '#eef6f9', borderBottom: '1px solid #f3f5f7' }}
              >
                <List.Item.Meta
                  avatar={<span style={{ fontSize: 18 }}>{typeIcon[notif.type] || <BellOutlined />}</span>}
                  title={<span style={{ fontWeight: notif.isRead ? 500 : 700, fontSize: 14 }}>{notif.title}</span>}
                  description={
                    <>
                      <div style={{ fontSize: 13, color: '#5a6b73', lineHeight: 1.4 }}>{notif.message}</div>
                      <div style={{ fontSize: 11, color: '#9fb2ba', marginTop: 2 }}>{timeAgo(notif.createdAt)}</div>
                    </>
                  }
                />
                {!notif.isRead && <Badge dot />}
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover content={content} trigger="click" open={open} onOpenChange={setOpen} placement="bottomRight" styles={{ body: { padding: '12px 16px' } }}>
      <Badge count={unreadCount} size="small" overflowCount={9}>
        <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} aria-label="Thông báo" />
      </Badge>
    </Popover>
  );
}
