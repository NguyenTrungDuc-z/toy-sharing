const BorrowRequest = require('../models/BorrowRequest');
const Toy = require('../models/Toy');
const User = require('../models/User');
const mongoose = require('mongoose');
const { autoReturnOverdueBorrows } = require('../services/overdueService');
const { createNotification, notifyFavoriteAvailable } = require('../services/notificationService');

const getCurrentUserId = (req) => req.userId;

const assertOwner = (toy, userId) => {
  const ownerId = typeof toy.ownerId === 'object' ? toy.ownerId._id || toy.ownerId : toy.ownerId;
  return ownerId.toString() === userId.toString();
};

// 1. NGƯỜI MƯỢN: Gửi yêu cầu mượn đồ chơi
exports.createRequest = async (req, res) => {
  try {
    const { toyId, dueDate, note } = req.body;
    const borrowerId = req.userId;

    if (!borrowerId) {
      return res.status(400).json({ message: 'Vui lòng đăng nhập!' });
    }

    if (!toyId) {
      return res.status(400).json({ message: 'Thiếu toyId' });
    }

    if (!dueDate) {
      return res.status(400).json({ message: 'Thiếu dueDate' });
    }

    const toy = await Toy.findById(toyId);
    if (!toy) {
      return res.status(404).json({ message: 'Không tìm thấy đồ chơi!' });
    }

    if (toy.status !== 'available') {
      return res.status(400).json({ message: 'Món đồ chơi này hiện tại không sẵn sàng để mượn!' });
    }

    if (assertOwner(toy, borrowerId)) {
      return res.status(400).json({ message: 'Bạn không thể mượn đồ chơi của chính mình!' });
    }

    const existingPending = await BorrowRequest.findOne({
      toyId, borrowerId, status: 'pending'
    });
    if (existingPending) {
      return res.status(400).json({ message: 'Bạn đã có yêu cầu mượn đang chờ duyệt cho đồ chơi này!' });
    }

    const newRequest = await BorrowRequest.create({
      toyId: toyId,
      ownerId: toy.ownerId,
      borrowerId: borrowerId,
      dueDate,
      note,
      status: 'pending',
      depositStatus: 'pending',
      depositAmount: toy.depositRequired || 0,
      requestDate: new Date(),
    });

    await createNotification({
      userId: toy.ownerId,
      type: 'borrow_request',
      title: 'Yêu cầu mượn mới',
      message: `Có người muốn mượn "${toy.name}" của bạn.`,
      link: 'requests',
      relatedId: newRequest._id
    });

    res.status(201).json({ message: 'Gửi yêu cầu mượn thành công!', data: newRequest });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 2. CHỦ ĐỒ CHƠI: Xác nhận giao đồ & bắt đầu lượt mượn (sau khi admin đã giữ cọc)
exports.confirmDeposit = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    const toy = await Toy.findById(request.toyId);
    if (!toy) {
      return res.status(404).json({ message: 'Không tìm thấy đồ chơi!' });
    }

    const currentUserId = getCurrentUserId(req);
    if (!currentUserId || !assertOwner(toy, currentUserId)) {
      return res.status(403).json({ message: 'Chỉ chủ đồ chơi mới được duyệt yêu cầu này!' });
    }

    if (request.status !== 'approved' && request.status !== 'pending') {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ để giao đồ!' });
    }

    // Escrow: chỉ cho giao đồ khi admin đã xác nhận giữ cọc.
    // Giữ tương thích với dữ liệu cũ (depositStatus 'paid').
    const hasDeposit = (toy.depositRequired || 0) > 0;
    if (hasDeposit && !['held', 'paid'].includes(request.depositStatus)) {
      return res.status(400).json({ message: 'Admin chưa xác nhận giữ cọc. Vui lòng chờ xác nhận cọc trước khi giao đồ!' });
    }

    request.status = 'borrowing';
    request.approvedDate = request.approvedDate || new Date();
    await request.save();

    // Cập nhật trạng thái toy thành 'borrowed'
    const updatedToy = await Toy.findByIdAndUpdate(
      request.toyId,
      { status: 'borrowed' },
      { new: true }
    );

    await createNotification({
      userId: request.borrowerId,
      type: 'borrow_approved',
      title: 'Bắt đầu lượt mượn',
      message: `Chủ đồ chơi đã giao "${toy.name}". Lượt mượn bắt đầu!`,
      link: 'requests',
      relatedId: request._id
    });

    res.status(200).json({ message: 'Đã xác nhận giao đồ! Quá trình mượn bắt đầu.', data: request });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 3. CHỦ ĐỒ CHƠI: Xác nhận đã nhận lại đồ & Hoàn cọc (Kết thúc lượt mượn)
exports.confirmReturnAndRefund = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    const toy = await Toy.findById(request.toyId);
    if (!toy) {
      return res.status(404).json({ message: 'Không tìm thấy đồ chơi!' });
    }

    const currentUserId = getCurrentUserId(req);
    if (!currentUserId || !assertOwner(toy, currentUserId)) {
      return res.status(403).json({ message: 'Chỉ chủ đồ chơi mới được xác nhận trả đồ!' });
    }

    if (request.status !== 'borrowing') {
      return res.status(400).json({ message: 'Yêu cầu này không ở trạng thái đang mượn!' });
    }

    request.status = 'returned';
    request.returnDate = new Date();
    // Escrow: nếu admin đang giữ cọc ('held'), KHÔNG tự hoàn — admin sẽ xử lý hoàn/trừ.
    // Dữ liệu cũ (chưa escrow) thì giữ hành vi cũ: tự đánh dấu đã hoàn.
    const escrowHeld = request.depositStatus === 'held';
    if (!escrowHeld) {
      request.depositStatus = 'refunded';
    }
    await request.save();

    // Cập nhật trạng thái toy thành 'available'
    const updatedToy = await Toy.findByIdAndUpdate(
      request.toyId,
      { status: 'available' },
      { new: true }
    );

    await createNotification({
      userId: request.borrowerId,
      type: 'return_confirmed',
      title: 'Đã hoàn tất trả đồ',
      message: escrowHeld
        ? `Chủ đồ chơi đã nhận lại "${toy.name}". Admin sẽ xử lý hoàn cọc cho bạn. Hãy để lại đánh giá nhé!`
        : `Chủ đồ chơi đã xác nhận nhận lại "${toy.name}" và hoàn cọc. Hãy để lại đánh giá nhé!`,
      link: 'requests',
      relatedId: request._id
    });
    await notifyFavoriteAvailable(request.toyId, toy.name);

    // Nếu admin đang giữ cọc, nhắc admin xử lý hoàn cọc
    if (escrowHeld) {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          type: 'return_confirmed',
          title: 'Cọc chờ hoàn trả',
          message: `"${toy.name}" đã được trả. Vui lòng xử lý hoàn cọc cho người mượn.`,
          link: 'admin-deposits',
          relatedId: request._id
        });
      }
    }

    res.status(200).json({ message: escrowHeld ? 'Đã nhận lại đồ chơi! Admin sẽ xử lý hoàn cọc.' : 'Đã nhận lại đồ chơi và hoàn cọc thành công!', data: request });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 4. CHUNG: Lấy lịch sử mượn đồ
