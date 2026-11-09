const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

const adminOnly = (req, res, next) => {
    if (req.authenticatedUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập!' });
    }
    next();
};

// Tuyến đường thống kê tổng quan quản trị (/api/admin/stats)
router.get('/stats', auth, adminOnly, adminController.getOverviewStats);

// Tuyến đường gỡ bỏ bài đăng vi phạm (/api/admin/toys/:id)
router.delete('/toys/:id', auth, adminOnly, adminController.deleteToy);

module.exports = router;
