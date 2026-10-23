const mongoose = require('mongoose');
const Review = require('../models/Review');
const Toy = require('../models/Toy');
const User = require('../models/User');
const BorrowRequest = require('../models/BorrowRequest');

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

    // Không cho phép tự đánh giá đồ chơi của chính mình
    if (toy.ownerId.toString() === reviewerId) {
      return res.status(400).json({ message: 'Bạn không thể tự đánh giá đồ chơi của chính mình!' });
    }

    // Nếu gửi kèm mã yêu cầu mượn (borrowRequestId), kiểm tra quyền và tránh đánh giá trùng lặp
    if (borrowRequestId) {
      if (!mongoose.isValidObjectId(borrowRequestId)) {
        return res.status(400).json({ message: 'Mã yêu cầu mượn không hợp lệ!' });
      }

      const borrowRequest = await BorrowRequest.findById(borrowRequestId);
      if (!borrowRequest) {
        return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn tương ứng!' });
      }

      if (borrowRequest.borrowerId.toString() !== reviewerId) {
        return res.status(403).json({ message: 'Bạn không phải là người mượn đơn này!' });
      }

      const existingReview = await Review.findOne({ borrowRequestId });
      if (existingReview) {
        return res.status(400).json({ message: 'Bạn đã gửi đánh giá cho lượt mượn này rồi!' });
      }
    }

    // Tạo bản ghi đánh giá
    const newReview = await Review.create({
      toyId,
      borrowRequestId: borrowRequestId || null,
      reviewerId,
      targetOwnerId: toy.ownerId,
      rating: Math.round(numRating),
      comment: comment.trim()
    });

    // Cập nhật lại điểm trung bình đánh giá cho Đồ chơi (Toy)
    const toyReviews = await Review.find({ toyId });
    const toyCount = toyReviews.length;
    const toyAvg = Number((toyReviews.reduce((sum, r) => sum + r.rating, 0) / toyCount).toFixed(1));
    await Toy.findByIdAndUpdate(toyId, {
      rating: { avg: toyAvg, count: toyCount }
    });

    // Cập nhật lại điểm trung bình đánh giá cho Chủ đồ chơi (User)
    const ownerReviews = await Review.find({ targetOwnerId: toy.ownerId });
    const ownerCount = ownerReviews.length;
    const ownerAvg = Number((ownerReviews.reduce((sum, r) => sum + r.rating, 0) / ownerCount).toFixed(1));
    await User.findByIdAndUpdate(toy.ownerId, {
      rating: { avg: ownerAvg, count: ownerCount }
    });

    const populatedReview = await Review.findById(newReview._id)
      .populate('reviewerId', 'name avatar email');

    res.status(201).json({
      message: 'Gửi đánh giá và nhận xét thành công!',
      review: populatedReview,
      toyRating: { avg: toyAvg, count: toyCount }
    });
  } catch (err) {
    console.error('Lỗi khi tạo đánh giá:', err);
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

    const reviews = await Review.find({ toyId })
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

    // Tính toán lại điểm sau khi xóa
    const toyReviews = await Review.find({ toyId: review.toyId });
    const toyCount = toyReviews.length;
    const toyAvg = toyCount > 0 
      ? Number((toyReviews.reduce((sum, r) => sum + r.rating, 0) / toyCount).toFixed(1)) 
      : 0;
    await Toy.findByIdAndUpdate(review.toyId, {
      rating: { avg: toyAvg, count: toyCount }
    });

    res.status(200).json({ message: 'Đã xóa đánh giá thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi xóa đánh giá', error: err.message });
  }
};
