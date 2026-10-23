const mongoose = require('mongoose');
const Report = require('../models/Report');

const reportStatuses = ['open', 'processing', 'closed', 'dismissed'];

// 1. LẤY TẤT CẢ BÁO CÁO (Admin)
exports.getAllReports = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            if (!reportStatuses.includes(req.query.status)) {
                return res.status(400).json({ message: 'Trạng thái báo cáo không hợp lệ!' });
            }
            filter.status = req.query.status;
        }

        const reports = await Report.find(filter)
            .populate({
                path: 'toyId',
                select: 'name category images ownerId',
                populate: { path: 'ownerId', select: 'name email' }
            })
            .populate('reporterId', 'name email')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ reports });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách báo cáo', error: error.message });
    }
};

// 2. CẬP NHẬT TRẠNG THÁI / GHI CHÚ BÁO CÁO (Admin)
exports.updateReport = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Mã báo cáo không hợp lệ!' });
        }

        const { status, adminNote } = req.body;
        if (status === undefined && adminNote === undefined) {
            return res.status(400).json({ message: 'Cần cung cấp trạng thái hoặc ghi chú xử lý!' });
        }
        if (status !== undefined && !reportStatuses.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái báo cáo không hợp lệ!' });
        }
        if (adminNote !== undefined && typeof adminNote !== 'string') {
            return res.status(400).json({ message: 'Ghi chú xử lý phải là chuỗi!' });
        }

        const update = { reviewedBy: req.userId };
        if (status !== undefined) {
            update.status = status;
            update.closedAt = ['closed', 'dismissed'].includes(status) ? new Date() : null;
        }
        if (adminNote !== undefined) update.adminNote = adminNote.trim();

        const report = await Report.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true
        })
            .populate({
                path: 'toyId',
                select: 'name category images ownerId',
                populate: { path: 'ownerId', select: 'name email' }
            })
            .populate('reporterId', 'name email')
            .populate('reviewedBy', 'name email');

        if (!report) return res.status(404).json({ message: 'Không tìm thấy báo cáo!' });
        res.status(200).json({ message: 'Đã cập nhật báo cáo!', report });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xử lý báo cáo', error: error.message });
    }
};
