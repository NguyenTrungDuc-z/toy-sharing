const mongoose = require('mongoose');
const Category = require('../models/Category');
const Toy = require('../models/Toy');

// Công khai: danh mục đang hoạt động (cho Home + form đăng đồ)
exports.listPublic = async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh mục', error: err.message });
  }
};

// Admin: tất cả danh mục + số đồ chơi mỗi danh mục
exports.listAll = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    for (const c of categories) {
      c.toyCount = await Toy.countDocuments({ category: c.name });
    }
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh mục', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, order, active } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Vui lòng nhập tên danh mục!' });
    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ message: 'Danh mục này đã tồn tại!' });
    const category = await Category.create({ name: name.trim(), description: description?.trim(), order: Number(order) || 0, active: active !== false });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo danh mục', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Mã danh mục không hợp lệ!' });
    const prev = await Category.findById(id);
    if (!prev) return res.status(404).json({ message: 'Không tìm thấy danh mục!' });

    const { name, description, order, active } = req.body;
    // Nếu đổi tên: cập nhật tên danh mục trên các đồ chơi đang dùng để giữ nhất quán
    if (name && name.trim() && name.trim() !== prev.name) {
      const dup = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
      if (dup) return res.status(400).json({ message: 'Tên danh mục đã tồn tại!' });
      await Toy.updateMany({ category: prev.name }, { category: name.trim() });
      prev.name = name.trim();
    }
    if (description !== undefined) prev.description = description?.trim();
    if (order !== undefined) prev.order = Number(order) || 0;
    if (active !== undefined) prev.active = active;
    await prev.save();
    res.json({ success: true, category: prev });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật danh mục', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục!' });
    const inUse = await Toy.countDocuments({ category: category.name });
    if (inUse > 0) return res.status(400).json({ message: `Còn ${inUse} đồ chơi thuộc danh mục này. Hãy chuyển/xóa chúng trước, hoặc tạm ẩn danh mục.` });
    await Category.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa danh mục!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa danh mục', error: err.message });
  }
};
