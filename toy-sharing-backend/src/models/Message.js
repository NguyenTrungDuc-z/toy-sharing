const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  borrowRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRequest', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
