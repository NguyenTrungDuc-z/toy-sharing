// E2E xác minh các bản vá theo đánh giá BA. Server chạy cổng 5000.
const BASE = 'http://localhost:5000/api';
const rnd = Math.random().toString(36).slice(2, 8);
const IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
const call = async (m, p, { token, body } = {}) => {
  const r = await fetch(BASE + p, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let d = null; try { d = await r.json(); } catch {}
  return { status: r.status, data: d };
};
let failed = 0;
const assert = (c, m) => { if (c) console.log('  PASS:', m); else { console.log('  FAIL:', m); failed++; } };
const reg = async (n, e) => { await call('POST', '/auth/register', { body: { name: n, email: e, password: '12345678', phone: '0900000000' } }); const l = await call('POST', '/auth/login', { body: { email: e, password: '12345678' } }); return { token: l.data.token, id: l.data.user?.id }; };

async function mkToy(owner, adminToken, deposit) {
  const c = await call('POST', '/toys', { token: owner.token, body: { name: 'Toy ' + rnd + Math.random().toString(36).slice(2,4), category: 'Giáo dục', ageRange: '3-6 tuổi', condition: 'new', images: [], depositRequired: deposit } });
  const toyId = c.data.toy._id;
  await call('PUT', `/toys/${toyId}/moderate`, { token: adminToken, body: { status: 'available' } });
  return toyId;
}

async function main() {
  const admin = await call('POST', '/auth/login', { body: { email: 'admin@toyshare.com', password: 'admin123' } });
  const adminToken = admin.data.token;
  const owner = await reg('O' + rnd, `owner_${rnd}@test.com`);
  const borrower = await reg('B' + rnd, `borrower_${rnd}@test.com`);
  const borrower2 = await reg('C' + rnd, `borrower_${rnd}b@test.com`);

  // ===== FIX #1: đồ MIỄN CỌC quá hạn -> 'overdue', KHÔNG tự 'returned' =====
  console.log('\n== #1 Overdue đồ miễn cọc không tự trả ==');
  const freeToy = await mkToy(owner, adminToken, 0);
  const past = new Date(Date.now() - 2 * 864e5).toISOString();
  const fr = await call('POST', '/borrows', { token: borrower.token, body: { toyId: freeToy, dueDate: past } });
  const freeReq = fr.data.data._id;
  await call('PUT', `/borrows/${freeReq}/approve`, { token: owner.token });
  await call('PATCH', `/borrows/${freeReq}/confirm-deposit`, { token: owner.token, body: { handoverImages: [IMG] } });
  // Gọi incoming-requests để kích hoạt job quét quá hạn
  const inc = await call('GET', '/borrows/incoming-requests', { token: owner.token });
  const row = (inc.data || []).find(r => r._id === freeReq);
  assert(row && row.status === 'overdue', 'đồ miễn cọc quá hạn -> overdue (không phải returned)');
  const toyAfter = await call('GET', `/toys/${freeToy}`);
  assert((toyAfter.data.toy || toyAfter.data).status === 'borrowed', 'đồ chơi vẫn borrowed (chưa về)');

  // ===== FIX #2a: voucher giới hạn mỗi người =====
  console.log('\n== #2a Voucher giới hạn lượt/người ==');
  const code = ('PER' + rnd).toUpperCase();
  await call('POST', '/vouchers', { token: adminToken, body: { code, discountType: 'fixed', discountValue: 20000, usagePerUser: 1, active: true } });
  const toyA = await mkToy(owner, adminToken, 100000);
  const toyB = await mkToy(owner, adminToken, 100000);
  const due = new Date(Date.now() + 5 * 864e5).toISOString();
  const ra = (await call('POST', '/borrows', { token: borrower.token, body: { toyId: toyA, dueDate: due } })).data.data._id;
  await call('PUT', `/borrows/${ra}/approve`, { token: owner.token });
  const ap1 = await call('POST', `/vouchers/apply/${ra}`, { token: borrower.token, body: { code } });
  assert(ap1.status === 200, 'lần 1 áp voucher OK');
  const rb = (await call('POST', '/borrows', { token: borrower.token, body: { toyId: toyB, dueDate: due } })).data.data._id;
  await call('PUT', `/borrows/${rb}/approve`, { token: owner.token });
  const ap2 = await call('POST', `/vouchers/apply/${rb}`, { token: borrower.token, body: { code } });
  assert(ap2.status === 400, 'lần 2 cùng người -> bị chặn (usagePerUser=1)');

  // ===== FIX #2b: hoàn lượt voucher khi huỷ đơn chưa đóng cọc =====
  console.log('\n== #2b Huỷ đơn đã áp voucher -> hoàn lượt ==');
  const cancelRes = await call('PATCH', `/borrows/${ra}/cancel`, { token: borrower.token });
  assert(cancelRes.status === 200, 'huỷ được đơn approved chưa đóng cọc');
  const rc = (await call('POST', '/borrows', { token: borrower.token, body: { toyId: toyA, dueDate: due } })).data.data._id;
  await call('PUT', `/borrows/${rc}/approve`, { token: owner.token });
  const ap3 = await call('POST', `/vouchers/apply/${rc}`, { token: borrower.token, body: { code } });
  assert(ap3.status === 200, 'sau khi huỷ, người dùng áp lại được (lượt đã hoàn)');

  // ===== FIX #2c: voucher KHÔNG giảm trần đền bù của chủ (nền tảng bảo trợ) =====
  console.log('\n== #2c Trần đền bù theo cọc gốc ==');
  const code25 = ('PCT' + rnd).toUpperCase();
  await call('POST', '/vouchers', { token: adminToken, body: { code: code25, discountType: 'percent', discountValue: 25, active: true } });
  const toyC = await mkToy(owner, adminToken, 200000);
  const rd = (await call('POST', '/borrows', { token: borrower2.token, body: { toyId: toyC, dueDate: due } })).data.data._id;
  await call('PUT', `/borrows/${rd}/approve`, { token: owner.token });
  const apd = await call('POST', `/vouchers/apply/${rd}`, { token: borrower2.token, body: { code: code25 } });
  assert(apd.data.newDeposit === 150000, 'cọc giảm còn 150k (đóng 150k)');
  await call('POST', `/deposits/${rd}/report-paid`, { token: borrower2.token });
  await call('POST', `/deposits/admin/${rd}/confirm`, { token: adminToken });
  await call('PATCH', `/borrows/${rd}/confirm-deposit`, { token: owner.token, body: { handoverImages: [IMG] } });
  await call('PATCH', `/borrows/${rd}/report-return`, { token: borrower2.token, body: { returnType: 'on_time', returnImages: [IMG] } });
  // Chủ khai hư hỏng 180k (> 150k đã đóng, nhưng <= 200k cọc gốc)
  const claim = await call('PATCH', `/borrows/${rd}/confirm-return`, { token: owner.token, body: { condition: 'damaged', amount: 180000, note: 'vỡ nặng', images: [IMG] } });
  assert(claim.status === 200, 'chủ khai hư 180k được chấp nhận (theo cọc gốc 200k)');
  await call('PATCH', `/borrows/${rd}/respond-claim`, { token: borrower2.token, body: { accept: true } });
  const resolve = await call('POST', `/deposits/admin/${rd}/resolve-damage`, { token: adminToken, body: { deductAmount: 180000 } });
  assert(resolve.data.data.depositDeductAmount === 180000, 'trừ 180k đền chủ');
  assert(resolve.data.data.depositRefundAmount === 0, 'người mượn hoàn 0 (đã đóng 150k < 180k), nền tảng bù 30k');

  // ===== FIX #6: chống trùng lịch khi duyệt =====
  console.log('\n== #6 Chống trùng lịch khi duyệt ==');
  const toyD = await mkToy(owner, adminToken, 50000);
  const b1 = (await call('POST', '/borrows', { token: borrower.token, body: { toyId: toyD, dueDate: due } })).data.data._id;
  const b2 = (await call('POST', '/borrows', { token: borrower2.token, body: { toyId: toyD, dueDate: due } })).data.data._id;
  const appr1 = await call('PUT', `/borrows/${b1}/approve`, { token: owner.token });
  assert(appr1.status === 200, 'duyệt đơn 1 OK');
  const appr2 = await call('PUT', `/borrows/${b2}/approve`, { token: owner.token });
  assert(appr2.status === 400, 'duyệt đơn 2 cùng đồ -> bị chặn (chống 2 đơn approved)');

  console.log('\n' + (failed === 0 ? 'ALL PASS' : failed + ' FAILED'));
  process.exit(failed === 0 ? 0 : 1);
}
main().catch(e => { console.error('ERROR', e); process.exit(1); });
