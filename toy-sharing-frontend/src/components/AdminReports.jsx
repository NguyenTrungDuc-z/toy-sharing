import { useEffect, useState } from 'react';
import axios from 'axios';
import { App, Card, Select, Input, Button, Tag, Typography, Empty, Spin, Flex } from 'antd';
import AdminLayout from './AdminLayout';

const { Text, Title, Paragraph } = Typography;
const API_URL = '/api/admin/reports';
const statusLabels = { open: 'Mới tiếp nhận', processing: 'Đang xử lý', closed: 'Đã đóng', dismissed: 'Không vi phạm' };
const statusColor = { open: 'gold', processing: 'blue', closed: 'green', dismissed: 'default' };

export default function AdminReports({ setPage }) {
  const { message } = App.useApp();
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = statusFilter === 'all' ? {} : { status: statusFilter };
        const res = await axios.get(API_URL, { params, headers: { Authorization: `Bearer ${token}` } });
        if (!active) return;
        const next = res.data.reports || [];
        setReports(next);
        setDrafts(Object.fromEntries(next.map(r => [r._id, { status: r.status, adminNote: r.adminNote || '' }])));
      } catch (err) {
        if (active) { message.error(err.response?.data?.message || 'Không thể tải danh sách báo cáo.'); setReports([]); }
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [statusFilter]);

  const updateDraft = (id, field, value) => setDrafts(cur => ({ ...cur, [id]: { ...cur[id], [field]: value } }));

  const saveReport = async (id) => {
    setSavingId(id);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/${id}`, drafts[id], { headers: { Authorization: `Bearer ${token}` } });
      setReports(cur => cur.map(r => r._id === id ? { ...r, ...drafts[id] } : r));
      message.success('Đã cập nhật báo cáo.');
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể cập nhật báo cáo.');
    } finally { setSavingId(null); }
  };

  const filterExtra = (
    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}
      options={[{ value: 'all', label: 'Tất cả trạng thái' }, ...Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))]} />
  );

  return (
    <AdminLayout active="admin-reports" setPage={setPage} title="Báo cáo vi phạm" extra={filterExtra}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
      ) : reports.length === 0 ? (
        <Empty description="Không có báo cáo ở trạng thái này." style={{ padding: '40px 0' }} />
      ) : (
        <Flex vertical gap={14}>
          {reports.map(report => {
            const draft = drafts[report._id] || { status: report.status, adminNote: report.adminNote || '' };
            const toy = report.toyId;
            return (
              <Card key={report._id} styles={{ body: { padding: 20 } }}>
                <Flex justify="space-between" align="start" wrap gap={16} style={{ marginBottom: 12 }}>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>{toy?.name || 'Bài đăng không còn tồn tại'}</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Người báo cáo: {report.reporterId?.name || 'Không rõ'} · {new Date(report.createdAt).toLocaleString('vi-VN')}</Text>
                  </div>
                  <Tag color={statusColor[report.status]}>{statusLabels[report.status] || report.status}</Tag>
                </Flex>
                <Text strong style={{ color: '#9d3b35', display: 'block' }}>{report.reason}</Text>
                <Paragraph style={{ color: '#5e5148', whiteSpace: 'pre-wrap', marginTop: 4 }}>{report.details || 'Không có chi tiết bổ sung.'}</Paragraph>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                  Chủ bài đăng: {toy?.ownerId?.name || 'Không rõ'} · Người xử lý: {report.reviewedBy?.name || 'Chưa xử lý'}
                </Text>
                <Flex gap={10} align="end" wrap>
                  <div style={{ minWidth: 180 }}>
                    <Text style={{ fontSize: 13 }}>Cập nhật trạng thái</Text>
                    <Select value={draft.status} onChange={v => updateDraft(report._id, 'status', v)} style={{ width: '100%', marginTop: 4 }}
                      options={Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <Text style={{ fontSize: 13 }}>Ghi chú xử lý</Text>
                    <Input value={draft.adminNote} onChange={e => updateDraft(report._id, 'adminNote', e.target.value)} maxLength={1000} placeholder="Ghi chú nội bộ" style={{ marginTop: 4 }} />
                  </div>
                  <Button danger type="primary" loading={savingId === report._id} onClick={() => saveReport(report._id)}>Lưu xử lý</Button>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}
    </AdminLayout>
  );
}
