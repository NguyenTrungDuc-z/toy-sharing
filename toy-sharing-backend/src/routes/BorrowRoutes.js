const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');

// Route tạo request mượn và lấy lịch sử
router.post('/', borrowController.createRequest);
router.get('/history', borrowController.getBorrowHistory);

// 🔥 BỔ SUNG 2 ROUTE MỚI: Phục vụ riêng cho giao diện 2 Tab của trang "Quản lý yêu cầu"
router.get('/my-borrows', borrowController.getMyBorrows);          // Tab 1: Tôi đi mượn
router.get('/incoming-requests', borrowController.getIncomingRequests); // Tab 2: Yêu cầu gửi tới tôi
router.get('/user-history', borrowController.getUserHistory);           // Tab 3: Lịch sử hoàn tất

// Route xử lý trạng thái cọc tiền và trả đồ
router.patch('/:requestId/confirm-deposit', borrowController.confirmDeposit);
router.patch('/:requestId/confirm-return', borrowController.confirmReturnAndRefund);

// 🔥 ROUTE BỔ SUNG: Duyệt & Từ chối yêu cầu mượn (cho chủ đồ chơi)
router.put('/:requestId/approve', borrowController.approveRequest);
router.put('/:requestId/reject', borrowController.rejectRequest);

module.exports = router;