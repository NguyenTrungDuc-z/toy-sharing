const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

// ==================== SOCKET.IO (realtime thông báo & chat) ====================
const io = new Server(server, { cors: { origin: '*' } });
global._io = io;

io.on('connection', (socket) => {
    // Chỉ tham gia phòng riêng theo userId lấy TỪ TOKEN đã xác thực (không tin userId do client gửi)
    const token = socket.handshake.auth?.token;
    let verifiedUserId = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'toyshare_secret');
            if (decoded.userId) {
                verifiedUserId = String(decoded.userId);
                socket.join(`user:${verifiedUserId}`);
            }
        } catch {
            // token không hợp lệ -> không join phòng nào
        }
    }

    // Chỉ cho join lại đúng phòng của chính mình (phòng trường hợp token xác thực muộn)
    socket.on('join', (userId) => {
        if (verifiedUserId && String(userId) === verifiedUserId) {
            socket.join(`user:${verifiedUserId}`);
        }
    });
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


async function createAdminAccount() {
    try {
        const existing = await User.findOne({ email: 'admin@toyshare.com' });
        if (existing) {
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
            }
            console.log('Admin account already exists (admin@toyshare.com)');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash('admin123', salt);

        await User.create({
            name: 'Hệ thống Admin',
            email: 'admin@toyshare.com',
            passwordHash: hashedAdminPassword,
            phone: '0123456789',
            address: 'Hà Nội',
            role: 'admin',
            status: 'active'
        });
        console.log('Admin account created (admin@toyshare.com / admin123)');
    } catch (err) {
        console.error('Error creating admin account:', err.message);
    }
}

// ==================== ROUTERS VÀ API CHỨC NĂNG ====================

// Tuyến đường xử lý mượn trả trả kết quả thành công (201 Created)
app.use('/api/borrows', require('./routes/BorrowRoutes'));

// Tuyến đường xử lý Auth (Đăng ký / Đăng nhập) và quản trị
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Tuyến đường xử lý đồ chơi (CRUD, mượn trả, quản lý cá nhân)
app.use('/api/toys', require('./routes/toyRoutes'));

// Tuyến đường xử lý đánh giá & nhận xét đồ chơi
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Tuyến đường hồ sơ công khai & thống kê người dùng
app.use('/api/users', require('./routes/userRoutes'));

// Tuyến đường thông báo trong ứng dụng
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Tuyến đường nhắn tin theo đơn mượn
app.use('/api/messages', require('./routes/messageRoutes'));

// Tuyến đường quản lý tiền cọc (escrow qua VietQR)
app.use('/api/deposits', require('./routes/depositRoutes'));

// Tuyến đường voucher giảm tiền cọc
app.use('/api/vouchers', require('./routes/voucherRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// ==================== KHỞI ĐỘNG HỆ THỐNG ĐỒNG BỘ ====================

const PORT = process.env.PORT || 5000;

const { autoReturnOverdueBorrows } = require('./services/overdueService');
const { remindDueSoonBorrows } = require('./services/reminderService');

async function startServer() {
    try {
        // Chờ kết nối thành công tới Database
        await connectDB();

        // Sau đó chạy hàm kiểm tra/tạo tài khoản Admin mặc định
        await createAdminAccount();

        // Kiểm tra và tự động chuyển các lượt mượn quá hạn thành 'đã trả' (returned)
        await autoReturnOverdueBorrows();
        // Nhắc các lượt mượn sắp đến hạn trả
        await remindDueSoonBorrows();

        // Định kỳ quét tự động mỗi 30 giây để xử lý các món quá hạn mượn
        setInterval(() => {
            autoReturnOverdueBorrows();
        }, 30000);

        // Nhắc "sắp đến hạn trả" mỗi 6 giờ (tránh gửi email quá dày)
        setInterval(() => {
            remindDueSoonBorrows();
        }, 6 * 3600 * 1000);

        // Cuối cùng mới mở cổng Server lắng nghe kết nối (dùng http server để hỗ trợ socket.io)
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT} (REST + Socket.IO)`);
        });
    } catch (error) {
        console.error(" Không thể khởi động server do lỗi kết nối:", error.message);
    }
}

// Chạy khởi động server hệ thống
startServer();