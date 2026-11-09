const mongoose = require('mongoose');
const Voucher = require('../models/Voucher');
const BorrowRequest = require('../models/BorrowRequest');

// Kiểm tra voucher còn hợp lệ để dùng hay không (không tính số tiền)
function checkUsable(voucher, deposit) {
  if (!voucher) return 'Mã giảm cọc không tồn tại!';
  if (!voucher.active) return 'Mã giảm cọc đã bị tạm ngưng!';
  if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) return 'Mã giảm cọc đã hết hạn!';
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) return 'Mã giảm cọc đã hết lượt sử dụng!';
  if (voucher.minDeposit && deposit < voucher.minDeposit) return `Cọc tối thiểu ${voucher.minDeposit.toLocaleString()}đ mới dùng được mã này!`;
  return null;
}

// ================= ADMIN =================
exports.listVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json({ success: true, vouchers });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh sách voucher', error: err.message });
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, maxDiscount, minDeposit, usageLimit, usagePerUser, expiresAt, active } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ message: 'Vui lòng nhập mã voucher!' });
    const value = Number(discountValue);
    if (isNaN(value) || value <= 0) return res.status(400).json({ message: 'Giá trị giảm phải lớn hơn 0!' });
    if (discountType === 'percent' && value > 100) return res.status(400).json({ message: 'Giảm theo % không vượt quá 100!' });

    const exists = await Voucher.findOne({ code: code.trim().toUpperCase() });
    if (exists) return res.status(400).json({ message: 'Mã voucher này đã tồn tại!' });

    const voucher = await Voucher.create({
      code: code.trim().toUpperCase(),
      description: description?.trim(),
      discountType: discountType === 'fixed' ? 'fixed' : 'percent',
      discountValue: value,
      maxDiscount: Number(maxDiscount) || 0,
      minDeposit: Number(minDeposit) || 0,
      usageLimit: Number(usageLimit) || 0,
      usagePerUser: Number(usagePerUser) || 0,
      expiresAt: expiresAt || null,
      active: active !== false,
      createdBy: req.userId
    });
    res.status(201).json({ success: true, voucher });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo voucher', error: err.message });
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Mã voucher không hợp lệ!' });
    const allowed = ['description', 'discountType', 'discountValue', 'maxDiscount', 'minDeposit', 'usageLimit', 'usagePerUser', 'expiresAt', 'active'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];
    const voucher = await Voucher.findByIdAndUpdate(id, update, { new: true });
    if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher!' });
    res.json({ success: true, voucher });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật voucher', error: err.message });
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findByIdAndDelete(id);
    if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher!' });
    res.json({ success: true, message: 'Đã xóa voucher!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa voucher', error: err.message });
  }
};

// ================= NGƯỜI MƯỢN =================
// Xem trước số tiền được giảm (không ghi gì)
exports.previewVoucher = async (req, res) => {
  try {
    const { borrowRequestId } = req.params;
    const { code } = req.body;
    const request = await BorrowRequest.findById(borrowRequestId);
    if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });
    if (request.borrowerId.toString() !== req.userId) return res.status(403).json({ message: 'Không phải đơn của bạn!' });

    const baseDeposit = (request.depositAmount || 0) + (request.voucherDiscount || 0);
    const voucher = await Voucher.findOne({ code: (code || '').trim().toUpperCase() });
    const err = checkUsable(voucher, baseDeposit);
    if (err) return res.status(400).json({ message: err });

    const discount = voucher.computeDiscount(baseDeposit);
    res.json({ success: true, discount, newDeposit: baseDeposit - discount, code: voucher.code, description: voucher.description });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi kiểm tra voucher', error: err.message });
  }
};

// Áp dụng voucher vào đơn (giảm cọc thật), chỉ khi chưa đóng cọc
exports.applyVoucher = async (req, res) => {
  try {
    const { borrowRequestId } = req.params;
    const { code } = req.body;
    const request = await BorrowRequest.findById(borrowRequestId);
    if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });
    if (request.borrowerId.toString() !== req.userId) return res.status(403).json({ message: 'Không phải đơn của bạn!' });
    if (request.status !== 'approved') return res.status(400).json({ message: 'Chỉ áp dụng voucher khi đơn đã được duyệt và chưa đóng cọc!' });
    if (request.depositStatus !== 'pending') return res.status(400).json({ message: 'Đơn đã ở bước đóng/giữ cọc, không thể áp dụng voucher nữa!' });
    if (request.voucherCode) return res.status(400).json({ message: `Đơn đã áp dụng mã "${request.voucherCode}" rồi!` });

    const baseDeposit = request.depositAmount || 0;
    const normalized = (code || '').trim().toUpperCase();
    const voucher = await Voucher.findOne({ code: normalized });
    const err = checkUsable(voucher, baseDeposit);
    if (err) return res.status(400).json({ message: err });

    // Giới hạn số lượt mỗi người (đếm đơn còn đang giữ mã này của chính họ)
    if (voucher.usagePerUser && voucher.usagePerUser > 0) {
      const usedByUser = await BorrowRequest.countDocuments({ voucherCode: voucher.code, borrowerId: req.userId });
      if (usedByUser >= voucher.usagePerUser) {
        return res.status(400).json({ message: `Bạn đã dùng mã này tối đa ${voucher.usagePerUser} lần!` });
      }
    }

    // Tăng lượt dùng ATOMIC: chỉ tăng khi còn lượt (tránh vượt usageLimit khi nhiều người bấm cùng lúc)
    const incCondition = { _id: voucher._id, active: true };
    if (voucher.usageLimit && voucher.usageLimit > 0) incCondition.usedCount = { $lt: voucher.usageLimit };
    const claimed = await Voucher.findOneAndUpdate(incCondition, { $inc: { usedCount: 1 } }, { new: true });
    if (!claimed) return res.status(400).json({ message: 'Mã giảm cọc đã hết lượt sử dụng!' });

    const discount = voucher.computeDiscount(baseDeposit);
    request.depositAmount = baseDeposit - discount;
    request.voucherCode = voucher.code;
    request.voucherDiscount = discount;
    await request.save();

    res.json({ success: true, message: `Đã áp dụng mã ${voucher.code}, giảm ${discount.toLocaleString()}đ tiền cọc!`, discount, newDeposit: request.depositAmount });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi áp dụng voucher', error: err.message });
  }
};

// Hoàn lại lượt dùng voucher khi đơn không thành (huỷ/từ chối/hoàn cọc trước khi mượn).
// Trả lại cọc gốc cho đơn để dữ liệu nhất quán. Gọi nội bộ từ BorrowController/depositController.
exports.releaseVoucher = async (request, { restoreDeposit = true } = {}) => {
  try {
    if (!request || !request.voucherCode) return;
    await Voucher.updateOne({ code: request.voucherCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    // restoreDeposit: khi đơn chưa đóng cọc (huỷ trước khi trả tiền) -> trả cọc gốc để nhất quán.
    // Khi đã đóng/hoàn cọc rồi thì giữ nguyên số liệu tiền, chỉ giải phóng lượt voucher.
    if (restoreDeposit) {
      request.depositAmount = (request.depositAmount || 0) + (request.voucherDiscount || 0);
      request.voucherDiscount = 0;
    }
    request.voucherCode = undefined;
  } catch (err) {
    console.error('[VOUCHER] Lỗi hoàn lượt voucher:', err.message);
  }
};
