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
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);