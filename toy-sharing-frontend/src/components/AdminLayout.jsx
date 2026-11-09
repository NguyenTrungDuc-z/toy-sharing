import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined, TeamOutlined, AuditOutlined, FlagOutlined, SwapOutlined, WalletOutlined,
  TagsOutlined,
} from '@ant-design/icons';

const { Sider, Content } = Layout;

const items = [
  { key: 'admin-dashboard', icon: <DashboardOutlined />, label: 'Bảng điều khiển' },
  { key: 'role-management', icon: <TeamOutlined />, label: 'Phân quyền người dùng' },
  { key: 'toy-moderation', icon: <AuditOutlined />, label: 'Kiểm soát bài đăng' },
  { key: 'admin-reports', icon: <FlagOutlined />, label: 'Báo cáo vi phạm' },
  { key: 'admin-borrows', icon: <SwapOutlined />, label: 'Quản lý lượt mượn' },
  { key: 'admin-deposits', icon: <WalletOutlined />, label: 'Quản lý tiền cọc' },
  { key: 'admin-vouchers', icon: <TagsOutlined />, label: 'Mã giảm cọc' },
];

export default function AdminLayout({ active, setPage, title, extra, children }) {
  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--color-background)' }}>
      <Sider width={240} breakpoint="lg" collapsedWidth={0} theme="light" style={{ borderRight: '1px solid var(--color-border)' }}>
        <Menu mode="inline" selectedKeys={[active]} items={items} onClick={({ key }) => setPage(key)}
          style={{ height: '100%', borderInlineEnd: 'none', paddingTop: 12 }} />
      </Sider>
      <Content style={{ padding: 'clamp(16px,3vw,32px)', overflowX: 'auto' }}>
        {(title || extra) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            {title && <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>}
            {extra}
          </div>
        )}
        {children}
      </Content>
    </Layout>
  );
}
