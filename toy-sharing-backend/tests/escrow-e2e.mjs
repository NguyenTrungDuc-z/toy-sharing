// E2E test cho luồng escrow + khiếu nại hư hỏng. Chạy khi server đã bật ở cổng 5000.
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

async function registerAndLogin(name, email) {
  await call('POST', '/auth/register', { body: { name, email, password: '12345678', phone: '0900000000' } });
  const login = await call('POST', '/auth/login', { body: { email, password: '12345678' } });
  return { token: login.data.token, id: login.data.user?.id };
}

let adminToken, owner, borrower;

// Tạo 1 toy mới + đưa tới trạng thái held (admin đã giữ cọc), trả về reqId + toyId
async function setupHeld(deposit = 200000) {
  const create = await call('POST', '/toys', { token: owner.token, body: {
    name: 'Toy ' + rnd + Math.random().toString(36).slice(2,5), category: 'Giáo dục', ageRange: '3-6 tuổi',
    condition: 'new', images: [], depositRequired: deposit
  }});
  const toyId = create.data.toy._id;
  await call('PUT', `/toys/${toyId}/moderate`, { token: adminToken, body: { status: 'available' } });
  const due = new Date(Date.now() + 5 * 864e5).toISOString();
  const reqRes = await call('POST', '/borrows', { token: borrower.token, body: { toyId, dueDate: due } });
  const reqId = reqRes.data.data._id;
  await call('PUT', `/borrows/${reqId}/approve`, { token: owner.token });
  await call('POST', `/deposits/${reqId}/report-paid`, { token: borrower.token });
  await call('POST', `/deposits/admin/${reqId}/confirm`, { token: adminToken });
  return { reqId, toyId };
}

async function main() {
  console.log('== Setup ==');
  const admin = await call('POST', '/auth/login', { body: { email: 'admin@toyshare.com', password: 'admin123' } });
  adminToken = admin.data.token; assert(!!adminToken, 'admin login');
  owner = await registerAndLogin('Owner ' + rnd, `owner_${rnd}@test.com`);
  borrower = await registerAndLogin('Borrower ' + rnd, `borrower_${rnd}@test.com`);
  assert(!!owner.token && !!borrower.token, 'accounts ready');

  // ===== Scenario 1: happy path (ok return) + handover photo guard =====
  console.log('\n== S1: happy path ==');
  const s1 = await setupHeld();
  const noPhoto = await call('PATCH', `/borrows/${s1.reqId}/confirm-deposit`, { token: owner.token });
  assert(noPhoto.status === 400, 'handover without photo rejected (got ' + noPhoto.status + ')');
  const hand = await call('PATCH', `/borrows/${s1.reqId}/confirm-deposit`, { token: owner.token, body: { handoverImages: [IMG] } });
  assert(hand.status === 200 && hand.data.data.status === 'borrowing', 'handover with photo -> borrowing');
  await call('PATCH', `/borrows/${s1.reqId}/report-return`, { token: borrower.token, body: { returnType: 'on_time', returnImages: [IMG] } });
  const okRet = await call('PATCH', `/borrows/${s1.reqId}/confirm-return`, { token: owner.token, body: { condition: 'ok' } });
  assert(okRet.status === 200 && okRet.data.data.depositStatus === 'held', 'ok return -> returned, held');
  const refund = await call('POST', `/deposits/admin/${s1.reqId}/refund`, { token: adminToken });
  assert(refund.status === 200 && refund.data.data.depositStatus === 'refunded', 'full refund');

  // ===== Scenario 2: damage claim -> borrower ACCEPTS -> admin deducts 50k =====
  console.log('\n== S2: damage accepted ==');
  const s2 = await setupHeld();
  await call('PATCH', `/borrows/${s2.reqId}/confirm-deposit`, { token: owner.token, body: { handoverImages: [IMG] } });
  await call('PATCH', `/borrows/${s2.reqId}/report-return`, { token: borrower.token, body: { returnType: 'on_time', returnImages: [IMG] } });
  const noImg = await call('PATCH', `/borrows/${s2.reqId}/confirm-return`, { token: owner.token, body: { condition: 'damaged', amount: 50000 } });
  assert(noImg.status === 400, 'damaged claim without image rejected');
  const claim = await call('PATCH', `/borrows/${s2.reqId}/confirm-return`, { token: owner.token, body: { condition: 'damaged', amount: 50000, note: 'vỡ', images: [IMG] } });
  assert(claim.status === 200 && claim.data.data.damageClaimStatus === 'claimed', 'damage claim created');
  const refundBlocked = await call('POST', `/deposits/admin/${s2.reqId}/refund`, { token: adminToken });
  assert(refundBlocked.status === 400, 'full refund blocked while claim open');
  const acc = await call('PATCH', `/borrows/${s2.reqId}/respond-claim`, { token: borrower.token, body: { accept: true } });
  assert(acc.status === 200 && acc.data.data.damageClaimStatus === 'accepted', 'borrower accepts');
  const resolve = await call('POST', `/deposits/admin/${s2.reqId}/resolve-damage`, { token: adminToken, body: { deductAmount: 50000 } });
  assert(resolve.status === 200 && resolve.data.data.depositStatus === 'partially_refunded', 'resolved partially_refunded');
  assert(resolve.data.data.depositRefundAmount === 150000 && resolve.data.data.depositDeductAmount === 50000, 'deduct 50k / refund 150k');
  assert(resolve.data.data.damageClaimStatus === 'resolved', 'claim resolved');

  // ===== Scenario 3: damage claim -> borrower DISPUTES -> admin deducts 0 (full refund) =====
  console.log('\n== S3: damage disputed, admin sides borrower ==');
  const s3 = await setupHeld();
  await call('PATCH', `/borrows/${s3.reqId}/confirm-deposit`, { token: owner.token, body: { handoverImages: [IMG] } });
  await call('PATCH', `/borrows/${s3.reqId}/report-return`, { token: borrower.token, body: { returnType: 'on_time', returnImages: [IMG] } });
  await call('PATCH', `/borrows/${s3.reqId}/confirm-return`, { token: owner.token, body: { condition: 'damaged', amount: 100000, note: 'xước', images: [IMG] } });
  const dispute = await call('PATCH', `/borrows/${s3.reqId}/respond-claim`, { token: borrower.token, body: { accept: false, note: 'tôi trả nguyên vẹn', images: [IMG] } });
  assert(dispute.status === 200 && dispute.data.data.damageClaimStatus === 'disputed', 'borrower disputes');
  const resolve0 = await call('POST', `/deposits/admin/${s3.reqId}/resolve-damage`, { token: adminToken, body: { deductAmount: 0, note: 'ảnh cho thấy không hư hỏng' } });
  assert(resolve0.status === 200 && resolve0.data.data.depositStatus === 'refunded', 'deduct 0 -> refunded full');
  assert(resolve0.data.data.depositRefundAmount === 200000, 'refund full 200k');

  console.log('\n' + (failed === 0 ? 'ALL PASS' : failed + ' FAILED'));
  process.exit(failed === 0 ? 0 : 1);
}
main().catch(e => { console.error('ERROR', e); process.exit(1); });
