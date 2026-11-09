const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const auth = require('../middleware/auth');

const adminOnly = (req, res, next) => {
    if (req.authenticatedUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập!' });
    }
    next();
};

// Người mượn
router.get('/:borrowRequestId/qr', auth, depositController.getDepositQR);
router.post('/:borrowRequestId/report-paid', auth, depositController.reportPaid);

// Admin
router.get('/admin/all', auth, adminOnly, depositController.listDeposits);
router.post('/admin/:borrowRequestId/confirm', auth, adminOnly, depositController.confirmReceipt);
router.post('/admin/:borrowRequestId/refund', auth, adminOnly, depositController.refundFull);
router.post('/admin/:borrowRequestId/resolve-damage', auth, adminOnly, depositController.resolveDamage);

module.exports = router;
