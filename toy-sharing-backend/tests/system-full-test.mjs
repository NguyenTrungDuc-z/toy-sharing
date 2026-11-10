// Script kiểm tra tự động toàn diện các chức năng hệ thống ToyShare (E2E API Test)
const BASE = 'http://localhost:5000/api';

async function call(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (err) {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('>>> BẮT ĐẦU KIỂM TRA TOÀN DIỆN CÁC CHỨC NĂNG HỆ THỐNG <<<');
  console.log('====================================================\n');

  // 1. AUTHENTICATION & LOGIN
  console.log('--- 1. XÁC THỰC & ĐĂNG NHẬP ---');
  const adminLogin = await call('POST', '/auth/login', {
    body: { email: 'admin@gmail.com', password: 'admin' },
  });
  assert(adminLogin.status === 200 && adminLogin.data.token, 'Đăng nhập Admin (admin@gmail.com / admin) thành công');
  assert(adminLogin.data.user?.role === 'admin', 'Tài khoản Admin có đúng vai trò role="admin"');
  const adminToken = adminLogin.data.token;

  const userLogin = await call('POST', '/auth/login', {
    body: { email: 'user@gmail.com', password: '123456' },
  });
  assert(userLogin.status === 200 && userLogin.data.token, 'Đăng nhập User (user@gmail.com / 123456) thành công');
  assert(userLogin.data.user?.role === 'user', 'Tài khoản User có đúng vai trò role="user"');
  const userToken = userLogin.data.token;

  // Profile cá nhân
  const meRes = await call('GET', '/auth/me', { token: userToken });
  assert(meRes.status === 200 && meRes.data.user?.email === 'user@gmail.com', 'Lấy thông tin cá nhân Profile (/auth/me) thành công');

  // 2. ADMIN DASHBOARD STATS & CHART.JS DATA
  console.log('\n--- 2. ADMIN DASHBOARD & DỮ LIỆU BIỂU ĐỒ (CHART.JS) ---');
  const statsRes = await call('GET', '/auth/admin/stats', { token: adminToken });
  assert(statsRes.status === 200 && statsRes.data.success, 'Lấy số liệu thống kê Dashboard thành công');
  const d = statsRes.data.data;
  assert(d.chartData?.length >= 4 && d.chartLabels?.length >= 4, 'Biểu đồ Line Chart: Có đầy đủ nhãn thời gian và dữ liệu tăng trưởng đồ chơi');
  assert(d.usersTrend?.length >= 4 && d.borrowsTrend?.length >= 4, 'Biểu đồ Line Chart: Có dữ liệu tăng trưởng thành viên và lượt mượn tích lũy');
  assert(d.categoryLabels?.length === 6 && d.categoryData?.length === 6, 'Biểu đồ Doughnut Chart: Có đủ 6 danh mục đồ chơi và tỉ lệ phân bố');
  assert(d.borrowStatusLabels?.length > 0 && d.borrowStatusData?.length > 0, 'Biểu đồ Bar Chart: Có dữ liệu phân tích trạng thái mượn đồ');
  assert(d.depositStats?.held !== undefined && d.depositStats?.refunded !== undefined, 'Biểu đồ Escrow: Có số liệu tiền ký quỹ đang giữ và đã hoàn trả');

  // 3. DANH MỤC SẢN PHẨM (CATEGORIES)
  console.log('\n--- 3. DANH MỤC ĐỒ CHƠI (CATEGORIES) ---');
  const catRes = await call('GET', '/categories');
  assert(catRes.status === 200 && catRes.data.categories?.length === 6, 'Lấy danh mục thành công (đủ 6 danh mục chính thức)');

  // 4. TOYS CATALOG & DETAIL & FILTER
  console.log('\n--- 4. DANH SÁCH ĐỒ CHƠI & BỘ LỌC (TOYS CATALOG) ---');
  const toysAll = await call('GET', '/toys?page=1&limit=12');
  assert(toysAll.status === 200 && toysAll.data.toys?.length === 12, 'Lấy trang 1 danh sách đồ chơi (12 món/trang) thành công');
  assert(toysAll.data.pagination?.total === 36, 'Tổng số đồ chơi đúng 36 sản phẩm');
  assert(toysAll.data.pagination?.totalPages === 3, 'Tổng số trang đúng 3 trang');

  // Kiểm tra ảnh của sản phẩm đầu tiên
  const firstToy = toysAll.data.toys[0];
  assert(firstToy.images?.length >= 2 && firstToy.images[0].startsWith('http'), 'Sản phẩm có đầy đủ 2 ảnh Unsplash chất lượng cao');

  // Lọc theo danh mục
  const catFilter = await call('GET', '/toys?category=Xếp hình');
  assert(catFilter.status === 200 && (catFilter.data.toys || catFilter.data).length === 6, 'Bộ lọc danh mục "Xếp hình" trả về đúng 6 sản phẩm');

  // Tìm kiếm theo từ khóa
  const searchFilter = await call('GET', '/toys?search=LEGO');
  assert(searchFilter.status === 200 && (searchFilter.data.toys || searchFilter.data).length > 0, 'Tìm kiếm đồ chơi theo từ khóa "LEGO" thành công');

  // Chi tiết sản phẩm
  const toyDetail = await call('GET', `/toys/${firstToy._id}`);
  assert(toyDetail.status === 200 && toyDetail.data.name === firstToy.name, 'Lấy chi tiết đồ chơi (ToyDetail) thành công');

  // Đồ chơi liên quan (Related toys)
  const relatedToys = await call('GET', `/toys/${firstToy._id}/related`);
  assert(relatedToys.status === 200 && relatedToys.data.related?.length > 0, 'Gợi ý đồ chơi tương tự cùng danh mục thành công');

  // 5. VOUCHER & GIẢM GIÁ CỌC
  console.log('\n--- 5. HỆ THỐNG MÃ GIẢM GIÁ CỌC (VOUCHER) ---');
  const vouchersRes = await call('GET', '/vouchers', { token: adminToken });
  assert(vouchersRes.status === 200 && vouchersRes.data.vouchers?.length >= 3, 'Admin quản lý danh sách voucher ưu đãi thành công');

  // 6. ĐÁNH GIÁ (REVIEWS)
  console.log('\n--- 6. ĐÁNH GIÁ & PHẢN HỒI (REVIEWS) ---');
  const reviewsRes = await call('GET', `/reviews/toy/${firstToy._id}`);
  assert(reviewsRes.status === 200 && reviewsRes.data.success, 'Lấy danh sách đánh giá của đồ chơi thành công');

  // 7. YÊU CẦU MƯỢN ĐỒ (BORROW REQUESTS)
  console.log('\n--- 7. QUẢN LÝ LƯỢT MƯỢN (BORROW REQUESTS) ---');
  const myBorrows = await call('GET', '/borrows/my-borrows', { token: userToken });
  assert(myBorrows.status === 200 && Array.isArray(myBorrows.data), 'Lấy danh sách đơn mượn của tôi (/borrows/my-borrows) thành công');

  const incomingRequests = await call('GET', '/borrows/incoming-requests', { token: userToken });
  assert(incomingRequests.status === 200 && Array.isArray(incomingRequests.data), 'Lấy danh sách yêu cầu người khác mượn đồ của tôi thành công');

  // 8. TÍNH NĂNG ADMIN NÂNG CAO
  console.log('\n--- 8. CÁC TÍNH NĂNG QUẢN TRỊ ADMIN ---');
  // 8a. Quản lý người dùng & phân quyền
  const adminUsers = await call('GET', '/auth/admin/users', { token: adminToken });
  assert(adminUsers.status === 200 && adminUsers.data.users?.length > 0, 'Admin quản lý danh sách & phân quyền thành viên (/auth/admin/users) thành công');

  // 8b. Quản lý kiểm duyệt bài đăng đồ chơi
  const adminToys = await call('GET', '/auth/admin/toys', { token: adminToken });
  assert(adminToys.status === 200 && Array.isArray(adminToys.data.toys || adminToys.data), 'Admin kiểm duyệt bài đăng đồ chơi (/auth/admin/toys) thành công');

  // 8c. Quản lý tiền ký quỹ Escrow
  const adminDeposits = await call('GET', '/deposits/admin/all', { token: adminToken });
  assert(adminDeposits.status === 200 && Array.isArray(adminDeposits.data.deposits), 'Admin quản lý dòng tiền cọc ký quỹ Escrow (/deposits/admin/all) thành công');

  // 8d. Quản lý lịch sử mượn toàn sàn
  const adminBorrows = await call('GET', '/admin/borrows', { token: adminToken });
  assert(adminBorrows.status === 200 && Array.isArray(adminBorrows.data.borrows), 'Admin theo dõi lịch sử mượn toàn sàn (/admin/borrows) thành công');

  // 8e. Quản lý báo cáo vi phạm
  const adminReports = await call('GET', '/admin/reports', { token: adminToken });
  assert(adminReports.status === 200 && Array.isArray(adminReports.data.reports), 'Admin kiểm tra báo cáo vi phạm (/admin/reports) thành công');

  // 9. THÔNG BÁO (NOTIFICATIONS)
  console.log('\n--- 9. THÔNG BÁO HỆ THỐNG (NOTIFICATIONS) ---');
  const notifs = await call('GET', '/notifications', { token: userToken });
  assert(notifs.status === 200 && Array.isArray(notifs.data.notifications), 'Lấy thông báo của người dùng (/notifications) thành công');

  // 10. YÊU THÍCH (FAVORITES)
  console.log('\n--- 10. DANH SÁCH YÊU THÍCH (FAVORITES) ---');
  const favRes = await call('GET', '/auth/me/favorites', { token: userToken });
  assert(favRes.status === 200 && Array.isArray(favRes.data.favorites || favRes.data), 'Lấy danh sách đồ chơi yêu thích (/auth/me/favorites) thành công');

  console.log('\n====================================================');
  console.log(`KẾT QUẢ KIỂM TRA: ${passed} PASS / ${failed} FAIL`);
  if (failed === 0) {
    console.log('>>> TẤT CẢ CHỨC NĂNG ĐỀU HOẠT ĐỘNG HOÀN HẢO 100%! <<<');
  } else {
    console.log('>>> CÓ CHỨC NĂNG CẦN XỬ LÝ! <<<');
  }
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('LỖI KHI CHẠY TEST:', err);
  process.exit(1);
});
