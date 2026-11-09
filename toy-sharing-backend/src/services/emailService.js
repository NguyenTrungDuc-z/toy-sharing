const nodemailer = require('nodemailer');

/**
 * Khởi tạo transporter nodemailer cho Gmail hoặc SMTP tùy chỉnh.
 */
function getTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        return null;
    }

    // Nếu chỉ định SMTP server riêng biệt
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user, pass }
        });
    }

    // Mặc định kết nối Gmail qua App Password
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass
        }
    });
}

/**
 * Kiểm tra xem dịch vụ email đã được cấu hình trong .env hay chưa
 */
function isEmailConfigured() {
    return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

/**
 * Gửi email chứa mã xác nhận và liên kết đặt lại mật khẩu
 */
async function sendResetPasswordEmail({ to, token, resetUrl, userName }) {
    const transporter = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || `"ToyShare Vietnam" <${process.env.EMAIL_USER || 'no-reply@toyshare.vn'}>`;

    if (!transporter) {
        console.warn(`[EMAIL] Chưa cấu hình EMAIL_USER và EMAIL_PASS trong .env. Bỏ qua gửi email thật tới ${to}.`);
        return {
            sent: false,
            reason: 'unconfigured',
            message: 'Email service chưa cấu hình credentials (.env)'
        };
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f3ee; margin: 0; padding: 24px; color: #2d2621; }
            .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebdcd0; }
            .logo { font-size: 24px; font-weight: 800; color: #ff6b35; margin-bottom: 24px; display: inline-block; }
            .header-title { font-size: 20px; font-weight: 700; color: #1f1a17; margin-bottom: 12px; }
            .content { font-size: 15px; line-height: 1.6; color: #52473f; margin-bottom: 24px; }
            .token-box { background: #fff8f3; border: 2px dashed #ff9a6c; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
            .token-label { font-size: 13px; color: #7a6a5f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 6px; }
            .token-value { font-family: monospace; font-size: 20px; font-weight: 700; color: #d94b15; letter-spacing: 1px; word-break: break-all; }
            .btn-action { display: inline-block; background-color: #ff6b35; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 12px 0 20px 0; }
            .footer { font-size: 13px; color: #9c8e84; border-top: 1px solid #f0e6de; padding-top: 20px; margin-top: 28px; line-height: 1.5; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 14px; font-size: 13px; color: #991b1b; border-radius: 4px; margin-top: 16px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🧸 ToyShare</div>
            <div class="header-title">Yêu cầu đặt lại mật khẩu</div>
            <p class="content">
                Xin chào ${userName || 'bạn'},<br/>
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${to}</strong> trên nền tảng chia sẻ đồ chơi ToyShare.
            </p>
            
            <div class="token-box">
                <div class="token-label">Mã xác nhận (Token) của bạn:</div>
                <div class="token-value">${token}</div>
            </div>

            ${resetUrl ? `
            <div style="text-align: center;">
                <a href="${resetUrl}" class="btn-action" target="_blank">Nhấp vào đây để Đặt lại mật khẩu</a>
            </div>
            ` : ''}

            <div class="warning">
                ⏱️ Mã xác nhận này có hiệu lực trong vòng <strong>15 phút</strong>.
            </div>

            <p class="content" style="margin-top: 20px; font-size: 14px;">
                Nếu bạn không gửi yêu cầu này, bạn có thể an tâm bỏ qua email. Mật khẩu hiện tại của bạn vẫn được bảo đảm an toàn.
            </p>

            <div class="footer">
                Trân trọng,<br/>
                Đội ngũ ToyShare Vietnam - Nền tảng chia sẻ đồ chơi trẻ em
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
[ToyShare] Yêu cầu đặt lại mật khẩu

Xin chào ${userName || ''},
Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản: ${to}

Mã xác nhận (token) của bạn là:
${token}

${resetUrl ? `Link đặt lại mật khẩu: ${resetUrl}\n` : ''}
Mã xác nhận này sẽ hết hạn sau 15 phút.
Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.

Đội ngũ ToyShare Vietnam
    `.trim();

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject: '🧸 [ToyShare] Mã xác nhận đặt lại mật khẩu của bạn',
            text: textContent,
            html: htmlContent
        });
        console.log(`[EMAIL] Đã gửi email reset password tới ${to}. MessageId: ${info.messageId}`);
        return { sent: true, messageId: info.messageId };
    } catch (err) {
        console.error(`[EMAIL] Lỗi khi gửi email tới ${to}:`, err.message);
        return { sent: false, error: err.message };
    }
}

module.exports = {
    isEmailConfigured,
    sendResetPasswordEmail
};
