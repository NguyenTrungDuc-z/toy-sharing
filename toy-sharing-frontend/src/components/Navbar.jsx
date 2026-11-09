import { Layout, Menu, Button, Avatar, Dropdown, Space, Tag } from "antd";
import {
  UserOutlined, HeartOutlined, LogoutOutlined, AppstoreOutlined,
  SwapOutlined, CompassOutlined,
} from "@ant-design/icons";
import NotificationBell from "./NotificationBell";

const { Header } = Layout;

export default function Navbar({ page, setPage, user, handleLogout }) {
  // ---------- ADMIN ----------
  if (user && user.role === "admin") {
    return (
      <Header
        style={{
          position: "sticky", top: 0, zIndex: 1100, height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(16px, 4vw, 40px)", background: "#0f2733",
          borderBottom: "1px solid #1d3b48",
        }}
      >
        <Space size={12} align="center">
          <span
            onClick={() => setPage("admin-dashboard")}
            style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", cursor: "pointer", letterSpacing: "-0.3px" }}
          >
            ToyShare
          </span>
          <Tag color="#0b6e8f" style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}>Quản trị viên</Tag>
        </Space>

        <Space size={18} align="center">
          <NotificationBell setPage={setPage} />
          <div style={{ textAlign: "right", lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#90a7b1" }}>{user.email}</div>
          </div>
          <Button danger type="primary" icon={<LogoutOutlined />} onClick={() => handleLogout?.()}>
            Đăng xuất
          </Button>
        </Space>
      </Header>
    );
  }

  // ---------- USER / GUEST ----------
  const navItems = [
    { key: "home", label: "Khám phá", icon: <CompassOutlined /> },
    { key: "my-toys", label: "Đồ chơi của tôi", icon: <AppstoreOutlined /> },
    { key: "requests", label: "Yêu cầu mượn", icon: <SwapOutlined /> },
    ...(user ? [{ key: "favorites", label: "Yêu thích", icon: <HeartOutlined /> }] : []),
  ];

  const userMenu = {
    items: [
      { key: "profile", label: "Hồ sơ cá nhân", icon: <UserOutlined /> },
      { key: "favorites", label: "Đồ chơi yêu thích", icon: <HeartOutlined /> },
      { type: "divider" },
      { key: "logout", label: "Đăng xuất", icon: <LogoutOutlined />, danger: true },
    ],
    onClick: ({ key }) => {
      if (key === "logout") handleLogout?.();
      else setPage(key);
    },
  };

  return (
    <Header
      style={{
        position: "sticky", top: 0, zIndex: 1100, height: 64,
        display: "flex", alignItems: "center", gap: 16,
        padding: "0 clamp(16px, 4vw, 40px)", background: "#ffffff",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <div
        onClick={() => setPage("home")}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}
      >
        <img src="/images/logo.png" alt="ToyShare" style={{ height: 38, objectFit: "contain" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--color-primary)", letterSpacing: "-0.4px" }}>
          ToyShare
        </span>
      </div>

      {/* Nav */}
      <Menu
        mode="horizontal"
        selectedKeys={[page]}
        items={navItems}
        onClick={({ key }) => setPage(key)}
        style={{ flex: 1, minWidth: 0, borderBottom: "none", background: "transparent", fontWeight: 500 }}
      />

      {/* Right */}
      <Space size={14} align="center" style={{ flexShrink: 0 }}>
        {user && <NotificationBell setPage={setPage} />}
        {user ? (
          <Dropdown menu={userMenu} trigger={["click"]} placement="bottomRight">
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 10px 4px 4px", border: "1px solid var(--color-border)", borderRadius: 999 }}>
              <Avatar size={30} src={user.avatar || undefined} style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                {(user.name || "U").charAt(0).toUpperCase()}
              </Avatar>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </span>
            </div>
          </Dropdown>
        ) : (
          <Space size={8}>
            <Button onClick={() => setPage("login")}>Đăng nhập</Button>
            <Button type="primary" onClick={() => setPage("register")}>Đăng ký</Button>
          </Space>
        )}
      </Space>
    </Header>
  );
}
