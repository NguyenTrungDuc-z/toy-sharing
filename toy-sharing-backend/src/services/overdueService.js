const BorrowRequest = require('../models/BorrowRequest');
const Toy = require('../models/Toy');

/**
 * Tự động kiểm tra và chuyển các lượt mượn đã quá hạn thành "đã trả" (returned).
 * Yêu cầu: Quá hạn ngày mượn bắt buộc trả đồ -> Đồ mượn chuyển thành đã trả (returned),
 * và món đồ chơi được cập nhật về trạng thái sẵn sàng (available).
 */
const autoReturnOverdueBorrows = async () => {
  try {
    const now = new Date();

    // Tìm các yêu cầu đang mượn có hạn trả nhỏ hơn thời điểm hiện tại
    const overdueRequests = await BorrowRequest.find({
      status: 'borrowing',
      dueDate: { $lt: now }
    });

    if (!overdueRequests || overdueRequests.length === 0) {
      return { count: 0, updatedIds: [] };
    }

    console.log(`[OVERDUE-CHECK] Phát hiện ${overdueRequests.length} lượt mượn quá hạn. Đang xử lý...`);

    const { createNotification, notifyFavoriteAvailable } = require('./notificationService');
    const updatedIds = [];
    for (const req of overdueRequests) {
      const escrowHeld = req.depositStatus === 'held';
      const toy = req.toyId ? await Toy.findById(req.toyId) : null;
      const toyName = toy?.name || 'đồ chơi';

      if (escrowHeld) {
        // Có cọc đang giữ: KHÔNG tự trả. Đồ vẫn ở người mượn, chờ chủ xác nhận nhận lại
        // hoặc khai mất đồ. Chuyển trạng thái sang 'overdue', đồ chơi vẫn 'borrowed'.
        req.status = 'overdue';
        if (!req.returnNote || !req.returnNote.includes('Quá hạn')) {
          req.returnNote = req.returnNote
            ? `${req.returnNote} | [Hệ thống]: Quá hạn - chờ chủ xác nhận nhận lại đồ.`
            : 'Quá hạn - đồ chơi vẫn đang ở người mượn, chờ chủ xác nhận nhận lại hoặc khai mất đồ.';
        }
        await req.save();

        try {
          await createNotification({
            userId: req.borrowerId,
            type: 'overdue',
            title: 'Lượt mượn quá hạn',
            message: `Bạn đã QUÁ HẠN trả "${toyName}". Vui lòng trả đồ sớm, tiền cọc đang bị giữ.`,
            link: 'requests',
            relatedId: req._id
          });
          await createNotification({
            userId: req.ownerId,
            type: 'overdue',
            title: 'Đồ chơi quá hạn chưa trả',
            message: `"${toyName}" đã quá hạn. Khi nhận lại đồ, hãy bấm "Xác nhận nhận lại đồ"; nếu mất, khai báo để trừ cọc.`,
            link: 'requests',
            relatedId: req._id
          });
        } catch (notifyErr) {
          console.error('[OVERDUE-CHECK] Lỗi gửi thông báo:', notifyErr.message);
        }
      } else {
        // Không có cọc giữ: giữ hành vi cũ - tự động chuyển 'returned' và giải phóng đồ chơi
        req.status = 'returned';
        req.returnDate = req.returnDate || now;
        req.depositStatus = 'refunded';
        req.returnStatus = 'overdue_returned';
        req.returnNote = req.returnNote
          ? `${req.returnNote} | [Hệ thống]: Quá hạn, tự động chuyển sang Đã trả.`
          : 'Quá hạn ngày mượn - Hệ thống đã tự động chuyển trạng thái thành Đã trả.';
        await req.save();

        let overdueToy = null;
        if (req.toyId) {
          overdueToy = await Toy.findByIdAndUpdate(req.toyId, { status: 'available' }, { new: true });
        }
        try {
          await createNotification({
            userId: req.borrowerId,
            type: 'overdue',
            title: 'Lượt mượn quá hạn',
            message: `Lượt mượn "${toyName}" đã quá hạn và được tự động chuyển sang Đã trả.`,
            link: 'requests',
            relatedId: req._id
          });
          await createNotification({
            userId: req.ownerId,
            type: 'overdue',
            title: 'Đồ chơi quá hạn trả',
            message: `"${toyName}" quá hạn đã được hệ thống tự động thu hồi.`,
            link: 'requests',
            relatedId: req._id
          });
          if (overdueToy) await notifyFavoriteAvailable(overdueToy._id, toyName);
        } catch (notifyErr) {
          console.error('[OVERDUE-CHECK] Lỗi gửi thông báo:', notifyErr.message);
        }
      }

      updatedIds.push(req._id);
    }

    console.log(`[OVERDUE-CHECK] Đã xử lý ${updatedIds.length} lượt mượn quá hạn.`);
    return { count: updatedIds.length, updatedIds };
  } catch (error) {
    console.error('[OVERDUE-CHECK] Lỗi trong quá trình tự động cập nhật quá hạn:', error.message);
    return { count: 0, error: error.message };
  }
};

module.exports = {
  autoReturnOverdueBorrows
};
