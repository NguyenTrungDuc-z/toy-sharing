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
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
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