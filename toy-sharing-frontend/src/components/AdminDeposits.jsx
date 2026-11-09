import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { App, Row, Col, Card, Tag, Avatar, Statistic, Alert, Image, InputNumber, Button, Typography, Flex, Spin, Empty } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import AdminLayout from './AdminLayout';

const { Text } = Typography;

const statusTag = {
  awaiting_confirmation: { text: 'Chờ xác nhận', color: 'gold' },
  held: { text: 'Đang giữ cọc', color: 'geekblue' },
  refunded: { text: 'Đã hoàn', color: 'green' },
  partially_refunded: { text: 'Hoàn một phần', color: 'cyan' },
};

function PhotoRow({ title, images }) {
  if (!images?.length) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <Text strong style={{ fontSize: 12 }}>{title}</Text>
      <Flex gap={6} wrap style={{ marginTop: 5 }}>
        <Image.PreviewGroup>{images.map((img, i) => <Image key={i} src={img} width={56} height={56} style={{ objectFit: 'cover', borderRadius: 8 }} />)}</Image.PreviewGroup>
      </Flex>
    </div>
  );
}

export default function AdminDeposits({ setPage }) {
  const { message } = App.useApp();
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState({ awaiting: 0, held: 0, claims: 0, disputed: 0, refunded: 0 });
  const [adminBank, setAdminBank] = useState({ configured: false });
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [deductDrafts, setDeductDrafts] = useState({});

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const params = statusFilter === 'all' ? {} : { status: statusFilter };
      const res = await axios.get('http://localhost:5000/api/deposits/admin/all', { params, headers: authHeaders() });
      setDeposits(res.data.deposits || []);
      setStats(res.data.stats || stats);
      setAdminBank(res.data.adminBank || { configured: false });
    } catch (err) {
      message.error(err.response?.data?.message || 'Không tải được danh sách cọc.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDeposits(); }, [statusFilter]);

  const doAction = async (id, action, body) => {
    setActionId(id);
    try {
      const res = await axios.post(`http://localhost:5000/api/deposits/admin/${id}/${action}`, body || {}, { headers: authHeaders() });
      message.success(res.data.message || 'Thành công.');
      await fetchDeposits();
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally { setActionId(null); }
  };

  const statCards = [
    { key: 'all', label: 'Tất cả', value: stats.awaiting + stats.held + stats.refunded, color: '#0b6e8f' },
    { key: 'awaiting_confirmation', label: 'Chờ xác nhận', value: stats.awaiting, color: '#d97706' },
    { key: 'held', label: 'Đang giữ', value: stats.held, color: '#4f46e5' },
    { key: 'refunded', label: 'Đã hoàn', value: stats.refunded, color: '#15803d' },
  ];

  return (
    <AdminLayout active="admin-deposits" setPage={setPage} title="Quản lý tiền cọc (Escrow)">
      {!adminBank.configured && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="Chưa cấu hình tài khoản nhận cọc"
          description={<span>Vui lòng điền <strong>ADMIN_BANK_ID / ADMIN_BANK_ACCOUNT / ADMIN_BANK_NAME</strong> trong file <strong>.env</strong> của backend.</span>} />
      )}

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {statCards.map(card => (
          <Col xs={12} sm={6} key={card.key}>
            <Card hoverable onClick={() => setStatusFilter(card.key)} styles={{ body: { padding: 16 } }}
              style={{ border: statusFilter === card.key ? `2px solid ${card.color}` : undefined }}>
              <Statistic title={card.label} value={card.value} valueStyle={{ color: card.color, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
      ) : deposits.length === 0 ? (
        <Empty description="Không có khoản cọc nào." style={{ padding: '40px 0' }} />
      ) : (
        <Flex vertical gap={14}>
          {deposits.map(d => {
            const deposit = d.depositAmount || d.toyId?.depositRequired || 0;
            const draft = deductDrafts[d._id] ?? (d.damageAmountRequested || '');
            const claimOpen = ['claimed', 'accepted', 'disputed'].includes(d.damageClaimStatus);
            const t = statusTag[d.depositStatus] || { text: d.depositStatus, color: 'default' };
            return (
              <Card key={d._id} styles={{ body: { padding: 20 } }}>
                <Flex justify="space-between" align="start" wrap gap={16} style={{ marginBottom: 12 }}>
                  <Flex align="center" gap={12}>
                    <Avatar shape="square" size={48} src={d.toyId?.images?.[0] || undefined} icon={<GiftOutlined />} style={{ background: '#f1f4f6', color: 'rgba(22,38,46,0.3)' }} />
                    <div>
                      <Text strong style={{ fontSize: 16 }}>{d.toyId?.name || 'Đã xoá'}</Text>
                      <div style={{ fontSize: 13, color: '#7c6e65' }}>Người mượn: {d.borrowerId?.name || '—'} · Chủ: {d.ownerId?.name || '—'}</div>
                    </div>
                  </Flex>
                  <Tag color={t.color}>{t.text}</Tag>
                </Flex>

                <Flex gap={20} wrap style={{ marginBottom: 12, fontSize: 14, color: '#5e5148' }}>
                  <span>Tiền cọc: <strong style={{ color: '#a86a2c' }}>{deposit.toLocaleString()}đ</strong></span>
                  <span>Đơn mượn: <strong>{d.status}</strong></span>
                  {claimOpen && (
                    <Text type="danger">
                      {d.isLostClaim ? 'Khai mất đồ' : 'Khiếu nại hư hỏng'}: <strong>{(d.damageAmountRequested || 0).toLocaleString()}đ</strong>
                      {d.damageClaimStatus === 'accepted' && ' (người mượn ĐỒNG Ý)'}
                      {d.damageClaimStatus === 'disputed' && ' (TRANH CHẤP)'}
                    </Text>
                  )}
                </Flex>

                {(d.handoverImages?.length || d.returnImages?.length || d.damageImages?.length || d.borrowerDisputeImages?.length) ? (
                  <div style={{ padding: 12, background: '#f6f8fa', borderRadius: 10, marginBottom: 12 }}>
                    <PhotoRow title="Ảnh lúc chủ GIAO đồ (trước)" images={d.handoverImages} />
                    <PhotoRow title="Ảnh người mượn khi TRẢ (sau)" images={d.returnImages} />
                    <PhotoRow title="Ảnh hư hỏng (chủ cung cấp)" images={d.damageImages} />
                    <PhotoRow title="Ảnh khiếu nại của người mượn" images={d.borrowerDisputeImages} />
                  </div>
                ) : null}

                {d.damageNote && claimOpen && <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>Chủ nói: "{d.damageNote}"</Text>}
                {d.borrowerDisputeNote && <Text style={{ display: 'block', fontSize: 13, color: '#b45309' }}>Người mượn phản bác: "{d.borrowerDisputeNote}"</Text>}

                {d.depositResolveNote && ['refunded', 'partially_refunded'].includes(d.depositStatus) && (
                  <Text type="success" style={{ display: 'block', fontSize: 13, marginTop: 6 }}>
                    {d.depositResolveNote} (hoàn {(d.depositRefundAmount || 0).toLocaleString()}đ{d.depositDeductAmount ? `, trừ ${d.depositDeductAmount.toLocaleString()}đ` : ''})
                  </Text>
                )}

                {/* Hành động */}
                {d.depositStatus === 'awaiting_confirmation' && (
                  <Button type="primary" loading={actionId === d._id} onClick={() => doAction(d._id, 'confirm')} style={{ marginTop: 8 }}>
                    Xác nhận đã nhận cọc
                  </Button>
                )}

                {d.depositStatus === 'held' && (
                  <div style={{ marginTop: 8 }}>
                    {d.damageClaimStatus === 'none' && (
                      d.status === 'returned' ? (
                        <Button type="primary" loading={actionId === d._id} onClick={() => doAction(d._id, 'refund')} style={{ background: '#16a34a' }}>
                          Hoàn 100% ({deposit.toLocaleString()}đ)
                        </Button>
                      ) : (
                        <Text type="secondary" italic>Đang giữ cọc. Chờ chủ xác nhận nhận lại đồ.</Text>
                      )
                    )}

                    {claimOpen && (
                      <div style={{ padding: 12, background: d.damageClaimStatus === 'disputed' ? '#fff5f5' : '#fff8ec', borderRadius: 10 }}>
                        <Text strong style={{ display: 'block', fontSize: 13, marginBottom: 10 }}>
                          {d.damageClaimStatus === 'claimed' && 'Chờ người mượn phản hồi — bạn vẫn có thể phân xử ngay.'}
                          {d.damageClaimStatus === 'accepted' && 'Người mượn đã đồng ý. Xác nhận số tiền trừ:'}
                          {d.damageClaimStatus === 'disputed' && 'TRANH CHẤP — xem bằng chứng 2 bên rồi quyết số tiền trừ (0 nếu bênh người mượn):'}
                        </Text>
                        <Flex gap={8} align="center" wrap>
                          <InputNumber min={0} max={deposit} value={draft} placeholder="Số tiền trừ" style={{ width: 140 }}
                            onChange={v => setDeductDrafts(prev => ({ ...prev, [d._id]: v }))}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => (v || '').replace(/,/g, '')} />
                          <Button danger type="primary" loading={actionId === d._id}
                            onClick={() => doAction(d._id, 'resolve-damage', { deductAmount: Number(draft) || 0 })}>
                            Phân xử & hoàn phần còn lại
                          </Button>
                          <Text type="secondary" style={{ fontSize: 12 }}>Trừ {(Number(draft) || 0).toLocaleString()}đ → hoàn {(deposit - (Number(draft) || 0)).toLocaleString()}đ</Text>
                        </Flex>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </Flex>
      )}
    </AdminLayout>
  );
}
