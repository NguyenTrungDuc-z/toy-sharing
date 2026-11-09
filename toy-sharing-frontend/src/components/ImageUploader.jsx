import React from 'react';
import { Upload, Typography, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

// Bộ tải ảnh base64 dùng lại (tối đa maxFiles, mỗi ảnh <= maxMB).
export default function ImageUploader({ images = [], onChange, maxFiles = 5, maxMB = 3, label }) {
  const { message } = App.useApp();

  const beforeUpload = (file) => {
    if (images.length >= maxFiles) { message.warning(`Tối đa ${maxFiles} ảnh`); return Upload.LIST_IGNORE; }
    if (file.size > maxMB * 1024 * 1024) { message.error(`Mỗi ảnh tối đa ${maxMB}MB`); return Upload.LIST_IGNORE; }
    const reader = new FileReader();
    reader.onloadend = () => onChange([...images, reader.result].slice(0, maxFiles));
    reader.readAsDataURL(file);
    return false;
  };

  const fileList = images.map((img, i) => ({ uid: String(i), name: `anh-${i + 1}`, status: 'done', url: img }));

  return (
    <div>
      {label && <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>{label}</Typography.Text>}
      <Upload listType="picture-card" accept="image/*" multiple fileList={fileList}
        beforeUpload={beforeUpload} onRemove={(f) => onChange(images.filter((_, i) => String(i) !== f.uid))}>
        {images.length < maxFiles && <div><PlusOutlined /><div style={{ marginTop: 4, fontSize: 11 }}>{images.length}/{maxFiles}</div></div>}
      </Upload>
    </div>
  );
}
