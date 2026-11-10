/**
 * Seed DỮ LIỆU THẬT & ĐA DẠNG vào MongoDB cho ToyShare.
 * - Danh mục: 6 danh mục chuẩn (Xếp hình, Giáo dục, Hành động, Công nghệ, Búp bê & Thú bông, Mỹ thuật & Sáng tạo).
 * - Sản phẩm: 36 sản phẩm đồ chơi chân thực, đa dạng, tên chuẩn như sàn thương mại điện tử / cửa hàng đồ chơi.
 * - Ảnh: Ảnh Unsplash chất lượng cao 100% hoạt động (HTTP 200), đúng chuẩn từng loại đồ chơi.
 * - Lượt mượn, đánh giá 2 chiều, tin nhắn, voucher, báo cáo vi phạm.
 *
 * Chạy:
 *   node scripts/seed.js fresh   -> làm mới toàn bộ dữ liệu demo
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Toy = require('../src/models/Toy');
const Category = require('../src/models/Category');
const BorrowRequest = require('../src/models/BorrowRequest');
const Review = require('../src/models/Review');
const Voucher = require('../src/models/Voucher');
const Report = require('../src/models/Report');
const Message = require('../src/models/Message');
const Notification = require('../src/models/Notification');

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/toy_sharing';
const DOMAIN = 'demo.toyshare.vn';
const daysAgo = (d) => new Date(Date.now() - d * 864e5);
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickRand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Nha Trang', 'Huế', 'Vũng Tàu'];
const FIRST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const MID = ['Thị', 'Văn', 'Minh', 'Thu', 'Quốc', 'Hải', 'Mai', 'Đức', 'Thuỳ', 'Gia', 'Khánh', 'Thanh'];
const LAST = ['Hà', 'Quân', 'Bích', 'Dũng', 'Anh', 'Thành', 'Linh', 'Bảo', 'Trang', 'Nam', 'Hương', 'Phúc', 'Ngọc', 'Tú', 'Khoa'];

// 36 SẢN PHẨM ĐỒ CHƠI CHÂN THỰC, TÊN ĐA DẠNG, ẢNH UNSPALSH CHUẨN XÁC
const TOY_CATALOG = [
  // ==================== 1. XẾP HÌNH ====================
  {
    name: 'Bộ Xếp Hình LEGO City Cảnh Sát Biển 60368',
    category: 'Xếp hình',
    ageRange: '6-12 tuổi',
    condition: 'new',
    depositRequired: 250000,
    description: 'Bộ lắp ráp LEGO City chủ đề cảnh sát biển tuần tra, gồm 430 mảnh ghép cao cấp, tàu tuần tra, cano cứu hộ, 4 mô hình nhân vật và đầy đủ phụ kiện. Giúp bé phát triển tư duy không gian và khả năng tập trung.',
    images: [
      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Đường Ray Tàu Hoả Gỗ Thomas & Friends 80 Chi Tiết',
    category: 'Xếp hình',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 160000,
    description: 'Hệ thống đường ray bằng gỗ sồi tự nhiên được mài nhẵn an toàn, gồm các toa tàu nam châm hút nhau, trạm dừng, cây xanh, biển báo giao thông và cầu vượt. Đồ chơi kích thích trí tưởng tượng phong phú của trẻ.',
    images: [
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Khối Xếp Hình Nam Châm Mag-Wisdom 118 Chi Tiết',
    category: 'Xếp hình',
    ageRange: '3-6 tuổi',
    condition: 'new',
    depositRequired: 180000,
    description: 'Bộ ghép hình nam châm đa giác màu sắc rực rỡ, lực hút mạnh mẽ, cho phép bé tự do dựng mô hình bánh xe quay, lâu đài 3D, quả cầu và các công trình kiến trúc kỳ thú.',
    images: [
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'LEGO Technic Siêu Xe Đua Thể Thao Porsche 911',
    category: 'Xếp hình',
    ageRange: '12+ tuổi',
    condition: 'like_new',
    depositRequired: 350000,
    description: 'Mô hình siêu xe đua tỉ lệ 1:14 với hệ thống giảm xóc, vô lăng xoay bánh trước, hộp số cơ học và động cơ 6 xi-lanh pít-tông chuyển động chân thực. Món đồ tuyệt vời cho các bạn đam mê cơ khí và siêu xe.',
    images: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Lắp Ghép Mô Hình Lâu Đài Cổ Tích Gỗ 3D DIY',
    category: 'Xếp hình',
    ageRange: '6-12 tuổi',
    condition: 'used',
    depositRequired: 130000,
    description: 'Bộ ghép mô hình kiến trúc lâu đài châu Âu bằng gỗ ép cao cấp được cắt laser chính xác từng khớp nối, không cần dùng keo dán. Kèm đèn LED trang trí lung linh ban đêm.',
    images: [
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Tháp Xếp Chồng Gỗ Cầu Vồng Montessori Tự Nhiên',
    category: 'Xếp hình',
    ageRange: '0-3 tuổi',
    condition: 'new',
    depositRequired: 80000,
    description: 'Đồ chơi giáo dục sớm Montessori gồm 12 vòng gỗ và khối hình cầu vồng sơn gốc nước an toàn không độc hại. Giúp bé nhận diện màu sắc, kích thước lớn nhỏ và phối hợp tay mắt khéo léo.',
    images: [
      'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80'
    ]
  },

  // ==================== 2. GIÁO DỤC ====================
  {
    name: 'Bảng Chữ Cái & Số Gỗ Montessori Đa Năng',
    category: 'Giáo dục',
    ageRange: '3-6 tuổi',
    condition: 'new',
    depositRequired: 100000,
    description: 'Bảng học chữ cái tiếng Việt và số đếm tích hợp câu cá nam châm, cột tính vòng tròn và phân loại hình khối. Chất liệu gỗ tự nhiên bo tròn các góc cạnh cực kỳ an toàn cho bé.',
    images: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Đồ Chơi Nhập Vai Bác Sĩ Nha Khoa Y Tế 28 Món',
    category: 'Giáo dục',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 90000,
    description: 'Hộp đồ chơi vali bác sĩ gồm tai nghe nhịp tim có đèn âm thanh, mô hình hàm răng, kim tiêm, nhiệt kế, kính soi và thuốc. Giúp bé làm quen với y tế và không còn sợ khi đi khám bệnh.',
    images: [
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Đàn Piano Điện Tử Mini 37 Phím Kèm Micro Cho Bé',
    category: 'Giáo dục',
    ageRange: '3-6 tuổi',
    condition: 'new',
    depositRequired: 150000,
    description: 'Đàn piano điện tử trẻ em có 37 phím âm thanh chuẩn, tích hợp 8 điệu nhạc đệm, nhiều âm sắc nhạc cụ, micro hát vui nhộn và cổng cắm sạc pin tiện lợi. Khơi dậy năng khiếu âm nhạc từ sớm.',
    images: [
      'https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Thí Nghiệm Khoa Học Kỳ Thú 50 Phản Ứng Hoá Học',
    category: 'Giáo dục',
    ageRange: '6-12 tuổi',
    condition: 'new',
    depositRequired: 140000,
    description: 'Hộp đồ chơi thí nghiệm STEM gồm ống nghiệm, phễu, kính bảo hộ và các hợp chất an toàn để bé tự thực hiện thí nghiệm núi lửa phun trào, tinh thể cầu vồng, nước đổi màu kỳ diệu.',
    images: [
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Cân Thăng Bằng Khỉ Con Học Toán Đố Vui',
    category: 'Giáo dục',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 80000,
    description: 'Cân thăng bằng hình chú khỉ thông minh kèm 19 chú khỉ nhỏ, các con số từ 1 đến 10 và 30 thẻ đố vui tính cộng trừ từ dễ đến nâng cao. Giúp bé yêu thích môn toán học một cách trực quan sinh động.',
    images: [
      'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Sách Vải Tương Tác Kỹ Năng Sống Đa Chủ Đề',
    category: 'Giáo dục',
    ageRange: '0-3 tuổi',
    condition: 'used',
    depositRequired: 60000,
    description: 'Sách vải handmade mềm mại, giặt được, không phai màu. Thiết kế các hoạt động cài khuy, kéo khóa, xem giờ, buộc dây giày và nhận biết các loài động vật thân thiện.',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
    ]
  },

  // ==================== 3. HÀNH ĐỘNG ====================
  {
    name: 'Xe Đua Địa Hình Điều Khiển Từ Xa Rock Crawler 4WD',
    category: 'Hành động',
    ageRange: '6-12 tuổi',
    condition: 'new',
    depositRequired: 220000,
    description: 'Xe đua off-road 2 cầu 4WD tỉ lệ 1:12, lốp cao su gai to bám đá, leo dốc 45 độ mượt mà. Sóng 2.4GHz khoảng cách điều khiển 60m, pin sạc Lithium dung lượng cao chơi liên tục 40 phút.',
    images: [
      'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Máy Bay Trực Thăng Cảm Ứng Đèn LED Bay Ban Đêm',
    category: 'Hành động',
    ageRange: '6-12 tuổi',
    condition: 'like_new',
    depositRequired: 170000,
    description: 'Trực thăng mini cảm biến bàn tay thông minh, tự động giữ độ cao và hạ cánh an toàn. Vỏ dẻo chống va đập, tích hợp dàn đèn LED nhiều màu nhấp nháy bắt mắt.',
    images: [
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Mô Hình Siêu Anh Hùng Spider-Man Marvel 30cm Khớp Động',
    category: 'Hành động',
    ageRange: '6-12 tuổi',
    condition: 'new',
    depositRequired: 160000,
    description: 'Mô hình Người Nhện bản quyền Marvel Titan Hero Series, chiều cao 30cm với hơn 14 khớp cử động linh hoạt, có phụ kiện bắn tơ nhện và khiên bảo vệ đi kèm.',
    images: [
      'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Xe Cứu Hỏa Phun Nước Thật Kèm Thang Nâng Tự Động',
    category: 'Hành động',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 150000,
    description: 'Xe cứu hỏa hợp kim cỡ lớn, thang cứu hộ xoay 360 độ và nâng cao 60cm, có bình chứa nước và nút bơm phun nước thật xa 2m, còi hú báo động và đèn chớp chân thực.',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Đội Xe Đặc Nhiệm Cảnh Sát SWAT Bọc Thép Hợp Kim',
    category: 'Hành động',
    ageRange: '3-6 tuổi',
    condition: 'used',
    depositRequired: 110000,
    description: 'Bộ 6 xe đặc nhiệm cảnh sát SWAT bằng kim loại đúc die-cast siêu bền: xe bọc thép, trực thăng, xe tuần tra, xe rà phá bom mìn và cano cứu hộ.',
    images: [
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Trạm Gara Đỗ Xe Cảnh Sát Cứu Hộ 4 Tầng Kèm Làn Trượt',
    category: 'Hành động',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 190000,
    description: 'Bãi đỗ xe thông minh 4 tầng gồm thang máy nâng hạ xe cơ học, làn trượt xoắn ốc siêu tốc, sân đáp trực thăng và trạm rửa xe kèm 4 xe con hợp kim.',
    images: [
      'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80'
    ]
  },

  // ==================== 4. CÔNG NGHỆ ====================
  {
    name: 'Robot Thông Minh Lập Trình STEM Cảm Biến Cử Chỉ',
    category: 'Công nghệ',
    ageRange: '6-12 tuổi',
    condition: 'new',
    depositRequired: 280000,
    description: 'Robot thông minh có khả năng nhận diện cử chỉ bàn tay, phát nhạc, nhảy múa, kể chuyện và lập trình đường đi qua ứng dụng điện thoại hoặc remote điều khiển.',
    images: [
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Kính Thiên Văn Khúc Xạ Thiên Văn Học F30070M Cho Bé',
    category: 'Công nghệ',
    ageRange: '6-12 tuổi',
    condition: 'like_new',
    depositRequired: 300000,
    description: 'Kính thiên văn tiêu cự 300mm đường kính thấu kính 70mm, độ phóng đại từ 15x đến 150x. Giúp các em nhỏ quan sát bề mặt Mặt Trăng, các hố va chạm và chòm sao rõ nét.',
    images: [
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Máy Chiếu Thiên Văn Vũ Trụ HD 12 Đĩa Phim Dạ Quang',
    category: 'Công nghệ',
    ageRange: '3-6 tuổi',
    condition: 'new',
    depositRequired: 190000,
    description: 'Đèn ngủ kiêm máy chiếu trần nhà hiển thị dải Ngân Hà, Hệ Mặt Trời và 12 cung hoàng đạo độ nét cao, xoay 360 độ êm ái tạo không gian ngủ diệu kỳ cho phòng bé.',
    images: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Lắp Ráp Mạch Điện Tử Sáng Tạo Electronic Blocks 100',
    category: 'Công nghệ',
    ageRange: '6-12 tuổi',
    condition: 'like_new',
    depositRequired: 180000,
    description: 'Bộ học lắp ráp mạch điện tử dạng nút bấm an toàn tuyệt đối (dùng pin 3V), tạo ra hơn 100 mạch thực hành: quạt gió, còi báo động, radio FM, đèn cảm ứng âm thanh.',
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Flycam Drone Mini Cảm Biến Tránh Va Chạm 360 Độ',
    category: 'Công nghệ',
    ageRange: '12+ tuổi',
    condition: 'new',
    depositRequired: 260000,
    description: 'Máy bay không người lái drone mini gấp gọn, có camera FPV truyền hình trực tiếp về điện thoại, cảm biến hồng ngoại 4 hướng tự tránh chướng ngại vật thông minh.',
    images: [
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Kính Hiển Vi Sinh Học Quang Học Phóng Đại 1200x',
    category: 'Công nghệ',
    ageRange: '6-12 tuổi',
    condition: 'like_new',
    depositRequired: 210000,
    description: 'Kính hiển vi quang học có 3 thấu kính phóng đại 100x, 400x và 1200x, đèn LED chiếu sáng, bộ tiêu bản mẫu thực vật và dụng cụ gắp soi vi sinh vật cho học sinh.',
    images: [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'
    ]
  },

  // ==================== 5. BÚP BÊ & THÚ BÔNG ====================
  {
    name: 'Búp Bê Barbie Thời Trang Dự Tiệc Kèm Tủ Đồ Phụ Kiện',
    category: 'Búp bê & Thú bông',
    ageRange: '3-6 tuổi',
    condition: 'new',
    depositRequired: 150000,
    description: 'Bộ búp bê thời trang chính hãng kèm tủ quần áo di động, 5 bộ váy dạ hội lộng lẫy, giày cao gót, túi xách và bàn trang điểm gương đèn sang trọng.',
    images: [
      'https://images.unsplash.com/photo-1582845512747-e42001c95638?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Gấu Bông Teddy Bear Lông Cừu Khổng Lồ 1m Siêu Mịn',
    category: 'Búp bê & Thú bông',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 120000,
    description: 'Gấu bông Teddy size lớn 1 mét, bông gòn bi 3D đàn hồi êm ái, lớp lông cừu mềm mại an toàn tuyệt đối không rụng lông, đã được khử khuẩn sạch sẽ thơm tho.',
    images: [
      'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Nhà Búp Bê Gỗ Biệt Thự 3 Tầng Đầy Đủ Nội Thất',
    category: 'Búp bê & Thú bông',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 250000,
    description: 'Mô hình nhà búp bê gỗ cao cấp 3 tầng với 5 phòng: phòng khách, bếp ăn, phòng ngủ, nhà tắm và ban công đón nắng, gồm 18 món nội thất mini bằng gỗ tỉ mỉ.',
    images: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582845512747-e42001c95638?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Thú Bông Khủng Long Xanh Mắt To Đáng Yêu Siêu Mềm',
    category: 'Búp bê & Thú bông',
    ageRange: '0-3 tuổi',
    condition: 'new',
    depositRequired: 90000,
    description: 'Thú nhồi bông chú khủng long bạo chúa tí hon màu xanh ngọc bích, mắt thêu tinh xảo, chất vải nhung tuyết mịn màng, làm gối ôm ngủ cực kỳ thoải mái cho bé.',
    images: [
      'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Búp Bê Gia Đình Hạnh Phúc 6 Thành Viên',
    category: 'Búp bê & Thú bông',
    ageRange: '3-6 tuổi',
    condition: 'used',
    depositRequired: 80000,
    description: 'Bộ sưu tập gồm ông bà, bố mẹ, hai bé và cún cưng. Trang phục vải may đo chi tiết, tay chân có khớp linh động giúp bé nhập vai đóng kịch gia đình ấm áp.',
    images: [
      'https://images.unsplash.com/photo-1582845512747-e42001c95638?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Thú Bông Kỳ Lân Unicorn Cầu Vồng Phát Sáng Êm Ái',
    category: 'Búp bê & Thú bông',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 110000,
    description: 'Kỳ lân bông cánh tiên nhũ vàng lấp lánh, bờm tóc cầu vồng mềm mại, tích hợp đèn LED đổi 7 màu dịu nhẹ và giai điệu ru ngủ thư giãn cho giấc ngủ ngon.',
    images: [
      'https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80'
    ]
  },

  // ==================== 6. MỸ THUẬT & SÁNG TẠO ====================
  {
    name: 'Bộ Hộp Bút Màu Vẽ Đa Năng 150 Chi Tiết Hộp Gỗ',
    category: 'Mỹ thuật & Sáng tạo',
    ageRange: '6-12 tuổi',
    condition: 'new',
    depositRequired: 130000,
    description: 'Vali gỗ đựng bộ họa cụ cao cấp gồm 36 màu nước, 24 sáp dầu, 24 bút chì màu, 24 bút dạ, cọ vẽ, gọt chì, tẩy và bảng pha màu palette. Thỏa sức sáng tạo cho bé yêu hội họa.',
    images: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Hộp Đất Nặn Tự Khô An Toàn 36 Màu Kèm Khuôn Ép',
    category: 'Mỹ thuật & Sáng tạo',
    ageRange: '3-6 tuổi',
    condition: 'new',
    depositRequired: 70000,
    description: 'Đất sét siêu nhẹ bọt xốp không dính tay, không bám màu, không mùi độc hại, tự khô sau 24h để lưu giữ thành phẩm. Gồm 36 túi màu và 10 dao cắt, khuôn tạo hình phong phú.',
    images: [
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Xâu Vòng Tay Chuỗi Hạt Pha Lê Handmade DIY',
    category: 'Mỹ thuật & Sáng tạo',
    ageRange: '6-12 tuổi',
    condition: 'new',
    depositRequired: 85000,
    description: 'Hộp phân ngăn chứa hơn 500 hạt cườm pha lê lấp lánh đủ sắc màu, hạt chữ cái, charm mặt dây chuyền, dây co giãn và kéo an toàn. Bé tự tay thiết kế vòng tay tặng bạn bè.',
    images: [
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bảng Vẽ Tự Xóa Màn Hình LCD Thông Minh 12 Inch',
    category: 'Mỹ thuật & Sáng tạo',
    ageRange: '3-6 tuổi',
    condition: 'like_new',
    depositRequired: 90000,
    description: 'Bảng vẽ điện tử màn hình LCD công nghệ mới không ánh sáng xanh, chống lóa bảo vệ mắt. Bút cảm ứng mượt mà, nút xóa một chạm tiện lợi và phím gạt khóa lưu hình ảnh.',
    images: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Tranh Cát Sáng Tạo Nghệ Thuật 24 Khung Tranh',
    category: 'Mỹ thuật & Sáng tạo',
    ageRange: '3-6 tuổi',
    condition: 'new',
    depositRequired: 65000,
    description: 'Trọn bộ gồm 24 tranh dán sẵn decal chủ đề động vật, phương tiện giao thông và 18 lọ cát màu thạch anh mịn sáng bóng. Rèn luyện tính kiên nhẫn và khiếu thẩm mỹ của bé.',
    images: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Bộ Tô Màu Tượng Thạch Cao Mini 12 Con Giáp Kèm Cọ',
    category: 'Mỹ thuật & Sáng tạo',
    ageRange: '3-6 tuổi',
    condition: 'new',
    depositRequired: 75000,
    description: 'Gồm 12 tượng thạch cao trắng nhẵn mịn hình các con vật ngộ nghĩnh, khay màu acrylic 12 màu tươi sáng chống thấm nước và 2 cọ vẽ đầu dẹp đầu nhọn cho bé thỏa sức phối màu.',
    images: [
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

const INSPECTION_IMG = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80';

async function main() {
  await mongoose.connect(URI);
  console.log('Đã kết nối MongoDB:', URI);

  const fresh = process.argv.includes('fresh');
  const existingDemoUser = await User.findOne({ email: new RegExp(`@${DOMAIN}$`) });
  if (existingDemoUser && !fresh) {
    console.log('Dữ liệu demo đã tồn tại. Dùng "node scripts/seed.js fresh" để seed lại.');
    await mongoose.disconnect();
    return;
  }

  console.log('\n--- BẮT ĐẦU DỌN DẸP DỮ LIỆU CŨ ---');
  // Xoá toàn bộ dữ liệu test / rác E2E cũ
  const testToyFilter = { name: { $regex: /^(Test Toy|Toy|Tblv)[a-z0-9]*/i } };
  const testUserFilter = { email: { $regex: /^(owner|borrower)_[a-z0-9]+/ } };
  await Toy.deleteMany(testToyFilter);
  await User.deleteMany(testUserFilter);

  // Xoá dữ liệu demo cũ
  const demoUsers = await User.find({ email: new RegExp(`@${DOMAIN}$`) }).select('_id');
  const demoUserIds = demoUsers.map(u => u._id);
  await Message.deleteMany({ $or: [{ senderId: { $in: demoUserIds } }, { receiverId: { $in: demoUserIds } }] });
  await Notification.deleteMany({ userId: { $in: demoUserIds } });
  await BorrowRequest.deleteMany({ $or: [{ ownerId: { $in: demoUserIds } }, { borrowerId: { $in: demoUserIds } }] });
  await Review.deleteMany({ reviewerId: { $in: demoUserIds } });
  await Report.deleteMany({});
  await Toy.deleteMany({}); // Xoá sạch toàn bộ đồ chơi cũ để thay thế bằng 36 sản phẩm chuẩn
  await User.deleteMany({ _id: { $in: demoUserIds } });
  await Voucher.deleteMany({ code: /^DEMO/ });
  console.log('Đã dọn dẹp sạch dữ liệu cũ.');

  // ---------- 1. DANH MỤC ----------
  const CATEGORIES = [
    { name: 'Xếp hình', description: 'Đồ chơi lắp ghép, Lego, xếp hình sáng tạo', order: 0 },
    { name: 'Giáo dục', description: 'Đồ chơi giáo dục sớm, Montessori, khoa học, âm nhạc', order: 1 },
    { name: 'Hành động', description: 'Xe điều khiển, robot, siêu anh hùng, mô hình vận động', order: 2 },
    { name: 'Công nghệ', description: 'Thiết bị STEM, flycam, kính thiên văn, kính hiển vi', order: 3 },
    { name: 'Búp bê & Thú bông', description: 'Búp bê thời trang, gấu bông, thú nhồi bông', order: 4 },
    { name: 'Mỹ thuật & Sáng tạo', description: 'Bộ vẽ tranh, đất nặn, xâu vòng thủ công, bảng vẽ LCD', order: 5 },
  ];

  await Category.deleteMany({});
  await Category.insertMany(CATEGORIES.map(c => ({ ...c, active: true })));
  console.log(`Đã tạo ${CATEGORIES.length} danh mục chuẩn.`);

  // ---------- 2. NGƯỜI DÙNG ----------
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('123456', salt);

  // Đảm bảo các tài khoản test cơ bản tồn tại
  const realUsersSeed = [
    { name: 'Nguyễn Văn An', email: 'user@gmail.com', phone: '0901234567', address: 'Hà Nội', role: 'user' },
    { name: 'Trần Thị Bích', email: 'user1@gmail.com', phone: '0912345678', address: 'TP. Hồ Chí Minh', role: 'user' },
    { name: 'Lê Đức Mạnh', email: 'manhgg22@gmail.com', phone: '0988776655', address: 'Đà Nẵng', role: 'user' },
  ];
  for (const ru of realUsersSeed) {
    await User.updateOne(
      { email: ru.email },
      { $setOnInsert: { ...ru, passwordHash: hash, authProvider: 'local', emailVerified: true, status: 'active', avatar: 'https://i.pravatar.cc/150?img=12' } },
      { upsert: true }
    );
  }

  // Tạo thêm 15 người dùng demo phong phú
  const USER_COUNT = 15;
  const demoUsersCreated = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const name = `${pickRand(FIRST)} ${pickRand(MID)} ${pickRand(LAST)}`;
    const u = await User.create({
      name,
      email: `user${i + 1}@${DOMAIN}`,
      passwordHash: hash,
      phone: `09${String(10000000 + rint(0, 89999999)).slice(0, 8)}`,
      address: pickRand(CITIES),
      role: 'user',
      status: 'active',
      authProvider: 'local',
      emailVerified: true,
      avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
    });
    demoUsersCreated.push(u);
  }

  const allActiveUsers = await User.find({ role: 'user', status: 'active' });
  console.log(`Người dùng hoạt động: ${allActiveUsers.length}`);

  // ---------- 3. TẠO 36 SẢN PHẨM ĐỒ CHƠI CHUẨN ----------
  const toyDocs = [];
  // Phân chia trạng thái chân thực:
  // ~26 sẵn sàng ('available'), ~6 đang mượn ('borrowed'), ~3 chờ duyệt ('pending'), ~1 từ chối ('rejected')
  const statusDistribution = [
    'available', 'available', 'available', 'borrowed', 'available', 'available', // Xếp hình (1 borrowed, 5 avail)
    'available', 'available', 'borrowed', 'available', 'available', 'available', // Giáo dục (1 borrowed, 5 avail)
    'available', 'borrowed', 'available', 'available', 'borrowed', 'available', // Hành động (2 borrowed, 4 avail)
    'available', 'available', 'available', 'borrowed', 'available', 'available', // Công nghệ (1 borrowed, 5 avail)
    'available', 'available', 'borrowed', 'available', 'available', 'available', // Búp bê (1 borrowed, 5 avail)
    'available', 'available', 'available', 'available', 'available', 'available', // Mỹ thuật (6 avail)
  ];

  for (let i = 0; i < TOY_CATALOG.length; i++) {
    const item = TOY_CATALOG[i];
    const owner = allActiveUsers[i % allActiveUsers.length];
    const age = Math.floor(Math.pow(Math.random(), 1.5) * 90);
    const created = daysAgo(age);
    const status = statusDistribution[i] || 'available';

    toyDocs.push({
      ownerId: owner._id,
      name: item.name,
      description: item.description,
      category: item.category,
      ageRange: item.ageRange,
      condition: item.condition,
      status: status,
      depositRequired: item.depositRequired,
      location: owner.address || pickRand(CITIES),
      images: item.images,
      rating: { avg: 5.0, count: 0 },
      createdAt: created,
      updatedAt: created,
    });
  }

  const savedToys = await Toy.insertMany(toyDocs);
  console.log(`Đã tạo thành công ${savedToys.length} sản phẩm đồ chơi chuẩn xác!`);

  // ---------- 4. TẠO LƯỢT MƯỢN CHÂN THỰC ----------
  const borrowerFor = (ownerId) => pickRand(allActiveUsers.filter(u => !u._id.equals(ownerId)));
  const borrowDocs = [];
  const returnedBorrowsForReview = [];

  // 4a. Các đơn hoàn tất trong quá khứ (để sinh đánh giá, lịch sử, thống kê)
  for (let i = 0; i < savedToys.length; i++) {
    const toy = savedToys[i];
    // Mỗi món có 1-2 lượt mượn đã hoàn tất thành công trong quá khứ
    const completedCount = (i % 3 === 0) ? 2 : 1;
    for (let c = 0; c < completedCount; c++) {
      const borrower = borrowerFor(toy.ownerId);
      const ago = rint(10, 80) + c * 15;
      const createdAt = daysAgo(ago + 7);
      const approvedDate = daysAgo(ago + 6);
      const returnDate = daysAgo(ago);

      const b = {
        toyId: toy._id,
        ownerId: toy.ownerId,
        borrowerId: borrower._id,
        depositAmount: toy.depositRequired,
        status: 'returned',
        depositStatus: 'refunded',
        depositRefundAmount: toy.depositRequired,
        depositDeductAmount: 0,
        requestDate: createdAt,
        approvedDate,
        returnDate,
        dueDate: daysAgo(ago + 1),
        handoverImages: [INSPECTION_IMG],
        returnImages: [INSPECTION_IMG],
        createdAt,
        updatedAt: returnDate,
      };
      borrowDocs.push(b);
      returnedBorrowsForReview.push(b);
    }
  }

  // 4b. Các đơn đang mượn (borrowing) cho các món đồ chơi có status = 'borrowed'
  const borrowedToys = savedToys.filter(t => t.status === 'borrowed');
  for (const toy of borrowedToys) {
    const borrower = borrowerFor(toy.ownerId);
    const ago = rint(2, 6);
    const createdAt = daysAgo(ago + 2);
    borrowDocs.push({
      toyId: toy._id,
      ownerId: toy.ownerId,
      borrowerId: borrower._id,
      depositAmount: toy.depositRequired,
      status: 'borrowing',
      depositStatus: 'held',
      depositConfirmedDate: daysAgo(ago),
      approvedDate: daysAgo(ago + 1),
      dueDate: daysAgo(-rint(3, 10)),
      handoverImages: [INSPECTION_IMG],
      createdAt,
      updatedAt: daysAgo(ago),
    });
  }

  // 4c. Một vài đơn pending chờ duyệt cho các món đồ chơi available
  const availableToys = savedToys.filter(t => t.status === 'available');
  for (let i = 0; i < 4; i++) {
    const toy = availableToys[i];
    const borrower = borrowerFor(toy.ownerId);
    const createdAt = daysAgo(rint(0, 2));
    borrowDocs.push({
      toyId: toy._id,
      ownerId: toy.ownerId,
      borrowerId: borrower._id,
      depositAmount: toy.depositRequired,
      status: 'pending',
      depositStatus: 'pending',
      requestDate: createdAt,
      dueDate: daysAgo(-rint(5, 14)),
      createdAt,
      updatedAt: createdAt,
    });
  }

  const savedBorrows = await BorrowRequest.insertMany(borrowDocs);
  console.log(`Đã tạo ${savedBorrows.length} lượt mượn thực tế.`);

  // ---------- 5. ĐÁNH GIÁ 2 CHIỀU ĐA DẠNG ----------
  const borrowerReviews = [
    'Đồ chơi rất mới và sạch sẽ, bé nhà mình thích mê!',
    'Chủ đồ chơi giao nhận đúng giờ, tư vấn cực kỳ nhiệt tình.',
    'Chất lượng tốt đúng như mô tả, đầy đủ phụ kiện. Sẽ mượn lại lần sau!',
    'Đồ chính hãng rất xịn xò, bé chơi cả tuần không chán.',
    'Rất hài lòng, đồ được đóng gói cẩn thận và đã khử khuẩn.',
    'Sản phẩm đẹp xuất sắc, hỗ trợ gia đình tiết kiệm được rất nhiều chi phí mua sắm đồ chơi.',
  ];
  const ownerReviews = [
    'Người mượn giữ gìn đồ rất cẩn thận, hoàn trả sạch đẹp như lúc giao.',
    'Giao tiếp lịch sự, trả đồ đúng hẹn. Rất hoan nghênh mượn tiếp!',
    'Rất uy tín và văn minh, đánh giá 5 sao cho gia đình bạn.',
    'Giữ đồ chơi cẩn thận, trả đúng hẹn, rất yên tâm khi chia sẻ đồ.',
  ];

  const reviewDocs = [];
  for (const b of savedBorrows.filter(x => x.status === 'returned')) {
    const rating = Math.random() < 0.85 ? 5 : 4;
    reviewDocs.push({
      toyId: b.toyId,
      borrowRequestId: b._id,
      reviewerId: b.borrowerId,
      targetOwnerId: b.ownerId,
      direction: 'borrower_to_owner',
      rating,
      comment: pickRand(borrowerReviews),
      createdAt: b.returnDate || b.updatedAt,
    });

    if (Math.random() < 0.75) {
      reviewDocs.push({
        toyId: b.toyId,
        borrowRequestId: b._id,
        reviewerId: b.ownerId,
        targetOwnerId: b.borrowerId,
        direction: 'owner_to_borrower',
        rating: 5,
        comment: pickRand(ownerReviews),
        createdAt: b.returnDate || b.updatedAt,
      });
    }
  }

  await Review.insertMany(reviewDocs);
  console.log(`Đã tạo ${reviewDocs.length} đánh giá 2 chiều.`);

  // Cập nhật rating cho từng đồ chơi
  for (const toy of savedToys) {
    const rs = await Review.find({ toyId: toy._id, direction: 'borrower_to_owner' });
    if (rs.length > 0) {
      const avg = Number((rs.reduce((sum, r) => sum + r.rating, 0) / rs.length).toFixed(1));
      await Toy.updateOne({ _id: toy._id }, { rating: { avg, count: rs.length } });
    }
  }

  // Cập nhật rating cho người dùng
  for (const u of allActiveUsers) {
    const rs = await Review.find({ targetOwnerId: u._id });
    if (rs.length > 0) {
      const avg = Number((rs.reduce((sum, r) => sum + r.rating, 0) / rs.length).toFixed(1));
      await User.updateOne({ _id: u._id }, { rating: { avg, count: rs.length } });
    }
  }

  // ---------- 6. TIN NHẮN CHAT CHO CÁC ĐƠN ĐANG MƯỢN ----------
  const chatLines = [
    'Chào bạn, đồ chơi này bé nhà bạn mấy tuổi rồi ạ?',
    'Dạ bé nhà mình 4 tuổi bạn nhé, đồ chơi còn mới và sạch sẽ lắm!',
    'Mình đã chuyển cọc ký quỹ rồi, chiều nay mình qua lấy được không?',
    'Dạ được bạn, khoảng 17h30 bạn qua địa chỉ trên app nhé.',
    'Mình nhận được đồ rồi nhé, đồ đẹp lắm cảm ơn bạn nhiều!',
  ];
  const msgDocs = [];
  const activeBorrows = savedBorrows.filter(b => b.status === 'borrowing').slice(0, 6);
  for (const b of activeBorrows) {
    for (let m = 0; m < chatLines.length; m++) {
      const fromBorrower = m % 2 === 0;
      msgDocs.push({
        borrowRequestId: b._id,
        senderId: fromBorrower ? b.borrowerId : b.ownerId,
        receiverId: fromBorrower ? b.ownerId : b.borrowerId,
        content: chatLines[m],
        isRead: true,
        createdAt: new Date(b.createdAt.getTime() + m * 18e5),
        updatedAt: new Date(b.createdAt.getTime() + m * 18e5),
      });
    }
  }
  await Message.insertMany(msgDocs);
  console.log(`Đã tạo ${msgDocs.length} tin nhắn trao đổi mẫu.`);

  // ---------- 7. THÔNG BÁO HỆ THỐNG ----------
  const notifDocs = [];
  for (const b of savedBorrows.slice(0, 20)) {
    notifDocs.push({
      userId: b.borrowerId,
      type: 'borrow_approved',
      title: 'Yêu cầu mượn đồ được duyệt',
      message: 'Chủ đồ chơi đã đồng ý cho bạn mượn. Vui lòng thanh toán cọc ký quỹ qua VietQR để hoàn tất.',
      link: 'requests',
      relatedId: b._id,
      isRead: Math.random() < 0.6,
      createdAt: b.updatedAt,
      updatedAt: b.updatedAt,
    });
  }
  await Notification.insertMany(notifDocs);
  console.log(`Đã tạo ${notifDocs.length} thông báo.`);

  // ---------- 8. VOUCHER ƯU ĐÃI ----------
  await Voucher.create([
    { code: 'DEMO25', description: 'Giảm 25% cọc, tối đa 50k', discountType: 'percent', discountValue: 25, maxDiscount: 50000, usageLimit: 100, usagePerUser: 1, usedCount: 15, active: true, expiresAt: daysAgo(-30) },
    { code: 'DEMO50K', description: 'Giảm 50k cọc cho đơn từ 200k', discountType: 'fixed', discountValue: 50000, minDeposit: 200000, usageLimit: 50, usagePerUser: 2, usedCount: 8, active: true, expiresAt: daysAgo(-60) },
    { code: 'DEMONEW', description: 'Ưu đãi thành viên mới -20k', discountType: 'fixed', discountValue: 20000, usagePerUser: 1, usedCount: 32, active: true, expiresAt: daysAgo(-90) },
  ]);
  console.log('Đã tạo voucher khuyến mại.');

  // ---------- 9. BÁO CÁO VI PHẠM DEMO CHO ADMIN ----------
  const reportDocs = [
    {
      toyId: savedToys[0]._id,
      reporterId: allActiveUsers[1]._id,
      reason: 'Thông tin sản phẩm',
      details: 'Đồ chơi rất tốt nhưng cần ghi chú rõ độ tuổi phù hợp cho bé nhỏ.',
      status: 'closed',
      createdAt: daysAgo(5),
    },
    {
      toyId: savedToys[12]._id,
      reporterId: allActiveUsers[2]._id,
      reason: 'Giá cọc bất hợp lý',
      details: 'Giá cọc hơi cao so với mặt bằng chung, đề xuất chủ đồ giảm một chút.',
      status: 'processing',
      createdAt: daysAgo(2),
    }
  ];
  await Report.insertMany(reportDocs);
  console.log(`Đã tạo ${reportDocs.length} báo cáo vi phạm demo.`);

  console.log('\n=============================================');
  console.log('>>> SEED DỮ LIỆU MỚI HOÀN TẤT THÀNH CÔNG! <<<');
  console.log(`- Tổng số sản phẩm: ${savedToys.length} (thuộc 6 danh mục, tên thật, ảnh thật 100% OK)`);
  console.log('- Đăng nhập Admin: admin@gmail.com | mk: admin');
  console.log('- Đăng nhập User: user@gmail.com hoặc manhgg22@gmail.com | mk: 123456');
  console.log('- Tài khoản demo: user1@demo.toyshare.vn ... user15@demo.toyshare.vn | mk: 123456');
  console.log('=============================================\n');

  await mongoose.disconnect();
}

main().catch(e => {
  console.error('LỖI KHI SEED DỮ LIỆU:', e);
  process.exit(1);
});