exports.getBorrowHistory = async (req, res) => {
  try {
    // Tự động chuyển các lượt mượn quá hạn thành 'returned'
    await autoReturnOverdueBorrows();

    const history = await BorrowRequest.find()
      .populate('toyId', 'name description ageRange depositRequired ownerId status')
      .populate('borrowerId', 'name email phone')
      .populate('ownerId', 'name email phone');

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 5. TAB 1: Lấy danh sách tôi đi mượn
exports.getMyBorrows = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Cần cung cấp userId' });
    }

    // Tự động chuyển các lượt mượn quá hạn thành 'returned'
    await autoReturnOverdueBorrows();

    const requests = await BorrowRequest.find({ borrowerId: userId })
      .populate({
        path: 'toyId',
        select: 'name images ownerId depositRequired status',
        populate: { path: 'ownerId', select: 'name email' },
      })
      .populate('borrowerId', 'name email');

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách tôi đi mượn!', error: error.message });
  }
};

// 6. TAB 2: Lấy danh sách yêu cầu gửi tới tôi
exports.getIncomingRequests = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Cần cung cấp userId' });
    }

    // Tự động chuyển các lượt mượn quá hạn thành 'returned'
    await autoReturnOverdueBorrows();

    const requests = await BorrowRequest.find({ ownerId: userId })
      .populate({
        path: 'toyId',
        select: 'name images ownerId depositRequired status',
      })
      .populate('borrowerId', 'name email');

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy yêu cầu gửi tới tôi!', error: error.message });
  }
};

