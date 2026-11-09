import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ChatModal({ isOpen, onClose, borrowRequest, currentUserId, counterpartName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    if (!isOpen || !borrowRequest?._id) return;
    let active = true;
    setLoading(true);

    const token = localStorage.getItem('token');
    axios.get(`http://localhost:5000/api/messages/${borrowRequest._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!active) return;
        setMessages(res.data.messages || []);
        scrollToBottom();
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });

    // Realtime: lắng nghe tin nhắn mới cho đơn này
    if (window.io) {
      const socket = window.io('http://localhost:5000', { auth: { token } });
      socket.on('connect', () => socket.emit('join', currentUserId));
      socket.on('message', (msg) => {
        if (msg.borrowRequestId === borrowRequest._id) {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        }
      });
      socketRef.current = socket;
    }

    return () => {
      active = false;
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, [isOpen, borrowRequest, currentUserId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/messages/${borrowRequest._id}`,
        { content: input.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, res.data.message]);
      setInput('');
      scrollToBottom();
    } catch {
      // bỏ qua
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !borrowRequest) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(45, 37, 32, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '480px', height: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 50px rgba(92,77,66,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1eae4', background: '#fffbf7' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>💬 {counterpartName || 'Trò chuyện'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{borrowRequest.toyId?.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a19286' }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fdfbf9' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>Đang tải...</p>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</p>
          ) : (
            messages.map(msg => {
              const senderId = msg.senderId?._id || msg.senderId;
              const isMine = senderId === currentUserId;
              return (
                <div key={msg._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: '16px', background: isMine ? 'var(--primary-color)' : '#fff', color: isMine ? '#fff' : 'var(--text-main)', border: isMine ? 'none' : '1px solid #f1eae4', fontSize: '14px', lineHeight: '1.4' }}>
                    {msg.content}
                    <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', padding: '14px 16px', borderTop: '1px solid #f1eae4' }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Nhập tin nhắn..." style={{ flex: 1, padding: '12px 16px', borderRadius: '20px', border: '1px solid #e2d8cf', fontSize: '14px', outline: 'none' }} />
          <button type="submit" disabled={sending || !input.trim()} className="btn-primary" style={{ padding: '12px 20px', borderRadius: '20px', fontSize: '14px', opacity: (sending || !input.trim()) ? 0.6 : 1 }}>Gửi</button>
        </form>
      </div>
    </div>
  );
}
