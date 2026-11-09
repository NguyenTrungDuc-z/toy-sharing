const mongoose = require('mongoose');

// Danh mục đồ chơi do admin quản lý (thay cho danh sách hardcode ở frontend).
// Toy.category lưu theo TÊN danh mục để tương thích dữ liệu hiện có.
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 },   // thứ tự hiển thị
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
