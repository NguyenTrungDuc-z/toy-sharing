import React, { useState, useEffect, useRef } from 'react';

export default function ToyFormModal({ isOpen, onClose, onSubmit, editingToy }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Giáo dục',
    customCategory: '',
    ageRange: 'Chọn độ tuổi',
    condition: 'Mới (New)',
    description: '',
    imageUrl: '',
    depositRequired: ''
  });

  
  const fileInputRef = useRef(null);

 
  const normalizeConditionToFrontend = (cond) => {
    if (!cond) return 'Mới (New)';
    const c = cond.toLowerCase();
    if (c === 'new') return 'Mới (New)';
    if (c === 'used') return 'Đã dùng (Used)';
    return cond; 
  };

  useEffect(() => {
    if (editingToy) {
     
      const defaultCategories = ['Giáo dục', 'Hành động', 'Xếp hình', 'Công nghệ'];
      const isCustom = editingToy.category && !defaultCategories.includes(editingToy.category);
      
      setFormData({
        name: editingToy.name || '',
        category: isCustom ? 'Khác' : (editingToy.category || 'Giáo dục'),
        customCategory: isCustom ? editingToy.category : '',
        ageRange: editingToy.ageRange || 'Chọn độ tuổi',
        condition: normalizeConditionToFrontend(editingToy.condition),
        description: editingToy.description || '',
       
        imageUrl: editingToy.imageUrl || (Array.isArray(editingToy.images) && editingToy.images.length > 0 ? editingToy.images[0] : ''),
        depositRequired: editingToy.depositRequired || ''
      });
    } else {
      setFormData({ name: '', category: 'Giáo dục', customCategory: '', ageRange: 'Chọn độ tuổi', condition: 'Mới (New)', description: '', imageUrl: '', depositRequired: '' });
    }
  }, [editingToy, isOpen]);

  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          imageUrl: reader.result 
        });
      };
      reader.readAsDataURL(file);
    }
  };


  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(45, 37, 32, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '32px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(92, 77, 66, 0.15)', border: '1px solid #eaedd9'
      }}>
        
       
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #fdf8f4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ backgroundColor: '#f59e0b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px' }}>🚀</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#2d2520' }}>
              {editingToy ? 'Chỉnh sửa thông tin đồ chơi' : 'Đăng đồ chơi mới'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a19286' }}>✕</button>
        </div>

        
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
       
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#a19286', marginBottom: '12px' }}>📷 Hình ảnh đồ chơi</label>
            
            
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />

            <div style={{ display: 'flex', gap: '12px' }}>
           
              <div 
                onClick={triggerFileSelect}
                style={{ 
                  flex: 2, height: '110px', border: '2px dashed #e5ccb3', borderRadius: '24px', 
                  backgroundColor: '#fffbf7', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  overflow: 'hidden', position: 'relative'
                }}
              >
                {formData.imageUrl ? (
                  
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <>
                    <span style={{ fontSize: '20px' }}>📸</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginTop: '4px' }}>Tải ảnh lên</span>
                    <span style={{ fontSize: '11px', color: '#a19286' }}>PNG, JPG (Tối đa 1 ảnh)</span>
                  </>
                )}
              </div>

              
            </div>
          </div>

          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#85581A', marginBottom: '14px' }}>
              <span>ℹ️</span> Thông tin cơ bản
            </div>
            
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>🖋️ Tên đồ chơi</label>
            <input 
              type="text" required placeholder="Ví dụ: Bộ lắp ráp LEGO Ninjago Rồng Lửa"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '14px 18px', borderRadius: '20px', border: '1px solid #eaedd9', backgroundColor: '#fffbf7', outline: 'none', marginBottom: '16px', fontSize: '14px' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>🕹️ Danh mục</label>
                <select 
                  value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: '20px', border: '1px solid #eaedd9', backgroundColor: '#fffbf7', fontSize: '14px', marginBottom: formData.category === 'Khác' ? '10px' : '0' }}
                >
                  <option value="Giáo dục">Giáo dục</option>
                  <option value="Hành động">Hành động</option>
                  <option value="Xếp hình">Xếp hình</option>
                  <option value="Công nghệ">Công nghệ</option>
                  <option value="Khác">Khác</option>
                </select>
                {formData.category === 'Khác' && (
                  <input 
                    type="text" required placeholder="Nhập danh mục khác..."
                    value={formData.customCategory} onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: '20px', border: '1px solid #eaedd9', backgroundColor: '#fffbf7', outline: 'none', fontSize: '14px' }}
                  />
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>👶 Độ tuổi phù hợp</label>
<select 
  value={formData.ageRange} onChange={(e) => setFormData({...formData, ageRange: e.target.value})}
  style={{ width: '100%', padding: '14px 18px', borderRadius: '20px', border: '1px solid #eaedd9', backgroundColor: '#fffbf7', fontSize: '14px' }}
