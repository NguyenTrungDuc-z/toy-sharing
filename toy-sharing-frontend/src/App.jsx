import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './components/Home';
import MyToys from './components/MyToys';
import Register from './components/Register';
import Login from './components/Login';
import Requests from './components/Requests';

import AdminDashboard from './components/AdminDashboard'; 
import RoleManagement from './components/RoleManagement'; 
import ToyModeration from './components/ToyModeration';

export default function App() {
  // Trạng thái trang hiện tại: 'home', 'my-toys', 'login', 'register', 'admin-dashboard', 'role-management'
  const [page, setPage] = useState('home');
  
  // Trạng thái người dùng đăng nhập
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Khi ứng dụng chạy, kiểm tra xem người dùng đã đăng nhập trước đó chưa
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('role');
    const savedPage = localStorage.getItem('currentPage'); // 💡 Mẹo: Nhớ trang Admin đang đứng trước khi F5
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      
      // 🔥 CẬP NHẬT: Nếu reload trang (F5) mà là Admin, giữ đúng trang admin họ đang làm việc
      if (savedRole === 'admin') {
        if (savedPage === 'role-management') {
          setPage('role-management');
        } else if (savedPage === 'toy-moderation') {
          setPage('toy-moderation');
        } else {
          setPage('admin-dashboard');
        }
      }
    }
  }, []);

  // Hàm chuyển trang thông minh, lưu trạng thái tránh mất dấu khi F5
  const navigateTo = (nextPage) => {
    setPage(nextPage);
    if (user?.role === 'admin') {
      localStorage.setItem('currentPage', nextPage);
    }
  };

  // Hàm xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setPage('login');
    setToast({ type: 'success', message: 'Đã đăng xuất tài khoản thành công!' });
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div>
      {/* Truyền page, setPage (đã đổi sang navigateTo), user và handleLogout vào Navbar */}
      <Navbar page={page} setPage={navigateTo} user={user} handleLogout={handleLogout} />
      
      {/* 📐 Nếu là admin thì bỏ padding '0 8%' để giao diện quản trị phân quyền bung tràn viền đẹp mắt */}
      <div style={{ padding: user?.role === 'admin' ? '0' : '0 8%' }}>
        {toast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: toast.type === 'success' ? '#16a34a' : '#dc2626',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 9999
          }}>
            {toast.message}
          </div>
        )}
        
        {/* 🟢 KHỐI TRANG CỦA USER THƯỜNG: Chỉ mở nếu KHÔNG PHẢI admin */}
        {page === 'home' && user?.role !== 'admin' && <Home user={user} setPage={navigateTo} />}
        {page === 'my-toys' && user?.role !== 'admin' && <MyToys user={user} setPage={navigateTo} />}
        {page === 'requests' && user?.role !== 'admin' && <Requests user={user} setPage={navigateTo} />}
        
        {/* 🔓 CÁC TRANG CÔNG CỘNG */}
        {page === 'login' && <Login setPage={navigateTo} setUser={(u) => {
          setUser(u);
          // Định hướng trang đầu tiên sau đăng nhập dựa trên quyền hạn
          if (u?.role === 'admin') {
            navigateTo('admin-dashboard');
          } else {
            navigateTo('home');
          }
        }} />}
        {page === 'register' && <Register setPage={navigateTo} />}
        
        {/* 🛡️ KHỐI TRANG CỦA ADMIN: Chỉ mở khi đúng quyền admin */}
        {page === 'admin-dashboard' && user?.role === 'admin' && (
          <AdminDashboard setPage={navigateTo} />
        )}

        {/* 🔥 BỔ SUNG: Render trang Phân Quyền Người Dùng khi state chuyển đổi sang 'role-management' */}
        {page === 'role-management' && user?.role === 'admin' && (
          <RoleManagement setPage={navigateTo} />
        )}

        {page === 'toy-moderation' && user?.role === 'admin' && (
          <ToyModeration setPage={navigateTo} />
        )}
        
      </div>
    </div>
  );
}