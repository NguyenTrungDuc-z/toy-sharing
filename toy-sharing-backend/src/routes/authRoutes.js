const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Toy = require('../models/Toy');       
const BorrowRequest = require('../models/BorrowRequest'); 
const jwt = require('jsonwebtoken');

// ==========================================
// 1. API ĐĂNG KÝ (Register)
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body; 
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được đăng ký sử dụng!' });
        }

        const newUser = new User({ 
            name, 
            email, 
            passwordHash: password, 
            phone,                  
            address: "",            
            avatar: "",
            role: "user" 
        });
        
        await newUser.save();
        res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đăng ký', error: err.message });
    }
});

// ==========================================
// 2. API ĐĂNG NHẬP (Login)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user || user.passwordHash !== password) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'toyshare_secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role || 'user' 
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: err.message });
    }
});

// ==========================================
// 3. API LẤY SỐ LIỆU THỐNG KÊ ĐỘNG CHO DASHBOARD
// ==========================================
router.get('/admin/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalToys = await Toy.countDocuments();
        const activeLoans = await BorrowRequest.countDocuments({ status: 'borrowing' }); // 🔥 Đổi từ 'approved' thành 'borrowing' theo dữ liệu DB thực tế
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
});

// ==========================================
// 4. API PHÂN QUYỀN & THỐNG KÊ CHI TIẾT NGƯỜI DÙNG
// ==========================================
router.get('/admin/users', async (req, res) => {
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
});

// ==========================================
// 5. API ADMIN: DUYỆT / TỪ CHỐI BÀI ĐĂNG ĐỒ CHƠI
// ==========================================
router.put('/admin/toys/:id/status', async (req, res) => {
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

        res.status(200).json({ success: true, message: `Đã cập nhật trạng thái thành: ${status}`, toy: updatedToy });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái đồ chơi', error: err.message });
    }
});

// ==========================================
// 6. API: LẤY DANH SÁCH ĐỒ CHƠI ĐÃ NÂNG CẤP (KHÔNG LO TRỐNG TAB)
// ==========================================
router.get('/admin/toys', async (req, res) => {
    try {
        const { status, category } = req.query;

        // Thống kê số lượng tổng quan
        const pendingCount = await Toy.countDocuments({ status: 'pending' });
        const approvedTodayCount = await Toy.countDocuments({ status: { $in: ['approved', 'available'] } });
        const reportsCount = await Toy.countDocuments({ isReported: true }); 

        // 🌟 XỬ LÝ RIÊNG CHO TAB "ĐANG CHO MƯỢN"
        if (status === 'borrowed') {
            // Bước 1: Tìm tất cả các giao dịch đang mượn thực tế từ bảng borrowrequests
            const activeRequests = await BorrowRequest.find({ 
                status: { $in: ['borrowed', 'borrowing'] } 
            });

            // Lấy ra danh sách ID của các món đồ chơi đang được mượn
            const toyIds = activeRequests.map(req => req.toyId);

            // Bước 2: Truy vấn thông tin chi tiết các đồ chơi đó từ bảng Toy
            let toyQuery = { _id: { $in: toyIds } };
            if (category && category !== 'all') {
                toyQuery.category = category;
            }

            const toyList = await Toy.find(toyQuery)
                                     .populate('ownerId', 'name email')
                                     .sort({ createdAt: -1 });

            // Trả về mảng đồ chơi đang mượn cho Frontend
            return res.status(200).json({
                success: true,
                stats: { pending: pendingCount, approvedToday: approvedTodayCount, reports: reportsCount },
                toys: toyList
            });
        }

        // 🌟 XỬ LÝ CHO CÁC TAB KHÁC (Chờ duyệt, Sẵn sàng, Bị từ chối)
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
});
/**
 * 7. API ADMIN: CẬP NHẬT VAI TRÒ HOẶC TRẠNG THÁI NGƯỜI DÙNG
 * PUT /api/auth/admin/users/:userId
 */
router.put('/admin/users/:userId', async (req, res) => {
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
});

module.exports = router;
