const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    toyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Toy', required: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true },
    details: { type: String, default: '', trim: true },
    status: {
        type: String,
        enum: ['open', 'processing', 'closed', 'dismissed'],
        default: 'open'
    },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);