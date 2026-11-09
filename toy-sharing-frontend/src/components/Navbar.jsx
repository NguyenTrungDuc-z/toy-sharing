import { useState } from "react";
import NotificationBell from "./NotificationBell";

export default function Navbar({ page, setPage, user, handleLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Giao diện Admin giữ nguyên
  if (user && user.role === "admin") {
    return (
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 6%",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{ fontSize: "22px", fontWeight: "bold", color: "#38bdf8", cursor: "pointer" }}
            onClick={() => setPage("admin-dashboard")}
          >
            🧸 ToyShare
          </span>
          <span
            style={{
              backgroundColor: "#334155",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#94a3b8",
            }}
          >
            QUẢN TRỊ VIÊN
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <NotificationBell setPage={setPage} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
              {user.name}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              {user.email}
            </div>
          </div>

          <button
            onClick={() => {
              if (handleLogout) handleLogout();
            }}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Đăng xuất
          </button>
        </div>
      </nav>
    );
  }

  // Giao diện Khách & Người dùng thường: ĐƠN GIẢN, TINH TẾ, HIỆN ĐẠI
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 1100, background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--color-border)" }}>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "14px 20px",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "22px",
            fontWeight: "800",
            color: "var(--color-primary)",
            cursor: "pointer",
          }}
          onClick={() => setPage("home")}
        >
          <img
            src="/images/logo.png"
            alt="ToyShare Logo"
            style={{ height: "42px", objectFit: "contain" }}
          />
          <span>ToyShare</span>
        </div>

        {/* NAVIGATION LINKS GỌN GÀNG */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {[
            { key: "home", label: "Khám phá" },
            { key: "my-toys", label: "Đồ chơi của tôi" },
            { key: "requests", label: "Yêu cầu mượn" },
            ...(user ? [{ key: "favorites", label: "Yêu thích" }] : [])
          ].map(tab => {
            const isActive = page === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setPage(tab.key)}
                style={{
                  color: isActive ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  background: isActive ? "var(--color-primary-light)" : "transparent",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* USER PROFILE HOẶC ĐĂNG NHẬP */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {user && <NotificationBell setPage={setPage} />}

          {user ? (
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "4px 10px 4px 6px",
                  borderRadius: "24px",
                  border: "1px solid #ebdcd0",
                  background: "#fff",
                }}
              >
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name || 'User')}`
                  }
                  alt="Avatar"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#fef3c7",
                    objectFit: "cover"
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--text-main)",
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {user.name}
                </span>
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>▾</span>
              </div>

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "46px",
                    background: "white",
                    minWidth: "200px",
                    borderRadius: "14px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    border: "1px solid #faeee4",
                    padding: "6px 0",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 2000
                  }}
                >
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #f9f4ef" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.email}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPage("profile");
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: "9px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "var(--text-main)",
                    }}
                  >
                    👤 Hồ sơ cá nhân
                  </button>

                  <button
                    onClick={() => {
                      setPage("favorites");
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: "9px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "var(--text-main)",
                    }}
                  >
                    ❤️ Đồ chơi yêu thích
                  </button>

                  <button
                    onClick={() => {
                      handleLogout();
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#dc2626",
                      fontWeight: "600",
                      borderTop: "1px solid #f9f4ef",
                      marginTop: "4px"
                    }}
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setPage("login")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  background: "#fff",
                  border: "1px solid #ebdcd0",
                  color: "#be6e15",
                  cursor: "pointer"
                }}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setPage("register")}
                className="btn-primary"
                style={{
                  padding: "8px 18px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
