const mongoose = require('mongoose');
const User = require('../models/User');
const Toy = require('../models/Toy');
const Review = require('../models/Review');
const BorrowRequest = require('../models/BorrowRequest');

// Hồ sơ công khai của 1 người dùng: thông tin cơ bản + đồ chơi + đánh giá nhận được
exports.getPublicProfile = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Mã người dùng không hợp lệ!' });
        }

        const user = await User.findById(req.params.id).select('name avatar rating createdAt address');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });

        const toys = await Toy.find({
            ownerId: user._id,
            status: { $in: ['available', 'borrowed', 'unavailable'] }
        }).select('name images category ageRange depositRequired status rating location');

        const reviews = await Review.find({ targetOwnerId: user._id })
            .populate('reviewerId', 'name avatar')
            .populate('toyId', 'name')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ user, toys, reviews });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Thống kê cá nhân cho trang Profile (yêu cầu đăng nhập)
exports.getMyStats = async (req, res) => {
    try {
        const userId = req.userId;

        const totalLent = await BorrowRequest.countDocuments({
            ownerId: userId,
            status: { $in: ['borrowing', 'returned', 'overdue'] }
        });

        const borrowedRequests = await BorrowRequest.find({
            borrowerId: userId,
            status: { $in: ['returned', 'overdue'] }
        }).select('status returnStatus dueDate returnDate');

        const totalBorrowed = borrowedRequests.length;

        const activeBorrowing = await BorrowRequest.countDocuments({
            borrowerId: userId,
            status: 'borrowing'
        });

        let onTimeCount = 0;
        borrowedRequests.forEach(r => {
            if (r.status === 'returned' && r.returnStatus !== 'overdue_returned') onTimeCount++;
        });
        const onTimeRate = totalBorrowed > 0 ? Math.round((onTimeCount / totalBorrowed) * 100) : 100;

        const reviewsReceived = await Review.countDocuments({ targetOwnerId: userId });
        const totalToys = await Toy.countDocuments({ ownerId: userId });

        res.json({
            totalToys,
            totalLent,
            totalBorrowed,
            activeBorrowing,
            onTimeRate,
            reviewsReceived
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
