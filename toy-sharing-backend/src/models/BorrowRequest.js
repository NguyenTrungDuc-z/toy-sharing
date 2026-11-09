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
  depositPaidReportedDate: { type: Date },
  depositConfirmedDate: { type: Date },
  depositRefundAmount: { type: Number },
  depositDeductAmount: { type: Number },
  depositResolveNote: { type: String },
  depositResolvedDate: { type: Date },
  damageReported: { type: Boolean, default: false },
  damageNote: { type: String },
  damageAmountRequested: { type: Number },
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
  returnReportedDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);