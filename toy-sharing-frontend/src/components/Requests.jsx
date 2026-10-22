import React, { useState, useEffect } from 'react';
import axios from 'axios';

const getUserId = () => {
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) return storedUserId;

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    const userObj = JSON.parse(userStr);
    return userObj?._id || userObj?.id || null;
  } catch {
    return null;
  }
};

export default function Requests() {
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const userId = getUserId();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!userId) {
        setIncomingRequests([]);
        setMyBorrows([]);
        return;
      }

      const [incomingRes, myBorrowsRes, historyRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/borrows/incoming-requests?userId=${userId}`),
        axios.get(`http://localhost:5000/api/borrows/my-borrows?userId=${userId}`),
        axios.get(`http://localhost:5000/api/borrows/user-history?userId=${userId}`),
      ]);

      setIncomingRequests(incomingRes.data || []);
      setMyBorrows(myBorrowsRes.data || []);
      setUserHistory(historyRes.data || []);
    } catch (err) {
      console.error('Lỗi lấy dữ liệu yêu cầu:', err.response?.data || err.message);
      setIncomingRequests([]);
      setMyBorrows([]);
      setUserHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshCurrentTab = async () => {
    if (!userId) return;
    if (activeTab === 'incoming') {
      const res = await axios.get(`http://localhost:5000/api/borrows/incoming-requests?userId=${userId}`);
      setIncomingRequests(res.data || []);
    } else if (activeTab === 'borrowing') {
      const res = await axios.get(`http://localhost:5000/api/borrows/my-borrows?userId=${userId}`);
      setMyBorrows(res.data || []);
    } else {
      const res = await axios.get(`http://localhost:5000/api/borrows/user-history?userId=${userId}`);
      setUserHistory(res.data || []);
    }
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'Thỏa thuận';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const renderStatusBadge = (status) => {
    const base = { display: 'inline-block', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
    if (status === 'pending') return <span style={{ ...base, backgroundColor: '#f3ebd9', color: '#b45309' }}>Chờ duyệt</span>;
    if (status === 'approved') return <span style={{ ...base, backgroundColor: '#e0e7ff', color: '#4f46e5' }}>Đã duyệt</span>;
    if (status === 'borrowing') return <span style={{ ...base, backgroundColor: '#dcfce7', color: '#16a34a' }}>Đang mượn</span>;
    if (status === 'returned') return <span style={{ ...base, backgroundColor: '#dcfce7', color: '#16a34a' }}>Đã trả</span>;
    if (status === 'rejected') return <span style={{ ...base, backgroundColor: '#fee2e2', color: '#ef4444' }}>Từ chối</span>;
    if (status === 'cancelled') return <span style={{ ...base, backgroundColor: '#f3f4f6', color: '#6b7280' }}>Đã huỷ</span>;
    return <span style={{ ...base, backgroundColor: '#f3f4f6', color: '#6b7280' }}>{status}</span>;
  };

   const handleApproveRequest = async (requestId) => {
     setActionLoading(true);
     try {
       await axios.put(`http://localhost:5000/api/borrows/${requestId}/approve`, {}, { headers: { 'x-user-id': userId } });
       showToast('Đã duyệt yêu cầu mượn!', 'success');
       await refreshCurrentTab();
     } catch (err) {
       showToast(err.response?.data?.message || err.message, 'error');
     } finally {
       setActionLoading(false);
     }
   };

   const handleRejectRequest = async (requestId) => {
     setActionLoading(true);
     try {
       await axios.put(`http://localhost:5000/api/borrows/${requestId}/reject`, {}, { headers: { 'x-user-id': userId } });
       showToast('Đã từ chối yêu cầu mượn!', 'success');
       await refreshCurrentTab();
     } catch (err) {
       showToast(err.response?.data?.message || err.message, 'error');
     } finally {
       setActionLoading(false);
     }
   };

   const handleCancelRequest = async (requestId) => {
     showToast('Huỷ yêu cầu: cần bổ sung API cancel riêng nếu muốn dùng.', 'info');
   };

   const handleConfirmDeposit = async (requestId) => {
     setActionLoading(true);
     try {
       await axios.patch(`http://localhost:5000/api/borrows/${requestId}/confirm-deposit`, {}, { headers: { 'x-user-id': userId } });
       showToast('Đã xác nhận nhận cọc! Quá trình mượn bắt đầu.', 'success');
       await refreshCurrentTab();
     } catch (err) {
       showToast(err.response?.data?.message || err.message, 'error');
     } finally {
       setActionLoading(false);
     }
   };

   const handleConfirmReturn = async (requestId) => {
     setActionLoading(true);
     try {
       await axios.patch(`http://localhost:5000/api/borrows/${requestId}/confirm-return`, {}, { headers: { 'x-user-id': userId } });
       showToast('Đã xác nhận trả đồ và hoàn cọc!', 'success');
       await refreshCurrentTab();
     } catch (err) {
       showToast(err.response?.data?.message || err.message, 'error');
     } finally {
       setActionLoading(false);
     }
   };

  const requests = activeTab === 'incoming' ? incomingRequests : activeTab === 'borrowing' ? myBorrows : userHistory;

  return (
    <div style={{ backgroundColor: '#fffbf7', minHeight: '100vh', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#2d2520', margin: '0 0 24px 0' }}>
          Quản lý yêu cầu
        </h1>

        <div style={{ display: 'flex', gap: '32px', borderBottom: '2px solid #f3ebd9', marginBottom: '35px' }}>
          <button onClick={() => setActiveTab('incoming')} style={{ padding: '12px 4px', fontSize: '16px', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'incoming' ? '#85581A' : '#a19286', borderBottom: activeTab === 'incoming' ? '3px solid #85581A' : '3px solid transparent', marginBottom: '-2px' }}>
            Yêu cầu gửi tới tôi
          </button>
          <button onClick={() => setActiveTab('borrowing')} style={{ padding: '12px 4px', fontSize: '16px', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'borrowing' ? '#85581A' : '#a19286', borderBottom: activeTab === 'borrowing' ? '3px solid #85581A' : '3px solid transparent', marginBottom: '-2px' }}>
            Đồ đang mượn
          </button>
          <button onClick={() => setActiveTab('history')} style={{ padding: '12px 4px', fontSize: '16px', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'history' ? '#85581A' : '#a19286', borderBottom: activeTab === 'history' ? '3px solid #85581A' : '3px solid transparent', marginBottom: '-2px' }}>
            Lịch sử thuê
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#7c6e65' }}>Đang tải danh sách yêu cầu...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: '#a19286', fontStyle: 'italic' }}>Không có yêu cầu nào trong danh mục này.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {requests.map((item) => (
              <div key={item._id} style={{ background: '#fff', borderRadius: '28px', padding: '24px', border: '1px solid rgba(234, 221, 211, 0.5)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <img
                    src={item.toyId?.images?.[0] || 'https://images.unsplash.com/photo-1531234799389-dcb7651eb0a2?w=150'}
                    alt={item.toyId?.name}
                    style={{ width: '84px', height: '84px', borderRadius: '22px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{item.toyId?.name || 'Đồ chơi'}</h3>
                    <p style={{ margin: '6px 0', fontSize: '14px', color: '#7c6e65' }}>
                      {activeTab === 'incoming'
                        ? `Người mượn: ${item.borrowerId?.name || 'Ẩn danh'}`
                        : activeTab === 'borrowing' 
                        ? `Chủ sở hữu: ${item.toyId?.ownerId?.name || 'Ẩn danh'}`
                        : `Vai trò: ${item.ownerId?._id === userId ? 'Người cho thuê' : 'Người thuê'}`}
                    </p>
                    {renderStatusBadge(item.status)}
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f5ede6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#7c6e65' }}>
                    Hạn trả: {formatShortDate(item.dueDate)}
                  </span>

                   {activeTab === 'history' ? (
                       <span style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Giao dịch đã kết thúc</span>
                   ) : activeTab === 'incoming' ? (
                     item.status === 'pending' ? (
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <button onClick={() => handleApproveRequest(item._id)} disabled={actionLoading} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#16a34a', color: 'white', border: 'none', fontWeight: '600', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                           Xác nhận
                         </button>
                         <button onClick={() => handleRejectRequest(item._id)} disabled={actionLoading} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontWeight: '600', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                           Từ chối
                         </button>
                       </div>
                     ) : item.status === 'approved' ? (
                       <button onClick={() => handleConfirmDeposit(item._id)} disabled={actionLoading} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontWeight: '600', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                         Xác nhận cọc
                       </button>
                     ) : item.status === 'borrowing' ? (
                       <button onClick={() => handleConfirmReturn(item._id)} disabled={actionLoading} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', fontWeight: '600', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                         Xác nhận trả đồ
                       </button>
                     ) : (
                       <span />
                     )
                   ) : (
                     item.status === 'pending' ? (
                       <button onClick={() => handleCancelRequest(item._id)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#6b7280', color: 'white', border: 'none', fontWeight: '600' }}>
                         Huỷ yêu cầu
                       </button>
                     ) : item.status === 'borrowing' ? (
                       <button onClick={() => showToast('Báo trả đồ: cần API riêng nếu muốn quy trình 2 bước.', 'info')} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', fontWeight: '600' }}>
                         Báo trả đồ
                       </button>
                     ) : null
                   )}
                </div>
              </div>
            ))}
          </div>
        )}

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
    </div>
  );
}
