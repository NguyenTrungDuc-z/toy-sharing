const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const voucherController = require('../controllers/voucherController');

const adminOnly = (req, res, next) => {
    if (req.authenticatedUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập!' });
    }
    next();
};

// Người mượn: xem trước & áp dụng voucher vào đơn mượn
router.post('/preview/:borrowRequestId', auth, voucherController.previewVoucher);
router.post('/apply/:borrowRequestId', auth, voucherController.applyVoucher);

// Admin: quản lý voucher
router.get('/', auth, adminOnly, voucherController.listVouchers);
router.post('/', auth, adminOnly, voucherController.createVoucher);
router.patch('/:id', auth, adminOnly, voucherController.updateVoucher);
router.delete('/:id', auth, adminOnly, voucherController.deleteVoucher);

module.exports = router;
