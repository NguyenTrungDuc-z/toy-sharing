import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Row, Col, Card, Statistic, Spin, Typography, Space, Tag, Flex, Segmented } from 'antd';
import {
  TeamOutlined,
  AppstoreOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  SafetyCertificateOutlined,
  PieChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import AdminLayout from './AdminLayout';

// Đăng ký toàn bộ các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const CATEGORY_COLORS = [
  '#0b6e8f', // Xếp hình (Teal)
  '#3b82f6', // Giáo dục (Blue)
  '#f97316', // Hành động (Orange)
  '#8b5cf6', // Công nghệ (Purple)
  '#ec4899', // Búp bê & Thú bông (Pink)
  '#10b981', // Mỹ thuật & Sáng tạo (Green)
  '#64748b', // Khác
];

const BORROW_STATUS_COLORS = [
  '#16a34a', // Đã hoàn tất - Green
  '#0b6e8f', // Đang mượn - Teal
  '#f59e0b', // Chờ duyệt - Amber
  '#dc2626', // Quá hạn - Red
  '#94a3b8', // Bị từ chối - Slate
  '#64748b', // Đã hủy - Gray
];

export default function AdminDashboard({ setPage }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalToys: 0,
    activeLoans: 0,
    pendingApprovals: 0,
    pendingToys: 0,
    totalReports: 0,
    chartData: [],
    chartLabels: [],
    usersTrend: [],
    borrowsTrend: [],
    categoryLabels: [],
    categoryData: [],
    borrowStatusLabels: [],
    borrowStatusData: [],
    depositStats: { held: 0, refunded: 0, pending: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month'); // week | month | year
  const [trendLoading, setTrendLoading] = useState(false);

  const RANGE_OPTIONS = [
    { label: '7 ngày', value: 'week' },
    { label: '4 tuần', value: 'month' },
    { label: '12 tháng', value: 'year' },
  ];
  const RANGE_TITLE = { week: '7 Ngày Qua', month: '4 Tuần Qua', year: '12 Tháng Qua' };

  useEffect(() => {
    const first = range === 'month' && loading;
    (async () => {
      if (!first) setTrendLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/admin/stats', {
          params: { range },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Không thể tải dữ liệu thống kê:', err);
      } finally {
        setLoading(false);
        setTrendLoading(false);
      }
    })();
  }, [range]);

  // 1. Dữ liệu Biểu đồ Tăng trưởng đa chiều (Multi-line Area Chart)
  const growthLineData = {
    labels: stats.chartLabels || [],
    datasets: [
      {
        label: 'Tổng đồ chơi',
        data: stats.chartData || [],
        fill: true,
        borderColor: '#0b6e8f',
        backgroundColor: 'rgba(11, 110, 143, 0.12)',
        tension: 0.35,
        pointBackgroundColor: '#0b6e8f',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Lượt mượn tích lũy',
        data: stats.borrowsTrend || [],
        fill: false,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.12)',
        tension: 0.35,
        pointBackgroundColor: '#16a34a',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Thành viên',
        data: stats.usersTrend || [],
        fill: false,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        tension: 0.35,
        pointBackgroundColor: '#f59e0b',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const growthLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, font: { size: 12, weight: '600' } },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { borderDash: [4, 4], color: '#e5e7eb' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  // 2. Dữ liệu Biểu đồ Phân bố Đồ chơi theo Danh mục (Doughnut Chart)
  const categoryDoughnutData = {
    labels: stats.categoryLabels || [],
    datasets: [
      {
        data: stats.categoryData || [],
        backgroundColor: CATEGORY_COLORS.slice(0, (stats.categoryLabels || []).length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const categoryDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          padding: 12,
          font: { size: 11, weight: '500' },
        },
      },
      tooltip: {
        callbacks: {
          label: (item) => {
            const total = item.dataset.data.reduce((a, b) => a + b, 0);
            const val = item.raw || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ${item.label}: ${val} sản phẩm (${pct}%)`;
          },
        },
      },
    },
    cutout: '62%',
  };

  // 3. Dữ liệu Biểu đồ Trạng thái Mượn Đồ (Bar Chart)
  const borrowStatusBarData = {
    labels: stats.borrowStatusLabels || [],
    datasets: [
      {
        label: 'Số lượt mượn',
        data: stats.borrowStatusData || [],
        backgroundColor: BORROW_STATUS_COLORS.slice(0, (stats.borrowStatusLabels || []).length),
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 42,
      },
    ],
  };

  const borrowStatusBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => ` ${item.dataset.label}: ${item.raw} lượt`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 5 },
        grid: { borderDash: [4, 4], color: '#e5e7eb' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  // 4. Dữ liệu Biểu đồ Quản lý Tiền cọc Escrow (Doughnut Chart)
  const depositStats = stats.depositStats || { held: 0, refunded: 0, pending: 0 };
  const depositDoughnutData = {
    labels: ['Đã hoàn trả cho khách', 'Đang giữ bảo chứng', 'Chờ người mượn cọc'],
    datasets: [
      {
        data: [depositStats.refunded || 0, depositStats.held || 0, depositStats.pending || 0],
        backgroundColor: ['#16a34a', '#0284c7', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const depositDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          padding: 12,
          font: { size: 11, weight: '500' },
        },
      },
      tooltip: {
        callbacks: {
          label: (item) => ` ${item.label}: ${(item.raw || 0).toLocaleString()}đ`,
        },
      },
    },
    cutout: '62%',
  };

  // Thẻ thống kê tổng quan
  const cards = [
    {
      title: 'Tổng thành viên',
      value: stats.totalUsers,
      suffix: 'người',
      icon: <TeamOutlined />,
      color: '#0b6e8f',
      bg: '#e6f4f8',
    },
    {
      title: 'Đồ chơi trên sàn',
      value: stats.totalToys,
      suffix: 'món',
      icon: <AppstoreOutlined />,
      color: '#4f46e5',
      bg: '#eef2ff',
    },
    {
      title: 'Đang mượn hoạt động',
      value: stats.activeLoans,
      suffix: 'đơn',
      icon: <SwapOutlined />,
      color: '#16a34a',
      bg: '#ecfdf5',
    },
    {
      title: 'Đơn mượn chờ duyệt',
      value: stats.pendingApprovals,
      suffix: 'đơn',
      icon: <ClockCircleOutlined />,
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      title: 'Tiền cọc đang giữ',
      value: depositStats.held || 0,
      prefix: '',
      isCurrency: true,
      icon: <SafetyCertificateOutlined />,
      color: '#0284c7',
      bg: '#f0f9ff',
    },
    {
      title: 'Báo cáo vi phạm',
      value: stats.totalReports || 0,
      suffix: 'tin',
      icon: <FlagOutlined />,
      color: '#dc2626',
      bg: '#fef2f2',
    },
  ];

  return (
    <AdminLayout active="admin-dashboard" setPage={setPage} title="Bảng Điều Khiển & Phân Tích Thống Kê (Analytics)">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#64748b' }}>Đang tải số liệu thời gian thực...</div>
        </div>
      ) : (
        <>
          {/* ROW 1: METRIC CARDS */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {cards.map((c) => (
              <Col xs={12} sm={8} lg={4} key={c.title}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  styles={{ body: { padding: '16px 14px' } }}
                >
                  <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: c.bg,
                        color: c.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      {c.icon}
                    </div>
                  </Flex>
                  <Statistic
                    title={<span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{c.title}</span>}
                    value={c.value}
                    formatter={(val) => (c.isCurrency ? `${Number(val).toLocaleString()}đ` : val)}
                    suffix={c.suffix && <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.suffix}</span>}
                    valueStyle={{
                      color: c.color,
                      fontWeight: 800,
                      fontSize: c.isCurrency ? 16 : 22,
                    }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* ROW 2: GROWTH TREND (LINE) + CATEGORY BREAKDOWN (DOUGHNUT) */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={15}>
              <Card
                title={
                  <Space>
                    <LineChartOutlined style={{ color: '#0b6e8f' }} />
                    <span style={{ fontWeight: 700 }}>Xu Hướng Tăng Trưởng ({RANGE_TITLE[range]})</span>
                  </Space>
                }
                extra={
                  <Segmented size="small" value={range} onChange={setRange} options={RANGE_OPTIONS} />
                }
                style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
              >
                <div style={{ height: 320, position: 'relative' }}>
                  {trendLoading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                      <Spin />
                    </div>
                  )}
                  <Line data={growthLineData} options={growthLineOptions} />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={9}>
              <Card
                title={
                  <Space>
                    <PieChartOutlined style={{ color: '#8b5cf6' }} />
                    <span style={{ fontWeight: 700 }}>Cơ Cấu Đồ Chơi Theo Danh Mục</span>
                  </Space>
                }
                style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
              >
                <div style={{ height: 320 }}>
                  <Doughnut data={categoryDoughnutData} options={categoryDoughnutOptions} />
                </div>
              </Card>
            </Col>
          </Row>

          {/* ROW 3: BORROW STATUS (BAR) + ESCROW DEPOSITS (DOUGHNUT) */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined style={{ color: '#16a34a' }} />
                    <span style={{ fontWeight: 700 }}>Phân Tích Trạng Thái Lượt Mượn Đồ</span>
                  </Space>
                }
                style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
              >
                <div style={{ height: 300 }}>
                  <Bar data={borrowStatusBarData} options={borrowStatusBarOptions} />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title={
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#0284c7' }} />
                    <span style={{ fontWeight: 700 }}>Dòng Tiền Ký Quỹ Cọc (Escrow)</span>
                  </Space>
                }
                style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
              >
                <div style={{ height: 230 }}>
                  <Doughnut data={depositDoughnutData} options={depositDoughnutOptions} />
                </div>
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px dashed #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-around',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Đã hoàn trả</div>
                    <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>
                      {(depositStats.refunded || 0).toLocaleString()}đ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Đang giữ</div>
                    <div style={{ fontWeight: 700, color: '#0284c7', fontSize: 13 }}>
                      {(depositStats.held || 0).toLocaleString()}đ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Chờ cọc</div>
                    <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 13 }}>
                      {(depositStats.pending || 0).toLocaleString()}đ
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AdminLayout>
  );
}
