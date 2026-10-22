import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin/reports';
const statusLabels = {
  open: 'Mới tiếp nhận',
  processing: 'Đang xử lý',
  closed: 'Đã đóng',
  dismissed: 'Không vi phạm',
};

export default function AdminReports({ setPage }) {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchReports = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = statusFilter === 'all' ? {} : { status: statusFilter };
        const response = await axios.get(API_URL, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        const nextReports = response.data.reports || [];
        setReports(nextReports);
        setDrafts(Object.fromEntries(nextReports.map(report => [report._id, {
          status: report.status,
          adminNote: report.adminNote || '',
        }])));
        setNotice(null);
      } catch (error) {
        if (active) {
          setNotice(error.response?.data?.message || 'Không thể tải danh sách báo cáo.');
          setReports([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReports();
    return () => { active = false; };
  }, [statusFilter]);

  const updateDraft = (reportId, field, value) => {
    setDrafts(current => ({
      ...current,
      [reportId]: { ...current[reportId], [field]: value },
    }));
  };

  const saveReport = async (reportId) => {
    setSavingId(reportId);
    setNotice(null);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/${reportId}`, drafts[reportId], {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(current => current.map(report => report._id === reportId
        ? { ...report, ...drafts[reportId] }
        : report));
      setNotice('Đã cập nhật báo cáo.');
    } catch (error) {
      setNotice(error.response?.data?.message || 'Không thể cập nhật báo cáo.');
    } finally {
      setSavingId(null);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e5ddd5', borderRadius: '8px', background: '#fff', color: '#2d2520' };
  const buttonStyle = { border: 'none', borderRadius: '8px', padding: '10px 14px', background: '#9d3b35', color: '#fff', fontWeight: 600, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: '#fffbf7', width: '100%' }}>
      <aside style={{ width: '260px', flexShrink: 0, background: '#fff', borderRight: '1px solid #f1eae4', padding: '28px 20px' }}>
        <button type="button" onClick={() => setPage('admin-dashboard')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Bảng điều khiển</button>
        <button type="button" onClick={() => setPage('toy-moderation')} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: 'transparent', color: '#7c6e65', cursor: 'pointer', marginBottom: '8px' }}>Kiểm soát bài đăng</button>
        <button type="button" style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 0, borderRadius: '8px', background: '#f8e8df', color: '#8f362f', fontWeight: 700, cursor: 'default' }}>Báo cáo vi phạm</button>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '36px clamp(20px, 4vw, 52px)', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div>
            <p style={{ color: '#a34b3f', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>AN TOÀN CỘNG ĐỒNG</p>
            <h1 style={{ fontSize: '28px', color: '#2d2520' }}>Báo cáo vi phạm</h1>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#7c6e65', fontSize: '14px' }}>
            Trạng thái
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={inputStyle}>
              <option value="all">Tất cả</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </header>

        {notice && <p role="status" style={{ padding: '12px 14px', marginBottom: '16px', borderRadius: '8px', background: notice.startsWith('Đã') ? '#e6f6ee' : '#fee2e2', color: notice.startsWith('Đã') ? '#166534' : '#991b1b' }}>{notice}</p>}

        {loading ? <p style={{ padding: '40px 0', color: '#7c6e65' }}>Đang tải báo cáo...</p> : reports.length === 0 ? (
          <p style={{ padding: '42px 20px', background: '#fff', border: '1px solid #f1eae4', borderRadius: '10px', color: '#7c6e65', textAlign: 'center' }}>Không có báo cáo ở trạng thái này.</p>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {reports.map(report => {
              const draft = drafts[report._id] || { status: report.status, adminNote: report.adminNote || '' };
              const toy = report.toyId;
              return (
                <article key={report._id} style={{ padding: '20px', background: '#fff', border: '1px solid #eee5dc', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', color: '#2d2520' }}>{toy?.name || 'Bài đăng không còn tồn tại'}</h2>
                      <p style={{ marginTop: '4px', color: '#7c6e65', fontSize: '13px' }}>
                        Người báo cáo: {report.reporterId?.name || 'Không rõ'} · {new Date(report.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <span style={{ padding: '5px 10px', borderRadius: '20px', background: '#f5f0eb', color: '#6b5141', fontSize: '12px', fontWeight: 700 }}>{statusLabels[report.status] || report.status}</span>
                  </div>
                  <p style={{ color: '#9d3b35', fontWeight: 700, marginBottom: '6px' }}>{report.reason}</p>
                  <p style={{ color: '#5e5148', whiteSpace: 'pre-wrap', marginBottom: '14px' }}>{report.details || 'Không có chi tiết bổ sung.'}</p>
                  <p style={{ color: '#7c6e65', fontSize: '13px', marginBottom: '14px' }}>
                    Chủ bài đăng: {toy?.ownerId?.name || 'Không rõ'} · Người xử lý: {report.reviewedBy?.name || 'Chưa xử lý'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 220px) 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <label style={{ display: 'grid', gap: '6px', color: '#6b5141', fontSize: '13px', fontWeight: 600 }}>
                      Cập nhật trạng thái
                      <select value={draft.status} onChange={event => updateDraft(report._id, 'status', event.target.value)} style={inputStyle}>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '6px', color: '#6b5141', fontSize: '13px', fontWeight: 600 }}>
                      Ghi chú xử lý
                      <input value={draft.adminNote} onChange={event => updateDraft(report._id, 'adminNote', event.target.value)} maxLength={1000} style={inputStyle} placeholder="Ghi chú nội bộ" />
                    </label>
                    <button type="button" onClick={() => saveReport(report._id)} disabled={savingId === report._id} style={buttonStyle}>
                      {savingId === report._id ? 'Đang lưu...' : 'Lưu xử lý'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}