const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const Toy = require('./models/Toy'); 
const User = require('./models/User'); 

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

// Hàm khởi tạo tài khoản Admin mặc định hệ thống
async function createAdminAccount() {
    try {
        // Xóa tài khoản admin cũ bị lưu mật khẩu băm (bcrypt) lỗi trước đó
        await User.deleteOne({ email: 'admin@toyshare.com' });

        // Tạo thẳng bằng mật khẩu chuỗi thường 'admin123' giống hệt logic authRoutes của bồ
        await User.create({
            name: 'Hệ thống Admin',
            email: 'admin@toyshare.com',
            passwordHash: 'admin123', // Mật khẩu dạng chuỗi thường trực tiếp
            phone: '0123456789',
            address: 'Hà Nội',
            role: 'admin' 
        });
        console.log('🚀 Đã làm sạch và khởi tạo lại tài khoản Admin dạng text thường chuẩn! (admin@toyshare.com / admin123)');
    } catch (err) {
        console.error('❌ Lỗi trong quá trình khởi tạo tài khoản Admin:', err.message);
    }
}

// ==================== ROUTERS VÀ API CHỨC NĂNG ====================

// Tuyến đường xử lý mượn trả trả kết quả thành công (201 Created)
app.use('/api/borrows', require('./routes/borrowRoutes'));

// Tuyến đường xử lý Auth (Đăng ký / Đăng nhập)
app.use('/api/auth', require('./routes/authRoutes'));
// Tuyến đường xử lý đồ chơi (CRUD, mượn trả, quản lý cá nhân)
app.use('/api/toys', require('./routes/toyRoutes'));

// 🛠️ 4. API ADMIN: Lấy số liệu thống kê tổng quan (Phục vụ Dashboard Quản trị)
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalToys = await Toy.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });
        
        // Đếm đồ chơi đang sẵn sàng hoặc đang bị mượn trên toàn sàn
        const availableToys = await Toy.countDocuments({ status: 'available' });
        const borrowedToys = await Toy.countDocuments({ status: { $in: ['borrowed', 'unavailable'] } });

        res.status(200).json({
            totalToys,
            totalUsers,
            availableToys,
            borrowedToys
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống khi lấy số liệu thống kê quản trị", error: err.message });
    }
});

// 🛠️ 5. API ADMIN: Quyền tối cao cưỡng ép gỡ bỏ bài đăng vi phạm khỏi hệ thống
app.delete('/api/admin/toys/:id', async (req, res) => {
    try {
        const deletedToy = await Toy.findByIdAndDelete(req.params.id);
        if (!deletedToy) {
            return res.status(404).json({ message: "Không tìm thấy đồ chơi yêu cầu gỡ bỏ." });
        }
        res.status(200).json({ message: "Admin đã gỡ bỏ bài đăng đồ chơi vi phạm thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống khi xóa bài đăng đồ chơi", error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// ==================== KHỞI ĐỘNG HỆ THỐNG ĐỒNG BỘ ====================

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Chờ kết nối thành công tới Database
        await connectDB(); 
        
        // Sau đó chạy hàm kiểm tra/tạo tài khoản Admin mặc định
        await createAdminAccount();

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