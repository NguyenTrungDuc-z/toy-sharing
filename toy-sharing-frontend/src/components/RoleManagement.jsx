import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { App, Row, Col, Card, Table, Tag, Avatar, Input, Select, Button, Statistic, Space, Flex } from 'antd';
import { UserOutlined, SafetyOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import AdminLayout from './AdminLayout';

export default function RoleManagement({ setPage }) {
  const { message, modal } = App.useApp();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ admins: 0, usersCount: 0, pending: 0, blocked: 0 });

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchUserData = async () => {
    try {
      const res = await axios.get('/api/auth/admin/users', { params: { search, role: roleFilter }, headers: authHeaders() });
      if (res.data.success) { setUsers(res.data.users); setStats(res.data.stats); }
    } catch { /* bỏ qua */ } finally { setLoading(false); }
  };

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(fetchUserData, 400);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const setUserRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/auth/admin/users/${userId}`, { role: newRole }, { headers: authHeaders() });
      message.success(`Đã đổi quyền thành ${newRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}!`);
      fetchUserData();
    } catch { message.error('Không thể cập nhật quyền hạn.'); }
  };

  const toggleStatus = (u) => {
    const newStatus = u.status === 'blocked' ? 'active' : 'blocked';
    const actionText = newStatus === 'blocked' ? 'khóa' : 'mở khóa';
    modal.confirm({
      title: `${newStatus === 'blocked' ? 'Khóa' : 'Mở khóa'} tài khoản`,
      content: `Bạn có chắc muốn ${actionText} tài khoản của ${u.name}?`,
      okText: 'Xác nhận', cancelText: 'Hủy', okButtonProps: { danger: newStatus === 'blocked' },
      onOk: async () => {
        try {
          await axios.put(`/api/auth/admin/users/${u._id}`, { status: newStatus }, { headers: authHeaders() });
          message.success(`Đã ${actionText} tài khoản!`);
          fetchUserData();
        } catch { message.error('Không thể thay đổi trạng thái tài khoản.'); }
      },
    });
  };

  const columns = [
    { title: 'Thành viên', key: 'user', render: (_, u) => (
      <Flex align="center" gap={12}>
        <Avatar src={u.avatar || undefined} icon={<UserOutlined />} />
        <div><div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 12, color: '#8c7664' }}>{u.email}</div></div>
      </Flex>
    ) },
    { title: 'Vai trò', dataIndex: 'role', key: 'role', render: r => r === 'admin'
      ? <Tag icon={<SafetyOutlined />} color="geekblue">Quản trị viên</Tag>
      : <Tag icon={<UserOutlined />}>Người dùng</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: s => s === 'blocked' ? <Tag color="red">Đã khóa</Tag> : <Tag color="green">Hoạt động</Tag> },
    { title: 'Thao tác', key: 'actions', align: 'right', render: (_, u) => (
      <Space>
        <Select size="small" value={u.role} style={{ width: 130 }} onChange={v => setUserRole(u._id, v)}
          options={[{ value: 'user', label: 'Người dùng' }, { value: 'admin', label: 'Quản trị viên' }]} />
        <Button size="small" danger={u.status !== 'blocked'} icon={u.status === 'blocked' ? <UnlockOutlined /> : <LockOutlined />} onClick={() => toggleStatus(u)}>
          {u.status === 'blocked' ? 'Mở khóa' : 'Khóa'}
        </Button>
      </Space>
    ) },
  ];

  const statItems = [
    { label: 'Quản trị viên', value: stats.admins, color: '#4f46e5' },
    { label: 'Người dùng', value: stats.usersCount, color: '#0b6e8f' },
    { label: 'Tài khoản khóa', value: stats.blocked, color: '#dc2626' },
  ];

  const extra = (
    <Space wrap>
      <Input.Search placeholder="Tìm theo tên, email..." allowClear value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
      <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 150 }}
        options={[{ value: 'all', label: 'Tất cả vai trò' }, { value: 'admin', label: 'Quản trị viên' }, { value: 'user', label: 'Người dùng' }]} />
    </Space>
  );

  return (
    <AdminLayout active="role-management" setPage={setPage} title="Phân quyền người dùng" extra={extra}>
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {statItems.map(s => (
          <Col xs={12} sm={8} key={s.label}>
            <Card styles={{ body: { padding: 18 } }}><Statistic title={s.label} value={s.value} valueStyle={{ color: s.color, fontWeight: 700 }} /></Card>
          </Col>
        ))}
      </Row>
      <Card styles={{ body: { padding: 0 } }}>
        <Table rowKey="_id" columns={columns} dataSource={users} loading={loading}
          pagination={{ pageSize: 10, hideOnSinglePage: true }} scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'Không tìm thấy người dùng.' }} />
      </Card>
    </AdminLayout>
  );
}
