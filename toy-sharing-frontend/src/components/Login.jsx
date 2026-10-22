import React, { useState } from 'react';
import axios from 'axios';


export default function Login({ setPage, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });
      
       showToast(res.data.message, 'success');

       
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }

      
      localStorage.setItem('user', JSON.stringify(res.data.user));

     
      if (res.data.user && res.data.user.role) {
        localStorage.setItem('role', res.data.user.role);
      }

      
      if (res.data.user && (res.data.user.id || res.data.user._id)) {
        localStorage.setItem('userId', res.data.user.id || res.data.user._id);
      }

      
      if (setUser) {
        setUser(res.data.user);
      }
      
      
      if (res.data.user?.role === 'admin') {
        setPage('admin-dashboard');
      } else {
        setPage('home');
      }
     } catch (err) {
       showToast(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!', 'error');
     }
  
  };

  return (
    <div style={{ 
      display: 'flex', 
      maxWidth: '1050px', 
      margin: '50px auto', 
      background: '#fffbf7', 
      borderRadius: '32px', 
      padding: '40px',
      gap: '50px',
      alignItems: 'center',
      boxShadow: '0 20px 50px rgba(92, 77, 66, 0.04)'
    }}>
      
      
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(180deg, #fff2e6 0%, #e6f2ff 100%)', 
        borderRadius: '24px', 
        padding: '40px 30px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        position: 'relative'
      }}>
        <div style={{ alignSelf: 'flex-start', fontWeight: '700', color: '#85581A', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
           ToyShare
        </div>

        <div style={{ 
          width: '85%', 
          height: '240px', 
          backgroundColor: '#fcd34d', 
          borderRadius: '20px', 
          overflow: 'hidden',
          boxShadow: '0 15px 30px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '60px'
        }}>
          🚂 
        </div>

        <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#2d2520', margin: '10px 0 0 0', lineHeight: '1.3' }}>
          Sharing Joy, One Toy at a Time
        </h2>
        
        <p style={{ color: '#6b5a4e', fontSize: '14px', lineHeight: '1.6', maxWidth: '340px', margin: 0 }}>
          Join our sustainable community of families making playtime more magical and eco-friendly.
        </p>
      </div>

     
      <div style={{ flex: 1, padding: '10px 20px' }}>
        <h3 style={{ fontSize: '36px', fontWeight: '700', color: '#1a1512', marginBottom: '8px' }}>Welcome Back!</h3>
        <p style={{ color: '#7c6e65', fontSize: '14px', marginBottom: '35px' }}>Log in to manage your toy chest and requests.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
         
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4a3f35' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="hello@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '12px', 
                border: '1px solid #e2d8cf', 
                backgroundColor: '#fff',
                fontSize: '14px'
              }} 
            />
          </div>

          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a3f35', flex: 1 }}>Password</label>
               <span 
                 onClick={() => showToast('Chức năng Quên mật khẩu đang được phát triển!', 'info')} 
                 style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '600', cursor: 'pointer' }}
               >
                 Forgot password?
               </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2d8cf', 
                  backgroundColor: '#fff',
                  fontSize: '14px'
                }} 
              />
              <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#a19286' }}>👁️</span>
            </div>
          </div>

          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe} 
              onChange={e => setRememberMe(e.target.checked)} 
              style={{ cursor: 'pointer', width: '16px', height: '16px' }} 
            />
            <label htmlFor="remember" style={{ fontSize: '13px', color: '#6b5a4e', cursor: 'pointer' }}>
              Remember my playroom session
            </label>
          </div>

        
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '14px', 
              backgroundColor: '#f59e0b', 
              color: '#fff', 
              border: 'none', 
              fontSize: '15px', 
              fontWeight: '700', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
              marginTop: '5px'
            }}
          >
            Login to ToyShare ➔
          </button>
        </form>

  
        <div style={{ display: 'flex', alignItems: 'center', margin: '30px 0', color: '#a19286', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#eaddd3' }}></div>
          <span style={{ padding: '0 15px' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#eaddd3' }}></div>
        </div>

       
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
           <button 
             onClick={() => showToast('Đăng nhập Google', 'info')}
             style={{ 
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', 
               border: '1px solid #e2d8cf', borderRadius: '12px', backgroundColor: '#fff', 
               fontWeight: '600', fontSize: '13px', color: '#4a3f35', cursor: 'pointer'
             }}
           >
             <span>🌐</span> Google
           </button>
           <button 
             onClick={() => showToast('Đăng nhập Facebook', 'info')}
             style={{ 
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', 
               border: 'none', borderRadius: '12px', backgroundColor: '#1877f2', 
               fontWeight: '600', fontSize: '13px', color: '#fff', cursor: 'pointer'
             }}
           >
             <span>🔹</span> Facebook
           </button>
        </div>

        {/* Link chuyển đổi sang màn Đăng ký */}
        <p style={{ textAlign: 'center', marginTop: '35px', fontSize: '13px', color: '#7c6e65' }}>
          New to ToyShare?{' '}
          <span 
            onClick={() => setPage('register')} 
            style={{ color: '#4f46e5', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Create an account
          </span>
         </p>
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
