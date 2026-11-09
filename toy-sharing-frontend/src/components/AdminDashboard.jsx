import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Row, Col, Card, Statistic, Spin, Typography } from 'antd';
import { TeamOutlined, AppstoreOutlined, SwapOutlined, ClockCircleOutlined } from '@ant-design/icons';
import AdminLayout from './AdminLayout';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function AdminDashboard({ setPage }) {
  const [stats, setStats] = useState({
    totalUsers: 0, totalToys: 0, activeLoans: 0, pendingApprovals: 0,
    chartData: [0, 0, 0, 0], chartLabels: ['21 ngày trước', '14 ngày trước', '7 ngày trước', 'Hôm nay'],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/auth/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setStats(res.data.data);
      } catch { /* bỏ qua */ } finally { setLoading(false); }
    })();
  }, []);

  const chartData = {
    labels: stats.chartLabels,
    datasets: [{
      fill: true, label: 'Tổng đồ chơi', data: stats.chartData,
      borderColor: '#0b6e8f', backgroundColor: 'rgba(11,110,143,0.12)', tension: 0.4, pointBackgroundColor: '#0b6e8f',
    }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { borderDash: [5, 5] } }, x: { grid: { display: false } } },
  };

  const cards = [
    { title: 'Tổng người dùng', value: stats.totalUsers, icon: <TeamOutlined />, color: '#0b6e8f' },
    { title: 'Tổng đồ chơi', value: stats.totalToys, icon: <AppstoreOutlined />, color: '#4f46e5' },
    { title: 'Đang cho mượn', value: stats.activeLoans, icon: <SwapOutlined />, color: '#16a34a' },
    { title: 'Chờ duyệt', value: stats.pendingApprovals, icon: <ClockCircleOutlined />, color: '#d97706' },
  ];

  return (
    <AdminLayout active="admin-dashboard" setPage={setPage} title="Bảng điều khiển">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {cards.map(c => (
              <Col xs={12} md={6} key={c.title}>
                <Card styles={{ body: { padding: 20 } }}>
                  <div style={{ color: c.color, fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
                  <Statistic title={c.title} value={c.value} valueStyle={{ color: c.color, fontWeight: 700 }} />
                </Card>
              </Col>
            ))}
          </Row>
          <Card title="Tăng trưởng đồ chơi (4 tuần gần nhất)">
            <div style={{ height: 320 }}><Line data={chartData} options={chartOptions} /></div>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
