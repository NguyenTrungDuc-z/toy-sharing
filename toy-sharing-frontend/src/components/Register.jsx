import React, { useState } from 'react';
import axios from 'axios';

export default function Register({ setPage }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
       showToast("Mật khẩu xác nhận không trùng khớp!", "error");
       return;
     }

     if (!agree) {
       showToast("Vui lòng tích chọn đồng ý với Hướng dẫn an toàn & Điều khoản dịch vụ!", "error");
       return;
     }

     try {
       const res = await axios.post('http://localhost:5000/api/auth/register', { 
         name, 
         email, 
         password, 
         phone 
       });
       showToast(res.data.message, 'success');
       setPage('login'); 
     } catch (err) {
       showToast(err.response?.data?.message || 'Đăng ký thất bại', 'error');
     }
  };

  return (
    <div style={{ 
      display: 'flex', 
      maxWidth: '1100px', 
      margin: '40px auto', 
      background: 'linear-gradient(135deg, #fffcf9 0%, #f7f0e9 100%)', 
      borderRadius: '32px', 
      padding: '50px',
      gap: '60px',
      alignItems: 'center'
    }}>
      
     
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '42px', fontWeight: '700', color: '#5c4d42', margin: 0, lineHeight: '1.2' }}>
          Join our circle of play.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '15px', lineHeight: '1.5' }}>
          Become part of a community where sharing brings joy and sustainability is child's play.
        </p>
        
       
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(92,77,66,0.03)', border: '1px solid #f3ece6' }}>
          <div style={{ fontSize: '24px', background: '#fff7ed', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>🛡️</div>
          <div>
            <strong style={{ color: '#5c4d42', fontSize: '15px' }}>Safe community</strong>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Vetted families and safety-checked toys for peace of mind.</div>
          </div>
        </div>

       
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(92,77,66,0.03)', border: '1px solid #f3ece6' }}>
          <div style={{ fontSize: '24px', background: '#f0fdf4', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>🍃</div>
          <div>
            <strong style={{ color: '#5c4d42', fontSize: '15px' }}>Eco-friendly sharing</strong>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Reducing plastic waste by giving every toy a second life.</div>
          </div>
        </div>

        
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(92,77,66,0.03)', border: '1px solid #f3ece6' }}>
          <div style={{ fontSize: '24px', background: '#f5f3ff', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>🎁</div>
          <div>
            <strong style={{ color: '#5c4d42', fontSize: '15px' }}>Zero-cost fun</strong>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Borrow hundreds of toys without spending a single penny.</div>
          </div>
        </div>

        <p style={{ fontStyle: 'italic', color: '#8a7667', fontSize: '13px', marginTop: '15px', lineHeight: '1.6' }}>
          "ToyShare transformed our weekends! My kids always have something new to learn with, and our house isn't cluttered anymore." – <strong style={{ color: '#d97706' }}>Sarah M., Educator</strong>
        </p>
      </div>

      
      <div style={{ 
        flex: 1, 
        background: '#ffffff', 
        padding: '40px', 
        borderRadius: '28px', 
        boxShadow: '0 30px 60px rgba(92,77,66,0.06)',
        border: '1px solid #f1eae4'
      }}>
        <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#2d2520', marginBottom: '6px' }}>Get Started</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>Join over 5,000 families sharing joy.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#5c4d42' }}>Full Name</label>
            <input type="text" placeholder="👨‍👩- Enter your full name" className="form-input" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%' }} />
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#5c4d42' }}>Email Address</label>
              <input type="email" placeholder="example@email.com" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#5c4d42' }}>Phone Number</label>
              <input type="text" placeholder="090xxxxxxx" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: '100%' }} />
            </div>
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#5c4d42' }}>Password</label>
              <input type="password" placeholder="••••••••" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#5c4d42' }}>Confirm Password</label>
              <input type="password" placeholder="••••••••" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%' }} />
            </div>
          </div>

         
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '5px' }}>
            <input type="checkbox" id="agree" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: '3px', cursor: 'pointer' }} />
            <label htmlFor="agree" style={{ fontSize: '13px', color: '#7c6e65', cursor: 'pointer', lineHeight: '1.4' }}>
              I agree to the <span style={{ color: '#b45309', fontWeight: '600' }}>Safety Guidelines</span> and <span style={{ color: '#b45309', fontWeight: '600' }}>Terms of Service</span>.
            </label>
          </div>

          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              padding: '14px', 
              justifyContent: 'center', 
              borderRadius: '16px', 
              marginTop: '10px',
              fontSize: '15px',
              fontWeight: '700',
              backgroundColor: '#eab308', 
              border: 'none'
            }}
          >
            Create Account ➔
          </button>
        </form>

        
        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Already have an account? <span onClick={() => setPage('login')} style={{ color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>Log in here</span>
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
