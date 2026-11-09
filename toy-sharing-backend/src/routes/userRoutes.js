const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Thống kê cá nhân (đặt trước /:id để không bị bắt nhầm)
router.get('/me/stats', auth, userController.getMyStats);

// Hồ sơ công khai của 1 người dùng
router.get('/:id', userController.getPublicProfile);

module.exports = router;
