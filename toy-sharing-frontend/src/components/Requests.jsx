import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewModal from './ReviewModal';
import BorrowActionModal from './BorrowActionModal';
import ChatModal from './ChatModal';
import DepositModal from './DepositModal';
import HandoverModal from './HandoverModal';
import ReturnInspectionModal from './ReturnInspectionModal';
import ClaimResponseModal from './ClaimResponseModal';

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

export default function Requests({ user, setPage, initialTab = 'borrowing' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'borrowing');
  const [borrowFilter, setBorrowFilter] = useState('all');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [reviewedRequestIds, setReviewedRequestIds] = useState([]);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [selectedRequestForAction, setSelectedRequestForAction] = useState(null);
  const [chatRequest, setChatRequest] = useState(null);
  const [depositRequest, setDepositRequest] = useState(null);
  const [handoverItem, setHandoverItem] = useState(null);
  const [inspectItem, setInspectItem] = useState(null);
  const [claimItem, setClaimItem] = useState(null);

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

      const token = localStorage.getItem('token');
      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
      const [incomingRes, myBorrowsRes, historyRes] = await Promise.all([
        axios.get('http://localhost:5000/api/borrows/incoming-requests', authHeaders),
        axios.get('http://localhost:5000/api/borrows/my-borrows', authHeaders),
        axios.get('http://localhost:5000/api/borrows/user-history', authHeaders),
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
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchData();

    // Lấy danh sách các đơn mượn mà user này đã từng gửi đánh giá
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/reviews/my-reviewed-requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setReviewedRequestIds(res.data.reviewedRequestIds || []))
        .catch(err => console.error('Lỗi lấy danh sách đã đánh giá:', err));
    }
  }, []);

  const refreshCurrentTab = async () => {
    if (!userId) return;
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    if (activeTab === 'incoming') {
      const res = await axios.get('http://localhost:5000/api/borrows/incoming-requests', authHeaders);
      setIncomingRequests(res.data || []);
    } else if (activeTab === 'borrowing') {
      const res = await axios.get('http://localhost:5000/api/borrows/my-borrows', authHeaders);
      setMyBorrows(res.data || []);
    } else {
      const res = await axios.get('http://localhost:5000/api/borrows/user-history', authHeaders);
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

  const renderStatusBadge = (status, returnStatus, item) => {
    const base = { display: 'inline-block', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
    if (status === 'pending') return <span style={{ ...base, backgroundColor: '#f3ebd9', color: '#b45309' }}>Chờ duyệt</span>;
    if (status === 'approved') return <span style={{ ...base, backgroundColor: '#e0e7ff', color: '#4f46e5' }}>Đã duyệt</span>;
    if (status === 'borrowing') {
      const isOverdue = item?.dueDate && new Date(item.dueDate) < new Date();
      if (isOverdue) return <span style={{ ...base, backgroundColor: '#fee2e2', color: '#b91c1c' }}>Quá hạn mượn</span>;
      return <span style={{ ...base, backgroundColor: '#dcfce7', color: '#16a34a' }}>Đang mượn</span>;
    }
    if (status === 'returned') {
      if (returnStatus === 'overdue_returned' || (item?.returnNote && item.returnNote.includes('Quá hạn'))) {
        return <span style={{ ...base, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Đã trả (Quá hạn)</span>;
      }
      return <span style={{ ...base, backgroundColor: '#dcfce7', color: '#16a34a' }}>Đã trả</span>;
    }
    if (status === 'rejected') return <span style={{ ...base, backgroundColor: '#fee2e2', color: '#ef4444' }}>Từ chối</span>;
    if (status === 'cancelled') return <span style={{ ...base, backgroundColor: '#f3f4f6', color: '#6b7280' }}>Đã huỷ</span>;
    return <span style={{ ...base, backgroundColor: '#f3f4f6', color: '#6b7280' }}>{status}</span>;
  };

   const handleApproveRequest = async (requestId) => {
     setActionLoading(true);
     try {
       const token = localStorage.getItem('token');
       await axios.put(`http://localhost:5000/api/borrows/${requestId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
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
       const token = localStorage.getItem('token');
       await axios.put(`http://localhost:5000/api/borrows/${requestId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
       showToast('Đã từ chối yêu cầu mượn!', 'success');
       await refreshCurrentTab();
     } catch (err) {
       showToast(err.response?.data?.message || err.message, 'error');
     } finally {
       setActionLoading(false);
     }
   };

   const handleCancelRequest = async (requestId) => {
     if (!window.confirm('Bạn có chắc chắn muốn huỷ yêu cầu mượn này?')) return;
     setActionLoading(true);
     try {
       const token = localStorage.getItem('token');
       await axios.patch(`http://localhost:5000/api/borrows/${requestId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
       showToast('Đã huỷ yêu cầu mượn!', 'success');
       await refreshCurrentTab();
     } catch (err) {
       showToast(err.response?.data?.message || err.message, 'error');
     } finally {
       setActionLoading(false);
     }
   };

   const handleApproveExtension = async (requestId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/borrows/${requestId}/approve-extension`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('🎉 Đã đồng ý gia hạn mượn đồ chơi!', 'success');
      await refreshCurrentTab();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectExtension = async (requestId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/borrows/${requestId}/reject-extension`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Đã từ chối yêu cầu gia hạn.', 'info');
      await refreshCurrentTab();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingBorrowsCount = myBorrows.filter(item => item.status === 'pending').length;
  const pendingIncomingCount = incomingRequests.filter(item => item.status === 'pending').length;

  let displayedRequests = [];
  if (activeTab === 'borrowing') {
    if (borrowFilter === 'all') displayedRequests = myBorrows;
    else displayedRequests = myBorrows.filter(item => item.status === borrowFilter);
  } else if (activeTab === 'incoming') {
    displayedRequests = incomingRequests;
  } else {
    displayedRequests = userHistory;
  }

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: '800', color: 'var(--color-foreground)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
          Quản lý yêu cầu
        </h1>
        <p style={{ color: 'var(--color-muted-foreground)', fontSize: '15px', margin: '0 0 28px 0' }}>
          Theo dõi tiến trình mượn đồ chơi của bạn và xử lý các yêu cầu mượn từ phụ huynh khác.
        </p>

        {/* TABS ĐIỀU HƯỚNG RÕ RÀNG, ĐẦY ĐỦ SỐ LƯỢNG */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid var(--color-border)', marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* TAB 1: ĐƠN TÔI ĐI MƯỢN */}
          <button
            onClick={() => { setActiveTab('borrowing'); setBorrowFilter('all'); }}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: '700',
              background: activeTab === 'borrowing' ? '#fff7ed' : 'none',
              border: 'none',
              borderRadius: '14px 14px 0 0',
              cursor: 'pointer',
              color: activeTab === 'borrowing' ? '#ea580c' : '#78716c',
              borderBottom: activeTab === 'borrowing' ? '3px solid #ea580c' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🛍️ Đơn tôi đi mượn</span>
            <span style={{
              backgroundColor: activeTab === 'borrowing' ? '#ea580c' : '#e7e5e4',
              color: activeTab === 'borrowing' ? '#ffffff' : '#57534e',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              {myBorrows.length}
            </span>
            {pendingBorrowsCount > 0 && (
              <span style={{
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '2px 7px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                border: '1px solid #fde68a'
              }}>
                {pendingBorrowsCount} chờ duyệt
              </span>
            )}
          </button>

          {/* TAB 2: YÊU CẦU GỬI TỚI TÔI (CHỦ ĐỒ) */}
          <button
            onClick={() => setActiveTab('incoming')}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: '700',
              background: activeTab === 'incoming' ? '#fff7ed' : 'none',
              border: 'none',
              borderRadius: '14px 14px 0 0',
              cursor: 'pointer',
              color: activeTab === 'incoming' ? '#ea580c' : '#78716c',
              borderBottom: activeTab === 'incoming' ? '3px solid #ea580c' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📬 Yêu cầu gửi tới tôi</span>
            <span style={{
              backgroundColor: pendingIncomingCount > 0 ? '#f59e0b' : (activeTab === 'incoming' ? '#ea580c' : '#e7e5e4'),
              color: pendingIncomingCount > 0 ? '#ffffff' : (activeTab === 'incoming' ? '#ffffff' : '#57534e'),
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              {incomingRequests.length}
            </span>
            {pendingIncomingCount > 0 && (
              <span style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '2px 7px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {pendingIncomingCount} cần duyệt!
              </span>
            )}
          </button>

          {/* TAB 3: LỊCH SỬ THUÊ / TRẢ */}
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: '700',
              background: activeTab === 'history' ? '#fff7ed' : 'none',
              border: 'none',
              borderRadius: '14px 14px 0 0',
              cursor: 'pointer',
              color: activeTab === 'history' ? '#ea580c' : '#78716c',
              borderBottom: activeTab === 'history' ? '3px solid #ea580c' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📜 Lịch sử giao dịch</span>
            <span style={{
              backgroundColor: activeTab === 'history' ? '#ea580c' : '#e7e5e4',
              color: activeTab === 'history' ? '#ffffff' : '#57534e',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              {userHistory.length}
            </span>
          </button>
        </div>

        {/* SUB-FILTER CHIPS NẾU ĐANG Ở TAB "ĐƠN TÔI ĐI MƯỢN" */}
        {activeTab === 'borrowing' && myBorrows.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#78716c', fontWeight: '600', marginRight: '4px' }}>Lọc nhanh:</span>
            {[
              { key: 'all', label: 'Tất cả', count: myBorrows.length },
              { key: 'pending', label: '⏳ Chờ duyệt', count: myBorrows.filter(b => b.status === 'pending').length },
              { key: 'approved', label: '✓ Đã duyệt / Cọc', count: myBorrows.filter(b => b.status === 'approved').length },
              { key: 'borrowing', label: '📦 Đang mượn', count: myBorrows.filter(b => b.status === 'borrowing').length },
            ].map(chip => (
              <button
                key={chip.key}
                onClick={() => setBorrowFilter(chip.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: borrowFilter === chip.key ? '1px solid #ea580c' : '1px solid #e7e5e4',
                  backgroundColor: borrowFilter === chip.key ? '#ffedd5' : '#ffffff',
                  color: borrowFilter === chip.key ? '#c2410c' : '#57534e',
                  fontSize: '13px',
                  fontWeight: borrowFilter === chip.key ? '700' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{chip.label}</span>
                <span style={{ fontSize: '11px', opacity: 0.85 }}>({chip.count})</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#7c6e65' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: '600' }}>Đang tải danh sách yêu cầu...</p>
          </div>
        ) : displayedRequests.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '50px 24px',
            textAlign: 'center',
            border: '1px dashed #e7e5e4',
            maxWidth: '560px',
            margin: '30px auto'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>
              {activeTab === 'borrowing' ? '🧸' : activeTab === 'incoming' ? '📬' : '📜'}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#292524', margin: '0 0 8px 0' }}>
              {activeTab === 'borrowing'
                ? (borrowFilter === 'all' ? 'Bạn chưa có đơn mượn đồ chơi nào' : 'Không có đơn mượn nào ở trạng thái này')
                : activeTab === 'incoming'
                ? 'Chưa có yêu cầu gửi tới bạn'
                : 'Chưa có lịch sử giao dịch nào'}
            </h3>
            <p style={{ fontSize: '14px', color: '#78716c', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              {activeTab === 'borrowing'
                ? (borrowFilter === 'all'
                  ? 'Hãy dạo quanh kho đồ chơi phong phú của ToyShare và gửi yêu cầu mượn những món đồ hấp dẫn cho bé nhé!'
                  : 'Hãy chuyển bộ lọc về "Tất cả" để kiểm tra toàn bộ các đơn mượn của bạn.')
                : activeTab === 'incoming'
                ? 'Khi có phụ huynh khác muốn mượn đồ chơi bạn chia sẻ, yêu cầu sẽ xuất hiện tại đây để bạn phê duyệt.'
                : 'Các đơn mượn đã hoàn tất, trả đồ hoặc huỷ sẽ được lưu trữ tự động tại đây.'}
            </p>
            {activeTab === 'borrowing' && borrowFilter === 'all' && setPage && (
              <button
                onClick={() => setPage('home')}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                }}
              >
                🔍 Khám phá đồ chơi ngay
              </button>
            )}
            {activeTab === 'incoming' && setPage && (
              <button
                onClick={() => setPage('my-toys')}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                }}
              >
                📦 Quản lý đồ chơi của tôi
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {displayedRequests.map((item) => (
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
                    {renderStatusBadge(item.status, item.returnStatus, item)}

                    {activeTab === 'borrowing' && item.status === 'pending' && (
                      <div style={{
                        marginTop: '10px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        lineHeight: 1.4
                      }}>
                        <span>⏳</span>
                        <span>Đang chờ chủ đồ chơi (<strong>{item.toyId?.ownerId?.name || 'Chủ đồ'}</strong>) duyệt yêu cầu. Bạn sẽ nhận được thông báo ngay khi chủ đồ phản hồi!</span>
                      </div>
                    )}

                    {activeTab === 'incoming' && item.status === 'pending' && (
                      <div style={{
                        marginTop: '10px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#1e40af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        lineHeight: 1.4
                      }}>
                        <span>🔔</span>
                        <span>Khách muốn mượn món này. Hãy bấm <strong>Xác nhận</strong> để đồng ý hoặc <strong>Từ chối</strong>!</span>
                      </div>
                    )}

                    {(item.returnStatus === 'overdue_returned' || (item.status === 'returned' && item.returnNote?.includes('Quá hạn'))) && (
                      <div style={{ marginTop: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', color: '#92400e' }}>
                        ⚠️ Quá hạn mượn bắt buộc trả: Đã tự động chuyển thành <strong>Đã trả</strong>.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f5ede6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#7c6e65' }}>
                      Hạn trả: {formatShortDate(item.dueDate)}
                    </span>
                    {item.toyId && !['rejected', 'cancelled'].includes(item.status) && (
                      <button
                        onClick={() => setChatRequest(item)}
                        style={{ padding: '6px 14px', borderRadius: '16px', backgroundColor: '#eef2ff', color: '#4f46e5', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        💬 Nhắn tin
                      </button>
                    )}
                  </div>

                  {activeTab === 'history' ? (
                    item.status === 'returned' && (item.borrowerId?._id === userId || item.borrowerId === userId) ? (
                      reviewedRequestIds.includes(item._id) ? (
                        <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                          ★ Đã đánh giá
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedRequestForReview(item)}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '20px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)'
                          }}
                        >
                          ⭐ Đánh giá
                        </button>
                      )
                    ) : (
                      <span style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Giao dịch đã kết thúc</span>
                    )
                  ) : activeTab === 'incoming' ? (
                    /* TAB 2: YÊU CẦU GỬI TỚI TÔI (CHỦ ĐỒ CHƠI) */
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
                      ((item.toyId?.depositRequired || 0) === 0 || item.depositStatus === 'held' || item.depositStatus === 'paid') ? (
                        <button onClick={() => setHandoverItem(item)} disabled={actionLoading} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#16a34a', color: 'white', border: 'none', fontWeight: '600', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                          ✓ Xác nhận giao đồ
                        </button>
                      ) : item.depositStatus === 'awaiting_confirmation' ? (
                        <span style={{ fontSize: '13px', color: '#d97706', fontWeight: '600', backgroundColor: '#fef3c7', padding: '8px 14px', borderRadius: '16px' }}>
                          ⏳ Chờ admin xác nhận cọc
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', backgroundColor: '#f3f4f6', padding: '8px 14px', borderRadius: '16px' }}>
                          💰 Chờ người mượn đóng cọc
                        </span>
                      )
                    ) : item.status === 'borrowing' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
                        {item.returnStatus === 'reported_early' && (
                          <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '10px 14px', textAlign: 'left', width: '100%', maxWidth: '340px', boxSizing: 'border-box' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                              📦 Người mượn báo TRẢ ĐỒ SỚM!
                            </div>
                            {item.returnNote && (
                              <div style={{ fontSize: '12px', color: '#14532d', fontStyle: 'italic', marginTop: '3px' }}>
                                Lời nhắn: "{item.returnNote}"
                              </div>
                            )}
                          </div>
                        )}

                        {item.returnStatus === 'reported_on_time' && (
                          <div style={{ backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '10px 14px', textAlign: 'left', width: '100%', maxWidth: '340px', boxSizing: 'border-box' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>
                              🤝 Người mượn báo TRẢ ĐỒ ĐÚNG HẠN!
                            </div>
                            {item.returnNote && (
                              <div style={{ fontSize: '12px', color: '#1e3a8a', fontStyle: 'italic', marginTop: '3px' }}>
                                Lời nhắn: "{item.returnNote}"
                              </div>
                            )}
                          </div>
                        )}

                        {item.extensionStatus === 'pending' && (
                          <div style={{ backgroundColor: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '10px 14px', textAlign: 'left', width: '100%', maxWidth: '340px', boxSizing: 'border-box' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>
                              🔔 Người mượn xin gia hạn đến: {formatShortDate(item.extensionDueDate)}
                            </div>
                            {item.extensionReason && (
                              <div style={{ fontSize: '12px', color: '#78350f', fontStyle: 'italic', marginTop: '3px' }}>
                                Lý do: "{item.extensionReason}"
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <button onClick={() => handleApproveExtension(item._id)} disabled={actionLoading} style={{ padding: '6px 14px', borderRadius: '14px', backgroundColor: '#16a34a', color: 'white', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                ✓ Đồng ý gia hạn
                              </button>
                              <button onClick={() => handleRejectExtension(item._id)} disabled={actionLoading} style={{ padding: '6px 14px', borderRadius: '14px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                ✕ Từ chối
                              </button>
                            </div>
                          </div>
                        )}

                        <button onClick={() => setInspectItem(item)} disabled={actionLoading} style={{ padding: '8px 18px', borderRadius: '20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', fontWeight: '600', cursor: actionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)' }}>
                          🔍 Kiểm tra & nhận lại đồ
                        </button>
                      </div>
                    ) : item.status === 'overdue' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '12px', color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>⚠️ Quá hạn - đồ chưa được trả</span>
                        <button onClick={() => setInspectItem(item)} disabled={actionLoading} style={{ padding: '8px 18px', borderRadius: '20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                          🔍 Kiểm tra / Khai mất đồ
                        </button>
                      </div>
                    ) : item.status === 'returned' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>✓ Đã nhận lại đồ</span>
                        {item.damageClaimStatus === 'claimed' && (
                          <span style={{ fontSize: '12px', color: '#d97706' }}>⏳ Chờ người mượn phản hồi khiếu nại</span>
                        )}
                        {item.damageClaimStatus === 'disputed' && (
                          <span style={{ fontSize: '12px', color: '#dc2626' }}>⚖️ Đang tranh chấp - chờ admin phân xử</span>
                        )}
                        {item.depositStatus === 'held' && item.damageClaimStatus === 'none' && (
                          <span style={{ fontSize: '12px', color: '#d97706' }}>⏳ Admin đang xử lý hoàn cọc</span>
                        )}
                        {['refunded', 'partially_refunded'].includes(item.depositStatus) && item.depositDeductAmount > 0 && (
                          <span style={{ fontSize: '12px', color: '#15803d' }}>✓ Nhận đền {item.depositDeductAmount.toLocaleString()}đ</span>
                        )}
                      </div>
                    ) : (
                      <span />
                    )
                  ) : (
                    /* TAB 1: TÔI ĐI MƯỢN (NGƯỜI MƯỢN) */
                    item.status === 'pending' ? (
                      <button onClick={() => handleCancelRequest(item._id)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#6b7280', color: 'white', border: 'none', fontWeight: '600' }}>
                        Huỷ yêu cầu
                      </button>
                    ) : item.status === 'approved' ? (
                      (item.toyId?.depositRequired || 0) === 0 ? (
                        <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', backgroundColor: '#dcfce7', padding: '8px 14px', borderRadius: '16px' }}>
                          ✓ Miễn cọc - Chờ chủ giao đồ
                        </span>
                      ) : item.depositStatus === 'awaiting_confirmation' ? (
                        <span style={{ fontSize: '13px', color: '#d97706', fontWeight: '600', backgroundColor: '#fef3c7', padding: '8px 14px', borderRadius: '16px' }}>
                          ⏳ Chờ admin xác nhận cọc
                        </span>
                      ) : item.depositStatus === 'held' ? (
                        <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', backgroundColor: '#dcfce7', padding: '8px 14px', borderRadius: '16px' }}>
                          ✓ Đã đóng cọc - Chờ chủ giao đồ
                        </span>
                      ) : (
                        <button onClick={() => setDepositRequest(item)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#16a34a', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                          💳 Thanh toán cọc
                        </button>
                      )
                    ) : item.status === 'borrowing' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {item.returnStatus === 'reported_early' && (
                            <span style={{ fontSize: '12px', color: '#166534', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                              📦 Đã báo trả đồ sớm
                            </span>
                          )}
                          {item.returnStatus === 'reported_on_time' && (
                            <span style={{ fontSize: '12px', color: '#1e40af', backgroundColor: '#dbeafe', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                              🤝 Đã báo trả đúng hạn
                            </span>
                          )}
                          {item.extensionStatus === 'pending' && (
                            <span style={{ fontSize: '12px', color: '#92400e', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                              ⏳ Đang xin mượn thêm đến {formatShortDate(item.extensionDueDate)}
                            </span>
                          )}
                          {item.extensionStatus === 'approved' && (
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                              ✓ Đã gia hạn
                            </span>
                          )}
                        </div>

                        {/* NÚT THAO TÁC CHỌN: TRẢ ĐỒ SỚM / MƯỢN THÊM / TRẢ ĐỒ ĐÚNG HẠN */}
                        <button
                          onClick={() => setSelectedRequestForAction(item)}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '20px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>⚡ Tùy chọn: Trả đồ / Mượn thêm ▾</span>
                        </button>
                      </div>
                    ) : (item.status === 'returned' || item.status === 'overdue') ? (
                      item.damageClaimStatus === 'claimed' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '12px', color: '#9d3b35', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                            {item.isLostClaim ? '❌ Chủ khai mất đồ' : '⚠️ Chủ báo hư hỏng'}: {(item.damageAmountRequested || 0).toLocaleString()}đ
                          </span>
                          <button onClick={() => setClaimItem(item)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#9d3b35', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                            Phản hồi khiếu nại
                          </button>
                        </div>
                      ) : item.damageClaimStatus === 'disputed' ? (
                        <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>⚖️ Đã khiếu nại - chờ admin phân xử</span>
                      ) : item.damageClaimStatus === 'accepted' ? (
                        <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '600' }}>⏳ Đã đồng ý - chờ admin trừ cọc</span>
                      ) : ['refunded', 'partially_refunded'].includes(item.depositStatus) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                            ✓ Đã hoàn {(item.depositRefundAmount ?? 0).toLocaleString()}đ{item.depositDeductAmount > 0 ? ` (trừ ${item.depositDeductAmount.toLocaleString()}đ)` : ''}
                          </span>
                          {item.status === 'returned' && !reviewedRequestIds.includes(item._id) && (
                            <button onClick={() => setSelectedRequestForReview(item)} style={{ padding: '7px 16px', borderRadius: '20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>⭐ Đánh giá</button>
                          )}
                        </div>
                      ) : item.status === 'returned' ? (
                        reviewedRequestIds.includes(item._id) ? (
                          <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>★ Đã đánh giá</span>
                        ) : (
                          <button onClick={() => setSelectedRequestForReview(item)} style={{ padding: '7px 16px', borderRadius: '20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>⭐ Đánh giá</button>
                        )
                      ) : (
                        <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '600' }}>⚠️ Quá hạn - vui lòng trả đồ</span>
                      )
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <ReviewModal
          isOpen={!!selectedRequestForReview}
          onClose={() => setSelectedRequestForReview(null)}
          toy={selectedRequestForReview?.toyId}
          borrowRequestId={selectedRequestForReview?._id}
          showToast={showToast}
          onSuccess={() => {
            if (selectedRequestForReview) {
              setReviewedRequestIds(prev => [...prev, selectedRequestForReview._id]);
            }
          }}
        />

        <BorrowActionModal
          isOpen={!!selectedRequestForAction}
          onClose={() => setSelectedRequestForAction(null)}
          item={selectedRequestForAction}
          showToast={showToast}
          onSuccess={() => {
            refreshCurrentTab();
          }}
        />

        <DepositModal
          isOpen={!!depositRequest}
          onClose={() => setDepositRequest(null)}
          borrowRequest={depositRequest}
          showToast={showToast}
          onSuccess={() => refreshCurrentTab()}
        />

        <HandoverModal
          isOpen={!!handoverItem}
          onClose={() => setHandoverItem(null)}
          item={handoverItem}
          showToast={showToast}
          onSuccess={() => refreshCurrentTab()}
        />

        <ReturnInspectionModal
          isOpen={!!inspectItem}
          onClose={() => setInspectItem(null)}
          item={inspectItem}
          showToast={showToast}
          onSuccess={() => refreshCurrentTab()}
        />

        <ClaimResponseModal
          isOpen={!!claimItem}
          onClose={() => setClaimItem(null)}
          item={claimItem}
          showToast={showToast}
          onSuccess={() => refreshCurrentTab()}
        />

        <ChatModal
          isOpen={!!chatRequest}
          onClose={() => setChatRequest(null)}
          borrowRequest={chatRequest}
          currentUserId={userId}
          counterpartName={
            chatRequest
              ? ((chatRequest.ownerId?._id === userId || chatRequest.ownerId === userId)
                  ? (chatRequest.borrowerId?.name || 'Người mượn')
                  : (chatRequest.toyId?.ownerId?.name || chatRequest.ownerId?.name || 'Chủ sở hữu'))
              : ''
          }
        />

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
