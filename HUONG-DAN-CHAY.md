# Hướng dẫn chạy ToyShare (MERN)

Hướng dẫn chạy dự án từ đầu, kèm tạo dữ liệu mẫu THẬT. Làm theo đúng thứ tự.

## 0. Yêu cầu cài sẵn
- **Node.js** v18+ (đang dùng v24).
- **MongoDB** chạy local tại `mongodb://localhost:27017` (cài MongoDB Community, hoặc dùng MongoDB Atlas rồi sửa `MONGO_URI`).
- Mở **2 cửa sổ terminal** (1 cho backend, 1 cho frontend).

---

## 1. Cài đặt thư viện

```bash
# Backend
cd toy-sharing-backend
npm install

# Frontend (mở terminal khác, hoặc cd .. rồi vào)
cd ../toy-sharing-frontend
npm install
```

---

## 2. Cấu hình môi trường (backend)

File `toy-sharing-backend/.env`. Nếu chưa có, copy từ mẫu:

```bash
cd toy-sharing-backend
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
```

Các biến quan trọng (có thể để mặc định khi chạy local):

| Biến | Bắt buộc? | Ghi chú |
|---|---|---|
| `MONGO_URI` | Có | `mongodb://localhost:27017/toy_sharing` |
| `JWT_SECRET` | Có | Chuỗi bí mật bất kỳ |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Nên | Tài khoản admin khởi tạo. Mặc định `admin@toyshare.com` / `admin123` |
| `ADMIN_BANK_ID` / `ADMIN_BANK_ACCOUNT` / `ADMIN_BANK_NAME` | Khi dùng cọc | Để sinh mã VietQR nhận cọc. Chưa điền thì màn QR báo "chưa cấu hình". |
| `EMAIL_USER` / `EMAIL_PASS` | Khi dùng email | Gmail + App Password. **Nếu để trống:** tài khoản mới được kích hoạt ngay (bỏ qua xác thực email) để app vẫn chạy. |
| `GOOGLE_CLIENT_ID` + FE `VITE_GOOGLE_CLIENT_ID` | Khi dùng đăng nhập Google | Lấy từ Google Cloud Console. |
| `CLIENT_URL` | Không | URL frontend chèn vào email, mặc định `http://localhost:5173`. |

> Frontend: nếu backend KHÔNG chạy ở `http://localhost:5000`, tạo file `toy-sharing-frontend/.env` với `VITE_API_URL=http://<host>:<port>`.

---

## 3. Tạo dữ liệu mẫu THẬT (seed)

Chạy **sau khi** MongoDB đã bật (backend không cần chạy khi seed):

```bash
cd toy-sharing-backend
npm run seed          # tạo dữ liệu demo (bỏ qua nếu đã có)
# hoặc tạo lại từ đầu (xoá demo cũ rồi seed mới):
npm run seed:fresh
```

Seed tạo: ~28 người dùng, ~90 đồ chơi (có ảnh thật), ~72 lượt mượn đủ mọi trạng thái, đánh giá 2 chiều, tin nhắn chat, thông báo, voucher, báo cáo vi phạm.

**Tài khoản sau khi seed:**
- Người dùng: `user1@demo.toyshare.vn` … `user28@demo.toyshare.vn` — mật khẩu `123456`
- Admin: `admin@toyshare.com` — mật khẩu `admin123` (hoặc `ADMIN_PASSWORD`)

---

## 4. Chạy ứng dụng

```bash
# Terminal 1 — Backend
cd toy-sharing-backend
npm run dev        # auto-reload (hoặc: npm start)

# Terminal 2 — Frontend
cd toy-sharing-frontend
npm run dev
```

- Backend: **http://localhost:5000**
- Frontend: **http://localhost:5173**  ← mở trình duyệt vào đây

---

## 5. Thử nhanh các luồng
- Đăng nhập **admin** → xem Dashboard (biểu đồ số liệu thật), Phân quyền, Kiểm soát bài đăng, Danh mục, Voucher, Báo cáo, Lượt mượn, Tiền cọc.
- Đăng nhập **user1** → Trang chủ (lọc theo danh mục), mở 1 đồ chơi, gửi yêu cầu mượn.
- Vào **Quản lý yêu cầu** để đi qua luồng: duyệt → đóng cọc (VietQR) → giao đồ → kiểm tra & nhận lại → đánh giá 2 chiều.
- Áp **voucher giảm cọc** ở bước thanh toán cọc (ví dụ `DEMO25`).

---

## 6. Lệnh hữu ích khác (trong `toy-sharing-backend`)

```bash
npm run test:e2e        # chạy 3 bộ kiểm thử end-to-end (cần backend đang chạy)
npm run cleanup         # xem trước dữ liệu TEST rác (không xoá)
npm run cleanup:apply   # xoá dữ liệu test rác (KHÔNG đụng dữ liệu demo)
npm run seed:fresh      # tạo lại dữ liệu demo
```

---

## 7. Lỗi thường gặp
- **EADDRINUSE :5000** → cổng đang bị chiếm. Windows: `netstat -ano | findstr :5000` rồi `taskkill /PID <pid> /F`.
- **MongoServerError / không kết nối được** → MongoDB chưa chạy. Bật service MongoDB hoặc kiểm tra `MONGO_URI`.
- **Ảnh đồ chơi không hiện** → ảnh demo lấy từ internet (loremflickr), cần có mạng; nếu offline, thẻ đồ chơi tự hiện ảnh thay thế theo danh mục.
- **Đăng nhập báo "Email chưa xác thực"** → bạn đã cấu hình `EMAIL_*`, hãy mở email bấm liên kết, hoặc dùng tài khoản seed (đã xác thực sẵn).
- **Màn QR cọc báo "chưa cấu hình"** → điền `ADMIN_BANK_*` trong `.env`.
