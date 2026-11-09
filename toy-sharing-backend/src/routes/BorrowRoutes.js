const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/BorrowController');
const auth = require('../middleware/auth');

router.post('/', auth, borrowController.createRequest);
router.get('/history', auth, borrowController.getBorrowHistory);

router.get('/my-borrows', auth, borrowController.getMyBorrows);
router.get('/incoming-requests', auth, borrowController.getIncomingRequests);
router.get('/user-history', auth, borrowController.getUserHistory);

router.patch('/:requestId/confirm-deposit', auth, borrowController.confirmDeposit);
router.patch('/:requestId/confirm-return', auth, borrowController.confirmReturnAndRefund);
router.patch('/:requestId/respond-claim', auth, borrowController.respondToDamageClaim);

router.put('/:requestId/approve', auth, borrowController.approveRequest);
router.put('/:requestId/reject', auth, borrowController.rejectRequest);
router.patch('/:requestId/cancel', auth, borrowController.cancelRequest);

router.patch('/:requestId/request-extension', auth, borrowController.requestExtension);
router.patch('/:requestId/approve-extension', auth, borrowController.approveExtension);
router.patch('/:requestId/reject-extension', auth, borrowController.rejectExtension);

router.patch('/:requestId/report-return', auth, borrowController.reportReturn);

router.all('/check-overdue', borrowController.checkOverdue);

module.exports = router;
