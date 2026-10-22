import React, { useState, useEffect } from 'react';
import axios from 'axios';


export default function RoleManagement({ setPage }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  // Loại bỏ moderators khỏi state thống kê
  const [stats, setStats] = useState({ admins: 0, usersCount: 0, pending: 0, blocked: 0 });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

 
  const fetchUserData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/admin/users', {
        params: { search: search, role: roleFilter }
      });
      if (res.data.success) {
        setUsers(res.data.users);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Lỗi khi kết nối database lấy danh sách user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchUserData();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter]);

  
  const [editingRoleUserId, setEditingRoleUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  const setUserRole = async (userId, newRole) => {
    const roles = ['user', 'admin'];
    if (!roles.includes(newRole)) {
      showToast('Vai trò không hợp lệ!', 'error');
      return;
    }
    try {
      const res = await axios.put(`http://localhost:5000/api/auth/admin/users/${userId}`, { role: newRole });
      if (res.data.success || res.status === 200) {
        showToast(`Cập nhật quyền thành viên thành ${newRole === 'admin' ? 'Quản trị viên' : 'Người dùng'} thành công!`, 'success');
        fetchUserData();
        setEditingRoleUserId(null);
      }
    } catch (err) {
      console.error("Lỗi cập nhật vai trò:", err);
      showToast("Không thể cập nhật quyền hạn.", "error");
    }
  };

  
  const handleToggleStatus = async (userId, currentStatus, userName) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const actionText = newStatus === 'blocked' ? 'KHÓA' : 'MỞ KHÓA';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của ${userName}?`)) {
      return;
    }

    try {
      const res = await axios.put(`http://localhost:5000/api/auth/admin/users/${userId}`, { status: newStatus });
       if (res.data.success || res.status === 200) {
         showToast(`${actionText} tài khoản thành công!`, 'success');
         fetchUserData(); // 🔄 Tải lại danh sách mới nhất từ DB
       }
     } catch (err) {
       console.error("Lỗi cập nhật trạng thái:", err);
       showToast("Không thể thay đổi trạng thái tài khoản.", "error");
    }
  };

  const renderRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: '600', backgroundColor: '#eef2ff', color: '#4f46e5' }}>🛡️ Quản trị viên</span>;
      default:
        return <span style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fdf4ec', color: '#85581A' }}>👤 Người dùng</span>;
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'blocked') {
      return <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: '#fee2e2', color: '#991b1b' }}>• BỊ KHÓA</span>;
    }
    return <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: '#d1fae5', color: '#065f46' }}>• HOẠT ĐỘNG</span>;
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: '#fffbf7', fontFamily: 'sans-serif', width: '100%' }}>
      
      
      <div style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #f1eae4', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <button 
            onClick={() => setPage('admin-dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
             Bảng điều khiển
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: '650', fontSize: '14px', cursor: 'default' }}
          >
             Phân quyền người dùng
          </button>

          <button 
            onClick={() => setPage('toy-moderation')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
             Kiểm soát bài đăng
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
             Phân tích
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
             Cài đặt
          </button>
        </div>

        
      </div>

      
      <div style={{ flex: 1, padding: '40px 50px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '35px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#85581A', margin: '0 0 6px 0' }}>Phân quyền người dùng</h2>
            <p style={{ color: '#7c6e65', fontSize: '14px', margin: 0 }}>Quản lý quyền truy cập và vai trò người dùng trong hệ thống ToyShare.</p>
          </div>
          <button style={{ backgroundColor: '#4338ca', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '20px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
            👤+ Mời thành viên
          </button>
        </div>

       
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '35px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4' }}>
            <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '700' }}>TỔNG QUẢN TRỊ VIÊN</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1512', marginTop: '8px' }}>{stats.admins}</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4' }}>
            <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '700' }}>TỔNG NGƯỜI DÙNG</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1512', marginTop: '8px' }}>{stats.usersCount || 0}</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4' }}>
            <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '700' }}>ĐANG CHỜ DUYỆT</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#4f46e5', marginTop: '8px' }}>{stats.pending}</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4' }}>
            <div style={{ fontSize: '12px', color: '#a19286', fontWeight: '700' }}>NGƯỜI DÙNG BỊ KHÓA</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444', marginTop: '8px' }}>{stats.blocked}</div>
          </div>
        </div>

        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', backgroundColor: '#fff', padding: '16px 24px', borderRadius: '20px', border: '1px solid #f1eae4' }}>
          <input 
            type="text" 
            placeholder=" Tìm theo tên, email hoặc UID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #eaddd3', width: '300px', fontSize: '14px', outline: 'none' }}
          />
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #eaddd3', fontSize: '14px', outline: 'none' }}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            
            <option value="user">Người dùng</option>
          </select>
        </div>

        
        <div style={{ backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1eae4', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#85581A', fontWeight: '600' }}>🔄 Đang truy vấn cơ sở dữ liệu MongoDB...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#fff8f2', borderBottom: '1px solid #f1eae4' }}>
                  <th style={{ padding: '18px 24px', fontSize: '13px', color: '#a19286' }}>HỒ SƠ NGƯỜI DÙNG</th>
                  <th style={{ padding: '18px 24px', fontSize: '13px', color: '#a19286' }}>PHÂN QUYỀN</th>
                  <th style={{ padding: '18px 24px', fontSize: '13px', color: '#a19286' }}>TRẠNG THÁI</th>
                  <th style={{ padding: '18px 24px', fontSize: '13px', color: '#a19286' }}>CẬP NHẬT CUỐI</th>
                  <th style={{ padding: '18px 24px', fontSize: '13px', color: '#a19286', textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#a19286' }}>Không tìm thấy tài khoản người dùng nào trùng khớp!</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} style={{ borderBottom: '1px solid #f9f5f0' }}>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={user.avatar || 'https://i.pravatar.cc/150?img=11'} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontWeight: '600', color: '#1a1512' }}>{user.name}</div>
                            <div style={{ color: '#a19286', fontSize: '12px' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>{renderRoleBadge(user.role)}</td>
                      <td style={{ padding: '18px 24px' }}>{renderStatusBadge(user.status)}</td>
                      <td style={{ padding: '18px 24px', color: '#7c6e65', fontSize: '13px' }}>
                        {new Date(user.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                        {editingRoleUserId === user._id ? (
                          <>
                            <select
                              value={selectedRole}
                              onChange={e => setSelectedRole(e.target.value)}
                              style={{ padding: '6px 12px', borderRadius: '6px', marginRight: '6px' }}
                            >
                              <option value="user">Người dùng</option>
                              <option value="admin">Quản trị viên</option>
                            </select>
                            <button
                              style={{ border: 'none', backgroundColor: '#4338ca', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', marginRight: '6px' }}
                              onClick={() => setUserRole(user._id, selectedRole)}
                              title="Xác nhận thay đổi vai trò"
                            >
                              OK
                            </button>
                            <button
                              style={{ border: 'none', backgroundColor: '#e5e7eb', color: '#000', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}
                              onClick={() => setEditingRoleUserId(null)}
                              title="Hủy"
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <button
                            style={{ border: 'none', backgroundColor: '#85581A', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', marginRight: '10px' }}
                            onClick={() => {
                              setEditingRoleUserId(user._id);
                              setSelectedRole(user.role);
                            }}
                            title="Phân quyền"
                          >
                            Phân quyền
                          </button>
                        )}
                        <button
                          style={{
                            border: 'none',
                            backgroundColor: user.status === 'blocked' ? '#16a34a' : '#ef4444',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: '6px 12px',
                            borderRadius: '6px'
                          }}
                          onClick={() => handleToggleStatus(user._id, user.status, user.name)}
                          title={user.status === 'blocked' ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        >
                          {user.status === 'blocked' ? 'Mở khóa' : 'Khóa'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          <div style={{ padding: '20px 24px', borderTop: '1px solid #f1eae4', color: '#7c6e65', fontSize: '13px' }}>
            Hiển thị thực tế {users.length} tài khoản người dùng từ hệ thống.
          </div>
        </div>

      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          animation: 'slideIn 0.3s ease-out',
          zIndex: 9999
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
