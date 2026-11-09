import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Table, Tag, Avatar, Statistic, Alert, Flex } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import AdminLayout from './AdminLayout';

const statusTag = {
  pending: { text: 'Chờ duyệt', color: 'gold' },
  approved: { text: 'Đã duyệt', color: 'blue' },
  borrowing: { text: 'Đang mượn', color: 'geekblue' },
  returned: { text: 'Đã trả', color: 'green' },
  rejected: { text: 'Từ chối', color: 'red' },
  cancelled: { text: 'Đã huỷ', color: 'default' },
  overdue: { text: 'Quá hạn', color: 'volcano' },
};

export default function AdminBorrows({ setPage }) {
  const [borrows, setBorrows] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, borrowing: 0, returned: 0, overdue: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = statusFilter === 'all' ? {} : { status: statusFilter };
        const res = await axios.get('http://localhost:5000/api/admin/borrows', { params, headers: { Authorization: `Bearer ${token}` } });
        if (!active) return;
        setBorrows(res.data.borrows || []);
        setStats(res.data.stats || stats);
        setError('');
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Không tải được dữ liệu.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [statusFilter]);

  const isOverdue = (b) => b.status === 'borrowing' && new Date(b.dueDate) < new Date();

  const statCards = [
    { key: 'all', label: 'Tổng lượt mượn', value: stats.total, color: '#0b6e8f' },
    { key: 'pending', label: 'Chờ duyệt', value: stats.pending, color: '#d97706' },
    { key: 'borrowing', label: 'Đang mượn', value: stats.borrowing, color: '#4f46e5' },
    { key: 'returned', label: 'Đã trả', value: stats.returned, color: '#15803d' },
    { key: 'overdue', label: 'Quá hạn', value: stats.overdue, color: '#b91c1c' },
  ];

  const columns = [
    { title: 'Đồ chơi', key: 'toy', render: (_, b) => (
      <Flex align="center" gap={10}>
        <Avatar shape="square" src={b.toyId?.images?.[0] || undefined} icon={<GiftOutlined />} style={{ background: '#f1f4f6', color: 'rgba(22,38,46,0.3)' }} />
        <span style={{ fontWeight: 600 }}>{b.toyId?.name || 'Đã xoá'}</span>
      </Flex>
    ) },
    { title: 'Người mượn', dataIndex: ['borrowerId', 'name'], key: 'borrower', render: v => v || '—' },
    { title: 'Chủ sở hữu', dataIndex: ['ownerId', 'name'], key: 'owner', render: v => v || '—', responsive: ['md'] },
    { title: 'Hạn trả', key: 'due', render: (_, b) => (
      <span style={{ color: isOverdue(b) ? '#b91c1c' : 'inherit', fontWeight: isOverdue(b) ? 700 : 400 }}>
        {b.dueDate ? new Date(b.dueDate).toLocaleDateString('vi-VN') : '—'}
      </span>
    ) },
    { title: 'Trạng thái', key: 'status', render: (_, b) => {
      const t = isOverdue(b) ? statusTag.overdue : (statusTag[b.status] || { text: b.status, color: 'default' });
      return <Tag color={t.color}>{t.text}</Tag>;
    } },
  ];

  return (
    <AdminLayout active="admin-borrows" setPage={setPage} title="Quản lý lượt mượn">
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {statCards.map(card => (
          <Col xs={12} sm={8} md={Math.floor(24 / 5) || 4} key={card.key} style={{ flex: '1 1 150px' }}>
            <Card hoverable onClick={() => setStatusFilter(card.key)} styles={{ body: { padding: 18 } }}
              style={{ border: statusFilter === card.key ? `2px solid ${card.color}` : undefined }}>
              <Statistic title={card.label} value={card.value} valueStyle={{ color: card.color, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Card styles={{ body: { padding: 0 } }}>
        <Table rowKey="_id" columns={columns} dataSource={borrows} loading={loading}
          pagination={{ pageSize: 10, hideOnSinglePage: true }} scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'Không có lượt mượn nào ở trạng thái này.' }} />
      </Card>
    </AdminLayout>
  );
}