// 7. CHỦ ĐỒ CHƠI: Duyệt yêu cầu mượn
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    const toy = await Toy.findById(request.toyId);
    if (!toy) {
      return res.status(404).json({ message: 'Không tìm thấy đồ chơi!' });
    }

    const currentUserId = getCurrentUserId(req);
    if (!currentUserId || !assertOwner(toy, currentUserId)) {
      return res.status(403).json({ message: 'Chỉ chủ đồ chơi mới được duyệt yêu cầu này!' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể duyệt yêu cầu ở trạng thái pending!' });
    }

    request.status = 'approved';
    request.approvedDate = new Date();
    await request.save();

    const autoRejected = await BorrowRequest.find(
      { toyId: request.toyId, _id: { $ne: request._id }, status: 'pending' }
    ).select('borrowerId');
    await BorrowRequest.updateMany(
      { toyId: request.toyId, _id: { $ne: request._id }, status: 'pending' },
      { status: 'rejected' }
    );

    await createNotification({
      userId: request.borrowerId,
      type: 'borrow_approved',
      title: 'Yêu cầu được duyệt',
      message: `Chủ đồ chơi đã duyệt yêu cầu mượn "${toy.name}". Vui lòng liên hệ để nhận đồ.`,
      link: 'requests',
      relatedId: request._id
    });
    for (const rejected of autoRejected) {
      await createNotification({
        userId: rejected.borrowerId,
        type: 'borrow_rejected',
        title: 'Yêu cầu bị từ chối',
        message: `Rất tiếc, "${toy.name}" đã được cho người khác mượn.`,
        link: 'requests',
        relatedId: request._id
      });
    }

    res.status(200).json({ message: 'Đã duyệt yêu cầu mượn!', data: request });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 8. CHỦ ĐỒ CHƠI: Từ chối yêu cầu mượn
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    const toy = await Toy.findById(request.toyId);
    if (!toy) {
      return res.status(404).json({ message: 'Không tìm thấy đồ chơi!' });
    }

    const currentUserId = getCurrentUserId(req);
    if (!currentUserId || !assertOwner(toy, currentUserId)) {
      return res.status(403).json({ message: 'Chỉ chủ đồ chơi mới được từ chối yêu cầu này!' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối yêu cầu ở trạng thái pending!' });
    }

    request.status = 'rejected';
    await request.save();

    await createNotification({
      userId: request.borrowerId,
      type: 'borrow_rejected',
      title: 'Yêu cầu bị từ chối',
      message: `Chủ đồ chơi đã từ chối yêu cầu mượn "${toy.name}".`,
      link: 'requests',
      relatedId: request._id
    });

    res.status(200).json({ message: 'Đã từ chối yêu cầu mượn!', data: request });
  } catch (error) {
    console.error('Lỗi khi từ chối yêu cầu:', error);
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 8b. NGƯỜI MƯỢN: Huỷ yêu cầu mượn (chỉ khi pending)
exports.cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = getCurrentUserId(req);

    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    if (request.borrowerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ người gửi yêu cầu mới được huỷ!' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể huỷ yêu cầu đang ở trạng thái chờ duyệt!' });
    }

    request.status = 'cancelled';
    await request.save();

    const cancelledToy = await Toy.findById(request.toyId).select('name');
    await createNotification({
      userId: request.ownerId,
      type: 'borrow_cancelled',
      title: 'Yêu cầu bị huỷ',
      message: `Người mượn đã huỷ yêu cầu mượn "${cancelledToy?.name || 'đồ chơi'}".`,
      link: 'requests',
      relatedId: request._id
    });

    res.status(200).json({ message: 'Đã huỷ yêu cầu mượn!', data: request });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 9. LẤY LỊCH SỬ THUÊ/CHO THUÊ ĐÃ HOÀN TẤT CỦA USER
exports.getUserHistory = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Cần cung cấp userId' });
    }

    // Tự động chuyển các lượt mượn quá hạn thành 'returned'
    await autoReturnOverdueBorrows();

    const history = await BorrowRequest.find({
      $or: [{ borrowerId: userId }, { ownerId: userId }],
      status: { $in: ['returned', 'rejected', 'cancelled'] }
    })
      .populate({
        path: 'toyId',
        select: 'name images ownerId depositRequired status',
        populate: { path: 'ownerId', select: 'name email' },
      })
      .populate('borrowerId', 'name email')
      .populate('ownerId', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json(history);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử người dùng:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử!', error: error.message });
  }
};

