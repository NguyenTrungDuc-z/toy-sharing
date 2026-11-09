const mongoose = require('mongoose');
const Review = require('../models/Review');
const Toy = require('../models/Toy');
const User = require('../models/User');
const BorrowRequest = require('../models/BorrowRequest');
const { createNotification } = require('../services/notificationService');

// 1. TẠO ĐÁNH GIÁ MỚI CHO ĐỒ CHƠI
exports.createReview = async (req, res) => {
  try {
    const { toyId, borrowRequestId, rating, comment } = req.body;
    const reviewerId = req.userId;

    // Validate dữ liệu đầu vào
    if (!toyId) {
      return res.status(400).json({ message: 'Thiếu mã đồ chơi (toyId)!' });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Số sao đánh giá phải từ 1 đến 5 sao!' });
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung nhận xét!' });
    }

    const toy = await Toy.findById(toyId);
    if (!toy) {
      return res.status(404).json({ message: 'Không tìm thấy đồ chơi!' });
    }

    if (!borrowRequestId) {
      return res.status(400).json({ message: 'Cần cung cấp mã yêu cầu mượn (borrowRequestId)!' });
    }

    if (!mongoose.isValidObjectId(borrowRequestId)) {
      return res.status(400).json({ message: 'Mã yêu cầu mượn không hợp lệ!' });
    }

    const borrowRequest = await BorrowRequest.findById(borrowRequestId);
    if (!borrowRequest) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn tương ứng!' });
    }

    // Xác định chiều đánh giá dựa trên người gửi:
    // - Người mượn -> chấm chủ & đồ chơi (borrower_to_owner)
    // - Chủ đồ chơi -> chấm người mượn (owner_to_borrower)
    const isBorrower = borrowRequest.borrowerId.toString() === reviewerId;
    const isOwner = borrowRequest.ownerId.toString() === reviewerId;
    if (!isBorrower && !isOwner) {
      return res.status(403).json({ message: 'Bạn không liên quan đến lượt mượn này!' });
    }

    const direction = isBorrower ? 'borrower_to_owner' : 'owner_to_borrower';
    const targetUserId = isBorrower ? borrowRequest.ownerId : borrowRequest.borrowerId;

    if (borrowRequest.status !== 'returned') {
      return res.status(400).json({ message: 'Chỉ được đánh giá sau khi đã trả đồ chơi!' });
    }

    // Mỗi người chỉ đánh giá lượt mượn này một lần (nhưng cả hai chiều đều được phép)
    const existingReview = await Review.findOne({ borrowRequestId, reviewerId });
    if (existingReview) {
      return res.status(400).json({ message: 'Bạn đã gửi đánh giá cho lượt mượn này rồi!' });
    }

    // Tạo bản ghi đánh giá
    const newReview = await Review.create({
      toyId,
      borrowRequestId: borrowRequestId || null,
      reviewerId,
      targetOwnerId: targetUserId,
      direction,
      rating: Math.round(numRating),
      comment: comment.trim()
    });

    // Chỉ cập nhật điểm đồ chơi khi là đánh giá của người mượn về đồ chơi
    let toyAvg, toyCount;
    if (direction === 'borrower_to_owner') {
      const toyReviews = await Review.find({ toyId, direction: { $ne: 'owner_to_borrower' } });
      toyCount = toyReviews.length;
      toyAvg = toyCount ? Number((toyReviews.reduce((sum, r) => sum + r.rating, 0) / toyCount).toFixed(1)) : 0;
      await Toy.findByIdAndUpdate(toyId, { rating: { avg: toyAvg, count: toyCount } });
    }

    // Cập nhật điểm trung bình cho người được đánh giá (chủ hoặc người mượn)
    const targetReviews = await Review.find({ targetOwnerId: targetUserId });
    const targetCount = targetReviews.length;
    const targetAvg = Number((targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetCount).toFixed(1));
    await User.findByIdAndUpdate(targetUserId, { rating: { avg: targetAvg, count: targetCount } });

    await createNotification({
      userId: targetUserId,
      type: 'new_review',
      title: 'Đánh giá mới',
      message: direction === 'borrower_to_owner'
        ? `"${toy.name}" của bạn vừa nhận được đánh giá ${Math.round(numRating)} sao.`
        : `Bạn vừa nhận được đánh giá ${Math.round(numRating)} sao từ chủ đồ chơi "${toy.name}".`,
      link: direction === 'borrower_to_owner' ? 'my-toys' : 'requests',
      relatedId: direction === 'borrower_to_owner' ? toyId : borrowRequest._id
    });

    const populatedReview = await Review.findById(newReview._id)
      .populate('reviewerId', 'name avatar email');

    res.status(201).json({
      message: 'Gửi đánh giá và nhận xét thành công!',
      review: populatedReview,
      direction,
      ...(direction === 'borrower_to_owner' ? { toyRating: { avg: toyAvg, count: toyCount } } : {})
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi gửi đánh giá', error: err.message });
  }
};

// 2. LẤY TẤT CẢ ĐÁNH GIÁ CỦA MỘT ĐỒ CHƠI (Public)
exports.getReviewsByToy = async (req, res) => {
  try {
    const { toyId } = req.params;
    if (!mongoose.isValidObjectId(toyId)) {
      return res.status(400).json({ message: 'Mã đồ chơi không hợp lệ!' });
    }

    const reviews = await Review.find({ toyId, direction: { $ne: 'owner_to_borrower' } })
      .populate('reviewerId', 'name avatar')
      .sort({ createdAt: -1 });

    const total = reviews.length;
    const avg = total > 0 
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)) 
      : 0;

    res.status(200).json({
      success: true,
      stats: { avg, count: total },
      reviews
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá', error: err.message });
  }
};

// 3. LẤY DANH SÁCH CÁC ĐƠN MƯỢN MÀ USER HIỆN TẠI ĐÃ ĐÁNH GIÁ
exports.getMyReviewedRequests = async (req, res) => {
  try {
    const reviews = await Review.find({ 
      reviewerId: req.userId,
      borrowRequestId: { $ne: null }
    }).select('borrowRequestId');

    const reviewedRequestIds = reviews.map(r => r.borrowRequestId.toString());
    res.status(200).json({ reviewedRequestIds });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi kiểm tra lịch sử đánh giá', error: err.message });
  }
};

// 4. XÓA ĐÁNH GIÁ (Chỉ người viết hoặc Admin mới có quyền)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá!' });
    }

    const currentUser = await User.findById(req.userId);
    const isAuthor = review.reviewerId.toString() === req.userId;
    const isAdmin = currentUser?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa đánh giá này!' });
    }

    await Review.findByIdAndDelete(id);

    // Tính toán lại điểm sau khi xóa (điểm đồ chơi chỉ tính đánh giá về đồ chơi)
    const toyReviews = await Review.find({ toyId: review.toyId, direction: { $ne: 'owner_to_borrower' } });
    const toyCount = toyReviews.length;
    const toyAvg = toyCount > 0 
      ? Number((toyReviews.reduce((sum, r) => sum + r.rating, 0) / toyCount).toFixed(1)) 
      : 0;
    await Toy.findByIdAndUpdate(review.toyId, {
      rating: { avg: toyAvg, count: toyCount }
    });

    const ownerReviews = await Review.find({ targetOwnerId: review.targetOwnerId });
    const ownerCount = ownerReviews.length;
    const ownerAvg = ownerCount > 0
      ? Number((ownerReviews.reduce((sum, r) => sum + r.rating, 0) / ownerCount).toFixed(1))
      : 0;
    await User.findByIdAndUpdate(review.targetOwnerId, {
      rating: { avg: ownerAvg, count: ownerCount }
    });

    res.status(200).json({ message: 'Đã xóa đánh giá thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi xóa đánh giá', error: err.message });
  }
};
