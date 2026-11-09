import React, { useState, useEffect } from 'react';
import axios from 'axios';

const statusLabels = {
  awaiting_confirmation: 'Chờ xác nhận',
  held: 'Đang giữ cọc',
  refunded: 'Đã hoàn',
  partially_refunded: 'Hoàn một phần'
};
const statusColors = {
  awaiting_confirmation: '#d97706',
  held: '#4f46e5',
  refunded: '#15803d',
  partially_refunded: '#0891b2'
};

export default function AdminDeposits({ setPage }) {
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState({ awaiting: 0, held: 0, damageReported: 0, refunded: 0 });
  const [adminBank, setAdminBank] = useState({ configured: false });
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [deductDrafts, setDeductDrafts] = useState({});

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const params = statusFilter === 'all' ? {} : { status: statusFilter };
      const res = await axios.get('http://localhost:5000/api/deposits/admin/all', { params, headers: authHeaders() });
      setDeposits(res.data.deposits || []);
      setStats(res.data.stats || stats);
      setAdminBank(res.data.adminBank || { configured: false });
      setNotice(null);
    } catch (err) {
      setNotice(err.response?.data?.message || 'Không tải được danh sách cọc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeposits(); }, [statusFilter]);

  const doAction = async (id, action, body) => {
    setActionId(id);
    try {
      const res = await axios.post(`http://localhost:5000/api/deposits/admin/${id}/${action}`, body || {}, { headers: authHeaders() });
      setNotice(res.data.message || 'Thành công.');
      await fetchDeposits();
    } catch (err) {
      setNotice(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setActionId(null);
    }
  };

  const statCards = [
    { key: 'all', label: 'Tất cả', value: stats.awaiting + stats.held + stats.refunded, color: '#85581A' },
    { key: 'awaiting_confirmation', label: 'Chờ xác nhận', value: stats.awaiting, color: '#d97706' },
    { key: 'held', label: 'Đang giữ', value: stats.held, color: '#4f46e5' },
    { key: 'refunded', label: 'Đã hoàn', value: stats.refunded, color: '#15803d' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: '#fffbf7', width: '100%' }}>
      <aside style={{ width: '260px', flexShrink: 0, background: '#fff', borderRight: '1px solid #f1eae4', padding: '28px 20px' }}>
        <button type="button" onClick={() => setPage('admin-dashboard')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Bảng điều khiển</button>
        <button type="button" onClick={() => setPage('toy-moderation')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Kiểm soát bài đăng</button>
        <button type="button" onClick={() => setPage('admin-reports')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Báo cáo vi phạm</button>
        <button type="button" onClick={() => setPage('admin-borrows')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Quản lý lượt mượn</button>
        <button type="button" style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: '#f8e8df', color: '#8f362f', fontWeight: 700, cursor: 'default' }}>Quản lý tiền cọc</button>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '36px clamp(20px, 4vw, 52px)', overflowY: 'auto' }}>
        <header style={{ marginBottom: '20px' }}>
          <p style={{ color: '#a34b3f', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>KÝ QUỸ (ESCROW)</p>
          <h1 style={{ fontSize: '28px', color: '#2d2520' }}>Quản lý tiền cọc</h1>
        </header>

        {!adminBank.configured && (
          <div style={{ padding: '14px 16px', marginBottom: '18px', borderRadius: '10px', background: '#fef3c7', color: '#92400e', fontSize: '14px' }}>
            ⚠️ Chưa cấu hình tài khoản nhận cọc. Vui lòng điền <strong>ADMIN_BANK_ID / ADMIN_BANK_ACCOUNT / ADMIN_BANK_NAME</strong> trong file <strong>.env</strong> của backend.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {statCards.map(card => (
            <div key={card.key} onClick={() => setStatusFilter(card.key)} style={{ padding: '18px', background: '#fff', border: statusFilter === card.key ? `2px solid ${card.color}` : '1px solid #f1eae4', borderRadius: '14px', cursor: 'pointer' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {notice && <p style={{ padding: '12px 14px', marginBottom: '16px', borderRadius: '8px', background: '#eef2ff', color: '#3730a3' }}>{notice}</p>}

        {loading ? (
          <p style={{ padding: '40px 0', color: '#7c6e65' }}>Đang tải...</p>
        ) : deposits.length === 0 ? (
          <p style={{ padding: '42px 20px', background: '#fff', border: '1px solid #f1eae4', borderRadius: '10px', color: '#7c6e65', textAlign: 'center' }}>Không có khoản cọc nào.</p>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {deposits.map(d => {
              const deposit = d.depositAmount || d.toyId?.depositRequired || 0;
              const draft = deductDrafts[d._id] ?? (d.damageAmountRequested || '');
              return (
                <article key={d._id} style={{ padding: '20px', background: '#fff', border: '1px solid #eee5dc', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {d.toyId?.images?.[0] ? <img src={d.toyId.images[0]} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} /> : <span style={{ fontSize: '28px' }}>🧸</span>}
                      <div>
                        <h3 style={{ fontSize: '17px', margin: 0 }}>{d.toyId?.name || 'Đã xoá'}</h3>
                        <p style={{ fontSize: '13px', color: '#7c6e65', margin: '4px 0 0' }}>
                          Người mượn: {d.borrowerId?.name || '—'} · Chủ: {d.ownerId?.name || '—'}
                        </p>
                      </div>
                    </div>
                    <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#fff', background: statusColors[d.depositStatus] || '#6b7280' }}>
                      {statusLabels[d.depositStatus] || d.depositStatus}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', marginBottom: '14px', color: '#5e5148' }}>
                    <span>Tiền cọc: <strong style={{ color: '#a86a2c' }}>{deposit.toLocaleString()}đ</strong></span>
                    <span>Đơn mượn: <strong>{d.status}</strong></span>
                    {d.damageReported && <span style={{ color: '#dc2626' }}>⚠️ Chủ yêu cầu đền: <strong>{(d.damageAmountRequested || 0).toLocaleString()}đ</strong></span>}
                  </div>

                  {d.damageReported && d.damageNote && (
                    <p style={{ fontSize: '13px', color: '#7c6e65', marginBottom: '14px', padding: '10px 12px', background: '#fef2f2', borderRadius: '8px' }}>
                      Lý do: {d.damageNote}
                    </p>
                  )}

                  {d.depositResolveNote && ['refunded', 'partially_refunded'].includes(d.depositStatus) && (
                    <p style={{ fontSize: '13px', color: '#15803d', marginBottom: '8px' }}>
                      ✓ {d.depositResolveNote} (hoàn {(d.depositRefundAmount || 0).toLocaleString()}đ{d.depositDeductAmount ? `, trừ ${d.depositDeductAmount.toLocaleString()}đ` : ''})
                    </p>
                  )}

                  {/* Hành động theo trạng thái */}
                  {d.depositStatus === 'awaiting_confirmation' && (
                    <button onClick={() => doAction(d._id, 'confirm')} disabled={actionId === d._id} style={{ padding: '10px 18px', borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                      {actionId === d._id ? 'Đang xử lý...' : '✓ Xác nhận đã nhận cọc'}
                    </button>
                  )}

                  {d.depositStatus === 'held' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {d.status !== 'returned' && (
                        <p style={{ fontSize: '13px', color: '#7c6e65', fontStyle: 'italic' }}>Đang giữ cọc. Chờ đồ chơi được trả để hoàn/trừ cọc.</p>
                      )}
                      {d.status === 'returned' && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button onClick={() => doAction(d._id, 'refund')} disabled={actionId === d._id} style={{ padding: '10px 18px', borderRadius: '10px', background: '#16a34a', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                            Hoàn 100% ({deposit.toLocaleString()}đ)
                          </button>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="number" min="0" max={deposit} placeholder="Số tiền trừ"
                              value={draft}
                              onChange={e => setDeductDrafts(prev => ({ ...prev, [d._id]: e.target.value }))}
                              style={{ width: '120px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5ddd5' }}
                            />
                            <button
                              onClick={() => doAction(d._id, 'resolve-damage', { deductAmount: Number(draft) || 0, note: d.damageNote })}
                              disabled={actionId === d._id}
                              style={{ padding: '10px 16px', borderRadius: '10px', background: '#9d3b35', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                            >
                              Trừ & hoàn phần còn lại
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
