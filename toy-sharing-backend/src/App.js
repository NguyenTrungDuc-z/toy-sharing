const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User'); 
const bcrypt = require('bcryptjs'); 

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper map condition từ frontend sang schema backend enum ['new', 'used']
const mapCondition = (cond) => {
    if (!cond) return 'used';
    const c = cond.toLowerCase();
    if (c.includes('mới') || c.includes('new')) return 'new';
    return 'used';
};

// Hàm khởi tạo tài khoản Admin mặc định hệ thống với mật khẩu băm bcrypt
async function createAdminAccount() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash('admin123', salt);

        await User.deleteOne({ email: 'admin@toyshare.com' });
        await User.create({
            name: 'Hệ thống Admin',
            email: 'admin@toyshare.com',
            passwordHash: hashedAdminPassword,
            phone: '0123456789',
            address: 'Hà Nội',
            role: 'admin' 
        });
        console.log('🚀 Đã khởi tạo lại tài khoản Admin với mật khẩu băm bcrypt bảo mật! (admin@toyshare.com / admin123)');
    } catch (err) {
        console.error('❌ Lỗi trong quá trình khởi tạo tài khoản Admin:', err.message);
    }
}

// ==================== ROUTERS VÀ API CHỨC NĂNG ====================

// Tuyến đường xử lý mượn trả trả kết quả thành công (201 Created)
app.use('/api/borrows', require('./routes/borrowRoutes'));

// Tuyến đường xử lý Auth (Đăng ký / Đăng nhập) và quản trị
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Tuyến đường xử lý đồ chơi (CRUD, mượn trả, quản lý cá nhân)
app.use('/api/toys', require('./routes/toyRoutes'));

// Tuyến đường xử lý đánh giá & nhận xét đồ chơi
app.use('/api/reviews', require('./routes/reviewRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// ==================== KHỞI ĐỘNG HỆ THỐNG ĐỒNG BỘ ====================

const PORT = process.env.PORT || 5000;

const { autoReturnOverdueBorrows } = require('./services/overdueService');

async function startServer() {
    try {
        // Chờ kết nối thành công tới Database
        await connectDB(); 
        
        // Sau đó chạy hàm kiểm tra/tạo tài khoản Admin mặc định
        await createAdminAccount();

        // Kiểm tra và tự động chuyển các lượt mượn quá hạn thành 'đã trả' (returned)
        await autoReturnOverdueBorrows();

        // Định kỳ quét tự động mỗi 30 giây để xử lý các món quá hạn mượn
        setInterval(() => {
            autoReturnOverdueBorrows();
        }, 30000);

        // Cuối cùng mới mở cổng Server lắng nghe kết nối
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(" Không thể khởi động server do lỗi kết nối:", error.message);
    }
}

// Chạy khởi động server hệ thống
startServer();