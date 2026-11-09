const mongoose = require('mongoose');

// Voucher giảm TIỀN CỌC thật. Vì nền tảng cho mượn miễn phí (chỉ có cọc hoàn lại),
// voucher làm giảm số tiền cọc người mượn phải khóa khi mượn -> giảm rào cản tham gia.
const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: { type: String, trim: true },
  // percent: giảm theo % cọc (có trần maxDiscount); fixed: giảm số tiền cố định
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  discountValue: { type: Number, required: true, min: 0 },
  maxDiscount: { type: Number, default: 0 },       // trần giảm khi theo %; 0 = không giới hạn
  minDeposit: { type: Number, default: 0 },         // cọc tối thiểu để áp dụng
  usageLimit: { type: Number, default: 0 },         // tổng số lượt dùng; 0 = không giới hạn
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Tính số tiền giảm cho một mức cọc cụ thể
voucherSchema.methods.computeDiscount = function (deposit) {
  if (this.discountType === 'fixed') {
    return Math.min(this.discountValue, deposit);
  }
  let d = Math.round((deposit * this.discountValue) / 100);
  if (this.maxDiscount && this.maxDiscount > 0) d = Math.min(d, this.maxDiscount);
  return Math.min(d, deposit);
};

module.exports = mongoose.model('Voucher', voucherSchema);
