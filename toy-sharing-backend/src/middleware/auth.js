const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'toyshare_secret');
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user || (decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({ message: 'Token has been revoked or is invalid' });
    }

    req.userId = user._id.toString();
    req.authenticatedUser = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi xác thực tài khoản', error: err.message });
  }
};

module.exports = auth;