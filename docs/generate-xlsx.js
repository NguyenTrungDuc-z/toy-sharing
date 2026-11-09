const ExcelJS = require('exceljs');
const path = require('path');

async function generate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ToyShare Team';
  wb.created = new Date();

  // ============ SHEET 1: Existing Features ============
  const ws1 = wb.addWorksheet('Tính năng đã có', {
    properties: { tabColor: { argb: '16A34A' } }
  });

  ws1.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Nhóm (Role)', key: 'group', width: 14 },
    { header: 'Tính năng', key: 'feature', width: 65 },
    { header: 'Trạng thái', key: 'status', width: 14 }
  ];

  const existing = [
    ['E01', 'Guest', 'Xem danh sách đồ chơi (trang chủ) + tìm kiếm theo tên', 'Done'],
    ['E02', 'Guest', 'Lọc theo độ tuổi, danh mục + sắp xếp', 'Done'],
    ['E03', 'Guest', 'Phân trang (pagination)', 'Done'],
    ['E04', 'Guest', 'Xem đánh giá (reviews) của đồ chơi', 'Done'],
    ['E05', 'Guest', 'Đăng ký tài khoản', 'Done'],
    ['E06', 'Guest', 'Đăng nhập', 'Done'],
    ['E07', 'Owner', 'Đăng đồ chơi mới (ảnh, tên, danh mục, độ tuổi, tình trạng, tiền cọc, mô tả)', 'Done'],
    ['E08', 'Owner', 'Sửa / Xóa đồ chơi (chặn xóa khi đang mượn, cascade delete)', 'Done'],
    ['E09', 'Owner', 'Xem danh sách đồ chơi của mình + thống kê (tổng, đang cho mượn)', 'Done'],
    ['E10', 'Owner', 'Duyệt / Từ chối yêu cầu mượn (auto-reject pending khác)', 'Done'],
    ['E11', 'Owner', 'Xác nhận cọc + Xác nhận trả', 'Done'],
    ['E12', 'Owner', 'Duyệt / Từ chối gia hạn', 'Done'],
    ['E13', 'Borrower', 'Gửi yêu cầu mượn đồ chơi (chặn trùng pending)', 'Done'],
    ['E14', 'Borrower', 'Hủy yêu cầu mượn (pending)', 'Done'],
    ['E15', 'Borrower', 'Yêu cầu gia hạn', 'Done'],
    ['E16', 'Borrower', 'Báo trả đồ chơi', 'Done'],
    ['E17', 'Borrower', 'Đánh giá sau khi trả (rating + comment, chỉ khi returned)', 'Done'],
    ['E18', 'Borrower', 'Thêm / Bỏ đồ chơi yêu thích', 'Done'],
    ['E19', 'Borrower', 'Báo cáo vi phạm (report)', 'Done'],
    ['E20', 'Account', 'Xem + Sửa hồ sơ (tên, SĐT, địa chỉ, avatar URL)', 'Done'],
    ['E21', 'Account', 'Đổi mật khẩu', 'Done'],
    ['E22', 'Admin', 'Dashboard thống kê (users, toys, borrows, pending + biểu đồ weekly)', 'Done'],
    ['E23', 'Admin', 'Quản lý người dùng (xem, phân quyền, khóa/mở tài khoản)', 'Done'],
    ['E24', 'Admin', 'Kiểm duyệt bài đăng (duyệt/từ chối toy pending)', 'Done'],
    ['E25', 'Admin', 'Xử lý báo cáo vi phạm (open/processing/closed/dismissed + ghi chú)', 'Done'],
    ['E26', 'Admin', 'Gỡ đồ chơi vi phạm (cascade delete)', 'Done'],
    ['E27', 'System', 'JWT authentication + middleware bảo mật (Bearer token)', 'Done'],
    ['E28', 'System', 'Auto-overdue check (mỗi 30 giây)', 'Done'],
    ['E29', 'System', 'Auto-reject pending requests khi approve 1 request', 'Done'],
    ['E30', 'System', 'Cascade delete (xóa toy -> xóa borrow, review, report, favorite)', 'Done'],
  ];

  existing.forEach(row => ws1.addRow({ id: row[0], group: row[1], feature: row[2], status: row[3] }));

  // Style header
  ws1.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '16A34A' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle' };
  });
  // Status column green
  ws1.getColumn('status').eachCell((cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.font = { bold: true, color: { argb: '16A34A' } };
    }
  });

  // ============ SHEET 2: Group A ============
  const ws2 = wb.addWorksheet('Nhóm A - Hoàn thiện UI', {
    properties: { tabColor: { argb: 'F59E0B' } }
  });

  ws2.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Tính năng', key: 'feature', width: 45 },
    { header: 'Mô tả chi tiết', key: 'desc', width: 75 },
    { header: 'Độ khó', key: 'effort', width: 12 },
    { header: 'Trạng thái', key: 'status', width: 14 }
  ];

  const groupA = [
    ['A1', 'Trang chi tiết đồ chơi (ToyDetail)', 'API GET /toys/:id đã có, UI: ảnh lớn, thông tin owner, reviews, nút mượn', 'Medium', 'Done'],
    ['A2', 'Điểm uy tín thực (real rating)', 'MyToys.jsx tính rating thực từ User model', 'Low', 'Done'],
    ['A3', 'Quên mật khẩu (Forgot Password)', 'Flow reset qua Nodemailer gửi Gmail App Password thật + Dev mode dự phòng', 'High', 'Done'],
    ['A4', 'Hiện/ẩn mật khẩu', 'Icon mắt toggle type password/text tiện lợi', 'Low', 'Done'],
    ['A5', 'Upload nhiều ảnh (3-5 ảnh)', 'Form multi-upload kèm preview ảnh và trình xem ảnh lớn', 'Medium', 'Done'],
    ['A6', 'Thêm Vị trí (Location)', 'Thêm vị trí đồ chơi vào form + bộ lọc location trang Home', 'Medium', 'Done'],
    ['A7', 'Upload avatar (file)', 'Upload file ảnh đại diện base64 trực tiếp trên Profile', 'Low', 'Done'],
    ['A8', 'Tình trạng "Như mới" (like_new)', 'Đã bổ sung like_new vào Toy model enum và giao diện bộ lọc', 'Low', 'Done'],
    ['A9', 'Chart labels động', 'Dashboard labels hiển thị tuần/ngày thực từ backend', 'Low', 'Done'],
  ];

  groupA.forEach(row => ws2.addRow({ id: row[0], feature: row[1], desc: row[2], effort: row[3], status: row[4] }));

  ws2.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle' };
  });
  ws2.getColumn('status').eachCell((cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.font = { bold: true, color: { argb: '16A34A' } };
    }
  });

  // ============ SHEET 3: Group B ============
  const ws3 = wb.addWorksheet('Nhóm B - Module mới', {
    properties: { tabColor: { argb: '4F46E5' } }
  });

  ws3.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Tính năng', key: 'feature', width: 45 },
    { header: 'Mô tả chi tiết', key: 'desc', width: 75 },
    { header: 'Độ khó', key: 'effort', width: 12 },
    { header: 'Trạng thái', key: 'status', width: 14 }
  ];

  const groupB = [
    ['B1', 'Thông báo trong app (Notifications)', 'Model Notification + icon chuông + badge realtime Socket.IO', 'High', 'Done'],
    ['B2', 'Thông báo toy yêu thích sẵn sàng', 'Khi toy trong favorites chuyển available → notify user đã thích', 'Medium', 'Done'],
    ['B3', 'Trang hồ sơ công khai (Owner Profile)', 'Xem toys, rating, reviews của 1 user. Link từ ToyDetail', 'Medium', 'Done'],
    ['B4', 'Nhắn tin theo đơn mượn (Messaging)', 'Model Message theo borrowRequestId, chat realtime owner ↔ borrower', 'High', 'Done'],
    ['B5', 'Thống kê cá nhân trên Profile', 'Số đồ đã mượn, cho mượn, tỉ lệ trả đúng hạn, tổng reviews', 'Medium', 'Done'],
    ['B6', 'Admin: Quản lý tất cả đơn mượn', 'Xem toàn bộ borrows + filter quá hạn + thống kê category/status', 'High', 'Done'],
  ];

  groupB.forEach(row => ws3.addRow({ id: row[0], feature: row[1], desc: row[2], effort: row[3], status: row[4] }));

  ws3.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle' };
  });
  ws3.getColumn('status').eachCell((cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.font = { bold: true, color: { argb: '16A34A' } };
    }
  });

  // ============ SHEET 4: Group C ============
  const ws4 = wb.addWorksheet('Nhóm C - Dịch vụ ngoài', {
    properties: { tabColor: { argb: 'EF4444' } }
  });

  ws4.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Tính năng', key: 'feature', width: 45 },
    { header: 'Mô tả chi tiết', key: 'desc', width: 65 },
    { header: 'Phụ thuộc', key: 'dep', width: 30 },
    { header: 'Độ khó', key: 'effort', width: 12 },
    { header: 'Trạng thái', key: 'status', width: 14 }
  ];

  const groupC = [
    ['C1', 'Google Login (OAuth)', 'Đăng nhập Google qua google-auth-library + UI Google Login', 'Google Client ID (.env)', 'High', 'Done'],
    ['C2', 'Thanh toán cọc online (VietQR Escrow & Dispute)', 'Sinh VietQR động nạp cọc Admin trung gian + quy trình khiếu nại ảnh hư hỏng 3 bước', 'ADMIN_BANK (.env)', 'Very High', 'Done'],
    ['C3', 'Realtime (Socket.IO)', 'WebSocket cho chat realtime + push notifications tức thời', 'Socket.IO', 'High', 'Done'],
  ];

  groupC.forEach(row => ws4.addRow({ id: row[0], feature: row[1], desc: row[2], dep: row[3], effort: row[4], status: row[5] }));

  ws4.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle' };
  });
  ws4.getColumn('status').eachCell((cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.font = { bold: true, color: { argb: '16A34A' } };
    }
  });

  // ============ SHEET 5: Summary ============
  const ws5 = wb.addWorksheet('Tổng hợp', {
    properties: { tabColor: { argb: '85581A' } }
  });

  ws5.columns = [
    { header: 'Nhóm', key: 'group', width: 35 },
    { header: 'Số lượng', key: 'count', width: 12 },
    { header: 'Mô tả', key: 'desc', width: 70 },
    { header: 'Trạng thái', key: 'status', width: 15 }
  ];

  ws5.addRow({ group: 'Tính năng đã có (Existing)', count: 30, desc: 'Đã hoàn thành - Guest, Owner, Borrower, Admin, System', status: '30/30 Done' });
  ws5.addRow({ group: 'Nhóm A - Hoàn thiện UI có sẵn', count: 9, desc: 'Ưu tiên cao, effort thấp-trung bình, hiệu quả ngay', status: '9/9 Done' });
  ws5.addRow({ group: 'Nhóm B - Module mới', count: 6, desc: 'Notifications, Messaging, Public Profile, Stats, Admin borrows', status: '6/6 Done' });
  ws5.addRow({ group: 'Nhóm C - Dịch vụ bên ngoài', count: 3, desc: 'Google OAuth, VietQR Escrow & Dispute, Socket.IO Realtime', status: '3/3 Done' });
  ws5.addRow({ group: 'TỔNG CỘNG', count: 48, desc: 'Đã hoàn thiện toàn bộ tính năng theo yêu cầu', status: '48/48 (100%)' });

  ws5.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '85581A' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle' };
  });
  // Bold total row
  ws5.getRow(6).eachCell(cell => {
    cell.font = { bold: true, size: 12 };
  });

  const outPath = path.join(__dirname, 'toyshare-features.xlsx');
  try {
    await wb.xlsx.writeFile(outPath);
    console.log('XLSX saved:', outPath);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const altPath = path.join(__dirname, 'toyshare-features-v2.xlsx');
      await wb.xlsx.writeFile(altPath);
      console.log('toyshare-features.xlsx đang mở trong Excel. Đã lưu bản cập nhật ra:', altPath);
    } else {
      throw err;
    }
  }
}

generate().catch(err => { console.error(err); process.exit(1); });
