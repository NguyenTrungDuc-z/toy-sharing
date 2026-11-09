# ToyShare - Hệ Thống Thiết Kế UI/UX Pro Max (Design System Master)

> **Tiêu chuẩn thiết kế:** Được trích xuất và áp dụng từ [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
> **Ngành hàng:** Nền tảng Chia sẻ & Thuê Đồ Chơi Trẻ Em P2P (Kids & Family Marketplace)
> **Phong cách:** Modern Warm Playful & Trustworthy (Vibrant & Block-based / Soft UI Evolution)

---

## 🎨 1. Hệ Màu Chuẩn Hóa (Semantic Color Tokens)

| Vai trò | Hex Code | Biến CSS | Độ tương phản (WCAG) | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `#EA580C` | `--color-primary` | 3.56:1 (Large text / UI) | Màu nhận diện thương hiệu cam đất năng động, vui tươi |
| **Primary Hover** | `#C2410C` | `--color-primary-hover` | **5.18:1 (WCAG AA)** | Trạng thái hover, text liên kết chính |
| **Primary Light** | `#FFF7ED` | `--color-primary-light` | — | Nền thẻ active, sub-filter chips, icon pill |
| **Primary Border**| `#FED7AA` | `--color-primary-border`| — | Đường viền thẻ nổi bật, focus ring |
| **On Primary** | `#FFFFFF` | `--color-on-primary` | — | Màu chữ / icon trên nền Primary |
| **Accent / Escrow**| `#16A34A` | `--color-accent` | 3.30:1 | Màu giao dịch ký quỹ VietQR, duyệt đơn, thành công |
| **Accent Hover** | `#15803D` | `--color-accent-hover` | **5.02:1 (WCAG AA)** | Trạng thái hover nút giao dịch, text xác nhận |
| **Accent Light** | `#F0FDF4` | `--color-accent-light` | — | Nền thông báo an toàn, badge hoàn tất |
| **Accent Border**| `#BBF7D0` | `--color-accent-border`| — | Viền thẻ ký quỹ an toàn |
| **Warning** | `#D97706` | `--color-warning` | 3.19:1 | Badge chờ duyệt, cần chú ý |
| **Warning Dark** | `#92400E` | `--color-warning-text` | **7.31:1 (WCAG AAA)** | Text thông báo trạng thái chờ duyệt |
| **Warning Light**| `#FFFBEB` | `--color-warning-light`| — | Hộp cảnh báo / thông tin chờ chủ đồ duyệt |
| **Destructive** | `#DC2626` | `--color-destructive` | **4.65:1 (WCAG AA)** | Nút từ chối, huỷ yêu cầu, xoá đồ chơi, khiếu nại |
| **Destructive Light**| `#FEF2F2`| `--color-destructive-light`| — | Nền cảnh báo lỗi, đơn bị từ chối |
| **Background** | `#FFFDF9` | `--color-background` | — | Nền toàn trang kem sứ ấm áp, chống mỏi mắt |
| **Foreground** | `#1C1917` | `--color-foreground` | **17.2:1 (WCAG AAA)**| Màu chữ tiêu đề và nội dung chính |
| **Muted Text** | `#57534E` | `--color-muted-foreground` | **7.51:1 (WCAG AAA)** | Chữ phụ, mô tả ngắn, metadata, ngày tháng |
| **Muted Surface**| `#F6F1EA` | `--color-muted` | — | Nền khối tìm kiếm, bảng phụ, avatar placeholder |
| **Card Surface** | `#FFFFFF` | `--color-card` | — | Mặt thẻ đồ chơi, modal trắng tinh khiết |
| **Border / Divider**| `#EDE4DC` | `--color-border` | — | Đường phân chia tinh tế, không dùng màu xám lạnh |

---

## 🔤 2. Typography Chuẩn Hóa

- **Phông chữ chủ đạo:** `'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - *Đặc tính Lexend:* Được nghiên cứu khoa học tại viện giáo dục nhằm tăng tốc độ đọc và khả năng nhận diện ký tự cho phụ huynh và trẻ em, bo tròn thân thiện, hiện đại.
- **Thang kích thước & Trọng lượng:**
  - `Display / Hero Title`: 36px – 42px | Weight: 800 (Extra Bold) | Line-height: 1.25
  - `Heading 2`: 24px – 28px | Weight: 700 (Bold) | Line-height: 1.35
  - `Heading 3`: 18px – 20px | Weight: 700 (Bold) | Line-height: 1.4
  - `Body / Subtitle`: 14px – 15px | Weight: 400 (Regular) & 500 (Medium) | Line-height: 1.55
  - `Caption / Badge`: 11px – 13px | Weight: 600 (Semi-Bold) | Line-height: 1.4

---

## 📐 3. Không Gian & Bo Góc (Spacing & Radius)

- **Bo góc (Border Radius):**
  - `--radius-sm: 8px;` (Tag nhỏ, ô input phụ)
  - `--radius-md: 14px;` (Ô nhập liệu, menu dropdown)
  - `--radius-lg: 22px;` (Card đồ chơi, khối chức năng)
  - `--radius-full: 9999px;` (Pill buttons, Filter chips, Avatar)
- **Đổ bóng phân tầng (Multi-layer Elevation):**
  - `--shadow-sm: 0 1px 3px rgba(41, 37, 36, 0.04);`
  - `--shadow-md: 0 4px 16px rgba(41, 37, 36, 0.06);` (Card hover)
  - `--shadow-primary: 0 4px 14px rgba(234, 88, 12, 0.25);` (Nút bấm chính)
  - `--shadow-accent: 0 4px 14px rgba(22, 163, 74, 0.22);` (Nút thanh toán / cọc)

---

## 🔘 4. Quy Chuẩn Thành Phần Giao Diện (Component Specs)

### 1. Nút bấm chính (Primary Button - Mượn ngay / Lưu):
- Nền: `var(--color-primary)` (`#EA580C`)
- Chữ: `#FFFFFF` (Font weight: 600)
- Bo góc: `9999px` (dạng viên thuốc thân thiện)
- Hover: Nhấc nhẹ `translateY(-1px)` và chuyển sang `var(--color-primary-hover)` (`#C2410C`) trong 180ms.

### 2. Nút phụ (Secondary Button):
- Nền: `var(--color-primary-light)` (`#FFF7ED`)
- Chữ: `var(--color-primary-hover)` (`#C2410C`)
- Viền: `1px solid var(--color-primary-border)` (`#FED7AA`)
- Hover: Nền `#FFEDD5`, viền `#FDBA74`.

### 3. Nút giao dịch / Hoàn tất (Accent Button):
- Nền: `var(--color-accent)` (`#16A34A`)
- Chữ: `#FFFFFF`
- Viền: Không viền, bóng xanh dịu `var(--shadow-accent)`
- Hover: `var(--color-accent-hover)` (`#15803D`).

### 4. Thẻ Đồ Chơi (Toy Card):
- Nền: `#FFFFFF`, Viền `1px solid var(--color-border)`
- Khi di chuột: `translateY(-4px)`, bóng đổ mở rộng `var(--shadow-md)`, viền ánh cam `var(--color-primary-border)`.

---

## ✅ 5. Pre-Delivery Checklist Đạt Chuẩn UI/UX Pro Max
- [x] Không xung đột màu sắc giữa các trang (loại bỏ màu ngẫu nhiên `#85581A`, `#be6e15`, `#e2e4ff`).
- [x] Tỷ lệ tương phản chữ đen trên nền sáng đạt trên 7:1 (vượt mức WCAG AAA).
- [x] Mọi tương tác click có con trỏ `cursor: pointer` và hiệu ứng chuyển động mượt mà (150ms - 200ms).
- [x] Có phản hồi trạng thái rõ ràng (Loading, Empty state, Toast thông báo, Hover elevation).
- [x] Bố cục thích ứng mượt mà trên mọi độ phân giải màn hình.
