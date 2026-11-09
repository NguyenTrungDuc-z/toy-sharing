const Notification = require('../models/Notification');

// Tạo một thông báo cho người dùng. Phát realtime qua socket.io nếu có.
async function createNotification({ userId, type, title, message, link, relatedId }) {
    try {
        const notification = await Notification.create({ userId, type, title, message, link, relatedId });

        // Phát realtime nếu socket.io được khởi tạo
        const io = global._io;
        if (io) {
            io.to(`user:${userId.toString()}`).emit('notification', notification);
        }
        return notification;
    } catch (err) {
        console.error('Lỗi tạo thông báo:', err.message);
        return null;
    }
}

// Thông báo cho những người đã thích 1 đồ chơi khi nó trở lại trạng thái sẵn sàng
async function notifyFavoriteAvailable(toyId, toyName) {
    try {
        const User = require('../models/User');
        const { sendGenericEmail } = require('./emailService');
        const fans = await User.find({ favorites: toyId }).select('_id name email');
        for (const fan of fans) {
            await createNotification({
                userId: fan._id,
                type: 'favorite_available',
                title: 'Đồ chơi yêu thích đã sẵn sàng',
                message: `"${toyName}" trong danh sách yêu thích của bạn đã có thể mượn!`,
                link: 'favorites',
                relatedId: toyId
            });
            if (fan.email) {
                await sendGenericEmail({
                    to: fan.email,
                    userName: fan.name,
                    subject: `[ToyShare] "${toyName}" đã có thể mượn`,
                    heading: 'Đồ chơi yêu thích đã sẵn sàng',
                    lines: [`Tin vui! <strong>"${toyName}"</strong> trong danh sách yêu thích của bạn vừa được trả và đã có thể mượn lại.`,
                            'Hãy nhanh tay gửi yêu cầu trước khi người khác mượn nhé.'],
                    actionUrl: process.env.CLIENT_URL || 'http://localhost:5173',
                    actionText: 'Xem ngay'
                });
            }
        }
    } catch (err) {
        console.error('Lỗi thông báo favorite available:', err.message);
    }
}

module.exports = { createNotification, notifyFavoriteAvailable };
