import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Radio, Upload, Alert, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { VIETNAM_REGIONS } from '../constants/vietnamLocations';

const DEFAULT_CATEGORIES = ['Giáo dục', 'Hành động', 'Xếp hình', 'Công nghệ'];

const locationOptions = VIETNAM_REGIONS.map(reg => ({
  label: reg.region, title: reg.region,
  options: reg.provinces.map(p => ({ value: p, label: p })),
}));

export default function ToyFormModal({ isOpen, onClose, onSubmit, editingToy }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [images, setImages] = useState([]); // base64[]
  const category = Form.useWatch('category', form);

  useEffect(() => {
    if (!isOpen) return;
    if (editingToy) {
      const isCustom = editingToy.category && !DEFAULT_CATEGORIES.includes(editingToy.category);
      form.setFieldsValue({
        name: editingToy.name || '',
        category: isCustom ? 'Khác' : (editingToy.category || 'Giáo dục'),
        customCategory: isCustom ? editingToy.category : '',
        ageRange: editingToy.ageRange || undefined,
        condition: editingToy.condition || 'new',
        depositRequired: editingToy.depositRequired || 0,
        location: editingToy.location || undefined,
        description: editingToy.description || '',
      });
      setImages(Array.isArray(editingToy.images) ? editingToy.images : []);
    } else {
      form.resetFields();
      form.setFieldsValue({ category: 'Giáo dục', condition: 'new', depositRequired: 0 });
      setImages([]);
    }
  }, [editingToy, isOpen]);

  const beforeUpload = (file) => {
    if (images.length >= 5) { message.warning('Tối đa 5 ảnh'); return Upload.LIST_IGNORE; }
    if (file.size > 3 * 1024 * 1024) { message.error('Mỗi ảnh tối đa 3MB'); return Upload.LIST_IGNORE; }
    const reader = new FileReader();
    reader.onloadend = () => setImages(prev => [...prev, reader.result].slice(0, 5));
    reader.readAsDataURL(file);
    return false;
  };

  const fileList = images.map((img, i) => ({ uid: String(i), name: `anh-${i + 1}`, status: 'done', url: img }));

  const handleOk = async () => {
    let v;
    try { v = await form.validateFields(); } catch { return; }
    const submitData = {
      name: v.name,
      category: v.category === 'Khác' ? (v.customCategory || '').trim() : v.category,
      ageRange: v.ageRange,
      condition: v.condition,
      description: v.description || '',
      images,
      depositRequired: Number(v.depositRequired) || 0,
      location: (v.location || '').trim(),
    };
    onSubmit(submitData);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      onOk={handleOk}
      title={editingToy ? 'Chỉnh sửa thông tin đồ chơi' : 'Đăng đồ chơi mới'}
      okText={editingToy ? 'Cập nhật' : 'Đăng đồ chơi'}
      cancelText="Hủy bỏ"
      width={640}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 12 } }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item label="Hình ảnh đồ chơi (tối đa 5)">
          <Upload listType="picture-card" accept="image/*" multiple fileList={fileList}
            beforeUpload={beforeUpload} onRemove={(f) => setImages(prev => prev.filter((_, i) => String(i) !== f.uid))}>
            {images.length < 5 && <div><PlusOutlined /><div style={{ marginTop: 6, fontSize: 12 }}>Tải ảnh</div></div>}
          </Upload>
        </Form.Item>

        <Form.Item name="name" label="Tên đồ chơi" rules={[{ required: true, message: 'Nhập tên đồ chơi' }]}>
          <Input placeholder="Ví dụ: Bộ lắp ráp LEGO Ninjago Rồng Lửa" />
        </Form.Item>

        <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
          <Select options={[...DEFAULT_CATEGORIES.map(c => ({ value: c, label: c })), { value: 'Khác', label: 'Khác' }]} />
        </Form.Item>
        {category === 'Khác' && (
          <Form.Item name="customCategory" label="Tên danh mục khác" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
            <Input placeholder="Nhập danh mục..." />
          </Form.Item>
        )}

        <Form.Item name="ageRange" label="Độ tuổi phù hợp" rules={[{ required: true, message: 'Chọn độ tuổi' }]}>
          <Select placeholder="Chọn độ tuổi" options={['0-3 tuổi', '3-6 tuổi', '6-12 tuổi', '12+ tuổi'].map(a => ({ value: a, label: a }))} />
        </Form.Item>

        <Form.Item name="condition" label="Tình trạng" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid"
            options={[{ value: 'new', label: 'Mới' }, { value: 'like_new', label: 'Như mới' }, { value: 'used', label: 'Đã dùng' }]} />
        </Form.Item>

        <Form.Item name="depositRequired" label="Tiền cọc (đồng)">
          <InputNumber min={0} step={10000} style={{ width: '100%' }} placeholder="Ví dụ: 200000"
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => (v || '').replace(/,/g, '')} />
        </Form.Item>

        <Form.Item name="location" label="Khu vực (Tỉnh/Thành phố)">
          <Select showSearch allowClear optionFilterProp="label" placeholder="Chọn Tỉnh / Thành phố" options={locationOptions} />
        </Form.Item>

        <Form.Item name="description" label="Mô tả chi tiết">
          <Input.TextArea rows={3} placeholder="Đồ chơi còn đầy đủ mảnh ghép, đã được vệ sinh sạch sẽ..." />
        </Form.Item>

        <Alert type="warning" showIcon message="Cam kết vệ sinh"
          description="Vì sức khỏe cộng đồng, hãy đảm bảo đồ chơi đã được vệ sinh sạch sẽ và không hỏng hóc gây nguy hiểm trước khi đăng." />
      </Form>
    </Modal>
  );
}
