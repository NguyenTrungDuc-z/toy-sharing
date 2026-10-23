const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  toyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Toy', 
    required: true 
  },
  borrowRequestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BorrowRequest' 
  },
  reviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  targetOwnerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 1000 
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
