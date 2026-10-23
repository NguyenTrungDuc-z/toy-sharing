const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Middleware xác thực quyền quản trị cho toàn bộ các route report
router.use(auth, async (req, res, next) => {
    try {
        if (req.authenticatedUser?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xác thực quyền quản trị', error: error.message });
    }
});

// Lấy danh sách báo cáo
router.get('/', reportController.getAllReports);

// Cập nhật trạng thái và ghi chú xử lý báo cáo
router.patch('/:id', reportController.updateReport);

module.exports = router;