const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
  toyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Toy', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'borrowing', 'returned', 'overdue', 'cancelled'],
    default: 'pending'
  },
  depositStatus: {
    type: String,
    enum: ['pending', 'awaiting_confirmation', 'paid', 'held', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  depositAmount: { type: Number, default: 0 },
  // Voucher giảm tiền cọc (thật): lưu mã + số tiền đã giảm so với cọc gốc của đồ chơi
  voucherCode: { type: String },
  voucherDiscount: { type: Number, default: 0 },
  depositPaidReportedDate: { type: Date },
  depositConfirmedDate: { type: Date },
  depositRefundAmount: { type: Number },
  depositDeductAmount: { type: Number },
  depositResolveNote: { type: String },
  depositResolvedDate: { type: Date },

  // Bằng chứng tình trạng đồ chơi
  handoverImages: [{ type: String }],   // ảnh lúc chủ giao đồ (trước)
  returnImages: [{ type: String }],     // ảnh lúc người mượn trả (sau)

  // Khiếu nại hư hỏng (dispute)
  damageClaimStatus: {
    type: String,
    enum: ['none', 'claimed', 'accepted', 'disputed', 'resolved'],
    default: 'none'
  },
  damageReported: { type: Boolean, default: false },
  damageNote: { type: String },
  damageAmountRequested: { type: Number },
  damageImages: [{ type: String }],       // ảnh hư hỏng do chủ cung cấp
  isLostClaim: { type: Boolean, default: false }, // khai báo mất đồ (không trả)
  damageClaimDate: { type: Date },
  borrowerDisputeNote: { type: String },
  borrowerDisputeImages: [{ type: String }],
  borrowerResponseDate: { type: Date },
  requestDate: { type: Date, default: Date.now },
  approvedDate: { type: Date },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  note: { type: String },
  extensionStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  extensionDueDate: { type: Date },
  extensionReason: { type: String },
  extensionRequestDate: { type: Date },
  returnStatus: {
    type: String,
    enum: ['none', 'reported_early', 'reported_on_time', 'overdue_returned'],
    default: 'none'
  },
  returnNote: { type: String },
  returnReportedDate: { type: Date },

  // Đã gửi nhắc "sắp đến hạn trả" hay chưa (tránh gửi lặp mỗi lần quét)
  dueSoonNotified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);