// 10. NGƯỜI MƯỢN: Gửi yêu cầu gia hạn / mượn thêm thời gian
exports.requestExtension = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { newDueDate, reason } = req.body;
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(400).json({ message: 'Cần cung cấp userId đăng nhập!' });
    }

    const borrowRequest = await BorrowRequest.findById(requestId);
    if (!borrowRequest) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    if (borrowRequest.borrowerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ người đang mượn mới được yêu cầu gia hạn!' });
    }

    if (borrowRequest.status !== 'borrowing') {
      return res.status(400).json({ message: 'Chỉ có thể xin mượn thêm khi đồ chơi đang trong trạng thái mượn!' });
    }

    if (borrowRequest.extensionStatus === 'pending') {
      return res.status(400).json({ message: 'Bạn đã có yêu cầu gia hạn đang chờ chủ đồ chơi phản hồi!' });
    }

    if (!newDueDate) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày gia hạn mới!' });
    }

    const newDate = new Date(newDueDate);
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ message: 'Ngày gia hạn không hợp lệ!' });
    }

    if (newDate <= new Date(borrowRequest.dueDate)) {
      return res.status(400).json({ message: 'Ngày gia hạn mới phải sau ngày hạn trả hiện tại!' });
    }

    borrowRequest.extensionStatus = 'pending';
    borrowRequest.extensionDueDate = newDate;
    borrowRequest.extensionReason = reason ? reason.trim() : '';
    borrowRequest.extensionRequestDate = new Date();
    await borrowRequest.save();

    const extToy = await Toy.findById(borrowRequest.toyId).select('name');
    await createNotification({
      userId: borrowRequest.ownerId,
      type: 'extension_request',
      title: 'Yêu cầu gia hạn',
      message: `Người mượn muốn gia hạn "${extToy?.name || 'đồ chơi'}".`,
      link: 'requests',
      relatedId: borrowRequest._id
    });

    res.status(200).json({
      message: 'Gửi yêu cầu mượn thêm thành công! Vui lòng chờ chủ đồ duyệt.',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Lỗi khi xin gia hạn:', error);
    res.status(500).json({ message: 'Lỗi server khi xin gia hạn!', error: error.message });
  }
};

// 11. CHỦ ĐỒ CHƠI: Đồng ý cho người mượn gia hạn thêm
exports.approveExtension = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = getCurrentUserId(req);

    const borrowRequest = await BorrowRequest.findById(requestId);
    if (!borrowRequest) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    if (borrowRequest.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ chủ đồ chơi mới có quyền duyệt gia hạn!' });
    }

    if (borrowRequest.extensionStatus !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu này không có đề nghị gia hạn nào đang chờ duyệt!' });
    }

    // Cập nhật ngày hạn trả chính thức thành ngày gia hạn mới
    borrowRequest.dueDate = borrowRequest.extensionDueDate;
    borrowRequest.extensionStatus = 'approved';
    await borrowRequest.save();

    const apprExtToy = await Toy.findById(borrowRequest.toyId).select('name');
    await createNotification({
      userId: borrowRequest.borrowerId,
      type: 'extension_approved',
      title: 'Gia hạn được chấp thuận',
      message: `Chủ đồ chơi đã đồng ý gia hạn "${apprExtToy?.name || 'đồ chơi'}".`,
      link: 'requests',
      relatedId: borrowRequest._id
    });

    res.status(200).json({
      message: 'Đã chấp thuận gia hạn mượn đồ chơi!',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Lỗi khi duyệt gia hạn:', error);
    res.status(500).json({ message: 'Lỗi server khi duyệt gia hạn!', error: error.message });
  }
};

