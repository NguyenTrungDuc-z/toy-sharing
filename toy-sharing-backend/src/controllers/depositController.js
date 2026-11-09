const mongoose = require('mongoose');
const BorrowRequest = require('../models/BorrowRequest');
const Toy = require('../models/Toy');
const { buildVietQRUrl, getAdminBankInfo } = require('../utils/vietqr');
const { createNotification } = require('../services/notificationService');

// ============ NGƯỜI MƯỢN ============

// Lấy mã VietQR để chuyển cọc vào tài khoản ADMIN (escrow)
exports.getDepositQR = async (req, res) => {
    try {
        const { borrowRequestId } = req.params;
        if (!mongoose.isValidObjectId(borrowRequestId)) {
            return res.status(400).json({ message: 'Mã đơn mượn không hợp lệ!' });
        }

        const request = await BorrowRequest.findById(borrowRequestId).populate('toyId', 'name');
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });

        if (request.borrowerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Chỉ người mượn mới xem được mã thanh toán cọc!' });
        }

        if (request.status !== 'approved') {
            return res.status(400).json({ message: 'Chỉ thanh toán cọc khi yêu cầu đã được duyệt!' });
        }

        const adminBank = getAdminBankInfo();
        if (!adminBank.configured) {
            return res.status(503).json({ message: 'Hệ thống chưa cấu hình tài khoản nhận cọc. Vui lòng liên hệ quản trị viên.' });
        }

        const amount = request.depositAmount || 0;
        const addInfo = `COC ${request._id}`;
        const qrUrl = buildVietQRUrl({
            bankId: adminBank.bankId,
            accountNo: adminBank.accountNo,
            accountName: adminBank.accountName,
            amount,
            addInfo
        });

        res.json({
            qrUrl,
            amount,
            addInfo,
            bank: { accountNo: adminBank.accountNo, accountName: adminBank.accountName },
            depositStatus: request.depositStatus
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Người mượn báo đã chuyển cọc -> chờ admin xác nhận
exports.reportPaid = async (req, res) => {
    try {
        const { borrowRequestId } = req.params;
        const request = await BorrowRequest.findById(borrowRequestId).populate('toyId', 'name');
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });

        if (request.borrowerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Chỉ người mượn mới được thao tác!' });
        }

        if (request.status !== 'approved') {
            return res.status(400).json({ message: 'Chỉ báo chuyển cọc khi yêu cầu đã được duyệt!' });
        }

        if (!['pending', 'awaiting_confirmation'].includes(request.depositStatus)) {
            return res.status(400).json({ message: 'Trạng thái cọc không hợp lệ để báo đã chuyển!' });
        }

        request.depositStatus = 'awaiting_confirmation';
        request.depositPaidReportedDate = new Date();
        await request.save();

        // Thông báo cho tất cả admin
        const User = require('../models/User');
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
            await createNotification({
                userId: admin._id,
                type: 'borrow_request',
                title: 'Cọc chờ xác nhận',
                message: `Người mượn báo đã chuyển cọc cho "${request.toyId?.name || 'đồ chơi'}". Vui lòng kiểm tra.`,
                link: 'admin-deposits',
                relatedId: request._id
            });
        }

        res.json({ message: 'Đã gửi báo cáo chuyển cọc! Chờ admin xác nhận.', data: request });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ============ CHỦ ĐỒ CHƠI ============

// Chủ báo cáo hư hỏng/mất mát để admin trừ cọc
exports.reportDamage = async (req, res) => {
    try {
        const { borrowRequestId } = req.params;
        const { amount, note } = req.body;

        const request = await BorrowRequest.findById(borrowRequestId).populate('toyId', 'name');
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });

        if (request.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Chỉ chủ đồ chơi mới được báo cáo hư hỏng!' });
        }

        if (!['borrowing', 'returned'].includes(request.status)) {
            return res.status(400).json({ message: 'Chỉ báo cáo hư hỏng khi đang mượn hoặc vừa trả!' });
        }

        const deposit = request.depositAmount || 0;
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0 || numAmount > deposit) {
            return res.status(400).json({ message: `Số tiền đền phải từ 1 đến ${deposit.toLocaleString()}đ (không vượt quá cọc)!` });
        }

        request.damageReported = true;
        request.damageAmountRequested = numAmount;
        request.damageNote = note ? note.trim() : '';
        await request.save();

        // Thông báo cho admin
        const User = require('../models/User');
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
            await createNotification({
                userId: admin._id,
                type: 'borrow_request',
                title: 'Báo cáo hư hỏng',
                message: `Chủ đồ chơi "${request.toyId?.name || ''}" yêu cầu trừ cọc ${numAmount.toLocaleString()}đ.`,
                link: 'admin-deposits',
                relatedId: request._id
            });
        }

        res.json({ message: 'Đã gửi báo cáo hư hỏng tới admin để xử lý trừ cọc.', data: request });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ============ ADMIN ============

// Danh sách cọc cần xử lý + đã xử lý
exports.listDeposits = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && status !== 'all') {
            filter.depositStatus = status;
        } else {
            // Mặc định chỉ hiển thị các đơn có liên quan đến cọc (đã báo chuyển trở lên)
            filter.depositStatus = { $in: ['awaiting_confirmation', 'held', 'refunded', 'partially_refunded'] };
        }

        const deposits = await BorrowRequest.find(filter)
            .populate('toyId', 'name images depositRequired')
            .populate('borrowerId', 'name email phone')
            .populate('ownerId', 'name email phone')
            .sort({ updatedAt: -1 })
            .limit(200);

        const stats = {
            awaiting: await BorrowRequest.countDocuments({ depositStatus: 'awaiting_confirmation' }),
            held: await BorrowRequest.countDocuments({ depositStatus: 'held' }),
            damageReported: await BorrowRequest.countDocuments({ damageReported: true, depositStatus: 'held' }),
            refunded: await BorrowRequest.countDocuments({ depositStatus: { $in: ['refunded', 'partially_refunded'] } })
        };

        res.json({ deposits, stats, adminBank: getAdminBankInfo() });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Admin xác nhận đã nhận cọc -> held
