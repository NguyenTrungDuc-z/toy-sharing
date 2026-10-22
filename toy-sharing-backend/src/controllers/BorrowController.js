const BorrowRequest = require('../models/BorrowRequest');
const Toy = require('../models/Toy');
const mongoose = require('mongoose');

const getCurrentUserId = (req) => req.userId || req.headers['x-user-id'] || req.query.userId || req.body.borrowerId;

const assertOwner = (toy, userId) => {
  const ownerId = typeof toy.ownerId === 'object' ? toy.ownerId._id || toy.ownerId : toy.ownerId;
  return ownerId.toString() === userId.toString();
};

// 1. NGƯỜI MƯỢN: Gửi yêu cầu mượn đồ chơi
exports.createRequest = async (req, res) => {
  try {
    const { toyId, dueDate, note } = req.body;
    const borrowerId = req.userId || req.body.borrowerId;

    console.log('[DEBUG] createRequest input:', { toyId, dueDate, note, borrowerId });

    if (!borrowerId) {
      return res.status(400).json({ message: 'Thiếu borrowerId / user đăng nhập' });
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

    const newRequest = await BorrowRequest.create({
      toyId: toyId,
      ownerId: toy.ownerId,
      borrowerId: borrowerId,
      dueDate,
      note,
      status: 'pending',
      depositStatus: 'pending',
      requestDate: new Date(),
    });

    res.status(201).json({ message: 'Gửi yêu cầu mượn thành công!', data: newRequest });
  } catch (error) {
    console.error('Lỗi khi tạo yêu cầu mượn:', error);
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 2. CHỦ ĐỒ CHƠI: Xác nhận đã nhận tiền cọc (Offline/Bank)
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
      return res.status(400).json({ message: 'Trạng thái không hợp lệ để xác nhận cọc!' });
    }

    request.depositStatus = 'paid';
    request.status = 'borrowing';
    request.approvedDate = request.approvedDate || new Date();
    await request.save();

    // Cập nhật trạng thái toy thành 'borrowed'
    const updatedToy = await Toy.findByIdAndUpdate(
      request.toyId,
      { status: 'borrowed' },
      { new: true }
    );
    console.log('[DEBUG] confirmDeposit - Updated toy status:', updatedToy.status);

    res.status(200).json({ message: 'Chủ đồ đã xác nhận nhận cọc! Quá trình mượn bắt đầu.', data: request });
  } catch (error) {
    console.error('Lỗi khi xác nhận cọc:', error);
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
    request.depositStatus = 'refunded';
    request.returnDate = new Date();
    await request.save();

    // Cập nhật trạng thái toy thành 'available'
    const updatedToy = await Toy.findByIdAndUpdate(
      request.toyId,
      { status: 'available' },
      { new: true }
    );
    console.log('[DEBUG] confirmReturnAndRefund - Updated toy status:', updatedToy.status);

    res.status(200).json({ message: 'Đã nhận lại đồ chơi và hoàn cọc thành công!', data: request });
  } catch (error) {
    console.error('Lỗi khi trả đồ:', error);
    res.status(500).json({ message: 'Lỗi server!', error: error.message });
  }
};

// 4. CHUNG: Lấy lịch sử mượn đồ
exports.getBorrowHistory = async (req, res) => {
  try {
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

    res.status(200).json({ message: 'Đã duyệt yêu cầu mượn!', data: request });
  } catch (error) {
    console.error('Lỗi khi duyệt yêu cầu:', error);
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

    res.status(200).json({ message: 'Đã từ chối yêu cầu mượn!', data: request });
  } catch (error) {
    console.error('Lỗi khi từ chối yêu cầu:', error);
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
