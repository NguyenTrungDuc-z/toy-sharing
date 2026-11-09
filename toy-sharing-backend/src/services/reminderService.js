const BorrowRequest = require('../models/BorrowRequest');

/**
 * Quét các lượt đang mượn sắp đến hạn trả (trong vòng REMIND_BEFORE_HOURS tới)
 * và gửi 1 lần thông báo in-app + email nhắc người mượn. Dùng cờ dueSoonNotified
 * để không gửi lặp ở các lần quét sau.
 */
const REMIND_BEFORE_HOURS = Number(process.env.DUE_SOON_HOURS) || 24;

const remindDueSoonBorrows = async () => {
    try {
        const now = new Date();
        const threshold = new Date(now.getTime() + REMIND_BEFORE_HOURS * 3600 * 1000);

        const dueSoon = await BorrowRequest.find({
            status: 'borrowing',
            dueSoonNotified: { $ne: true },
            dueDate: { $gt: now, $lte: threshold }
        })
            .populate('toyId', 'name')
            .populate('borrowerId', 'name email');

        if (!dueSoon.length) return { count: 0 };

        const { createNotification } = require('./notificationService');
        const { sendGenericEmail } = require('./emailService');

        for (const req of dueSoon) {
            const toyName = req.toyId?.name || 'đồ chơi';
            const dueStr = new Date(req.dueDate).toLocaleDateString('vi-VN');

            await createNotification({
                userId: req.borrowerId?._id || req.borrowerId,
                type: 'due_soon',
                title: 'Sắp đến hạn trả đồ',
                message: `"${toyName}" sẽ đến hạn trả vào ${dueStr}. Hãy chuẩn bị trả đúng hạn để được hoàn cọc đầy đủ.`,
                link: 'requests',
                relatedId: req._id
            });

            if (req.borrowerId?.email) {
                await sendGenericEmail({
                    to: req.borrowerId.email,
                    userName: req.borrowerId.name,
                    subject: `[ToyShare] Sắp đến hạn trả "${toyName}"`,
                    heading: 'Nhắc lịch trả đồ chơi',
                    lines: [
                        `Lượt mượn <strong>"${toyName}"</strong> của bạn sẽ đến hạn trả vào <strong>${dueStr}</strong>.`,
                        'Vui lòng trả đồ đúng hạn để được hoàn lại tiền cọc đầy đủ. Nếu cần thêm thời gian, bạn có thể gửi yêu cầu mượn thêm trong ứng dụng.'
                    ],
                    actionUrl: process.env.CLIENT_URL || 'http://localhost:5173',
                    actionText: 'Mở ToyShare'
                });
            }

            req.dueSoonNotified = true;
            await req.save();
        }

        console.log(`[DUE-SOON] Đã nhắc ${dueSoon.length} lượt mượn sắp đến hạn.`);
        return { count: dueSoon.length };
    } catch (error) {
        console.error('[DUE-SOON] Lỗi khi nhắc hạn trả:', error.message);
        return { count: 0, error: error.message };
    }
};

module.exports = { remindDueSoonBorrows };
