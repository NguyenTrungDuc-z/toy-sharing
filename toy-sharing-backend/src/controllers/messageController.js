const mongoose = require('mongoose');
const Message = require('../models/Message');
const BorrowRequest = require('../models/BorrowRequest');
const { createNotification } = require('../services/notificationService');

// Kiểm tra người dùng có thuộc cuộc mượn này không (là owner hoặc borrower)
function getCounterpart(borrowRequest, userId) {
    const ownerId = borrowRequest.ownerId.toString();
    const borrowerId = borrowRequest.borrowerId.toString();
    if (ownerId === userId.toString()) return borrowerId;
    if (borrowerId === userId.toString()) return ownerId;
    return null;
}

// Lấy toàn bộ tin nhắn của 1 đơn mượn
exports.getMessages = async (req, res) => {
    try {
        const { borrowRequestId } = req.params;
        if (!mongoose.isValidObjectId(borrowRequestId)) {
            return res.status(400).json({ message: 'Mã đơn mượn không hợp lệ!' });
        }

        const borrowRequest = await BorrowRequest.findById(borrowRequestId);
        if (!borrowRequest) {
            return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });
        }

        const counterpart = getCounterpart(borrowRequest, req.userId);
        if (!counterpart) {
            return res.status(403).json({ message: 'Bạn không có quyền xem cuộc trò chuyện này!' });
        }

        const messages = await Message.find({ borrowRequestId })
            .populate('senderId', 'name avatar')
            .sort({ createdAt: 1 });

        // Đánh dấu các tin gửi tới mình là đã đọc
        await Message.updateMany(
            { borrowRequestId, receiverId: req.userId, isRead: false },
            { isRead: true }
        );

        res.json({ messages });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Gửi tin nhắn trong 1 đơn mượn
exports.sendMessage = async (req, res) => {
    try {
        const { borrowRequestId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống!' });
        }
        if (!mongoose.isValidObjectId(borrowRequestId)) {
            return res.status(400).json({ message: 'Mã đơn mượn không hợp lệ!' });
        }

        const borrowRequest = await BorrowRequest.findById(borrowRequestId);
        if (!borrowRequest) {
            return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });
        }

        const counterpart = getCounterpart(borrowRequest, req.userId);
        if (!counterpart) {
            return res.status(403).json({ message: 'Bạn không có quyền nhắn tin trong đơn mượn này!' });
        }

        const message = await Message.create({
            borrowRequestId,
            senderId: req.userId,
            receiverId: counterpart,
            content: content.trim()
        });

        const populated = await Message.findById(message._id).populate('senderId', 'name avatar');

        // Realtime: gửi tới người nhận
        const io = global._io;
        if (io) {
            io.to(`user:${counterpart}`).emit('message', populated);
        }

        // Thông báo
        await createNotification({
            userId: counterpart,
            type: 'new_message',
            title: 'Tin nhắn mới',
            message: `${populated.senderId.name}: ${content.trim().slice(0, 50)}`,
            link: 'requests',
            relatedId: borrowRequestId
        });

        res.status(201).json({ message: populated });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Đếm tổng tin nhắn chưa đọc
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({ receiverId: req.userId, isRead: false });
        res.json({ unreadCount: count });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
