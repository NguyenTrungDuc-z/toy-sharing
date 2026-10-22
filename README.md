# 🧸 ToyShare - Nền tảng Chia sẻ Đồ chơi

ToyShare là một nền tảng chia sẻ đồ chơi trực tuyến dành cho cộng đồng phụ huynh, cho phép đăng, mượn và quản lý đồ chơi cho trẻ em. Dự án được xây dựng theo kiến trúc **MERN Stack** (MongoDB, Express.js, React, Node.js).

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt và Chạy](#-cài-đặt-và-chạy)
- [Tài khoản Admin mặc định](#-tài-khoản-admin-mặc-định)
- [API Endpoints](#-api-endpoints)
- [Mô hình dữ liệu](#-mô-hình-dữ-liệu)
- [Phân quyền người dùng](#-phân-quyền-người-dùng)
- [Giao diện người dùng](#-giao-diện-người-dùng)

---

## 🌟 Tổng quan

ToyShare giải quyết nhu cầu chia sẻ đồ chơi bền vững trong cộng đồng. Phụ huynh có thể đăng đồ chơi mà con họ không còn sử dụng để cho người khác mượn (có tiền cọc), đồng thời có thể mượn đồ chơi từ người khác cho con mình. Hệ thống có cơ chế **kiểm duyệt bài đăng** (Admin duyệt trước khi đồ chơi xuất hiện trên trang chủ) và **quản lý tiền cọc** cho mỗi lượt mượn.

---

## ✨ Tính năng

### 👤 Người dùng (User)
- **Đăng ký / Đăng nhập** (email, mật khẩu, số điện thoại)
- **Duyệt đồ chơi**: Xem danh sách đồ chơi có sẵn (status `available`) trên trang chủ
- **Lọc đồ chơi**: Lọc theo độ tuổi (0-3, 3-6, 6-12) và danh mục (Giáo dục, Hành động, Xếp hình...)
- **Đăng đồ chơi**: Thêm đồ chơi mới kèm ảnh (upload Base64), tiền cọc, tình trạng — bài đăng ở trạng thái `pending` chờ Admin duyệt
- **Quản lý đồ chơi cá nhân**: Xem, sửa, xóa đồ chơi của mình (chặn xóa khi đang cho mượn)
- **Mượn đồ chơi**: Gửi yêu cầu mượn với hạn trả (7 ngày mặc định)
- **Quản lý yêu cầu**: 
  - Tab "Yêu cầu gửi tới tôi": Duyệt / Từ chối yêu cầu mượn đồ của mình
  - Tab "Đồ đang mượn": Xem trạng thái đồ mình đang mượn

### 🛡️ Admin
- **Dashboard tổng quan**: Thống kê số người dùng, đồ chơi, đang cho mượn, chờ duyệt + biểu đồ xu hướng (Chart.js)
- **Kiểm soát bài đăng**: Duyệt / Từ chối đồ chơi mới; lọc theo tab (Chờ duyệt, Sẵn sàng, Đang cho mượn, Bị từ chối) và danh mục
- **Phân quyền người dùng**: Tìm kiếm user, thay đổi vai trò (user/admin), khóa/mở khóa tài khoản
- **Sidebar điều hướng** riêng biệt cho khu vực quản trị

---

## 🛠 Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **Node.js** | - | Runtime JavaScript |
| **Express.js** | ^5.2.1 | Web framework |
| **MongoDB** | - | Cơ sở dữ liệu NoSQL (local) |
| **Mongoose** | ^9.7.4 | ODM cho MongoDB |
| **cors** | ^2.8.6 | Cross-Origin Resource Sharing |
| **dotenv** | ^17.4.2 | Quản lý biến môi trường |
| **nodemon** | ^3.1.14 | Hot-reload khi phát triển (devDependency) |

### Frontend
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **React** | ^19.2.7 | Thư viện UI |
| **Axios** | ^1.18.1 | HTTP client |
| **Chart.js** | ^4.5.1 | Thư viện biểu đồ |
| **react-chartjs-2** | ^5.3.1 | React wrapper cho Chart.js |
| **Vite** | ^8.1.1 | Build tool |

> **Lưu ý**: Frontend không sử dụng React Router. Điều hướng trang được quản lý qua state `page` trong `App.jsx`.

---

## 📁 Cấu trúc dự án

```
SDN302_Project/
├── package.json                          # Dependencies backend (root) + scripts
├── README.md                             # Tài liệu dự án
│
├── toy-sharing-backend/                  # Backend (API Server)
│   ├── .env                              # Biến môi trường (PORT, MONGO_URI)
│   └── src/
│       ├── App.js                        # Entry point, cấu hình Express, khởi tạo Admin
│       ├── config/
│       │   └── db.js                     # Kết nối MongoDB
│       ├── models/
│       │   ├── User.js                   # Model người dùng
│       │   ├── Toy.js                    # Model đồ chơi
│       │   └── BorrowRequest.js          # Model yêu cầu mượn
│       ├── routes/
│       │   ├── authRoutes.js             # Routes xác thực + Admin APIs
│       │   ├── toyRoutes.js              # Routes CRUD đồ chơi
│       │   └── borrowRoutes.js           # Routes mượn/trả đồ chơi
│       └── controllers/
│           └── borrowController.js       # Controller xử lý logic mượn/trả
│
├── toy-sharing-frontend/                 # Frontend (React SPA)
│   ├── package.json                      # Dependencies frontend
│   ├── index.html                        # HTML template
│   ├── vite.config.js                    # Cấu hình Vite
│   ├── public/
│   │   └── images/
│   │       └── banner.png                # Ảnh banner trang chủ
│   └── src/
│       ├── main.jsx                      # Entry point React
│       ├── App.jsx                       # Component gốc + điều hướng state-based
│       ├── App.css                       # Stylesheet toàn cục (tone cam đất ấm)
│       └── components/
│           ├── Navbar.jsx                # Thanh điều hướng (tách riêng Admin/User)
│           ├── Home.jsx                  # Trang chủ: danh sách đồ chơi + bộ lọc
│           ├── Login.jsx                 # Trang đăng nhập (2 cột: banner + form)
│           ├── Register.jsx              # Trang đăng ký (2 cột: giới thiệu + form)
│           ├── MyToys.jsx                # Quản lý đồ chơi cá nhân (bảng + KPI cards)
│           ├── ToyFormModal.jsx          # Modal đăng/sửa đồ chơi (upload ảnh Base64)
│           ├── Requests.jsx              # Quản lý yêu cầu mượn (2 tab)
│           ├── AdminDashboard.jsx        # Dashboard admin (thống kê + biểu đồ)
│           ├── RoleManagement.jsx        # Quản lý phân quyền người dùng
│           └── ToyModeration.jsx         # Kiểm duyệt bài đăng đồ chơi
```

---

## 🚀 Cài đặt và Chạy

### Yêu cầu
- **Node.js** (v18 trở lên)
- **npm** (v9 trở lên)
- **MongoDB** chạy local tại `mongodb://localhost:27017`

### 1. Clone dự án
```bash
git clone <repository-url>
cd SDN302_Project
```

### 2. Cài đặt dependencies

```bash
# Cài đặt dependencies cho backend (tại thư mục gốc)
npm install

# Cài đặt dependencies cho frontend
cd toy-sharing-frontend
npm install
cd ..
```

### 3. Cấu hình biến môi trường

File `toy-sharing-backend/.env` đã có sẵn cấu hình:

```env
PORT = 5000
MONGO_URI=mongodb://localhost:27017/toy_sharing
```

### 4. Chạy ứng dụng

```bash
# Terminal 1: Chạy Backend (từ thư mục gốc)
npm start
# hoặc chế độ dev (auto-reload):
npm run dev

# Terminal 2: Chạy Frontend
cd toy-sharing-frontend
npm run dev
```

- **Backend** chạy tại: `http://localhost:5000`
- **Frontend** chạy tại: `http://localhost:5173`

---

## 🔑 Tài khoản Admin mặc định

Khi server backend khởi động, hệ thống tự động tạo tài khoản Admin mặc định:

| Trường | Giá trị |
|---|---|
| **Email** | `admin@toyshare.com` |
| **Mật khẩu** | `admin123` |
| **Vai trò** | `admin` |

> Tài khoản Admin được tạo lại mỗi lần server khởi động (xóa cũ, tạo mới).

---

## 📡 API Endpoints

### Authentication & Admin (`/api/auth`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/register` | Đăng ký tài khoản (name, email, password, phone) |
| `POST` | `/login` | Đăng nhập (trả về user object kèm id, name, email, role) |
| `GET` | `/admin/stats` | Thống kê dashboard: tổng users, toys, active loans, pending |
| `GET` | `/admin/users` | Danh sách users (hỗ trợ search, role filter) |
| `PUT` | `/admin/users/:userId` | Cập nhật role/status user |
| `GET` | `/admin/toys` | Danh sách đồ chơi theo trạng thái (pending/approved/borrowed/rejected) |
| `PUT` | `/admin/toys/:id/status` | Duyệt / Từ chối bài đăng đồ chơi |

### Toys (`/api/toys`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/` | Lấy đồ chơi `available` (hỗ trợ search, category filter) |
| `GET` | `/my-toys` | Lấy đồ chơi của user (query param `userId`) |
| `GET` | `/pending` | Lấy đồ chơi chờ duyệt (yêu cầu auth + admin) |
| `POST` | `/` | Đăng đồ chơi mới (yêu cầu auth, status mặc định `pending`) |
| `PUT` | `/:id` | Cập nhật đồ chơi (yêu cầu auth + là owner) |
| `PUT` | `/:id/moderate` | Admin duyệt/từ chối đồ chơi |
| `DELETE` | `/:id` | Xóa đồ chơi |

### Borrow Requests (`/api/borrows`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/` | Tạo yêu cầu mượn (toyId, borrowerId, dueDate) |
| `GET` | `/history` | Lịch sử mượn đồ toàn bộ |
| `GET` | `/my-borrows` | Đồ tôi đang mượn (query param `userId`) |
| `GET` | `/incoming-requests` | Yêu cầu gửi tới tôi (query param `userId`) |
| `PUT` | `/:requestId/approve` | Chủ đồ chơi duyệt yêu cầu mượn |
| `PUT` | `/:requestId/reject` | Chủ đồ chơi từ chối yêu cầu mượn |
| `PATCH` | `/:requestId/confirm-deposit` | Chủ đồ xác nhận nhận cọc → chuyển status sang `borrowing` |
| `PATCH` | `/:requestId/confirm-return` | Chủ đồ xác nhận nhận lại đồ + hoàn cọc → status `returned` |

### Admin Legacy APIs (trong `App.js`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/admin/stats` | Thống kê tổng quan (totalToys, totalUsers, availableToys, borrowedToys) |
| `DELETE` | `/api/admin/toys/:id` | Admin gỡ bài đăng vi phạm |

---

## 📊 Mô hình dữ liệu

### User
| Trường | Kiểu | Mô tả |
|---|---|---|
| `name` | String | Tên người dùng (bắt buộc) |
| `email` | String | Email (bắt buộc, duy nhất) |
| `passwordHash` | String | Mật khẩu (lưu dạng plaintext trong DB) |
| `phone` | String | Số điện thoại (bắt buộc) |
| `address` | String | Địa chỉ |
| `avatar` | String | URL ảnh đại diện |
| `rating` | Object | `{ avg: Number, count: Number }` — Điểm đánh giá |
| `role` | String | Vai trò: `user` \| `admin` (mặc định: `user`) |
| `timestamps` | Auto | `createdAt`, `updatedAt` tự động |

### Toy
| Trường | Kiểu | Mô tả |
|---|---|---|
| `ownerId` | ObjectId → User | Chủ sở hữu (bắt buộc) |
| `name` | String | Tên đồ chơi (bắt buộc) |
| `description` | String | Mô tả chi tiết |
| `category` | String | Danh mục (Giáo dục, Công nghệ, Gia đình, Khoa học...) |
| `ageRange` | String | Độ tuổi phù hợp (bắt buộc) |
| `condition` | String | Tình trạng: `new` \| `used` (bắt buộc) |
| `images` | [String] | Mảng URL/Base64 ảnh đồ chơi |
| `status` | String | `available` \| `borrowed` \| `unavailable` \| `pending` \| `approved` \| `rejected` (mặc định: `pending`) |
| `depositRequired` | Number | Tiền cọc yêu cầu (VNĐ, mặc định: 0) |
| `location` | String | Vị trí |
| `timestamps` | Auto | `createdAt`, `updatedAt` tự động |

### BorrowRequest
| Trường | Kiểu | Mô tả |
|---|---|---|
| `toyId` | ObjectId → Toy | Đồ chơi được mượn (bắt buộc) |
| `ownerId` | ObjectId → User | Chủ sở hữu đồ chơi (bắt buộc) |
| `borrowerId` | ObjectId → User | Người mượn (bắt buộc) |
| `status` | String | `pending` \| `approved` \| `rejected` \| `borrowing` \| `returned` \| `overdue` \| `cancelled` |
| `depositStatus` | String | Trạng thái cọc: `pending` \| `paid` \| `refunded` |
| `requestDate` | Date | Ngày gửi yêu cầu |
| `approvedDate` | Date | Ngày được duyệt |
| `dueDate` | Date | Hạn trả (bắt buộc) |
| `returnDate` | Date | Ngày trả thực tế |
| `note` | String | Ghi chú kèm theo |
| `timestamps` | Auto | `createdAt`, `updatedAt` tự động |

---

## 🔐 Phân quyền người dùng

Hệ thống có 2 vai trò chính:

| Quyền | User | Admin |
|---|:---:|:---:|
| Đăng ký / Đăng nhập | ✅ | ✅ |
| Xem đồ chơi trên trang chủ | ✅ | ❌ (chuyển thẳng Dashboard) |
| Lọc đồ chơi theo độ tuổi & danh mục | ✅ | ❌ |
| Đăng đồ chơi mới (chờ duyệt) | ✅ | ❌ |
| Quản lý đồ chơi cá nhân (CRUD) | ✅ | ❌ |
| Gửi yêu cầu mượn đồ chơi | ✅ | ❌ |
| Duyệt/từ chối yêu cầu mượn (đồ của mình) | ✅ | ❌ |
| Dashboard thống kê hệ thống | ❌ | ✅ |
| Kiểm duyệt bài đăng đồ chơi (approve/reject) | ❌ | ✅ |
| Quản lý vai trò người dùng | ❌ | ✅ |
| Khóa / Mở khóa tài khoản | ❌ | ✅ |

> Admin đăng nhập sẽ được chuyển thẳng vào Admin Dashboard, không truy cập được trang Home/MyToys/Requests.

---

## 🎨 Giao diện người dùng

### Các trang chính

#### Phía User
- **Trang chủ (Home)**: Hero section + bộ lọc 2 hàng (độ tuổi, danh mục) + grid đồ chơi dạng card với ảnh, tag, tiền cọc, nút "Mượn ngay"
- **Đăng nhập (Login)**: Layout 2 cột — banner "Sharing Joy" bên trái + form đăng nhập bên phải (hỗ trợ Google/Facebook placeholder)
- **Đăng ký (Register)**: Layout 2 cột — giới thiệu Safe Community/Eco-friendly/Zero-cost bên trái + form đăng ký bên phải
- **Đồ chơi của tôi (My Toys)**: 3 KPI cards (Tổng, Đang cho mượn, Điểm uy tín) + bảng danh sách đồ chơi + nút Sửa/Xóa + Modal đăng/sửa
- **Quản lý yêu cầu (Requests)**: 2 tab — "Yêu cầu gửi tới tôi" và "Đồ đang mượn" dạng card grid

#### Phía Admin
- **Admin Dashboard**: Sidebar trái + 4 thẻ thống kê + biểu đồ đường (Chart.js) + thao tác nhanh
- **Phân quyền người dùng (Role Management)**: Sidebar + 4 thẻ thống kê + bộ lọc tìm kiếm + bảng user với nút đổi vai trò/khóa tài khoản
- **Kiểm soát bài đăng (Toy Moderation)**: Sidebar + 3 thẻ thống kê + 4 tab lọc (Chờ duyệt/Sẵn sàng/Đang mượn/Bị từ chối) + grid card đồ chơi với nút Phê duyệt/Từ chối

### Thiết kế
- **Tone màu chủ đạo**: Cam đất ấm (`#be6e15` → `#9c570b`), nền kem pastel (`#fcf8f4`)
- **Font chữ**: Lexend (Google Fonts)
- **Card-based layout**: Bo góc lớn (28px), hover effect nhấc nhẹ
- **Status badges**: Màu sắc phân biệt theo trạng thái (Sẵn sàng/Đang mượn/Chờ duyệt/Bị từ chối)
- **Modal form**: Đăng/sửa đồ chơi với upload ảnh từ máy tính (Base64)
- **Admin Navbar riêng**: Nền tối (`#1e293b`), badge "ADMIN PANEL"

---

## 📝 Luồng hoạt động chính

### 1. Đăng đồ chơi
```
User đăng đồ chơi mới (nhập tên, danh mục, độ tuổi, tình trạng, tiền cọc, ảnh)
→ Trạng thái: pending
→ Admin vào trang "Kiểm soát bài đăng" duyệt
→ Phê duyệt → Trạng thái chuyển thành: available (hiển thị trên trang chủ)
→ Từ chối → Trạng thái chuyển thành: rejected
```

### 2. Mượn đồ chơi
```
User nhấn "Mượn ngay" trên trang chủ
→ Tạo BorrowRequest (status: pending, depositStatus: pending)
→ Chủ đồ chơi vào tab "Yêu cầu gửi tới tôi" để duyệt
→ Xác nhận → Request status: approved
→ Chủ đồ xác nhận nhận cọc → Request status: borrowing, Toy status: borrowed
→ Chủ đồ xác nhận trả đồ + hoàn cọc → Request status: returned, Toy status: available
```

### 3. Quản trị (Admin)
```
Admin đăng nhập → Chuyển thẳng vào Dashboard
→ Xem thống kê tổng quan (Users, Toys, Active Loans, Pending)
→ Duyệt bài đăng đồ chơi mới
→ Quản lý phân quyền (đổi user ↔ admin, khóa/mở khóa)
```

---

## 👥 Thành viên dự án

Dự án SDN302 - FPT University

---

## 📄 License

ISC