/**
 * Seed DỮ LIỆU THẬT vào MongoDB để demo/bảo vệ (không phải mock ở frontend).
 * Tạo: danh mục, người dùng, đồ chơi (trải đều 4 tuần để biểu đồ dashboard có xu hướng),
 * lượt mượn ở mọi trạng thái, đánh giá 2 chiều, voucher, báo cáo vi phạm.
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

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/toy_sharing';
const DOMAIN = 'demo.toyshare.vn';
const daysAgo = (d) => new Date(Date.now() - d * 864e5);
const pick = (arr, i) => arr[i % arr.length];

async function main() {
  await mongoose.connect(URI);
  console.log('Đã kết nối MongoDB:', URI);

  const existing = await User.findOne({ email: new RegExp(`@${DOMAIN}$`) });
  const fresh = process.argv.includes('fresh');
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
    await BorrowRequest.deleteMany({ $or: [{ ownerId: { $in: ids } }, { borrowerId: { $in: ids } }] });
    await Review.deleteMany({ $or: [{ reviewerId: { $in: ids } }, { toyId: { $in: toyIds } }] });
    await Report.deleteMany({ toyId: { $in: toyIds } });
    await Toy.deleteMany({ ownerId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    await Voucher.deleteMany({ code: /^DEMO/ });
    await Category.deleteMany({ name: { $in: ['Búp bê & Thú bông', 'Mỹ thuật & Sáng tạo'] } });
    console.log('Đã xoá dữ liệu demo cũ.');
  }

  // ---------- DANH MỤC ----------
  const catNames = ['Giáo dục', 'Hành động', 'Xếp hình', 'Công nghệ', 'Búp bê & Thú bông', 'Mỹ thuật & Sáng tạo'];
  for (let i = 0; i < catNames.length; i++) {
    await Category.updateOne({ name: catNames[i] }, { $setOnInsert: { name: catNames[i], order: i, active: true } }, { upsert: true });
  }
  console.log('Danh mục: OK');

  // ---------- NGƯỜI DÙNG ----------
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('123456', salt);
  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  const names = ['Nguyễn Thu Hà', 'Trần Minh Quân', 'Lê Thị Bích', 'Phạm Văn Dũng', 'Hoàng Mai Anh', 'Vũ Đức Thành', 'Đặng Thuỳ Linh', 'Bùi Quốc Bảo'];
  const users = [];
  for (let i = 0; i < names.length; i++) {
    const u = await User.create({
      name: names[i], email: `user${i + 1}@${DOMAIN}`, passwordHash: hash,
      phone: `09${(10000000 + i * 111111).toString().slice(0, 8)}`, address: pick(cities, i),
      role: 'user', status: 'active', authProvider: 'local', emailVerified: true,
    });
    users.push(u);
  }
  console.log('Người dùng:', users.length);

  // ---------- ĐỒ CHƠI (trải đều 4 tuần) ----------
  const toyTemplates = [
    ['Bộ xếp hình LEGO City 60 mảnh', 'Xếp hình', 'new', 200000, '6-12 tuổi'],
    ['Đường ray tàu hoả gỗ', 'Xếp hình', 'like_new', 150000, '3-6 tuổi'],
    ['Bộ lắp ráp robot STEM', 'Công nghệ', 'like_new', 300000, '6-12 tuổi'],
    ['Xe điều khiển từ xa địa hình', 'Hành động', 'used', 180000, '6-12 tuổi'],
    ['Bảng chữ cái gỗ Montessori', 'Giáo dục', 'new', 120000, '0-3 tuổi'],
    ['Đàn piano mini cho bé', 'Giáo dục', 'like_new', 160000, '3-6 tuổi'],
    ['Gấu bông Teddy 60cm', 'Búp bê & Thú bông', 'new', 90000, '0-3 tuổi'],
    ['Bộ búp bê gia đình', 'Búp bê & Thú bông', 'used', 110000, '3-6 tuổi'],
    ['Bộ màu vẽ + giá vẽ cho bé', 'Mỹ thuật & Sáng tạo', 'like_new', 80000, '3-6 tuổi'],
    ['Đất nặn an toàn 24 màu', 'Mỹ thuật & Sáng tạo', 'new', 70000, '3-6 tuổi'],
    ['Máy bay trực thăng điều khiển', 'Hành động', 'like_new', 250000, '6-12 tuổi'],
    ['Bộ bác sĩ nhập vai', 'Giáo dục', 'used', 95000, '3-6 tuổi'],
  ];
  const toyDocs = [];
  let idx = 0;
  // 4 tuần, mỗi tuần 6 món -> tích luỹ 6/12/18/24 (biểu đồ tăng dần)
  for (const weekOffset of [24, 17, 10, 3]) {
    for (let k = 0; k < 6; k++) {
      const [baseName, category, condition, deposit, ageRange] = pick(toyTemplates, idx);
      const owner = pick(users, idx);
      const created = daysAgo(weekOffset - k * 0.4);
      toyDocs.push({
        ownerId: owner._id,
        name: `${baseName} #${idx + 1}`,
        description: 'Đồ chơi được vệ sinh sạch sẽ, đầy đủ phụ kiện. Cho mượn trong cộng đồng ToyShare.',
        category, ageRange, condition,
        status: 'available',
        depositRequired: deposit,
        location: pick(cities, idx),
        images: [],
        rating: { avg: 0, count: 0 },
        createdAt: created, updatedAt: created,
      });
      idx++;
    }
  }
  // 3 món chờ duyệt (cho trang Kiểm soát bài đăng)
  for (let k = 0; k < 3; k++) {
    const [baseName, category, condition, deposit, ageRange] = pick(toyTemplates, idx + k);
    toyDocs.push({
      ownerId: pick(users, idx + k)._id, name: `${baseName} (chờ duyệt)`,
      description: 'Bài đăng mới chờ admin kiểm duyệt.', category, ageRange, condition,
      status: 'pending', depositRequired: deposit, location: pick(cities, k), images: [],
      rating: { avg: 0, count: 0 }, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    });
  }
  const insertedToys = await Toy.insertMany(toyDocs);
  console.log('Đồ chơi:', insertedToys.length);

  const availableToys = insertedToys.filter(t => t.status === 'available');

  // ---------- LƯỢT MƯỢN (đa trạng thái) ----------
  const borrowerOf = (ownerId) => users.find(u => !u._id.equals(ownerId));
  const mk = (overrides) => ({ requestDate: daysAgo(10), ...overrides });
  const borrowDocs = [];
  const t = availableToys;

  // pending (chờ chủ duyệt)
  borrowDocs.push(mk({ toyId: t[0]._id, ownerId: t[0].ownerId, borrowerId: borrowerOf(t[0].ownerId)._id, status: 'pending', depositStatus: 'pending', depositAmount: t[0].depositRequired, dueDate: daysAgo(-7), createdAt: daysAgo(2), updatedAt: daysAgo(2) }));
  // approved + awaiting_confirmation (chờ admin xác nhận cọc) -> AdminDeposits
  borrowDocs.push(mk({ toyId: t[1]._id, ownerId: t[1].ownerId, borrowerId: borrowerOf(t[1].ownerId)._id, status: 'approved', depositStatus: 'awaiting_confirmation', depositAmount: t[1].depositRequired, depositPaidReportedDate: daysAgo(1), approvedDate: daysAgo(2), dueDate: daysAgo(-10), createdAt: daysAgo(3), updatedAt: daysAgo(1) }));
  // borrowing + held (đang cho mượn) -> activeLoans + AdminDeposits(held)
  borrowDocs.push(mk({ toyId: t[2]._id, ownerId: t[2].ownerId, borrowerId: borrowerOf(t[2].ownerId)._id, status: 'borrowing', depositStatus: 'held', depositAmount: t[2].depositRequired, depositConfirmedDate: daysAgo(4), approvedDate: daysAgo(5), handoverImages: [], dueDate: daysAgo(-5), createdAt: daysAgo(6), updatedAt: daysAgo(4) }));
  borrowDocs.push(mk({ toyId: t[3]._id, ownerId: t[3].ownerId, borrowerId: borrowerOf(t[3].ownerId)._id, status: 'borrowing', depositStatus: 'held', depositAmount: t[3].depositRequired, depositConfirmedDate: daysAgo(3), approvedDate: daysAgo(4), dueDate: daysAgo(-9), createdAt: daysAgo(5), updatedAt: daysAgo(3) }));
  // overdue + held (quá hạn, chờ chủ nhận lại)
  borrowDocs.push(mk({ toyId: t[4]._id, ownerId: t[4].ownerId, borrowerId: borrowerOf(t[4].ownerId)._id, status: 'overdue', depositStatus: 'held', depositAmount: t[4].depositRequired, approvedDate: daysAgo(12), dueDate: daysAgo(2), returnNote: 'Quá hạn - chờ chủ xác nhận nhận lại đồ.', createdAt: daysAgo(14), updatedAt: daysAgo(2) }));
  // returned + refunded (đã trả, hoàn cọc) -> để đánh giá
  const retA = mk({ toyId: t[5]._id, ownerId: t[5].ownerId, borrowerId: borrowerOf(t[5].ownerId)._id, status: 'returned', depositStatus: 'refunded', depositAmount: t[5].depositRequired, depositRefundAmount: t[5].depositRequired, depositDeductAmount: 0, approvedDate: daysAgo(16), returnDate: daysAgo(8), dueDate: daysAgo(9), createdAt: daysAgo(18), updatedAt: daysAgo(8) });
  const retB = mk({ toyId: t[6]._id, ownerId: t[6].ownerId, borrowerId: borrowerOf(t[6].ownerId)._id, status: 'returned', depositStatus: 'refunded', depositAmount: t[6].depositRequired, depositRefundAmount: t[6].depositRequired, depositDeductAmount: 0, approvedDate: daysAgo(20), returnDate: daysAgo(11), dueDate: daysAgo(12), createdAt: daysAgo(22), updatedAt: daysAgo(11) });
  // returned + partially_refunded (có khiếu nại đã xử lý) -> AdminDeposits lịch sử
  borrowDocs.push(mk({ toyId: t[7]._id, ownerId: t[7].ownerId, borrowerId: borrowerOf(t[7].ownerId)._id, status: 'returned', depositStatus: 'partially_refunded', depositAmount: t[7].depositRequired, depositRefundAmount: Math.round(t[7].depositRequired / 2), depositDeductAmount: Math.round(t[7].depositRequired / 2), damageClaimStatus: 'resolved', depositResolveNote: 'Trừ 50% đền bù trầy xước', approvedDate: daysAgo(24), returnDate: daysAgo(15), dueDate: daysAgo(16), createdAt: daysAgo(26), updatedAt: daysAgo(15) }));
  // claimed (chủ báo hư hỏng, chờ người mượn phản hồi)
  borrowDocs.push(mk({ toyId: t[8]._id, ownerId: t[8].ownerId, borrowerId: borrowerOf(t[8].ownerId)._id, status: 'returned', depositStatus: 'held', depositAmount: t[8].depositRequired, damageClaimStatus: 'claimed', damageReported: true, damageAmountRequested: Math.round(t[8].depositRequired / 3), damageNote: 'Vỡ một chi tiết nhỏ', damageImages: [], damageClaimDate: daysAgo(1), approvedDate: daysAgo(10), returnDate: daysAgo(2), dueDate: daysAgo(3), createdAt: daysAgo(12), updatedAt: daysAgo(1) }));

  borrowDocs.push(retA, retB);
  const insertedBorrows = await BorrowRequest.insertMany(borrowDocs);
  // đánh dấu 2 toy đang được mượn thành 'borrowed'
  await Toy.updateMany({ _id: { $in: [t[2]._id, t[3]._id, t[4]._id] } }, { status: 'borrowed' });
  console.log('Lượt mượn:', insertedBorrows.length);

  // ---------- ĐÁNH GIÁ 2 CHIỀU cho 2 đơn đã trả ----------
  const reviewPairs = [retA, retB].map(r => insertedBorrows.find(b => b.toyId.equals(r.toyId) && b.status === 'returned' && b.depositStatus === 'refunded'));
  for (const b of reviewPairs) {
    if (!b) continue;
    await Review.create({ toyId: b.toyId, borrowRequestId: b._id, reviewerId: b.borrowerId, targetOwnerId: b.ownerId, direction: 'borrower_to_owner', rating: 5, comment: 'Đồ chơi sạch đẹp, chủ thân thiện, giao nhận đúng hẹn!' });
    await Review.create({ toyId: b.toyId, borrowRequestId: b._id, reviewerId: b.ownerId, targetOwnerId: b.borrowerId, direction: 'owner_to_borrower', rating: 5, comment: 'Người mượn giữ gìn cẩn thận, trả đúng hạn.' });
  }
  // Cập nhật điểm trung bình cho toy + user
  for (const uid of users.map(u => u._id)) {
    const rs = await Review.find({ targetOwnerId: uid });
    if (rs.length) await User.updateOne({ _id: uid }, { rating: { avg: Number((rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1)), count: rs.length } });
  }
  for (const b of reviewPairs) {
    if (!b) continue;
    const rs = await Review.find({ toyId: b.toyId, direction: { $ne: 'owner_to_borrower' } });
    if (rs.length) await Toy.updateOne({ _id: b.toyId }, { rating: { avg: Number((rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1)), count: rs.length } });
  }
  console.log('Đánh giá: OK');

  // ---------- VOUCHER ----------
  await Voucher.create([
    { code: 'DEMO25', description: 'Giảm 25% cọc, tối đa 50k', discountType: 'percent', discountValue: 25, maxDiscount: 50000, usageLimit: 100, usagePerUser: 1, active: true, expiresAt: daysAgo(-30) },
    { code: 'DEMO50K', description: 'Giảm 50k cọc cho đơn từ 200k', discountType: 'fixed', discountValue: 50000, minDeposit: 200000, usageLimit: 50, usagePerUser: 2, active: true, expiresAt: daysAgo(-60) },
    { code: 'DEMOHE', description: 'Ưu đãi hè (đã tạm ngưng)', discountType: 'percent', discountValue: 15, active: false },
  ]);
  console.log('Voucher: OK');

  // ---------- BÁO CÁO VI PHẠM ----------
  await Report.create([
    { toyId: insertedToys[0]._id, reporterId: users[2]._id, reason: 'Thông tin sai lệch', details: 'Ảnh không khớp với mô tả.', status: 'open' },
    { toyId: insertedToys[1]._id, reporterId: users[3]._id, reason: 'Nghi ngờ đồ không an toàn', details: 'Có chi tiết nhỏ dễ rơi.', status: 'processing' },
  ]);
  console.log('Báo cáo: OK');

  console.log('\n=== SEED HOÀN TẤT ===');
  console.log(`Tài khoản demo: user1@${DOMAIN} ... user${users.length}@${DOMAIN} | mật khẩu: 123456`);
  await mongoose.disconnect();
}

main().catch(e => { console.error('SEED ERROR', e); process.exit(1); });
