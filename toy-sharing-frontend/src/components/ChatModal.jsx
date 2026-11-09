import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, Input, Button, Spin, Empty, Typography, Flex } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { API_BASE } from '../config';

export default function ChatModal({ isOpen, onClose, borrowRequest, currentUserId, counterpartName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  useEffect(() => {
    if (!isOpen || !borrowRequest?._id) return;
    let active = true;
    setLoading(true);
    const token = localStorage.getItem('token');
    axios.get(`/api/messages/${borrowRequest._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (active) { setMessages(res.data.messages || []); scrollToBottom(); } })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    if (window.io) {
      const socket = window.io(API_BASE, { auth: { token } });
      socket.on('connect', () => socket.emit('join', currentUserId));
      socket.on('message', (msg) => {
        if (msg.borrowRequestId === borrowRequest._id) { setMessages(prev => [...prev, msg]); scrollToBottom(); }
      });
      socketRef.current = socket;
    }
    return () => { active = false; if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } };
  }, [isOpen, borrowRequest, currentUserId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/messages/${borrowRequest._id}`,
        { content: input.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, res.data.message]);
      setInput(''); scrollToBottom();
    } catch { /* bỏ qua */ } finally { setSending(false); }
  };

  if (!borrowRequest) return null;

  return (
    <Modal open={isOpen} onCancel={onClose} footer={null} width={480}
      title={<div><div style={{ fontWeight: 700 }}>{counterpartName || 'Trò chuyện'}</div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{borrowRequest.toyId?.name}</Typography.Text></div>}
      styles={{ body: { padding: 0 } }}>
      <div style={{ height: 460, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: '#f6f8fa' }}>
        {loading ? (
          <Flex justify="center" style={{ marginTop: 40 }}><Spin /></Flex>
        ) : messages.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tin nhắn. Hãy bắt đầu trò chuyện!" style={{ marginTop: 40 }} />
        ) : (
          messages.map(msg => {
            const senderId = msg.senderId?._id || msg.senderId;
            const isMine = senderId === currentUserId;
            return (
              <div key={msg._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: 16, background: isMine ? 'var(--color-primary)' : '#fff', color: isMine ? '#fff' : 'var(--color-foreground)', border: isMine ? 'none' : '1px solid var(--color-border)', fontSize: 14 }}>
                  {msg.content}
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <Flex gap={8} style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
        <Input value={input} onChange={e => setInput(e.target.value)} onPressEnter={handleSend} placeholder="Nhập tin nhắn..." />
        <Button type="primary" icon={<SendOutlined />} loading={sending} disabled={!input.trim()} onClick={handleSend}>Gửi</Button>
      </Flex>
    </Modal>
  );
}