exports.confirmReceipt = async (req, res) => {
    try {
        const { borrowRequestId } = req.params;
        const request = await BorrowRequest.findById(borrowRequestId).populate('toyId', 'name');
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });

        if (request.depositStatus !== 'awaiting_confirmation') {
            return res.status(400).json({ message: 'Đơn này không ở trạng thái chờ xác nhận cọc!' });
        }
        if (request.status !== 'approved') {
            return res.status(400).json({ message: 'Chỉ xác nhận cọc khi yêu cầu đang ở trạng thái đã duyệt!' });
        }

        request.depositStatus = 'held';
        request.depositConfirmedDate = new Date();
        await request.save();

        await createNotification({
            userId: request.borrowerId,
            type: 'borrow_approved',
            title: 'Cọc đã được xác nhận',
            message: `Admin đã xác nhận giữ cọc cho "${request.toyId?.name || 'đồ chơi'}". Chủ đồ chơi sẽ giao đồ.`,
            link: 'requests',
            relatedId: request._id
        });
        await createNotification({
            userId: request.ownerId,
            type: 'borrow_approved',
            title: 'Cọc đã sẵn sàng',
            message: `Cọc cho "${request.toyId?.name || 'đồ chơi'}" đã được giữ. Bạn có thể giao đồ cho người mượn.`,
            link: 'requests',
            relatedId: request._id
        });

        res.json({ message: 'Đã xác nhận giữ cọc!', data: request });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Admin hoàn cọc đầy đủ cho người mượn -> refunded
exports.refundFull = async (req, res) => {
    try {
        const { borrowRequestId } = req.params;
        const request = await BorrowRequest.findById(borrowRequestId).populate('toyId', 'name');
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });

        if (request.depositStatus !== 'held') {
            return res.status(400).json({ message: 'Chỉ hoàn được cọc đang được giữ!' });
        }
        // Cho phép hoàn khi đã trả, hoặc khi đơn bị huỷ/từ chối mà cọc còn giữ.
        if (!['returned', 'rejected', 'cancelled', 'approved'].includes(request.status)) {
            return res.status(400).json({ message: 'Trạng thái đơn không hợp lệ để hoàn cọc!' });
        }

        const amount = request.depositAmount || 0;
        request.depositStatus = 'refunded';
        request.depositRefundAmount = amount;
        request.depositDeductAmount = 0;
        request.depositResolvedDate = new Date();
        request.depositResolveNote = 'Hoàn cọc đầy đủ';
        // Nếu đơn vẫn 'approved' (chủ chưa giao đồ) mà hoàn cọc -> huỷ đơn
        if (request.status === 'approved') {
            request.status = 'cancelled';
        }
        await request.save();

        await createNotification({
            userId: request.borrowerId,
            type: 'return_confirmed',
            title: 'Đã hoàn cọc',
            message: `Admin đã hoàn ${amount.toLocaleString()}đ tiền cọc "${request.toyId?.name || 'đồ chơi'}" cho bạn.`,
            link: 'requests',
            relatedId: request._id
        });

        res.json({ message: 'Đã hoàn cọc đầy đủ cho người mượn!', data: request });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Admin xử lý trừ cọc đền chủ + hoàn phần còn lại -> partially_refunded
exports.resolveDamage = async (req, res) => {
    try {
        const { borrowRequestId } = req.params;
        const { deductAmount, note } = req.body;

        const request = await BorrowRequest.findById(borrowRequestId).populate('toyId', 'name');
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn mượn!' });

        if (request.depositStatus !== 'held') {
            return res.status(400).json({ message: 'Chỉ xử lý được cọc đang được giữ!' });
        }
        if (request.status !== 'returned') {
            return res.status(400).json({ message: 'Chỉ trừ cọc đền bù sau khi đồ chơi đã được trả!' });
        }

        const deposit = request.depositAmount || 0;
        const deduct = Number(deductAmount);
        if (isNaN(deduct) || deduct < 0 || deduct > deposit) {
            return res.status(400).json({ message: `Số tiền trừ phải từ 0 đến ${deposit.toLocaleString()}đ!` });
        }

        const refund = deposit - deduct;
        request.depositStatus = 'partially_refunded';
        request.depositDeductAmount = deduct;
        request.depositRefundAmount = refund;
        request.depositResolveNote = note ? note.trim() : `Trừ ${deduct.toLocaleString()}đ đền chủ đồ chơi`;
        request.depositResolvedDate = new Date();
        await request.save();

        await createNotification({
            userId: request.ownerId,
            type: 'return_confirmed',
            title: 'Nhận tiền đền bù',
            message: `Admin đã trừ ${deduct.toLocaleString()}đ từ cọc để đền bù cho "${request.toyId?.name || 'đồ chơi'}".`,
            link: 'requests',
            relatedId: request._id
        });
        await createNotification({
            userId: request.borrowerId,
            type: 'return_confirmed',
            title: 'Hoàn cọc một phần',
            message: `Admin đã trừ ${deduct.toLocaleString()}đ tiền đền, hoàn lại ${refund.toLocaleString()}đ cho bạn.`,
            link: 'requests',
            relatedId: request._id
        });

        res.json({ message: `Đã trừ ${deduct.toLocaleString()}đ đền chủ, hoàn ${refund.toLocaleString()}đ cho người mượn.`, data: request });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
