import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  App, Tabs, Segmented, Card, Button, Tag, Avatar, Typography, Empty, Spin, Flex, Badge, Alert, Space, Rate,
} from 'antd';
import {
  MessageOutlined, ShoppingOutlined, InboxOutlined, HistoryOutlined, GiftOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ReviewModal from './ReviewModal';
import BorrowActionModal from './BorrowActionModal';
import ChatModal from './ChatModal';
import DepositModal from './DepositModal';
import HandoverModal from './HandoverModal';
import ReturnInspectionModal from './ReturnInspectionModal';
import ClaimResponseModal from './ClaimResponseModal';

const { Text } = Typography;

const getUserId = () => {
  const stored = localStorage.getItem('userId');
  if (stored) return stored;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try { const u = JSON.parse(userStr); return u?._id || u?.id || null; } catch { return null; }
};

const fmt = (d) => d ? dayjs(d).format('DD/MM') : 'Thỏa thuận';

export default function Requests({ user, setPage, initialTab = 'borrowing' }) {
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState(initialTab || 'borrowing');
  const [borrowFilter, setBorrowFilter] = useState('all');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewedRequestIds, setReviewedRequestIds] = useState([]);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [ownerReviewItem, setOwnerReviewItem] = useState(null);
  const [selectedRequestForAction, setSelectedRequestForAction] = useState(null);
  const [chatRequest, setChatRequest] = useState(null);
  const [depositRequest, setDepositRequest] = useState(null);
  const [handoverItem, setHandoverItem] = useState(null);
  const [inspectItem, setInspectItem] = useState(null);
  const [claimItem, setClaimItem] = useState(null);

  const userId = getUserId();
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  const showToast = (msg, type = 'success') => { if (type === 'error') message.error(msg); else if (type === 'info') message.info(msg); else message.success(msg); };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!userId) { setIncomingRequests([]); setMyBorrows([]); return; }
      const [a, b, c] = await Promise.all([
        axios.get('http://localhost:5000/api/borrows/incoming-requests', authHeaders()),
        axios.get('http://localhost:5000/api/borrows/my-borrows', authHeaders()),
        axios.get('http://localhost:5000/api/borrows/user-history', authHeaders()),
      ]);
      setIncomingRequests(a.data || []); setMyBorrows(b.data || []); setUserHistory(c.data || []);
    } catch { setIncomingRequests([]); setMyBorrows([]); setUserHistory([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);
  useEffect(() => {
    fetchData();
    axios.get('http://localhost:5000/api/reviews/my-reviewed-requests', authHeaders())
      .then(res => setReviewedRequestIds(res.data.reviewedRequestIds || [])).catch(() => {});
  }, []);

  const refreshCurrentTab = async () => {
    if (!userId) return;
    if (activeTab === 'incoming') setIncomingRequests((await axios.get('http://localhost:5000/api/borrows/incoming-requests', authHeaders())).data || []);
    else if (activeTab === 'borrowing') setMyBorrows((await axios.get('http://localhost:5000/api/borrows/my-borrows', authHeaders())).data || []);
    else setUserHistory((await axios.get('http://localhost:5000/api/borrows/user-history', authHeaders())).data || []);
  };

  const act = async (fn, okMsg, okType = 'success') => {
    setActionLoading(true);
    try { await fn(); showToast(okMsg, okType); await refreshCurrentTab(); }
    catch (err) { showToast(err.response?.data?.message || err.message, 'error'); }
    finally { setActionLoading(false); }
  };
  const approve = (id) => act(() => axios.put(`http://localhost:5000/api/borrows/${id}/approve`, {}, authHeaders()), 'Đã duyệt yêu cầu mượn!');
  const reject = (id) => act(() => axios.put(`http://localhost:5000/api/borrows/${id}/reject`, {}, authHeaders()), 'Đã từ chối yêu cầu mượn!');
  const cancel = (id) => modal.confirm({ title: 'Huỷ yêu cầu mượn', content: 'Bạn có chắc muốn huỷ yêu cầu mượn này?', okText: 'Huỷ yêu cầu', okButtonProps: { danger: true }, cancelText: 'Không',
    onOk: () => act(() => axios.patch(`http://localhost:5000/api/borrows/${id}/cancel`, {}, authHeaders()), 'Đã huỷ yêu cầu mượn!') });
  const approveExt = (id) => act(() => axios.patch(`http://localhost:5000/api/borrows/${id}/approve-extension`, {}, authHeaders()), 'Đã đồng ý gia hạn!');
  const rejectExt = (id) => act(() => axios.patch(`http://localhost:5000/api/borrows/${id}/reject-extension`, {}, authHeaders()), 'Đã từ chối yêu cầu gia hạn.', 'info');

  const statusTag = (item) => {
    const s = item.status;
    const overdue = item.dueDate && new Date(item.dueDate) < new Date();
    if (s === 'pending') return <Tag color="gold">Chờ duyệt</Tag>;
    if (s === 'approved') return <Tag color="blue">Đã duyệt</Tag>;
    if (s === 'borrowing') return overdue ? <Tag color="volcano">Quá hạn mượn</Tag> : <Tag color="green">Đang mượn</Tag>;
    if (s === 'overdue') return <Tag color="volcano">Quá hạn</Tag>;
    if (s === 'returned') return (item.returnStatus === 'overdue_returned' || item.returnNote?.includes('Quá hạn'))
      ? <Tag color="gold">Đã trả (Quá hạn)</Tag> : <Tag color="green">Đã trả</Tag>;
    if (s === 'rejected') return <Tag color="red">Từ chối</Tag>;
    if (s === 'cancelled') return <Tag>Đã huỷ</Tag>;
    return <Tag>{s}</Tag>;
  };

  // ----- Hành động theo tab + trạng thái -----
  const incomingActions = (item) => {
    const deposit = item.toyId?.depositRequired || 0;
    if (item.status === 'pending') return (
      <Space><Button type="primary" loading={actionLoading} onClick={() => approve(item._id)} style={{ background: '#16a34a' }}>Duyệt</Button>
        <Button danger loading={actionLoading} onClick={() => reject(item._id)}>Từ chối</Button></Space>
    );
    if (item.status === 'approved') {
      if (deposit === 0 || item.depositStatus === 'held' || item.depositStatus === 'paid')
        return <Button type="primary" loading={actionLoading} onClick={() => setHandoverItem(item)}>Xác nhận giao đồ</Button>;
      if (item.depositStatus === 'awaiting_confirmation') return <Tag color="gold">Chờ admin xác nhận cọc</Tag>;
      return <Tag>Chờ người mượn đóng cọc</Tag>;
    }
    if (item.status === 'borrowing') return (
      <Space direction="vertical" align="end" style={{ width: '100%' }}>
        {item.returnStatus === 'reported_early' && <Alert type="success" showIcon message="Người mượn báo TRẢ ĐỒ SỚM" style={{ padding: '4px 10px' }} />}
        {item.returnStatus === 'reported_on_time' && <Alert type="info" showIcon message="Người mượn báo TRẢ ĐỒ ĐÚNG HẠN" style={{ padding: '4px 10px' }} />}
        {item.extensionStatus === 'pending' && (
          <Alert type="warning" showIcon style={{ padding: '6px 10px' }}
            message={`Xin gia hạn đến ${fmt(item.extensionDueDate)}`}
            description={<Space><Button size="small" type="primary" style={{ background: '#16a34a' }} onClick={() => approveExt(item._id)}>Đồng ý</Button>
              <Button size="small" danger onClick={() => rejectExt(item._id)}>Từ chối</Button></Space>} />
        )}
        <Button type="primary" loading={actionLoading} onClick={() => setInspectItem(item)}>Kiểm tra & nhận lại đồ</Button>
      </Space>
    );
    if (item.status === 'overdue') return (
      <Space direction="vertical" align="end">
        <Tag color="volcano">Quá hạn - đồ chưa được trả</Tag>
        <Button type="primary" loading={actionLoading} onClick={() => setInspectItem(item)}>Kiểm tra / Khai mất đồ</Button>
      </Space>
    );
    if (item.status === 'returned') return (
      <Space direction="vertical" align="end">
        <Text type="success">Đã nhận lại đồ</Text>
        {item.damageClaimStatus === 'claimed' && <Text type="warning" style={{ fontSize: 12 }}>Chờ người mượn phản hồi khiếu nại</Text>}
        {item.damageClaimStatus === 'disputed' && <Text type="danger" style={{ fontSize: 12 }}>Đang tranh chấp - chờ admin</Text>}
        {item.depositStatus === 'held' && item.damageClaimStatus === 'none' && <Text type="warning" style={{ fontSize: 12 }}>Admin đang xử lý hoàn cọc</Text>}
        {['refunded', 'partially_refunded'].includes(item.depositStatus) && item.depositDeductAmount > 0 && <Text type="success" style={{ fontSize: 12 }}>Nhận đền {item.depositDeductAmount.toLocaleString()}đ</Text>}
        {reviewedRequestIds.includes(item._id)
          ? <Text type="secondary" style={{ fontSize: 12 }}>Đã đánh giá người mượn</Text>
          : <Button size="small" type="primary" onClick={() => setOwnerReviewItem(item)}>Đánh giá người mượn</Button>}
      </Space>
    );
    return null;
  };

  const borrowingActions = (item) => {
    const deposit = item.toyId?.depositRequired || 0;
    if (item.status === 'pending') return <Button loading={actionLoading} onClick={() => cancel(item._id)}>Huỷ yêu cầu</Button>;
    if (item.status === 'approved') {
      if (deposit === 0) return <Tag color="green">Miễn cọc - chờ chủ giao đồ</Tag>;
      if (item.depositStatus === 'awaiting_confirmation') return <Tag color="gold">Chờ admin xác nhận cọc</Tag>;
      if (item.depositStatus === 'held') return <Tag color="green">Đã đóng cọc - chờ chủ giao đồ</Tag>;
      return <Button type="primary" onClick={() => setDepositRequest(item)} style={{ background: '#16a34a' }}>Thanh toán cọc</Button>;
    }
    if (item.status === 'borrowing') return (
      <Space direction="vertical" align="end">
        {item.returnStatus === 'reported_early' && <Tag color="green">Đã báo trả đồ sớm</Tag>}
        {item.returnStatus === 'reported_on_time' && <Tag color="blue">Đã báo trả đúng hạn</Tag>}
        {item.extensionStatus === 'pending' && <Tag color="gold">Đang xin mượn thêm đến {fmt(item.extensionDueDate)}</Tag>}
        {item.extensionStatus === 'approved' && <Tag color="green">Đã gia hạn</Tag>}
        <Button type="primary" onClick={() => setSelectedRequestForAction(item)}>Tùy chọn: Trả đồ / Mượn thêm</Button>
      </Space>
    );
    if (item.status === 'returned' || item.status === 'overdue') {
      if (item.damageClaimStatus === 'claimed') return (
        <Space direction="vertical" align="end">
          <Tag color="red">{item.isLostClaim ? 'Chủ khai mất đồ' : 'Chủ báo hư hỏng'}: {(item.damageAmountRequested || 0).toLocaleString()}đ</Tag>
          <Button danger type="primary" onClick={() => setClaimItem(item)}>Phản hồi khiếu nại</Button>
        </Space>
      );
      if (item.damageClaimStatus === 'disputed') return <Text type="danger" style={{ fontSize: 12 }}>Đã khiếu nại - chờ admin phân xử</Text>;
      if (item.damageClaimStatus === 'accepted') return <Text type="warning" style={{ fontSize: 12 }}>Đã đồng ý - chờ admin trừ cọc</Text>;
      if (['refunded', 'partially_refunded'].includes(item.depositStatus)) return (
        <Space direction="vertical" align="end">
          <Text type="success" style={{ fontSize: 12 }}>Đã hoàn {(item.depositRefundAmount ?? 0).toLocaleString()}đ{item.depositDeductAmount > 0 ? ` (trừ ${item.depositDeductAmount.toLocaleString()}đ)` : ''}</Text>
          {item.status === 'returned' && !reviewedRequestIds.includes(item._id) && <Button type="primary" onClick={() => setSelectedRequestForReview(item)}>Đánh giá</Button>}
        </Space>
      );
      if (item.status === 'returned') return reviewedRequestIds.includes(item._id)
        ? <Text type="success">Đã đánh giá</Text>
        : <Button type="primary" onClick={() => setSelectedRequestForReview(item)}>Đánh giá</Button>;
      return <Text type="warning" style={{ fontSize: 12 }}>Quá hạn - vui lòng trả đồ</Text>;
    }
    return null;
  };

  const historyActions = (item) => {
    const isBorrower = item.borrowerId?._id === userId || item.borrowerId === userId;
    if (item.status === 'returned' && isBorrower) return reviewedRequestIds.includes(item._id)
      ? <Text type="success">Đã đánh giá</Text>
      : <Button type="primary" onClick={() => setSelectedRequestForReview(item)}>Đánh giá</Button>;
    return <Text type="secondary">Giao dịch đã kết thúc</Text>;
  };

  const renderActions = (item) => activeTab === 'incoming' ? incomingActions(item) : activeTab === 'borrowing' ? borrowingActions(item) : historyActions(item);

  const displayed = activeTab === 'borrowing'
    ? (borrowFilter === 'all' ? myBorrows : myBorrows.filter(i => i.status === borrowFilter))
    : activeTab === 'incoming' ? incomingRequests : userHistory;

  const pendingIncoming = incomingRequests.filter(i => i.status === 'pending').length;

  const tabItems = [
    { key: 'borrowing', label: <Badge count={myBorrows.filter(i => i.status === 'pending').length} size="small" offset={[8, -2]}><span><ShoppingOutlined /> Đơn tôi đi mượn ({myBorrows.length})</span></Badge> },
    { key: 'incoming', label: <Badge count={pendingIncoming} size="small" offset={[8, -2]}><span><InboxOutlined /> Yêu cầu gửi tới tôi ({incomingRequests.length})</span></Badge> },
    { key: 'history', label: <span><HistoryOutlined /> Lịch sử ({userHistory.length})</span> },
  ];

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '24px clamp(16px,4vw,24px) 56px' }}>
      <Typography.Title level={3} style={{ marginBottom: 4 }}>Quản lý yêu cầu</Typography.Title>
      <Text type="secondary">Theo dõi tiến trình mượn đồ chơi và xử lý yêu cầu từ phụ huynh khác.</Text>

      <Tabs activeKey={activeTab} onChange={(k) => { setActiveTab(k); setBorrowFilter('all'); }} items={tabItems} style={{ marginTop: 16 }} />

      {activeTab === 'borrowing' && myBorrows.length > 0 && (
        <Segmented style={{ marginBottom: 20 }} value={borrowFilter} onChange={setBorrowFilter}
          options={[
            { value: 'all', label: `Tất cả (${myBorrows.length})` },
            { value: 'pending', label: `Chờ duyệt (${myBorrows.filter(b => b.status === 'pending').length})` },
            { value: 'approved', label: `Đã duyệt/Cọc (${myBorrows.filter(b => b.status === 'approved').length})` },
            { value: 'borrowing', label: `Đang mượn (${myBorrows.filter(b => b.status === 'borrowing').length})` },
          ]} />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : displayed.length === 0 ? (
        <Empty style={{ padding: '48px 0' }}
          description={activeTab === 'borrowing' ? 'Bạn chưa có đơn mượn nào.' : activeTab === 'incoming' ? 'Chưa có yêu cầu gửi tới bạn.' : 'Chưa có lịch sử giao dịch.'}>
          {activeTab === 'borrowing' && <Button type="primary" onClick={() => setPage('home')}>Khám phá đồ chơi</Button>}
          {activeTab === 'incoming' && <Button type="primary" onClick={() => setPage('my-toys')}>Quản lý đồ chơi của tôi</Button>}
        </Empty>
      ) : (
        <Flex vertical gap={16}>
          {displayed.map(item => {
            const counterpart = (item.ownerId?._id === userId || item.ownerId === userId)
              ? (item.borrowerId?.name || 'Người mượn')
              : (item.toyId?.ownerId?.name || item.ownerId?.name || 'Chủ sở hữu');
            return (
              <Card key={item._id} styles={{ body: { padding: 20 } }}>
                <Flex gap={16} align="start" wrap>
                  <Avatar shape="square" size={72} src={item.toyId?.images?.[0] || undefined} icon={<GiftOutlined />} style={{ background: '#f1f4f6', color: 'rgba(22,38,46,0.3)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <Flex justify="space-between" align="start" gap={8} wrap>
                      <div>
                        <Text strong style={{ fontSize: 16 }}>{item.toyId?.name || 'Đồ chơi'}</Text>
                        <div style={{ fontSize: 13, color: '#8c7664' }}>
                          {activeTab === 'incoming' ? `Người mượn: ${item.borrowerId?.name || 'Ẩn danh'}`
                            : `Chủ sở hữu: ${item.toyId?.ownerId?.name || item.ownerId?.name || 'Ẩn danh'}`}
                        </div>
                        {activeTab === 'incoming' && item.borrowerId?.rating?.count > 0 && (
                          <Flex align="center" gap={6} style={{ marginTop: 2 }}>
                            <Rate disabled allowHalf value={item.borrowerId.rating.avg} style={{ fontSize: 12 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.borrowerId.rating.avg} ({item.borrowerId.rating.count} lượt)</Text>
                          </Flex>
                        )}
                        {activeTab === 'incoming' && !(item.borrowerId?.rating?.count > 0) && (
                          <Text type="secondary" style={{ fontSize: 12 }}>Người mượn chưa có đánh giá</Text>
                        )}
                      </div>
                      {statusTag(item)}
                    </Flex>
                    {(item.returnStatus === 'overdue_returned' || (item.status === 'returned' && item.returnNote?.includes('Quá hạn'))) && (
                      <Alert type="warning" showIcon style={{ marginTop: 8 }} message="Quá hạn mượn: đã tự động chuyển thành Đã trả." />
                    )}
                  </div>
                </Flex>
                <Flex justify="space-between" align="center" wrap gap={12} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                  <Space size={12} wrap>
                    <Text type="secondary" style={{ fontSize: 13 }}>Hạn trả: {fmt(item.dueDate)}</Text>
                    {item.toyId && !['rejected', 'cancelled'].includes(item.status) && (
                      <Button size="small" icon={<MessageOutlined />} onClick={() => setChatRequest(item)}>Nhắn tin</Button>
                    )}
                  </Space>
                  <div>{renderActions(item)}</div>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}

      {/* Modals */}
      <ReviewModal isOpen={!!selectedRequestForReview} onClose={() => setSelectedRequestForReview(null)}
        toy={selectedRequestForReview?.toyId} borrowRequestId={selectedRequestForReview?._id} showToast={showToast}
        onSuccess={() => { if (selectedRequestForReview) setReviewedRequestIds(prev => [...prev, selectedRequestForReview._id]); }} />
      <ReviewModal isOpen={!!ownerReviewItem} onClose={() => setOwnerReviewItem(null)}
        toy={ownerReviewItem?.toyId} borrowRequestId={ownerReviewItem?._id} mode="owner"
        targetName={ownerReviewItem?.borrowerId?.name} showToast={showToast}
        onSuccess={() => { if (ownerReviewItem) setReviewedRequestIds(prev => [...prev, ownerReviewItem._id]); }} />
      <BorrowActionModal isOpen={!!selectedRequestForAction} onClose={() => setSelectedRequestForAction(null)} item={selectedRequestForAction} showToast={showToast} onSuccess={refreshCurrentTab} />
      <DepositModal isOpen={!!depositRequest} onClose={() => setDepositRequest(null)} borrowRequest={depositRequest} showToast={showToast} onSuccess={refreshCurrentTab} />
      <HandoverModal isOpen={!!handoverItem} onClose={() => setHandoverItem(null)} item={handoverItem} showToast={showToast} onSuccess={refreshCurrentTab} />
      <ReturnInspectionModal isOpen={!!inspectItem} onClose={() => setInspectItem(null)} item={inspectItem} showToast={showToast} onSuccess={refreshCurrentTab} />
      <ClaimResponseModal isOpen={!!claimItem} onClose={() => setClaimItem(null)} item={claimItem} showToast={showToast} onSuccess={refreshCurrentTab} />
      <ChatModal isOpen={!!chatRequest} onClose={() => setChatRequest(null)} borrowRequest={chatRequest} currentUserId={userId}
        counterpartName={chatRequest ? ((chatRequest.ownerId?._id === userId || chatRequest.ownerId === userId) ? (chatRequest.borrowerId?.name || 'Người mượn') : (chatRequest.toyId?.ownerId?.name || chatRequest.ownerId?.name || 'Chủ sở hữu')) : ''} />
    </div>
  );
}
