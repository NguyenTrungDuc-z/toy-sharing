// Sinh link ảnh VietQR (miễn phí, không cần API key) từ thông tin ngân hàng.
// Tham khảo: https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/
// Format: https://img.vietqr.io/image/<BANK>-<ACCOUNT>-<TEMPLATE>.png?amount=&addInfo=&accountName=

function buildVietQRUrl({ bankId, accountNo, accountName, amount, addInfo, template = 'compact2' }) {
    if (!bankId || !accountNo) return null;
    const base = `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNo)}-${template}.png`;
    const params = new URLSearchParams();
    if (amount) params.set('amount', String(Math.round(amount)));
    if (addInfo) params.set('addInfo', addInfo);
    if (accountName) params.set('accountName', accountName);
    const query = params.toString();
    return query ? `${base}?${query}` : base;
}

// Thông tin tài khoản ADMIN (escrow) đọc từ biến môi trường
function getAdminBankInfo() {
    return {
        bankId: process.env.ADMIN_BANK_ID || '',
        accountNo: process.env.ADMIN_BANK_ACCOUNT || '',
        accountName: process.env.ADMIN_BANK_NAME || '',
        configured: Boolean(process.env.ADMIN_BANK_ID && process.env.ADMIN_BANK_ACCOUNT)
    };
}

module.exports = { buildVietQRUrl, getAdminBankInfo };
