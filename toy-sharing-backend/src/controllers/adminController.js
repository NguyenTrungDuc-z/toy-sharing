const User = require('../models/User');
const Toy = require('../models/Toy');
const BorrowRequest = require('../models/BorrowRequest');
const Report = require('../models/Report');
const { autoReturnOverdueBorrows } = require('../services/overdueService');

// 1. API LẤY SỐ LIỆU THỐNG KÊ ĐỘNG CHO DASHBOARD (/api/auth/admin/stats)
exports.getStats = async (req, res) => {
    try {
        await autoReturnOverdueBorrows();
        const totalUsers = await User.countDocuments();
        const totalToys = await Toy.countDocuments();
        const activeLoans = await BorrowRequest.countDocuments({ status: 'borrowing' });
        const pendingApprovals = await BorrowRequest.countDocuments({ status: 'pending' });

        const dynamicChartData = [
            Math.max(5, Math.round(totalToys * 0.2)),
            Math.max(15, Math.round(totalToys * 0.5)),
            Math.max(30, Math.round(totalToys * 0.7)),
            totalToys
        ];

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalToys,
                activeLoans,
                pendingApprovals,
                chartData: dynamicChartData
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tính toán số liệu thống kê thực tế',
            error: err.message
        });
    }
};

// 2. API THỐNG KÊ TỔNG QUAN HỆ THỐNG (/api/admin/stats)
exports.getOverviewStats = async (req, res) => {
    try {
        const totalToys = await Toy.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });
        const availableToys = await Toy.countDocuments({ status: 'available' });
        const borrowedToys = await Toy.countDocuments({ status: { $in: ['borrowed', 'unavailable'] } });

        res.status(200).json({
            totalToys,
            totalUsers,
            availableToys,
            borrowedToys
        });
    } catch (err) {
        res.status(500).json({
            message: "Lỗi hệ thống khi lấy số liệu thống kê quản trị",
            error: err.message
        });
    }
};

// 3. API PHÂN QUYỀN & THỐNG KÊ CHI TIẾT NGƯỜI DÙNG (/api/auth/admin/users)
exports.getUsers = async (req, res) => {
    try {
        const { search, role } = req.query;

        const adminsCount = await User.countDocuments({ role: 'admin' });
        const usersCount = await User.countDocuments({ role: 'user' });
        const pendingCount = await User.countDocuments({ status: 'pending' });
        const blockedCount = await User.countDocuments({ status: 'blocked' });

        let queryCondition = {};

        if (search) {
            queryCondition.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            queryCondition.role = role;
        }

        const userList = await User.find(queryCondition)
            .select('name email role status updatedAt phone avatar')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            stats: {
                admins: adminsCount,
                usersCount: usersCount,
                pending: pendingCount,
                blocked: blockedCount
            },
            users: userList
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi truy xuất danh sách phân quyền người dùng',
            error: err.message
        });
    }
};

// 4. API CẬP NHẬT VAI TRÒ HOẶC TRẠNG THÁI NGƯỜI DÙNG (/api/auth/admin/users/:userId)
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, status } = req.body;
        const updateFields = {};
        if (role) updateFields.role = role;
        if (status) updateFields.status = status;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu cập nhật (role/status)' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
        }

        res.status(200).json({ success: true, message: 'Cập nhật thành công!', user: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật người dùng', error: err.message });
    }
};

// 5. API LẤY DANH SÁCH ĐỒ CHƠI KIỂM DUYỆT THEO TAB (/api/auth/admin/toys)
exports.getToys = async (req, res) => {
    try {
        const { status, category } = req.query;

        // Thống kê số lượng tổng quan
        const pendingCount = await Toy.countDocuments({ status: 'pending' });
        const approvedTodayCount = await Toy.countDocuments({ status: { $in: ['approved', 'available'] } });
        const reportsCount = await Report.countDocuments({ status: { $in: ['open', 'processing'] } });

        // Xử lý riêng cho tab "ĐANG CHO MƯỢN"
        if (status === 'borrowed') {
            const activeRequests = await BorrowRequest.find({
                status: { $in: ['borrowed', 'borrowing'] }
            });

            const toyIds = activeRequests.map(reqItem => reqItem.toyId);

            let toyQuery = { _id: { $in: toyIds } };
            if (category && category !== 'all') {
                toyQuery.category = category;
            }

            const toyList = await Toy.find(toyQuery)
                .populate('ownerId', 'name email')
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                stats: { pending: pendingCount, approvedToday: approvedTodayCount, reports: reportsCount },
                toys: toyList
            });
        }

        // Xử lý cho các tab khác (pending, approved, rejected, etc.)
        let queryCondition = {};
        if (status) {
            if (status === 'approved') {
                queryCondition.status = { $in: ['approved', 'available'] };
            } else {
                queryCondition.status = status;
            }
        } else {
            queryCondition.status = 'pending';
        }

        if (category && category !== 'all') {
            queryCondition.category = category;
        }

        const toyList = await Toy.find(queryCondition)
            .populate('ownerId', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            stats: { pending: pendingCount, approvedToday: approvedTodayCount, reports: reportsCount },
            toys: toyList
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server kiểm duyệt đồ chơi', error: err.message });
    }
};

// 6. API DUYỆT / TỪ CHỐI BÀI ĐĂNG ĐỒ CHƠI (/api/auth/admin/toys/:id/status)
exports.updateToyStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected', 'available', 'unavailable'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ!' });
        }

        // Nếu admin duyệt (approved) thì chuyển luôn thành available để user khác có thể mượn
        const finalStatus = status === 'approved' ? 'available' : status;

        const updatedToy = await Toy.findByIdAndUpdate(
            req.params.id,
            { status: finalStatus },
            { new: true }
        );

        if (!updatedToy) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đồ chơi!' });
        }

        res.status(200).json({
            success: true,
            message: `Đã cập nhật trạng thái thành: ${status}`,
            toy: updatedToy
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái đồ chơi', error: err.message });
    }
};

// 7. API GỠ BỎ BÀI ĐĂNG ĐỒ CHƠI VI PHẠM (/api/admin/toys/:id)
exports.deleteToy = async (req, res) => {
    try {
        const deletedToy = await Toy.findByIdAndDelete(req.params.id);
        if (!deletedToy) {
            return res.status(404).json({ message: "Không tìm thấy đồ chơi yêu cầu gỡ bỏ." });
        }
        res.status(200).json({ message: "Admin đã gỡ bỏ bài đăng đồ chơi vi phạm thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống khi xóa bài đăng đồ chơi", error: err.message });
    }
};