>
  <option value="Chọn độ tuổi">Chọn độ tuổi</option>
  <option value="0-3 tuổi">0-3 tuổi</option>
  <option value="3-6 tuổi">3-6 tuổi</option>
  <option value="6-12 tuổi">6-12 tuổi</option>
  <option value="12+ tuổi">12+ tuổi</option>
</select>
              </div>
            </div>
          </div>

         
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#85581A', marginBottom: '14px' }}>
               Chi tiết & Tình trạng
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '10px' }}>⚙️ Tình trạng hiện tại</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {['Mới (New)', 'Như mới (Like New)', 'Đã dùng (Used)'].map((cond) => {
                const isSelected = formData.condition === cond;
                return (
                  <button
                    key={cond} type="button" onClick={() => setFormData({...formData, condition: cond})}
                    style={{
                      padding: '10px 20px', borderRadius: '20px', border: isSelected ? 'none' : '1px solid #eaedd9',
                      backgroundColor: isSelected ? '#e58f12' : 'white', color: isSelected ? 'white' : '#7c6e65',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>💰 Tiền cọc (đồng)</label>
            <input 
              type="number" min="0" placeholder="Ví dụ: 200000"
              value={formData.depositRequired} onChange={(e) => setFormData({...formData, depositRequired: e.target.value})}
              style={{ width: '100%', padding: '14px 18px', borderRadius: '20px', border: '1px solid #eaedd9', backgroundColor: '#fffbf7', outline: 'none', marginBottom: '16px', fontSize: '14px' }}
            />

            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#7c6e65', marginBottom: '6px' }}>📝 Mô tả chi tiết</label>
            <textarea 
              rows="3" placeholder="Ví dụ: Đồ chơi còn đầy đủ các mảnh ghép, có sách hướng dẫn, đã được vệ sinh khử khuẩn..."
              value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', padding: '14px 18px', borderRadius: '20px', border: '1px solid #eaedd9', backgroundColor: '#fffbf7', outline: 'none', fontSize: '14px', resize: 'none' }}
            />
          </div>

          {/* Khối Cam kết vệ sinh */}
          <div style={{ display: 'flex', gap: '12px', backgroundColor: '#fffbf2', border: '1px solid #f3ebd9', padding: '16px 20px', borderRadius: '24px', alignItems: 'flex-start' }}>
            <span style={{ backgroundColor: '#e58f12', color: 'white', minWidth: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', marginTop: '2px' }}>✓</span>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#85581A' }}>Cam kết vệ sinh</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#a19286', lineHeight: '1.5' }}>
                Vì sức khỏe cộng đồng, hãy đảm bảo đồ chơi đã được vệ sinh sạch sẽ và không bị hỏng hóc gây nguy hiểm trước khi đăng tải.
              </p>
            </div>
          </div>

        </div>

        {/* Thanh Footer Chứa Nút điều hướng */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '18px 28px', borderTop: '1px solid #fdf8f4', backgroundColor: '#fffbfaf2' }}>
          <button 
            type="button" onClick={onClose}
            style={{ padding: '12px 32px', borderRadius: '20px', border: 'none', backgroundColor: '#e0e7ff', color: '#4f46e5', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
          >
            Hủy bỏ
          </button>
          <button 
            type="button" onClick={() => {
              // Validate ageRange before submit
              if (formData.ageRange === 'Chọn độ tuổi') {
                alert('Vui lòng chọn độ tuổi phù hợp cho đồ chơi!');
                return;
              }
              
              // Normalize condition to match backend enum: 'new' or 'used'
              let normalizedCondition = 'new';
              if (formData.condition === 'Đã dùng (Used)') {
                normalizedCondition = 'used';
              } else if (formData.condition === 'Như mới (Like New)') {
                normalizedCondition = 'new'; // Like New treated as new for backend enum
              }
              
              // Validate category if 'Khác' is selected
              if (formData.category === 'Khác' && !formData.customCategory.trim()) {
                alert('Vui lòng nhập tên danh mục!');
                return;
              }

              // Submit with images array format for backend
              const submitData = {
                name: formData.name,
                category: formData.category === 'Khác' ? formData.customCategory.trim() : formData.category,
                ageRange: formData.ageRange,
                condition: normalizedCondition,
                description: formData.description,
                images: formData.imageUrl ? [formData.imageUrl] : [],
                depositRequired: Number(formData.depositRequired) || 0
              };
              
              onSubmit(submitData);
            }}
            style={{ padding: '12px 36px', borderRadius: '20px', border: 'none', backgroundColor: '#e58f12', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
          >
            {editingToy ? 'Cập nhật' : 'Đăng đồ chơi'}
          </button>
        </div>

      </div>
    </div>
  );
}