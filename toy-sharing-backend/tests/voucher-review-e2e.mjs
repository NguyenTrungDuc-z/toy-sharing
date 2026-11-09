// E2E cho voucher THẬT + đánh giá 2 chiều. Server chạy cổng 5000.
const BASE = 'http://localhost:5000/api';
const rnd = Math.random().toString(36).slice(2, 8);
const IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
let failed = 0;
const assert = (cond, msg) => { if (cond) console.log('  PASS:', msg); else { console.log('  FAIL:', msg); failed++; } };

async function reg(name, email) {
  const r = await call('POST', '/auth/register', { body: { name, email, password: '12345678', phone: '0900000000' } });
  if (r.data?.requiresVerification && r.data?.devVerifyToken) {
    await call('POST', '/auth/verify-email', { body: { email, token: r.data.devVerifyToken } });
  }
  const login = await call('POST', '/auth/login', { body: { email, password: '12345678' } });
  return { token: login.data.token, id: login.data.user?.id };
}

async function main() {
  const admin = await call('POST', '/auth/login', { body: { email: 'admin@toyshare.com', password: 'admin123' } });
  const adminToken = admin.data.token;
  const owner = await reg('Owner ' + rnd, `owner_${rnd}@test.com`);
  const borrower = await reg('Borrower ' + rnd, `borrower_${rnd}@test.com`);
  assert(!!adminToken && !!owner.token && !!borrower.token, 'setup accounts');

  // ===== VOUCHER =====
  console.log('\n== Voucher thật ==');
  const code = ('TEST' + rnd).toUpperCase();
  const vc = await call('POST', '/vouchers', { token: adminToken, body: {
    code, discountType: 'percent', discountValue: 25, maxDiscount: 0, minDeposit: 0, usageLimit: 5, active: true
  }});
  assert(vc.status === 201, 'admin tạo voucher 25%');

  const create = await call('POST', '/toys', { token: owner.token, body: {
    name: 'Toy ' + rnd, category: 'Giáo dục', ageRange: '3-6 tuổi', condition: 'new', images: [], depositRequired: 200000
  }});
  const toyId = create.data.toy._id;
  await call('PUT', `/toys/${toyId}/moderate`, { token: adminToken, body: { status: 'available' } });
  const due = new Date(Date.now() + 5 * 864e5).toISOString();
  const reqRes = await call('POST', '/borrows', { token: borrower.token, body: { toyId, dueDate: due } });
  const reqId = reqRes.data.data._id;
  await call('PUT', `/borrows/${reqId}/approve`, { token: owner.token });

  const apply = await call('POST', `/vouchers/apply/${reqId}`, { token: borrower.token, body: { code } });
  assert(apply.status === 200 && apply.data.discount === 50000, 'áp voucher giảm 50k (25% của 200k)');
  assert(apply.data.newDeposit === 150000, 'cọc mới = 150k');

  const qr = await call('GET', `/deposits/${reqId}/qr`, { token: borrower.token });
  if (qr.status === 503) console.log('  SKIP: QR cần ADMIN_BANK trong .env (chưa cấu hình) — bỏ qua kiểm tra số tiền QR');
  else assert(qr.data.amount === 150000, 'QR hiển thị 150k');

  const applyAgain = await call('POST', `/vouchers/apply/${reqId}`, { token: borrower.token, body: { code } });
  assert(applyAgain.status === 400, 'không áp voucher 2 lần');

  // Đẩy đơn tới 'returned' để test đánh giá 2 chiều
  await call('POST', `/deposits/${reqId}/report-paid`, { token: borrower.token });
  await call('POST', `/deposits/admin/${reqId}/confirm`, { token: adminToken });
  await call('PATCH', `/borrows/${reqId}/confirm-deposit`, { token: owner.token, body: { handoverImages: [IMG] } });
  await call('PATCH', `/borrows/${reqId}/report-return`, { token: borrower.token, body: { returnType: 'on_time', returnImages: [IMG] } });
  const ret = await call('PATCH', `/borrows/${reqId}/confirm-return`, { token: owner.token, body: { condition: 'ok' } });
  assert(ret.status === 200, 'đơn đã trả (returned)');

  // ===== ĐÁNH GIÁ 2 CHIỀU =====
  console.log('\n== Đánh giá 2 chiều ==');
  const r1 = await call('POST', '/reviews', { token: borrower.token, body: { toyId, borrowRequestId: reqId, rating: 5, comment: 'Đồ chơi rất tốt' } });
  assert(r1.status === 201 && r1.data.direction === 'borrower_to_owner', 'người mượn đánh giá chủ/đồ chơi');

  const r1dup = await call('POST', '/reviews', { token: borrower.token, body: { toyId, borrowRequestId: reqId, rating: 4, comment: 'lần 2' } });
  assert(r1dup.status === 400, 'người mượn không đánh giá 2 lần');

  const r2 = await call('POST', '/reviews', { token: owner.token, body: { toyId, borrowRequestId: reqId, rating: 4, comment: 'Người mượn giữ gìn tốt' } });
  assert(r2.status === 201 && r2.data.direction === 'owner_to_borrower', 'chủ đánh giá người mượn');

  // Kiểm tra điểm người mượn đã được cập nhật
  const bprofile = await call('GET', `/users/${borrower.id}`, { token: owner.token });
  const brating = bprofile.data?.rating || bprofile.data?.user?.rating || bprofile.data?.data?.rating;
  assert(brating && brating.count >= 1 && brating.avg === 4, 'điểm người mượn = 4 (1 lượt)');

  // Review công khai của đồ chơi KHÔNG chứa review chủ->người mượn
  const toyReviews = await call('GET', `/reviews/toy/${toyId}`);
  assert(toyReviews.data.reviews.length === 1, 'review công khai của đồ chơi chỉ có 1 (không lẫn review người mượn)');

  console.log('\n' + (failed === 0 ? 'ALL PASS' : failed + ' FAILED'));
  process.exit(failed === 0 ? 0 : 1);
}
main().catch(e => { console.error('ERROR', e); process.exit(1); });
