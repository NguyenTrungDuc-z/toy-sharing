const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['borrow_request', 'borrow_approved', 'borrow_rejected', 'borrow_cancelled',
           'extension_request', 'extension_approved', 'extension_rejected',
           'return_reported', 'return_confirmed', 'overdue', 'toy_moderated',
           'favorite_available', 'new_message', 'new_review'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
