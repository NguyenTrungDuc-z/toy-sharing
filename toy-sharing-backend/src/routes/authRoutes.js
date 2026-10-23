const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// ==========================================
// 1. CÁC TUYẾN ĐƯỜNG XÁC THỰC & NGƯỜI DÙNG (Auth & User)
// ==========================================
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.get('/me/favorites', auth, authController.getFavorites);
router.put('/me', auth, authController.updateMe);
router.patch('/change-password', auth, authController.changePassword);
router.post('/logout', auth, authController.logout);

// ==========================================
// 2. CÁC TUYẾN ĐƯỜNG QUẢN TRỊ VIÊN (Admin)
// ==========================================
// Lấy số liệu thống kê động cho Dashboard
router.get('/admin/stats', adminController.getStats);

// Phân quyền & danh sách người dùng
router.get('/admin/users', adminController.getUsers);
router.put('/admin/users/:userId', adminController.updateUser);

// Kiểm duyệt bài đăng đồ chơi
router.get('/admin/toys', adminController.getToys);
router.put('/admin/toys/:id/status', adminController.updateToyStatus);

module.exports = router;
