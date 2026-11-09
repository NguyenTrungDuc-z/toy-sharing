const mongoose = require('mongoose');
const Toy = require('../models/Toy');
const User = require('../models/User');
const Report = require('../models/Report');
const BorrowRequest = require('../models/BorrowRequest');
const Review = require('../models/Review');
const { autoReturnOverdueBorrows } = require('../services/overdueService');
const { createNotification, notifyFavoriteAvailable } = require('../services/notificationService');

const toySortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
    'deposit-asc': { depositRequired: 1 },
    'deposit-desc': { depositRequired: -1 },
    createdAt: { createdAt: 1 },
    '-createdAt': { createdAt: -1 },
    name: { name: 1 },
    '-name': { name: -1 },
    depositRequired: { depositRequired: 1 },
    '-depositRequired': { depositRequired: -1 },
};

// 1. LẤY TẤT CẢ TOYS (Public - Home)
exports.getAllToys = async (req, res) => {
    try {
        await autoReturnOverdueBorrows();
        const { search, category, location, page: pageValue, limit: limitValue, sort: sortValue } = req.query;
        const filter = {
            status: { $in: ['available', 'borrowed', 'unavailable'] }
        };

        if (category) {
            filter.category = category;
        }
        if (location) {
            filter.location = { $regex: location, $options: "i" };
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (sortValue && !toySortOptions[sortValue]) {
            return res.status(400).json({ message: 'Kiểu sắp xếp không hợp lệ!' });
        }

        const hasPagination = pageValue !== undefined || limitValue !== undefined;
        const page = pageValue === undefined ? 1 : Number(pageValue);
        const limit = limitValue === undefined ? 20 : Number(limitValue);
        if (hasPagination && (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100)) {
            return res.status(400).json({ message: 'page phải >= 1 và limit phải từ 1 đến 100!' });
        }

        let query = Toy.find(filter).populate("ownerId", "name email");
        if (sortValue) query = query.sort(toySortOptions[sortValue]);

        if (!hasPagination) {
            return res.json(await query);
        }

        const [toys, total] = await Promise.all([
            query.skip((page - 1) * limit).limit(limit),
            Toy.countDocuments(filter),
        ]);
        res.json({
            toys,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error("Error fetching toys:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 1b. LẤY CHI TIẾT 1 TOY
exports.getToyById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Mã đồ chơi không hợp lệ!' });
        }
        const toy = await Toy.findById(req.params.id).populate('ownerId', 'name email avatar rating');
        if (!toy) return res.status(404).json({ message: 'Không tìm thấy đồ chơi!' });
        res.json(toy);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 2. BÁO CÁO ĐỒ CHƠI VI PHẠM
exports.reportToy = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Mã đồ chơi không hợp lệ!' });
        }
        const { reason, details = '' } = req.body;
        if (typeof reason !== 'string' || !reason.trim()) {
            return res.status(400).json({ message: 'Vui lòng cung cấp lý do báo cáo!' });
        }
        if (typeof details !== 'string') {
            return res.status(400).json({ message: 'Chi tiết báo cáo phải là chuỗi!' });
        }

        const toy = await Toy.findById(req.params.id);
        if (!toy) return res.status(404).json({ message: 'Không tìm thấy bài đăng đồ chơi!' });

        const report = await Report.create({
            toyId: toy._id,
            reporterId: req.userId,
            reason: reason.trim(),
            details: details.trim(),
        });
        res.status(201).json({ message: 'Đã gửi báo cáo bài đăng!', report });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi gửi báo cáo', error: err.message });
    }
};

// 3. THÊM VÀO DANH SÁCH YÊU THÍCH
exports.addFavorite = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Mã đồ chơi không hợp lệ!' });
        }
        const toy = await Toy.findById(req.params.id).select('_id');
        if (!toy) return res.status(404).json({ message: 'Không tìm thấy đồ chơi!' });

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $addToSet: { favorites: toy._id } },
            { new: true, select: 'favorites' }
        );
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        res.status(200).json({ message: 'Đã thêm vào danh sách yêu thích!', favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lưu đồ chơi yêu thích', error: err.message });
    }
};

// 4. XÓA KHỎI DANH SÁCH YÊU THÍCH
exports.removeFavorite = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Mã đồ chơi không hợp lệ!' });
        }
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $pull: { favorites: req.params.id } },
            { new: true, select: 'favorites' }
        );
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        res.status(200).json({ message: 'Đã xóa khỏi danh sách yêu thích!', favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xóa đồ chơi yêu thích', error: err.message });
    }
};

