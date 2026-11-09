import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { App, Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Switch, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import AdminLayout from './AdminLayout';

const API = '/api/categories';

export default function CategoryManagement({ setPage }) {
  const { message, modal } = App.useApp();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/all`, authHeaders());
      setCategories(res.data.categories || []);
    } catch { setCategories([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ active: true, order: 0 }); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); form.setFieldsValue(c); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      if (editing) { await axios.patch(`${API}/${editing._id}`, vals, authHeaders()); message.success('Đã cập nhật danh mục!'); }
      else { await axios.post(API, vals, authHeaders()); message.success('Đã tạo danh mục!'); }
      setModalOpen(false); fetchCategories();
    } catch (err) {
      if (err?.response) message.error(err.response.data?.message || 'Không lưu được danh mục!');
    } finally { setSaving(false); }
  };

  const toggleActive = async (c) => {
    try { await axios.patch(`${API}/${c._id}`, { active: !c.active }, authHeaders()); fetchCategories(); }
    catch { message.error('Không đổi được trạng thái.'); }
  };

  const handleDelete = (c) => modal.confirm({
    title: 'Xóa danh mục', content: `Xóa danh mục "${c.name}"?`,
    okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Hủy',
    onOk: async () => {
      try { await axios.delete(`${API}/${c._id}`, authHeaders()); message.success('Đã xóa danh mục!'); fetchCategories(); }
      catch (err) { message.error(err.response?.data?.message || 'Không xóa được danh mục.'); }
    }
  });

  const columns = [
    { title: 'Thứ tự', dataIndex: 'order', key: 'order', width: 80 },
    { title: 'Tên danh mục', dataIndex: 'name', key: 'name', render: n => <strong>{n}</strong> },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', render: d => d || '—' },
    { title: 'Số đồ chơi', dataIndex: 'toyCount', key: 'toyCount', render: n => <Tag color="blue">{n || 0}</Tag> },
    { title: 'Hiển thị', key: 'active', render: (_, c) => <Switch checked={c.active} onChange={() => toggleActive(c)} /> },
    { title: 'Thao tác', key: 'actions', align: 'right', render: (_, c) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(c)}>Sửa</Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(c)}>Xóa</Button>
      </Space>
    ) },
  ];

  const extra = <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm danh mục</Button>;

  return (
    <AdminLayout active="admin-categories" setPage={setPage} title="Quản lý danh mục" extra={extra}>
      <Card styles={{ body: { padding: 0 } }}>
        <Table rowKey="_id" columns={columns} dataSource={categories} loading={loading}
          pagination={{ pageSize: 10, hideOnSinglePage: true }} scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'Chưa có danh mục nào. Bấm "Thêm danh mục".' }} />
      </Card>

      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSave} confirmLoading={saving}
        okText={editing ? 'Lưu' : 'Tạo'} cancelText="Hủy" title={editing ? `Sửa danh mục ${editing.name}` : 'Thêm danh mục'}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
            <Input placeholder="VD: Búp bê & Thú bông" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input placeholder="Mô tả ngắn (tùy chọn)" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="order" label="Thứ tự hiển thị">
              <InputNumber min={0} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="active" label="Hiển thị" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