// 12. CHỦ ĐỒ CHƠI: Từ chối yêu cầu gia hạn thêm
exports.rejectExtension = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = getCurrentUserId(req);

    const borrowRequest = await BorrowRequest.findById(requestId);
    if (!borrowRequest) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    if (borrowRequest.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ chủ đồ chơi mới có quyền từ chối gia hạn!' });
    }

    if (borrowRequest.extensionStatus !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu này không có đề nghị gia hạn nào đang chờ duyệt!' });
    }

    borrowRequest.extensionStatus = 'rejected';
    await borrowRequest.save();

    const rejExtToy = await Toy.findById(borrowRequest.toyId).select('name');
    await createNotification({
      userId: borrowRequest.borrowerId,
      type: 'extension_rejected',
      title: 'Gia hạn bị từ chối',
      message: `Chủ đồ chơi đã từ chối gia hạn "${rejExtToy?.name || 'đồ chơi'}".`,
      link: 'requests',
      relatedId: borrowRequest._id
    });

    res.status(200).json({
      message: 'Đã từ chối yêu cầu gia hạn!',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Lỗi khi từ chối gia hạn:', error);
    res.status(500).json({ message: 'Lỗi server khi từ chối gia hạn!', error: error.message });
  }
};

// 13. NGƯỜI MƯỢN: Báo trả đồ (Trả sớm hoặc Trả đúng hạn)
exports.reportReturn = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { returnType, note } = req.body;
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(400).json({ message: 'Cần cung cấp userId đăng nhập!' });
    }

    const borrowRequest = await BorrowRequest.findById(requestId);
    if (!borrowRequest) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn!' });
    }

    if (borrowRequest.borrowerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ người đang mượn mới được gửi thông báo trả đồ!' });
    }

    if (borrowRequest.status !== 'borrowing') {
      return res.status(400).json({ message: 'Chỉ có thể báo trả đồ khi đang trong trạng thái mượn đồ!' });
    }

    const isEarly = returnType === 'early';
    borrowRequest.returnStatus = isEarly ? 'reported_early' : 'reported_on_time';
    borrowRequest.returnNote = note ? note.trim() : '';
    borrowRequest.returnReportedDate = new Date();
    await borrowRequest.save();

    const retToy = await Toy.findById(borrowRequest.toyId).select('name');
    await createNotification({
      userId: borrowRequest.ownerId,
      type: 'return_reported',
      title: 'Người mượn báo trả đồ',
      message: `Người mượn đã báo trả "${retToy?.name || 'đồ chơi'}". Vui lòng xác nhận khi nhận lại đồ.`,
      link: 'requests',
      relatedId: borrowRequest._id
    });

    res.status(200).json({
      message: isEarly
        ? 'Đã gửi thông báo TRẢ ĐỒ SỚM đến chủ đồ chơi thành công!'
        : 'Đã gửi thông báo TRẢ ĐỒ ĐÚNG HẠN đến chủ đồ chơi thành công!',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Lỗi khi báo trả đồ:', error);
    res.status(500).json({ message: 'Lỗi server khi báo trả đồ!', error: error.message });
  }
};

// 14. KIỂM TRA QUÁ HẠN & TỰ ĐỘNG CHUYỂN SANG ĐÃ TRẢ
exports.checkOverdue = async (req, res) => {
  try {
    const result = await autoReturnOverdueBorrows();
    res.status(200).json({
      success: true,
      message: `Đã kiểm tra quá hạn ngày mượn. Đã chuyển ${result.count} lượt mượn sang 'returned'.`,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra quá hạn!', error: error.message });
  }
};
