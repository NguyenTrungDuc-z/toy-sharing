import React, { useState } from "react";

export default function Navbar({ page, setPage, user, handleLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (user && user.role === "admin") {
    return (
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 8%",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          position: "relative",
          zIndex: 1000,
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{ fontSize: "24px", fontWeight: "bold", color: "#38bdf8" }}
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
            ADMIN PANEL
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
            🚪 Đăng xuất khỏi hệ thống
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 8%",
        background: "white",
        borderBottom: "1px solid #f1eae4",
        position: "relative",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "24px",
          fontWeight: "bold",
          color: "var(--primary-color)",
          cursor: "pointer",
        }}
        onClick={() => setPage("home")}
      >
        <img
          src="/images/logo.png"
          alt="ToyShare Logo"
          style={{ height: "60px", objectFit: "contain" }}
        />
        <span>ToyShare</span>
      </div>
      
      <div style={{ display: "flex", gap: "30px", fontWeight: "500" }}>
        <button
          onClick={() => setPage("home")}
          style={{
            color:
              page === "home" ? "var(--primary-color)" : "var(--text-muted)",
            textDecoration: "none",
            background: "none",
            border: "none",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Home
        </button>
        <button
          onClick={() => setPage("my-toys")}
          style={{
            color:
              page === "my-toys" ? "var(--primary-color)" : "var(--text-muted)",
            textDecoration: "none",
            background: "none",
            border: "none",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          My Toys
        </button>
        <button
          onClick={() => setPage("requests")}
          style={{
            color:
              page === "requests"
                ? "var(--primary-color)"
                : "var(--text-muted)",
            textDecoration: "none",
            background: "none",
            border: "none",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Requests
        </button>
      </div>

     
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
       

        {user ? (
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
            >
              <img
                src={
                  user.avatar ||
                  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"
                }
                alt="Avatar"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#f3e8ff",
                  border: "2px solid var(--primary-color)",
                }}
              />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
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
                  top: "50px",
                  background: "white",
                  minWidth: "200px",
                  borderRadius: "14px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  border: "1px solid #f1eae4",
                  padding: "10px 0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    padding: "10px 20px",
                    borderBottom: "1px dashed #f1eae4",
                    marginBottom: "5px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--text-main)",
                    }}
                  >
                    {user.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {user.email}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPage("profile");
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: "10px 20px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "var(--text-main)",
                    width: "100%",
                  }}
                >
                   Thông tin cá nhân
                </button>

                <button
                  onClick={() => {
                    handleLogout();
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: "10px 20px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#ef4444",
                    fontWeight: "600",
                    width: "100%",
                    borderTop: "1px solid #f9f5f1",
                    marginTop: "5px",
                  }}
                >
                   Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setPage("login")}
            className="btn-primary"
            style={{
              padding: "10px 22px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </nav>
  );
}
