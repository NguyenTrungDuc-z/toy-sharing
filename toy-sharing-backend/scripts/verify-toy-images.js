const https = require('https');

// Danh sách sản phẩm chi tiết mẫu với ảnh Unsplash chất lượng cao, đúng từng món
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

async function verifyAll() {
  console.log(`Kiểm tra ${TOY_CATALOG.length} sản phẩm đồ chơi...`);
  const urls = new Set();
  TOY_CATALOG.forEach(t => t.images.forEach(img => urls.add(img)));
  console.log(`Tổng cộng ${urls.size} URL ảnh độc nhất:`);

  let allOk = true;
  for (const url of urls) {
    await new Promise((resolve) => {
      https.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log(`  [200 OK] ${url.slice(0, 60)}...`);
        } else {
          console.error(`  [FAIL ${res.statusCode}] ${url}`);
          allOk = false;
        }
        resolve();
      }).on('error', (err) => {
        console.error(`  [ERR] ${err.message} - ${url}`);
        allOk = false;
        resolve();
      });
    });
  }

  if (allOk) {
    console.log('\n>>> TẤT CẢ ẢNH ĐỀU HOẠT ĐỘNG HOÀN HẢO (HTTP 200)! <<<');
  } else {
    console.error('\n>>> CÓ ẢNH BỊ LỖI! <<<');
    process.exit(1);
  }
}

if (require.main === module) {
  verifyAll();
}

module.exports = { TOY_CATALOG };
