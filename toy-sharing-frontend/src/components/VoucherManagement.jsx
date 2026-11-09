import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { App, Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Switch, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AdminLayout from './AdminLayout';

const API = 'http://localhost:5000/api/vouchers';

export default function VoucherManagement({ setPage }) {
  const { message, modal } = App.useApp();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, authHeaders());
      setVouchers(res.data.vouchers || []);
    } catch { setVouchers([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchVouchers(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ discountType: 'percent', active: true, discountValue: 10, maxDiscount: 0, minDeposit: 0, usageLimit: 0 });
    setModalOpen(true);
  };
  const openEdit = (v) => {
    setEditing(v);
    form.setFieldsValue({ ...v, expiresAt: v.expiresAt ? dayjs(v.expiresAt) : null });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const payload = { ...vals, expiresAt: vals.expiresAt ? vals.expiresAt.toISOString() : null };
      if (editing) {
        await axios.patch(`${API}/${editing._id}`, payload, authHeaders());
        message.success('Đã cập nhật voucher!');
      } else {
        await axios.post(API, payload, authHeaders());
        message.success('Đã tạo voucher mới!');
      }
      setModalOpen(false);
      fetchVouchers();
    } catch (err) {
      if (err?.response) message.error(err.response.data?.message || 'Không lưu được voucher!');
    } finally { setSaving(false); }
  };

  const toggleActive = async (v) => {
    try {
      await axios.patch(`${API}/${v._id}`, { active: !v.active }, authHeaders());
      fetchVouchers();
    } catch { message.error('Không đổi được trạng thái.'); }
  };

  const handleDelete = (v) => modal.confirm({
    title: 'Xóa voucher', content: `Xóa mã "${v.code}"? Hành động này không thể hoàn tác.`,
    okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Hủy',
    onOk: async () => {
      try { await axios.delete(`${API}/${v._id}`, authHeaders()); message.success('Đã xóa voucher!'); fetchVouchers(); }
      catch { message.error('Không xóa được voucher.'); }
    }
  });

  const columns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', render: c => <Tag color="geekblue" style={{ fontWeight: 700 }}>{c}</Tag> },
    { title: 'Giảm', key: 'discount', render: (_, v) => v.discountType === 'percent'
      ? `${v.discountValue}%${v.maxDiscount ? ` (tối đa ${v.maxDiscount.toLocaleString()}đ)` : ''}`
      : `${v.discountValue.toLocaleString()}đ` },
    { title: 'Cọc tối thiểu', dataIndex: 'minDeposit', key: 'minDeposit', render: m => m ? `${m.toLocaleString()}đ` : '—' },
    { title: 'Lượt dùng', key: 'usage', render: (_, v) => `${v.usedCount}${v.usageLimit ? ` / ${v.usageLimit}` : ''}` },
    { title: 'Hết hạn', dataIndex: 'expiresAt', key: 'expiresAt', render: d => d ? dayjs(d).format('DD/MM/YYYY') : 'Không' },
    { title: 'Trạng thái', key: 'active', render: (_, v) => <Switch checked={v.active} onChange={() => toggleActive(v)} /> },
    { title: 'Thao tác', key: 'actions', align: 'right', render: (_, v) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(v)}>Sửa</Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(v)}>Xóa</Button>
      </Space>
    ) },
  ];

  const extra = <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo voucher</Button>;

  return (
    <AdminLayout active="admin-vouchers" setPage={setPage} title="Mã giảm cọc" extra={extra}>
      <Card styles={{ body: { padding: 0 } }}>
        <Table rowKey="_id" columns={columns} dataSource={vouchers} loading={loading}
          pagination={{ pageSize: 10, hideOnSinglePage: true }} scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'Chưa có voucher nào. Bấm "Tạo voucher" để thêm.' }} />
      </Card>

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSave} confirmLoading={saving}
        okText={editing ? 'Lưu' : 'Tạo'} cancelText="Hủy" title={editing ? `Sửa voucher ${editing.code}` : 'Tạo voucher mới'}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="code" label="Mã voucher" rules={[{ required: true, message: 'Nhập mã voucher' }]}>
            <Input placeholder="VD: HECHE2026" disabled={!!editing} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input placeholder="Mô tả ngắn hiển thị nội bộ" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="discountType" label="Kiểu giảm" rules={[{ required: true }]}>
              <Select style={{ width: 140 }} options={[{ value: 'percent', label: 'Theo %' }, { value: 'fixed', label: 'Số tiền' }]} />
            </Form.Item>
            <Form.Item name="discountValue" label="Giá trị giảm" rules={[{ required: true, message: 'Nhập giá trị' }]}>
              <InputNumber min={1} style={{ width: 160 }} />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="maxDiscount" label="Trần giảm (nếu theo %)">
              <InputNumber min={0} step={1000} style={{ width: 160 }} addonAfter="đ" />
            </Form.Item>
            <Form.Item name="minDeposit" label="Cọc tối thiểu">
              <InputNumber min={0} step={1000} style={{ width: 160 }} addonAfter="đ" />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="usageLimit" label="Giới hạn lượt dùng (0 = không giới hạn)">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="expiresAt" label="Ngày hết hạn">
              <DatePicker format="DD/MM/YYYY" style={{ width: 160 }} />
            </Form.Item>
          </Space>
          <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
