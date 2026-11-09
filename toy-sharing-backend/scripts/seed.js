/**
 * Seed DỮ LIỆU THẬT & LỚN vào MongoDB để demo/bảo vệ (không phải mock ở frontend).
 * Tạo: danh mục, ~28 người dùng, ~90 đồ chơi (có ẢNH THẬT, trải đều ~120 ngày để
 * biểu đồ dashboard có xu hướng), ~70 lượt mượn ở mọi trạng thái, đánh giá 2 chiều,
 * tin nhắn chat, thông báo, voucher, báo cáo vi phạm.
 *
 *   node scripts/seed.js         -> seed (bỏ qua nếu đã seed)
 *   node scripts/seed.js fresh   -> xoá dữ liệu demo cũ rồi seed lại
 *
 * Mọi tài khoản demo có mật khẩu: 123456
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

// Ảnh thật theo từ khoá (loremflickr trả ảnh thật, ổn định theo lock). Hiển thị trong trình duyệt người dùng.
const img = (keyword, n) => `https://loremflickr.com/600/450/${keyword}?lock=${n}`;

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Nha Trang', 'Huế', 'Vũng Tàu'];

const FIRST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const MID = ['Thị', 'Văn', 'Minh', 'Thu', 'Quốc', 'Hải', 'Mai', 'Đức', 'Thuỳ', 'Gia', 'Khánh', 'Thanh'];
const LAST = ['Hà', 'Quân', 'Bích', 'Dũng', 'Anh', 'Thành', 'Linh', 'Bảo', 'Trang', 'Nam', 'Hương', 'Phúc', 'Ngọc', 'Tú', 'Khoa'];

// Mỗi danh mục: [tên món, từ khoá ảnh, khoảng cọc]
const CATALOG = {
  'Xếp hình': [
    ['Bộ xếp hình LEGO City', 'lego', [150000, 350000]],
    ['Đường ray tàu hoả gỗ', 'train,toy', [100000, 200000]],
    ['Bộ lắp ráp mô hình nhà', 'blocks,toy', [120000, 250000]],
    ['LEGO Technic xe đua', 'lego', [200000, 400000]],
    ['Khối gỗ xếp tháp', 'wooden,toy', [60000, 120000]],
  ],
  'Giáo dục': [
    ['Bảng chữ cái gỗ Montessori', 'montessori', [80000, 150000]],
    ['Đàn piano mini cho bé', 'piano,toy', [120000, 220000]],
    ['Bộ bác sĩ nhập vai', 'doctor,toy', [70000, 130000]],
    ['Bảng tính học đếm', 'abacus', [60000, 110000]],
    ['Sách vải tương tác', 'book,baby', [50000, 90000]],
  ],
  'Hành động': [
    ['Xe điều khiển từ xa địa hình', 'rc,car', [150000, 300000]],
    ['Máy bay trực thăng điều khiển', 'helicopter,toy', [200000, 350000]],
    ['Robot biến hình', 'robot,toy', [120000, 260000]],
    ['Siêu nhân mô hình', 'actionfigure', [90000, 180000]],
    ['Xe cứu hoả chạy pin', 'firetruck,toy', [100000, 190000]],
  ],
  'Công nghệ': [
    ['Bộ lắp ráp robot STEM', 'robot', [200000, 420000]],
    ['Kính thiên văn cho trẻ', 'telescope', [180000, 350000]],
    ['Máy chiếu sao vũ trụ', 'projector', [150000, 280000]],
    ['Bộ mạch điện tử học tập', 'circuit,electronics', [160000, 300000]],
  ],
  'Búp bê & Thú bông': [
    ['Gấu bông Teddy 60cm', 'teddybear', [70000, 140000]],
    ['Bộ búp bê gia đình', 'doll', [90000, 180000]],
    ['Thú bông kỳ lân', 'unicorn,plush', [60000, 120000]],
    ['Nhà búp bê mini', 'dollhouse', [150000, 300000]],
  ],
  'Mỹ thuật & Sáng tạo': [
    ['Bộ màu vẽ + giá vẽ', 'paint,kids', [70000, 140000]],
    ['Đất nặn an toàn 24 màu', 'claytoy', [50000, 100000]],
    ['Bộ làm vòng tay thủ công', 'craft,kids', [60000, 110000]],
    ['Bảng vẽ nước tự khô', 'drawing,kids', [55000, 95000]],
  ],
};
const AGE = ['0-3 tuổi', '3-6 tuổi', '6-12 tuổi', '12+ tuổi'];
const COND = ['new', 'like_new', 'used'];
const DESCS = [
  'Đồ chơi được vệ sinh sạch sẽ, đầy đủ phụ kiện. Cho mượn trong cộng đồng ToyShare.',
  'Bé nhà mình đã lớn nên chia sẻ lại, còn rất mới và hoạt động tốt.',
  'Hàng chính hãng, đã khử khuẩn kỹ trước khi giao. Nhận trả tận nơi khu vực nội thành.',
  'Phù hợp phát triển tư duy và vận động cho bé. Ảnh thật do mình chụp.',
  'Đồ bền, an toàn, không chi tiết sắc nhọn. Có thể cho mượn 1-2 tuần.',
];

async function main() {
  await mongoose.connect(URI);
  console.log('Đã kết nối MongoDB:', URI);

  const fresh = process.argv.includes('fresh');
  const existing = await User.findOne({ email: new RegExp(`@${DOMAIN}$`) });
  if (existing && !fresh) {
    console.log('Dữ liệu demo đã tồn tại. Dùng "node scripts/seed.js fresh" để seed lại.');
    await mongoose.disconnect();
    return;
  }
  if (fresh) {
    const demoUsers = await User.find({ email: new RegExp(`@${DOMAIN}$`) }).select('_id');
    const ids = demoUsers.map(u => u._id);
    const demoToys = await Toy.find({ ownerId: { $in: ids } }).select('_id');
    const toyIds = demoToys.map(t => t._id);
    await Message.deleteMany({ $or: [{ senderId: { $in: ids } }, { receiverId: { $in: ids } }] });
    await Notification.deleteMany({ userId: { $in: ids } });
    await BorrowRequest.deleteMany({ $or: [{ ownerId: { $in: ids } }, { borrowerId: { $in: ids } }] });
    await Review.deleteMany({ $or: [{ reviewerId: { $in: ids } }, { toyId: { $in: toyIds } }] });
    await Report.deleteMany({ toyId: { $in: toyIds } });
    await Toy.deleteMany({ ownerId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    await Voucher.deleteMany({ code: /^DEMO/ });
    console.log('Đã xoá dữ liệu demo cũ.');
  }

  // ---------- DANH MỤC ----------
  const catNames = Object.keys(CATALOG);
  for (let i = 0; i < catNames.length; i++) {
    await Category.updateOne({ name: catNames[i] }, { $setOnInsert: { name: catNames[i], order: i, active: true } }, { upsert: true });
  }
  console.log('Danh mục:', catNames.length);

  // ---------- NGƯỜI DÙNG ----------
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('123456', salt);
  const USER_COUNT = 28;
  const users = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const name = `${pickRand(FIRST)} ${pickRand(MID)} ${pickRand(LAST)}`;
    const u = await User.create({
      name, email: `user${i + 1}@${DOMAIN}`, passwordHash: hash,
      phone: `09${String(10000000 + rint(0, 89999999)).slice(0, 8)}`,
      address: pickRand(CITIES), role: 'user', status: i % 14 === 13 ? 'blocked' : 'active',
      authProvider: 'local', emailVerified: true,
      avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
    });
    users.push(u);
  }
  console.log('Người dùng:', users.length, '(1 bị khoá để demo quản lý)');

  // ---------- ĐỒ CHƠI (ảnh thật, trải ~120 ngày) ----------
  const TOY_COUNT = 90;
  let imgLock = 1000;
  const toyDocs = [];
  for (let i = 0; i < TOY_COUNT; i++) {
    const category = pickRand(catNames);
    const [baseName, kw, depRange] = pickRand(CATALOG[category]);
    const owner = pickRand(users.filter(u => u.status === 'active'));
    // Trải tạo đồ đều trên 120 ngày (nhiều hơn ở gần đây để biểu đồ tăng)
    const age = Math.floor(Math.pow(Math.random(), 1.6) * 120);
    const created = daysAgo(age);
    const deposit = Math.round(rint(depRange[0], depRange[1]) / 10000) * 10000;
    // ~85% đã duyệt (available), ~10% chờ duyệt, ~5% bị từ chối
    const r = Math.random();
    const status = r < 0.85 ? 'available' : (r < 0.95 ? 'pending' : 'rejected');
    toyDocs.push({
      ownerId: owner._id,
      name: `${baseName}${i % 3 === 0 ? ' (như mới)' : ''}`,
      description: pickRand(DESCS),
      category, ageRange: pickRand(AGE), condition: pickRand(COND),
      status, depositRequired: deposit, location: owner.address,
      images: [img(kw, imgLock++), img(kw, imgLock++)],
      rating: { avg: 0, count: 0 },
      createdAt: created, updatedAt: created,
    });
  }
  const toys = await Toy.insertMany(toyDocs);
  const availableToys = toys.filter(t => t.status === 'available');
  console.log('Đồ chơi:', toys.length, `(${availableToys.length} sẵn sàng, ${toys.filter(t=>t.status==='pending').length} chờ duyệt)`);

  // ---------- LƯỢT MƯỢN (nhiều, mọi trạng thái) ----------
  const borrowerFor = (ownerId) => pickRand(users.filter(u => u.status === 'active' && !u._id.equals(ownerId)));
  const borrowDocs = [];
  // Phân bố trạng thái thực tế
  const plan = [
    ['pending', 10], ['approved_await', 6], ['approved_held', 4],
    ['borrowing', 10], ['overdue', 5], ['returned_ok', 20],
    ['returned_partial', 5], ['claimed', 4], ['rejected', 4], ['cancelled', 4],
  ];
  let ti = 0;
  const usableToys = availableToys.slice(); // tránh trùng toy giữa các đơn active
  const takeToy = () => usableToys[(ti++) % usableToys.length];

  const returnedForReview = [];
  for (const [kind, n] of plan) {
    for (let k = 0; k < n; k++) {
      const toy = takeToy();
      const borrower = borrowerFor(toy.ownerId);
      const dep = toy.depositRequired;
      const base = { toyId: toy._id, ownerId: toy.ownerId, borrowerId: borrower._id, depositAmount: dep };
      const ago = rint(3, 90);
      const createdAt = daysAgo(ago + 4);
      if (kind === 'pending') {
        borrowDocs.push({ ...base, status: 'pending', depositStatus: 'pending', requestDate: createdAt, dueDate: daysAgo(-rint(5, 20)), createdAt, updatedAt: createdAt });
      } else if (kind === 'approved_await') {
        borrowDocs.push({ ...base, status: 'approved', depositStatus: 'awaiting_confirmation', depositPaidReportedDate: daysAgo(ago), approvedDate: daysAgo(ago + 1), dueDate: daysAgo(-rint(7, 20)), createdAt, updatedAt: daysAgo(ago) });
      } else if (kind === 'approved_held') {
        borrowDocs.push({ ...base, status: 'approved', depositStatus: 'held', depositConfirmedDate: daysAgo(ago), approvedDate: daysAgo(ago + 1), dueDate: daysAgo(-rint(7, 20)), createdAt, updatedAt: daysAgo(ago) });
      } else if (kind === 'borrowing') {
        borrowDocs.push({ ...base, status: 'borrowing', depositStatus: 'held', depositConfirmedDate: daysAgo(ago), approvedDate: daysAgo(ago + 1), handoverImages: [img('toy', imgLock++)], dueDate: daysAgo(-rint(2, 12)), createdAt, updatedAt: daysAgo(ago) });
      } else if (kind === 'overdue') {
        borrowDocs.push({ ...base, status: 'overdue', depositStatus: 'held', approvedDate: daysAgo(ago + 2), handoverImages: [img('toy', imgLock++)], dueDate: daysAgo(rint(1, 6)), returnNote: 'Quá hạn - chờ chủ xác nhận nhận lại đồ.', createdAt, updatedAt: daysAgo(2) });
      } else if (kind === 'returned_ok') {
        const d = { ...base, status: 'returned', depositStatus: 'refunded', depositRefundAmount: dep, depositDeductAmount: 0, approvedDate: daysAgo(ago + 3), returnDate: daysAgo(rint(2, ago)), dueDate: daysAgo(rint(1, ago)), handoverImages: [img('toy', imgLock++)], returnImages: [img('toy', imgLock++)], createdAt, updatedAt: daysAgo(2) };
        borrowDocs.push(d); returnedForReview.push(d);
      } else if (kind === 'returned_partial') {
        borrowDocs.push({ ...base, status: 'returned', depositStatus: 'partially_refunded', depositRefundAmount: Math.round(dep / 2), depositDeductAmount: Math.round(dep / 2), damageClaimStatus: 'resolved', depositResolveNote: 'Trừ 50% đền bù trầy xước nhẹ', approvedDate: daysAgo(ago + 3), returnDate: daysAgo(rint(2, ago)), dueDate: daysAgo(rint(1, ago)), damageImages: [img('toy', imgLock++)], createdAt, updatedAt: daysAgo(3) });
      } else if (kind === 'claimed') {
        borrowDocs.push({ ...base, status: 'returned', depositStatus: 'held', damageClaimStatus: 'claimed', damageReported: true, damageAmountRequested: Math.round(dep / 3), damageNote: 'Vỡ một chi tiết nhỏ', damageImages: [img('broken,toy', imgLock++)], damageClaimDate: daysAgo(1), approvedDate: daysAgo(ago + 3), returnDate: daysAgo(2), dueDate: daysAgo(3), createdAt, updatedAt: daysAgo(1) });
      } else if (kind === 'rejected') {
        borrowDocs.push({ ...base, status: 'rejected', depositStatus: 'pending', requestDate: createdAt, dueDate: daysAgo(-5), createdAt, updatedAt: daysAgo(ago) });
      } else if (kind === 'cancelled') {
        borrowDocs.push({ ...base, status: 'cancelled', depositStatus: 'pending', requestDate: createdAt, dueDate: daysAgo(-5), createdAt, updatedAt: daysAgo(ago) });
      }
    }
  }
  const borrows = await BorrowRequest.insertMany(borrowDocs);
  // Đồng bộ trạng thái đồ chơi cho các đơn đang giữ đồ
  const busyToyIds = borrows.filter(b => ['borrowing', 'overdue'].includes(b.status)).map(b => b.toyId);
  await Toy.updateMany({ _id: { $in: busyToyIds } }, { status: 'borrowed' });
  console.log('Lượt mượn:', borrows.length);

  // ---------- ĐÁNH GIÁ 2 CHIỀU (cho đơn đã trả tốt) ----------
  const borrowerComments = ['Đồ chơi sạch đẹp đúng mô tả, chủ thân thiện!', 'Giao nhận đúng hẹn, bé nhà mình rất thích.', 'Chất lượng tốt, sẽ mượn lại lần sau.', 'Đóng gói cẩn thận, cảm ơn chủ shop.', 'Ưng ý, đồ còn như mới.'];
  const ownerComments = ['Người mượn giữ gìn cẩn thận, trả đúng hạn.', 'Trao đổi lịch sự, trả đồ sạch sẽ.', 'Rất uy tín, sẽ cho mượn lần sau.', 'Đúng hẹn, giữ đồ tốt.'];
  const reviewDocs = [];
  for (const d of returnedForReview) {
    const b = borrows.find(x => x.toyId.equals(d.toyId) && x.borrowerId.equals(d.borrowerId) && x.status === 'returned' && x.depositStatus === 'refunded');
    if (!b) continue;
    reviewDocs.push({ toyId: b.toyId, borrowRequestId: b._id, reviewerId: b.borrowerId, targetOwnerId: b.ownerId, direction: 'borrower_to_owner', rating: rint(4, 5), comment: pickRand(borrowerComments), createdAt: b.updatedAt });
    if (Math.random() < 0.7) reviewDocs.push({ toyId: b.toyId, borrowRequestId: b._id, reviewerId: b.ownerId, targetOwnerId: b.borrowerId, direction: 'owner_to_borrower', rating: rint(4, 5), comment: pickRand(ownerComments), createdAt: b.updatedAt });
  }
  await Review.insertMany(reviewDocs);
  // Cập nhật điểm trung bình toy + user
  for (const uid of users.map(u => u._id)) {
    const rs = await Review.find({ targetOwnerId: uid });
    if (rs.length) await User.updateOne({ _id: uid }, { rating: { avg: Number((rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1)), count: rs.length } });
  }
  const reviewedToyIds = [...new Set(reviewDocs.filter(r => r.direction === 'borrower_to_owner').map(r => String(r.toyId)))];
  for (const tid of reviewedToyIds) {
    const rs = await Review.find({ toyId: tid, direction: { $ne: 'owner_to_borrower' } });
    if (rs.length) await Toy.updateOne({ _id: tid }, { rating: { avg: Number((rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1)), count: rs.length } });
  }
  console.log('Đánh giá:', reviewDocs.length);

  // ---------- TIN NHẮN CHAT (cho ~20 đơn) ----------
  const chatLines = [
    'Chào bạn, đồ còn cho mượn không ạ?', 'Còn bạn nhé, bạn muốn mượn mấy ngày?',
    'Mình mượn 1 tuần được không?', 'Được bạn, mình duyệt yêu cầu nhé.',
    'Mình chuyển cọc rồi nha.', 'Ok mình nhận được rồi, hẹn giao đồ chiều nay.',
    'Đồ đẹp lắm, cảm ơn bạn nhiều!', 'Bé nhà mình thích lắm ạ.',
  ];
  const msgDocs = [];
  const chatBorrows = borrows.filter(b => !['rejected', 'cancelled'].includes(b.status)).slice(0, 22);
  for (const b of chatBorrows) {
    const n = rint(2, 6);
    for (let m = 0; m < n; m++) {
      const fromBorrower = m % 2 === 0;
      msgDocs.push({
        borrowRequestId: b._id,
        senderId: fromBorrower ? b.borrowerId : b.ownerId,
        receiverId: fromBorrower ? b.ownerId : b.borrowerId,
        content: chatLines[m % chatLines.length],
        isRead: m < n - 1,
        createdAt: new Date(b.createdAt.getTime() + m * 36e5),
        updatedAt: new Date(b.createdAt.getTime() + m * 36e5),
      });
    }
  }
  await Message.insertMany(msgDocs);
  console.log('Tin nhắn:', msgDocs.length);

  // ---------- THÔNG BÁO ----------
  const notifDocs = [];
  for (const b of borrows.slice(0, 50)) {
    const map = {
      pending: ['borrow_request', b.ownerId, 'Yêu cầu mượn mới', 'Có người muốn mượn đồ chơi của bạn.'],
      approved: ['borrow_approved', b.borrowerId, 'Yêu cầu được duyệt', 'Chủ đồ chơi đã duyệt yêu cầu mượn của bạn.'],
      borrowing: ['return_confirmed', b.borrowerId, 'Đã nhận đồ', 'Bạn đã nhận đồ, nhớ trả đúng hạn nhé.'],
      overdue: ['overdue', b.borrowerId, 'Quá hạn trả đồ', 'Bạn đã quá hạn trả đồ, vui lòng trả sớm.'],
      returned: ['return_confirmed', b.borrowerId, 'Hoàn tất lượt mượn', 'Lượt mượn đã hoàn tất, hãy để lại đánh giá!'],
      rejected: ['borrow_rejected', b.borrowerId, 'Yêu cầu bị từ chối', 'Rất tiếc, yêu cầu mượn đã bị từ chối.'],
    };
    const e = map[b.status];
    if (!e) continue;
    notifDocs.push({ userId: e[1], type: e[0], title: e[2], message: e[3], link: 'requests', relatedId: b._id, isRead: Math.random() < 0.5, createdAt: b.updatedAt, updatedAt: b.updatedAt });
  }
  await Notification.insertMany(notifDocs);
  console.log('Thông báo:', notifDocs.length);

  // ---------- VOUCHER ----------
  await Voucher.create([
    { code: 'DEMO25', description: 'Giảm 25% cọc, tối đa 50k', discountType: 'percent', discountValue: 25, maxDiscount: 50000, usageLimit: 100, usagePerUser: 1, usedCount: 12, active: true, expiresAt: daysAgo(-30) },
    { code: 'DEMO50K', description: 'Giảm 50k cọc cho đơn từ 200k', discountType: 'fixed', discountValue: 50000, minDeposit: 200000, usageLimit: 50, usagePerUser: 2, usedCount: 5, active: true, expiresAt: daysAgo(-60) },
    { code: 'DEMONEW', description: 'Ưu đãi người mới -20k', discountType: 'fixed', discountValue: 20000, usagePerUser: 1, usedCount: 30, active: true, expiresAt: daysAgo(-90) },
    { code: 'DEMOHE', description: 'Ưu đãi hè (đã tạm ngưng)', discountType: 'percent', discountValue: 15, active: false },
  ]);
  console.log('Voucher: 4');

  // ---------- BÁO CÁO VI PHẠM ----------
  const reasons = ['Thông tin sai lệch', 'Nghi ngờ đồ không an toàn', 'Ảnh không đúng sản phẩm', 'Giá cọc bất hợp lý', 'Nội dung không phù hợp'];
  const statuses = ['open', 'processing', 'closed', 'dismissed'];
  const reportDocs = [];
  for (let i = 0; i < 8; i++) {
    const toy = pickRand(toys);
    reportDocs.push({ toyId: toy._id, reporterId: borrowerFor(toy.ownerId)._id, reason: pickRand(reasons), details: 'Chi tiết do người dùng cung cấp khi báo cáo bài đăng này.', status: statuses[i % statuses.length], createdAt: daysAgo(rint(1, 30)) });
  }
  await Report.insertMany(reportDocs);
  console.log('Báo cáo:', reportDocs.length);

  console.log('\n=== SEED HOÀN TẤT ===');
  console.log(`Tài khoản demo: user1@${DOMAIN} ... user${users.length}@${DOMAIN} | mật khẩu: 123456`);
  console.log('Admin: admin@toyshare.com | mật khẩu: admin123 (hoặc ADMIN_PASSWORD trong .env)');
  await mongoose.disconnect();
}

main().catch(e => { console.error('SEED ERROR', e); process.exit(1); });
