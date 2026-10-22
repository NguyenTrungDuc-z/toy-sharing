const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  avatar: { type: String, default: "" },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Toy' }],
  tokenVersion: { type: Number, default: 0 },
  rating: {
    avg: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
 
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);