const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Tuyến đường thống kê tổng quan quản trị (/api/admin/stats)
router.get('/stats', adminController.getOverviewStats);

// Tuyến đường gỡ bỏ bài đăng vi phạm (/api/admin/toys/:id)
router.delete('/toys/:id', adminController.deleteToy);

module.exports = router;
