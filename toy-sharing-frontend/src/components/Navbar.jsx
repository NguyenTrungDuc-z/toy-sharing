import { useState } from "react";
import NotificationBell from "./NotificationBell";

export default function Navbar({ page, setPage, user, handleLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (user && user.role === "admin") {
    return (
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 8%",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          position: "relative",
          zIndex: 1000,
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{ fontSize: "24px", fontWeight: "bold", color: "#38bdf8", cursor: "pointer" }}
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
              letterSpacing: "0.5px",
            }}
          >
            BẢNG QUẢN TRỊ VIÊN
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <NotificationBell setPage={setPage} />
          <div style={{ textAlign: "right" }}>
            <div
              style={{ fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}
            >
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
              padding: "10px 20px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
            }}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </nav>
    );
  }

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 1100, background: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      {/* TOP UTILITY ANNOUNCEMENT BAR */}
      <div style={{
        background: "#251b14",
        color: "#d5c7bc",
        padding: "6px 8%",
        fontSize: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        borderBottom: "1px solid #3c2c20"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span>📞</span> Hotline tư vấn ba mẹ 24/7: <strong style={{ color: "#ff9a42" }}>1900 8888</strong>
          </span>
          <span style={{ display: "none", mdDisplay: "inline", color: "#5a4535" }}>|</span>
          <span style={{ color: "#6ee7b7", fontWeight: "600" }}>
            🛡️ 100% Đồ chơi được kiểm định & tiệt trùng UV-C
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>📍 Toàn quốc 63 tỉnh thành</span>
          <span style={{ color: "#ffc58d" }}>⚡ Hoàn cọc VietQR 15 phút</span>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 8%",
          background: "white",
          borderBottom: "1px solid #f1eae4",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "24px",
            fontWeight: "800",
            color: "var(--primary-color)",
            cursor: "pointer",
            letterSpacing: "-0.5px"
          }}
          onClick={() => setPage("home")}
        >
          <img
            src="/images/logo.png"
            alt="ToyShare Logo"
            style={{ height: "50px", objectFit: "contain" }}
          />
          <span>ToyShare</span>
        </div>

        {/* NAVIGATION LINKS */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {[
            { key: "home", label: "Trang chủ" },
            { key: "my-toys", label: "Đồ chơi của tôi" },
            { key: "requests", label: "Yêu cầu mượn" },
            ...(user ? [{ key: "favorites", label: "Đã lưu thích" }] : [])
          ].map(tab => {
            const isActive = page === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setPage(tab.key)}
                style={{
                  color: isActive ? "var(--primary-color)" : "var(--text-main)",
                  background: isActive ? "#fff5ec" : "none",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* USER ACTIONS */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          {user && <NotificationBell setPage={setPage} />}

          {user ? (
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  padding: "4px 10px",
                  borderRadius: "24px",
                  background: showDropdown ? "#fff5ec" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name || 'User')}`
                  }
                  alt="Avatar"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    backgroundColor: "#fef3c7",
                    border: "2px solid var(--primary-color)",
                    objectFit: "cover"
                  }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--text-main)",
                  }}
                >
                  {user.name} ▾
                </span>
              </div>

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "52px",
                    background: "white",
                    minWidth: "220px",
                    borderRadius: "16px",
                    boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
                    border: "1px solid #faeee4",
                    padding: "8px 0",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 2000
                  }}
                >
                  <div
                    style={{
                      padding: "12px 18px",
                      borderBottom: "1px dashed #f1eae4",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "var(--text-main)",
                      }}
                    >
                      {user.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {user.email}
                    </div>
                    <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600", marginTop: "2px" }}>
                      ✓ Thành viên đã xác thực
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPage("profile");
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: "10px 18px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "var(--text-main)",
                      fontWeight: "500",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
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
                      padding: "10px 18px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "var(--text-main)",
                      fontWeight: "500",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
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
                      padding: "12px 18px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#ef4444",
                      fontWeight: "700",
                      width: "100%",
                      borderTop: "1px solid #f9f5f1",
                      marginTop: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setPage("login")}
                style={{
                  padding: "9px 18px",
                  borderRadius: "20px",
                  fontSize: "14px",
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
                  padding: "9px 20px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Đăng ký miễn phí
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
