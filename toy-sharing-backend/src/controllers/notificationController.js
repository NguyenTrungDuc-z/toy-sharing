const Notification = require('../models/Notification');

// Lấy danh sách thông báo của người dùng hiện tại
exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({ userId: req.userId, isRead: false });
        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Đánh dấu 1 thông báo đã đọc
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Không tìm thấy thông báo!' });
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Đánh dấu tất cả đã đọc
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.userId, isRead: false }, { isRead: true });
        res.json({ message: 'Đã đánh dấu tất cả là đã đọc.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
