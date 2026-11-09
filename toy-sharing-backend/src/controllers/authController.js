const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const emailService = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Hàm tạo JWT dùng chung
const signToken = (user) => jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion || 0 },
    process.env.JWT_SECRET || 'toyshare_secret',
    { expiresIn: '1d' }
);

// 1. API ĐĂNG KÝ (Register)
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ email và mật khẩu!' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được đăng ký sử dụng!' });
        }

        // Băm mật khẩu bằng bcryptjs với salt rounds = 10
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            passwordHash: hashedPassword,
            phone,
            address: "",
            avatar: "",
            role: "user"
        });

        await newUser.save();
        res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đăng ký', error: err.message });
    }
};

// 2. API ĐĂNG NHẬP (Login)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu!' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        // So sánh mật khẩu bằng bcrypt
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.passwordHash);
        } catch (err) {
            isMatch = false;
        }

        // Tương thích ngược: Nếu tài khoản cũ chưa băm mật khẩu, so sánh chuỗi và tự động băm lại vào DB
        if (!isMatch && user.passwordHash === password) {
            isMatch = true;
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
            await user.save();
        }

        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, tokenVersion: user.tokenVersion || 0 },
            process.env.JWT_SECRET || 'toyshare_secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role || 'user'
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: err.message });
    }
};

// 2b. API ĐĂNG NHẬP BẰNG GOOGLE (Google OAuth)
exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body; // ID token từ Google Identity Services
        if (!credential) {
            return res.status(400).json({ message: 'Thiếu Google credential!' });
        }
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(503).json({ message: 'Đăng nhập Google chưa được cấu hình trên máy chủ (thiếu GOOGLE_CLIENT_ID).' });
        }

        // Xác thực ID token với Google
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (err) {
            return res.status(401).json({ message: 'Google credential không hợp lệ!' });
        }

        const { sub: googleId, email, email_verified, name, picture } = payload;
        if (!email) {
            return res.status(400).json({ message: 'Không lấy được email từ Google!' });
        }
        if (email_verified === false) {
            return res.status(400).json({ message: 'Email Google chưa được xác minh!' });
        }

        // Tìm theo googleId hoặc email; nếu chưa có thì tạo mới
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                googleId,
                authProvider: 'google',
                avatar: picture || '',
                role: 'user',
                status: 'active'
            });
        } else {
            // Liên kết googleId nếu tài khoản email đã tồn tại (đăng ký local trước đó)
            let changed = false;
            if (!user.googleId) { user.googleId = googleId; changed = true; }
            if (!user.avatar && picture) { user.avatar = picture; changed = true; }
            if (changed) await user.save();
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!' });
        }

        const token = signToken(user);
        res.status(200).json({
            message: 'Đăng nhập Google thành công!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role || 'user'
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đăng nhập Google', error: err.message });
    }
};

// 3. API LẤY THÔNG TIN TÀI KHOẢN (Get Profile)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash -tokenVersion');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        }

        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ tài khoản', error: err.message });
    }
};

// 4. API LẤY DANH SÁCH YÊU THÍCH (Get Favorites)
exports.getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: 'favorites',
            populate: { path: 'ownerId', select: 'name email' }
        }).select('favorites');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        }
        res.status(200).json({ favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách đồ chơi yêu thích', error: err.message });
    }
};

// 5. API CẬP NHẬT HỒ SƠ (Update Profile)
exports.updateMe = async (req, res) => {
    try {
        const allowedFields = ['name', 'phone', 'address', 'avatar'];
        const updateFields = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                if (typeof req.body[field] !== 'string') {
                    return res.status(400).json({ message: `${field} phải là chuỗi!` });
                }
                updateFields[field] = req.body[field].trim();
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'Không có thông tin hợp lệ để cập nhật!' });
        }
        if (updateFields.name !== undefined && !updateFields.name) {
            return res.status(400).json({ message: 'Tên không được để trống!' });
        }
        if (updateFields.phone !== undefined && !updateFields.phone) {
            return res.status(400).json({ message: 'Số điện thoại không được để trống!' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateFields },
            { new: true, runValidators: true, select: '-passwordHash -tokenVersion' }
        );
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        }

        res.status(200).json({ message: 'Cập nhật hồ sơ thành công!', user });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ', error: err.message });
    }
};

// 6. API ĐỔI MẬT KHẨU (Change Password)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Cần cung cấp mật khẩu hiện tại và mật khẩu mới!' });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        }

        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        } catch (err) {
            isMatch = false;
        }

        // Tương thích ngược nếu tài khoản cũ chưa băm
        if (!isMatch && user.passwordHash === currentPassword) {
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu', error: err.message });
    }
};

// 8. API QUÊN MẬT KHẨU (Forgot Password) - tạo token và gửi email thật qua Nodemailer (Gmail)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng nhập email!' });
        }

        const user = await User.findOne({ email });
        // Luôn trả về thông báo chung để tránh dò email tồn tại
        if (!user) {
            return res.status(200).json({
                message: 'Nếu email tồn tại trong hệ thống, mã xác nhận đặt lại mật khẩu đã được gửi đến hòm thư của bạn.'
            });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/?page=forgot-password&token=${rawToken}&email=${encodeURIComponent(email)}`;
        console.log(`[FORGOT-PASSWORD] Token đặt lại cho ${email}: ${rawToken}`);

        // Gửi email thật qua Nodemailer (Gmail)
        const emailResult = await emailService.sendResetPasswordEmail({
            to: email,
            token: rawToken,
            resetUrl: resetLink,
            userName: user.name
        });

        if (emailResult.sent) {
            return res.status(200).json({
                message: 'Mã xác nhận đặt lại mật khẩu đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư (cả thư mục Spam/Rác).',
                emailSent: true
            });
        }

        // Trường hợp EMAIL_USER / EMAIL_PASS chưa được cấu hình trong .env:
        // Cung cấp token trực tiếp để không làm gián đoạn kiểm thử và phát triển
        res.status(200).json({
            message: 'Chưa cấu hình Gmail trong file .env (EMAIL_USER / EMAIL_PASS). Mã token được cấp bên dưới để kiểm thử.',
            devResetToken: rawToken,
            devResetLink: resetLink,
            emailSent: false
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xử lý quên mật khẩu', error: err.message });
    }
};

// 9. API ĐẶT LẠI MẬT KHẨU (Reset Password) - dùng token
exports.resetPassword = async (req, res) => {
    try {
        const { token, email, newPassword } = req.body;
        if (!token || !email || !newPassword) {
            return res.status(400).json({ message: 'Thiếu thông tin đặt lại mật khẩu!' });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            email,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Link đặt lại không hợp lệ hoặc đã hết hạn!' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.tokenVersion = (user.tokenVersion || 0) + 1; // thu hồi token cũ
        await user.save();

        res.status(200).json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu', error: err.message });
    }
};

// 7. API ĐĂNG XUẤT (Logout)
exports.logout = async (req, res) => {
    try {
        req.authenticatedUser.tokenVersion += 1;
        await req.authenticatedUser.save();
        res.status(200).json({ message: 'Đăng xuất thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đăng xuất', error: err.message });
    }
};
