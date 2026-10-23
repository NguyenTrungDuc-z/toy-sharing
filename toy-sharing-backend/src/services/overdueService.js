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

    console.log(`[OVERDUE-CHECK] Phát hiện ${overdueRequests.length} lượt mượn quá hạn ngày trả bắt buộc. Đang tự động chuyển sang 'returned'...`);

    const updatedIds = [];
    for (const req of overdueRequests) {
      req.status = 'returned';
      req.returnDate = req.returnDate || now;
      req.depositStatus = 'refunded';
      req.returnStatus = 'overdue_returned';
      req.returnNote = req.returnNote 
        ? `${req.returnNote} | [Hệ thống]: Quá hạn ngày mượn, đã tự động chuyển sang Đã trả.`
        : 'Quá hạn ngày mượn bắt buộc trả đồ - Hệ thống đã tự động chuyển trạng thái thành Đã trả.';
      await req.save();

      // Cập nhật trạng thái đồ chơi trở lại 'available'
      if (req.toyId) {
        await Toy.findByIdAndUpdate(req.toyId, { status: 'available' });
      }

      updatedIds.push(req._id);
    }

    console.log(`[OVERDUE-CHECK] Thành công! Đã tự động chuyển ${updatedIds.length} lượt mượn quá hạn sang 'returned' và khôi phục đồ chơi về 'available'.`);
    return { count: updatedIds.length, updatedIds };
  } catch (error) {
    console.error('[OVERDUE-CHECK] Lỗi trong quá trình tự động cập nhật quá hạn:', error.message);
    return { count: 0, error: error.message };
  }
};

module.exports = {
  autoReturnOverdueBorrows
};
