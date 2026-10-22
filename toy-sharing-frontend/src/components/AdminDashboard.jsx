import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);


export default function AdminDashboard({ setPage }) {
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalToys: 0,
    activeLoans: 0,
    pendingApprovals: 0,
    chartData: [0, 0, 0, 0] 
  });
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/admin/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu thống kê admin:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  
  const chartData = {
    labels: ['Ngày 1', 'Ngày 10', 'Ngày 20', 'Hôm nay'],
    datasets: [
      {
        fill: true,
        label: 'Tổng đồ chơi', 
        data: stats.chartData, 
        borderColor: '#85581A',
        backgroundColor: 'rgba(217, 184, 154, 0.3)',
        tension: 0.4, 
        pointBackgroundColor: '#85581A',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, 
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { borderDash: [5, 5] } 
      },
      x: { grid: { display: false } }
    }
  };

 
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fffbf7', fontSize: '16px', fontWeight: '600', color: '#85581A' }}>
         Đang tải số liệu hệ thống thời gian thực...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: '#fffbf7', fontFamily: 'sans-serif', width: '100%' }}>
      
     
      <div style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #f1eae4', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
        
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: '650', fontSize: '14px', cursor: 'default' }}
          >
             Bảng điều khiển
          </button>
          
          
          <button 
            onClick={() => setPage('role-management')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
            onClick={() => setPage('admin-reports')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#7c6e65', fontWeight: '550', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
             Báo cáo vi phạm
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
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1512', margin: '0 0 6px 0' }}>Tổng quan hệ thống</h2>
        <p style={{ color: '#7c6e65', fontSize: '14px', margin: '0 0 35px 0' }}>Thống kê thời gian thực và các thao tác quản trị.</p>

      
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '35px' }}>
          
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4', position: 'relative' }}>
            <div style={{ fontSize: '13px', color: '#a19286', fontWeight: '600' }}>Tổng người dùng</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1512', margin: '8px 0' }}>
              {stats.totalUsers.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>↗ +12% so với tháng trước</div>
            <span style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '18px', backgroundColor: '#eef2ff', padding: '8px', borderRadius: '50%' }}>👥</span>
          </div>

          
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4', position: 'relative' }}>
            <div style={{ fontSize: '13px', color: '#a19286', fontWeight: '600' }}>Tổng đồ chơi</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1512', margin: '8px 0' }}>
              {stats.totalToys.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>↗ +8% so với tháng trước</div>
            <span style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '18px', backgroundColor: '#fff7ed', padding: '8px', borderRadius: '50%' }}>🤖</span>
          </div>

          
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4', position: 'relative' }}>
            <div style={{ fontSize: '13px', color: '#a19286', fontWeight: '600' }}>Đang cho mượn</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1512', margin: '8px 0' }}>
              {stats.activeLoans.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '600' }}>→ Tốc độ ổn định</div>
            <span style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '18px', backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '50%' }}>🔀</span>
          </div>

        
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1eae4', position: 'relative' }}>
            <div style={{ fontSize: '13px', color: '#a19286', fontWeight: '600' }}>Đang chờ duyệt</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#d97706', margin: '8px 0' }}>
              {stats.pendingApprovals.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>⚠️ Cần chú ý</div>
            <span style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '18px', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '50%' }}>🔔</span>
          </div>
        </div>

        
        <div style={{ display: 'flex', gap: '25px' }}>
          
          <div style={{ flex: 2, backgroundColor: '#fff', padding: '30px', borderRadius: '28px', border: '1px solid #f1eae4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1512', margin: 0 }}>Kho đồ chơi</h3>
                <p style={{ color: '#a19286', fontSize: '12px', margin: '4px 0 0 0' }}>Xu hướng tăng trưởng số lượng đồ chơi</p>
              </div>
              <span style={{ fontSize: '12px', color: '#7c6e65', backgroundColor: '#fdf4ec', padding: '6px 14px', borderRadius: '20px', fontWeight: '600' }}>30 ngày qua</span>
            </div>
            
            <div style={{ height: '260px', width: '100%' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

         
          <div style={{ flex: 1, backgroundColor: '#fff', padding: '30px', borderRadius: '28px', border: '1px solid #f1eae4', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1512', margin: 0 }}>Thao tác nhanh</h3>
            
            <button style={{ width: '100%', padding: '14px', borderRadius: '16px', backgroundColor: '#78350f', color: '#fff', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               Tải lên hàng loạt
            </button>

            <button style={{ width: '100%', padding: '14px', borderRadius: '16px', backgroundColor: '#4338ca', color: '#fff', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               Thông báo người mượn
            </button>

         
            <div style={{ marginTop: 'auto', backgroundColor: '#fff7ed', padding: '16px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1512' }}>Trạng thái hệ thống</div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '4px' }}>🟢 Mọi dịch vụ ổn định</div>
              </div>
              <span style={{ fontSize: '11px', color: '#a19286', fontWeight: '700' }}>TRỰC TIẾP</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}