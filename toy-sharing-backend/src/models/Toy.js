const mongoose = require('mongoose');

const toySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  ageRange: { type: String, required: true },
  condition: { type: String, enum: ['new', 'used'], required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['available', 'borrowed', 'unavailable', 'pending', 'rejected'], default: 'pending' },
  depositRequired: { type: Number, default: 0 },
  location: { type: String },
  rating: {
    avg: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Toy', toySchema);