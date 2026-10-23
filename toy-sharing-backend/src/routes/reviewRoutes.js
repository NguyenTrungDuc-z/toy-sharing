const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

// Lấy danh sách đánh giá của một món đồ chơi (Public)
router.get('/toy/:toyId', reviewController.getReviewsByToy);

// Lấy danh sách ID các đơn mượn mà user hiện tại đã đánh giá
router.get('/my-reviewed-requests', auth, reviewController.getMyReviewedRequests);

// Gửi đánh giá mới (Yêu cầu đăng nhập)
router.post('/', auth, reviewController.createReview);

// Xóa đánh giá (Người viết hoặc Admin)
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router;
