import React, { useRef } from 'react';

// Bộ tải ảnh base64 dùng lại (tối đa maxFiles, mỗi ảnh <= maxMB).
export default function ImageUploader({ images = [], onChange, maxFiles = 5, maxMB = 3, label }) {
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxFiles - images.length;
    files.slice(0, remaining).forEach(file => {
      if (file.size > maxMB * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => onChange([...images, reader.result].slice(0, maxFiles));
      reader.readAsDataURL(file);
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (idx) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#7c6e65', marginBottom: '8px' }}>{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {images.map((img, idx) => (
          <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5ccb3' }}>
            <img src={img} alt={`Ảnh ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button type="button" onClick={() => remove(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', lineHeight: '20px', padding: 0 }}>✕</button>
          </div>
        ))}
        {images.length < maxFiles && (
          <div onClick={() => inputRef.current?.click()} style={{ width: '80px', height: '80px', border: '2px dashed #e5ccb3', borderRadius: '12px', background: '#fffbf7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>📷</span>
            <span style={{ fontSize: '10px', color: '#a19286' }}>{images.length}/{maxFiles}</span>
          </div>
        )}
      </div>
    </div>
  );
}
