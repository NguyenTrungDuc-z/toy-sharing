// Dọn dữ liệu test do bộ E2E tạo ra (user owner_*/borrower_*, đồ "Toy xxxx",
// voucher TEST*/DBG*/PER*/PCT*, cùng borrow/review/notification liên quan).
// Mặc định DRY RUN. Chạy "node scripts/cleanup-testdata.js apply" để xoá thật.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const APPLY = process.argv.includes('apply');
const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/toy_sharing';

(async () => {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const toys = db.collection('toys');
  const users = db.collection('users');
  const borrows = db.collection('borrowrequests');
  const reviews = db.collection('reviews');
  const notifications = db.collection('notifications');
  const vouchers = db.collection('vouchers');

  const toyFilter = { name: { $regex: /^(Test Toy|Toy |Tblv)[a-z0-9]*/i } };
  const userFilter = { email: { $regex: /^(owner|borrower)_[a-z0-9]+(b)?@test\.com$/ } };
  const voucherFilter = { code: { $regex: /^(TEST|DBG|PER|PCT|HECHE)/ } };

  const testToys = await toys.find(toyFilter).project({ _id: 1 }).toArray();
  const testUsers = await users.find(userFilter).project({ _id: 1 }).toArray();
  const toyIds = testToys.map(t => t._id);
  const userIds = testUsers.map(u => u._id);
  const relatedBorrows = await borrows.find({
    $or: [{ toyId: { $in: toyIds } }, { ownerId: { $in: userIds } }, { borrowerId: { $in: userIds } }]
  }).project({ _id: 1 }).toArray();
  const borrowIds = relatedBorrows.map(b => b._id);

  console.log('=== TEST DATA FOUND ===');
  console.log('toys:', toyIds.length, '| users:', userIds.length, '| borrows:', borrowIds.length,
    '| vouchers:', await vouchers.countDocuments(voucherFilter),
    '| reviews:', await reviews.countDocuments({ $or: [{ toyId: { $in: toyIds } }, { borrowRequestId: { $in: borrowIds } }] }),
    '| notifications:', await notifications.countDocuments({ userId: { $in: userIds } }));

  if (!APPLY) { console.log('(DRY RUN — thêm "apply" để xoá thật)'); await mongoose.disconnect(); return; }

  const r = {
    reviews: (await reviews.deleteMany({ $or: [{ toyId: { $in: toyIds } }, { borrowRequestId: { $in: borrowIds } }] })).deletedCount,
    notifications: (await notifications.deleteMany({ userId: { $in: userIds } })).deletedCount,
    borrows: (await borrows.deleteMany({ _id: { $in: borrowIds } })).deletedCount,
    toys: (await toys.deleteMany({ _id: { $in: toyIds } })).deletedCount,
    users: (await users.deleteMany({ _id: { $in: userIds } })).deletedCount,
    vouchers: (await vouchers.deleteMany(voucherFilter)).deletedCount,
  };
  console.log('=== DELETED ===', JSON.stringify(r));
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
