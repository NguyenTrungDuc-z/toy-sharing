import React, { useState, useEffect } from 'react';
import axios from 'axios';

const statusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  borrowing: 'Đang mượn',
  returned: 'Đã trả',
  rejected: 'Từ chối',
  cancelled: 'Đã huỷ',
  overdue: 'Quá hạn'
};

const statusColors = {
  pending: '#d97706',
  approved: '#2563eb',
  borrowing: '#4f46e5',
  returned: '#15803d',
  rejected: '#dc2626',
  cancelled: '#6b7280',
  overdue: '#b91c1c'
};

export default function AdminBorrows({ setPage }) {
  const [borrows, setBorrows] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, borrowing: 0, returned: 0, overdue: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchBorrows = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = statusFilter === 'all' ? {} : { status: statusFilter };
        const res = await axios.get('http://localhost:5000/api/admin/borrows', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!active) return;
        setBorrows(res.data.borrows || []);
        setStats(res.data.stats || stats);
        setError('');
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Không tải được dữ liệu.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBorrows();
    return () => { active = false; };
  }, [statusFilter]);

  const isOverdue = (b) => b.status === 'borrowing' && new Date(b.dueDate) < new Date();

  const statCards = [
    { key: 'all', label: 'Tổng lượt mượn', value: stats.total, color: '#85581A' },
    { key: 'pending', label: 'Chờ duyệt', value: stats.pending, color: '#d97706' },
    { key: 'borrowing', label: 'Đang mượn', value: stats.borrowing, color: '#4f46e5' },
    { key: 'returned', label: 'Đã trả', value: stats.returned, color: '#15803d' },
    { key: 'overdue', label: 'Quá hạn', value: stats.overdue, color: '#b91c1c' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: '#fffbf7', width: '100%' }}>
      <aside style={{ width: '260px', flexShrink: 0, background: '#fff', borderRight: '1px solid #f1eae4', padding: '28px 20px' }}>
        <button type="button" onClick={() => setPage('admin-dashboard')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Bảng điều khiển</button>
        <button type="button" onClick={() => setPage('toy-moderation')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Kiểm soát bài đăng</button>
        <button type="button" onClick={() => setPage('admin-reports')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Báo cáo vi phạm</button>
        <button type="button" style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: '#f8e8df', color: '#8f362f', fontWeight: 700, cursor: 'default' }}>Quản lý lượt mượn</button>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '36px clamp(20px, 4vw, 52px)', overflowY: 'auto' }}>
        <header style={{ marginBottom: '24px' }}>
          <p style={{ color: '#a34b3f', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>GIÁM SÁT HOẠT ĐỘNG</p>
          <h1 style={{ fontSize: '28px', color: '#2d2520' }}>Quản lý lượt mượn</h1>
        </header>

        {/* Stat cards (also act as filters) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(card => (
            <div key={card.key} onClick={() => setStatusFilter(card.key)} style={{ padding: '20px', background: '#fff', border: statusFilter === card.key ? `2px solid ${card.color}` : '1px solid #f1eae4', borderRadius: '16px', cursor: 'pointer' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {error && <p style={{ padding: '12px 14px', marginBottom: '16px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b' }}>{error}</p>}

        {loading ? (
          <p style={{ padding: '40px 0', color: '#7c6e65' }}>Đang tải danh sách...</p>
        ) : borrows.length === 0 ? (
          <p style={{ padding: '42px 20px', background: '#fff', border: '1px solid #f1eae4', borderRadius: '10px', color: '#7c6e65', textAlign: 'center' }}>Không có lượt mượn nào ở trạng thái này.</p>
        ) : (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1eae4', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #fcf2e9', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 16px' }}>ĐỒ CHƠI</th>
                  <th style={{ padding: '14px 16px' }}>NGƯỜI MƯỢN</th>
                  <th style={{ padding: '14px 16px' }}>CHỦ SỞ HỮU</th>
                  <th style={{ padding: '14px 16px' }}>HẠN TRẢ</th>
                  <th style={{ padding: '14px 16px' }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map(b => (
                  <tr key={b._id} style={{ borderBottom: '1px solid #fdf5ee' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {b.toyId?.images?.[0] ? (
                          <img src={b.toyId.images[0]} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : <span style={{ fontSize: '22px' }}>🧸</span>}
                        <span style={{ fontWeight: '600' }}>{b.toyId?.name || 'Đã xoá'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{b.borrowerId?.name || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>{b.ownerId?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', color: isOverdue(b) ? '#b91c1c' : 'inherit', fontWeight: isOverdue(b) ? 700 : 400 }}>
                      {b.dueDate ? new Date(b.dueDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#fff', background: isOverdue(b) ? statusColors.overdue : (statusColors[b.status] || '#6b7280') }}>
                        {isOverdue(b) ? 'Quá hạn' : (statusLabels[b.status] || b.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