// 5. LẤY TOYS CỦA USER ĐANG ĐĂNG NHẬP
exports.getMyToys = async (req, res) => {
    try {
        await autoReturnOverdueBorrows();
        const toys = await Toy.find({ ownerId: req.userId }).sort({ createdAt: -1 });
        res.json(toys);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 6. LẤY TOYS CHỜ DUYỆT (Admin)
exports.getPendingToys = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId);
        if (currentUser.role !== "admin") {
            return res.status(403).json({ message: "Admin only" });
        }
        const toys = await Toy.find({ status: "pending" }).populate(
            "ownerId",
            "name email"
        );
        res.json(toys);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// 7. TẠO TOY MỚI
exports.createToy = async (req, res) => {
    try {
        const { name, description, category, ageRange, condition, depositRequired, imageUrl, images, location } =
            req.body;

        // Validate required fields
        if (!name || !ageRange || !condition) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ tên, độ tuổi và tình trạng đồ chơi" });
        }

        // Prepare images array - filter out empty/undefined values
        let finalImages = [];
        if (images && Array.isArray(images)) {
            finalImages = images.filter(img => img && img.trim());
        } else if (imageUrl && imageUrl.trim()) {
            finalImages = [imageUrl];
        }

        const toy = new Toy({
            name,
            description,
            category,
            ageRange,
            condition,
            depositRequired: Number(depositRequired) || 0,
            images: finalImages,
            location: location || '',
            ownerId: req.userId,
            status: "pending",
        });

        await toy.save();
        res.status(201).json({ message: "Đồ chơi đã được đăng thành công! Chờ duyệt từ admin.", toy });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi lưu dữ liệu đồ chơi", error: err.message });
    }
};

// 8. CẬP NHẬT TOY
exports.updateToy = async (req, res) => {
    try {
        const toy = await Toy.findById(req.params.id);
        if (!toy) return res.status(404).json({ message: "Toy not found" });
        if (toy.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { name, description, category, ageRange, condition, depositRequired, imageUrl, images, location } =
            req.body;
        const updateData = { name, description, category, ageRange, condition, depositRequired, status: 'pending' };
        if (location !== undefined) updateData.location = location;
        if (images) {
            updateData.images = images;
        } else if (imageUrl) {
            updateData.images = [imageUrl];
        }
        const updatedToy = await Toy.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json({ message: "Đã cập nhật đồ chơi! Chờ admin duyệt lại.", toy: updatedToy });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 9. DUYỆT BÀI ĐĂNG (Admin Moderate)
exports.moderateToy = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId);
        if (currentUser.role !== "admin") {
            return res.status(403).json({ message: "Admin only" });
        }
        const allowedStatuses = ['available', 'rejected', 'pending'];
        if (!allowedStatuses.includes(req.body.status)) {
            return res.status(400).json({ message: `Trạng thái không hợp lệ! Chỉ cho phép: ${allowedStatuses.join(', ')}` });
        }
        const toy = await Toy.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!toy) return res.status(404).json({ message: "Toy not found" });

        if (req.body.status === 'available') {
            await createNotification({
                userId: toy.ownerId,
                type: 'toy_moderated',
                title: 'Đồ chơi được duyệt',
                message: `"${toy.name}" đã được duyệt và hiển thị công khai.`,
                link: 'my-toys',
                relatedId: toy._id
            });
            await notifyFavoriteAvailable(toy._id, toy.name);
        } else if (req.body.status === 'rejected') {
            await createNotification({
                userId: toy.ownerId,
                type: 'toy_moderated',
                title: 'Đồ chơi bị từ chối',
                message: `"${toy.name}" đã bị từ chối. Vui lòng kiểm tra lại thông tin.`,
                link: 'my-toys',
                relatedId: toy._id
            });
        }

        res.json(toy);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// 10. XÓA TOY
exports.deleteToy = async (req, res) => {
    try {
        const toy = await Toy.findById(req.params.id);
        if (!toy) return res.status(404).json({ message: "Toy not found" });

        const currentUser = await User.findById(req.userId);
        const isOwner = toy.ownerId.toString() === req.userId;
        const isAdmin = currentUser?.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Bạn không có quyền xóa đồ chơi này!" });
        }

        const activeBorrow = await BorrowRequest.findOne({
            toyId: toy._id,
            status: { $in: ['pending', 'approved', 'borrowing'] }
        });
        if (activeBorrow) {
            return res.status(400).json({ message: "Không thể xóa đồ chơi đang trong quá trình mượn/trả!" });
        }

        await Promise.all([
            BorrowRequest.deleteMany({ toyId: toy._id }),
            Review.deleteMany({ toyId: toy._id }),
            Report.deleteMany({ toyId: toy._id }),
            User.updateMany({}, { $pull: { favorites: toy._id } }),
        ]);
        await Toy.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa đồ chơi và dữ liệu liên quan!" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
