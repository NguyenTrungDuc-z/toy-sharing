const BorrowRequest = require('../models/BorrowRequest');
const Toy = require('../models/Toy');

/**
 * Tự động chuyển các lượt mượn ĐANG MƯỢN đã quá hạn sang trạng thái 'overdue'.
 *
 * LƯU Ý NGHIỆP VỤ: hệ thống KHÔNG tự coi là "đã trả", vì đồ chơi vẫn đang ở
 * người mượn cho tới khi chủ bấm "Xác nhận nhận lại đồ". Điều này áp dụng cho
 * CẢ đồ có cọc lẫn đồ miễn cọc — tránh tình trạng "báo đã trả nhưng đồ chưa về".
 * Việc giải phóng đồ chơi (available) + hoàn cọc chỉ xảy ra khi chủ xác nhận
 * nhận lại (confirmReturn), hoặc admin xử lý khiếu nại/mất đồ.
 */
const autoReturnOverdueBorrows = async () => {
  try {
    const now = new Date();

    const overdueRequests = await BorrowRequest.find({
      status: 'borrowing',
      dueDate: { $lt: now }
    });

    if (!overdueRequests || overdueRequests.length === 0) {
      return { count: 0, updatedIds: [] };
    }

    console.log(`[OVERDUE-CHECK] Phát hiện ${overdueRequests.length} lượt mượn quá hạn. Đang xử lý...`);

    const { createNotification } = require('./notificationService');
    const updatedIds = [];

    for (const req of overdueRequests) {
      const toy = req.toyId ? await Toy.findById(req.toyId) : null;
      const toyName = toy?.name || 'đồ chơi';

      // Chuyển sang 'overdue'; đồ chơi GIỮ NGUYÊN 'borrowed' (vẫn ở người mượn).
      req.status = 'overdue';
      if (!req.returnNote || !req.returnNote.includes('Quá hạn')) {
        req.returnNote = req.returnNote
          ? `${req.returnNote} | [Hệ thống]: Quá hạn - chờ chủ xác nhận nhận lại đồ.`
          : 'Quá hạn - đồ chơi vẫn đang ở người mượn, chờ chủ xác nhận nhận lại hoặc khai báo (hư hỏng/mất).';
      }
      await req.save();

      try {
        await createNotification({
          userId: req.borrowerId,
          type: 'overdue',
          title: 'Lượt mượn quá hạn',
          message: req.depositStatus === 'held'
            ? `Bạn đã QUÁ HẠN trả "${toyName}". Vui lòng trả đồ sớm, tiền cọc đang được giữ.`
            : `Bạn đã QUÁ HẠN trả "${toyName}". Vui lòng liên hệ chủ để trả đồ sớm.`,
          link: 'requests',
          relatedId: req._id
        });
        await createNotification({
          userId: req.ownerId,
          type: 'overdue',
          title: 'Đồ chơi quá hạn chưa trả',
          message: `"${toyName}" đã quá hạn. Khi nhận lại đồ, hãy bấm "Xác nhận nhận lại đồ"; nếu hư hỏng/mất, hãy khai báo để xử lý.`,
          link: 'requests',
          relatedId: req._id
        });
      } catch (notifyErr) {
        console.error('[OVERDUE-CHECK] Lỗi gửi thông báo:', notifyErr.message);
      }

      updatedIds.push(req._id);
    }

    console.log(`[OVERDUE-CHECK] Đã chuyển ${updatedIds.length} lượt mượn sang 'overdue'.`);
    return { count: updatedIds.length, updatedIds };
  } catch (error) {
    console.error('[OVERDUE-CHECK] Lỗi trong quá trình tự động cập nhật quá hạn:', error.message);
    return { count: 0, error: error.message };
  }
};

module.exports = {
  autoReturnOverdueBorrows
};
