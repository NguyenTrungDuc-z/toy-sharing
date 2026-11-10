const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/toy_sharing';

async function setAdmin() {
  await mongoose.connect(URI);
  console.log('Connected to MongoDB');

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin', salt);

  // Cập nhật hoặc tạo tài khoản admin@gmail.com
  const r1 = await mongoose.connection.collection('users').updateOne(
    { email: 'admin@gmail.com' },
    {
      $set: {
        email: 'admin@gmail.com',
        role: 'admin',
        passwordHash: hash,
        status: 'active',
        name: 'Hệ thống Admin',
        phone: '0123456789',
        address: 'Hà Nội',
        authProvider: 'local',
        emailVerified: true
      }
    },
    { upsert: true }
  );
  console.log('Admin admin@gmail.com configured:', r1);

  // Cũng đổi luôn pass cho admin@toyshare.com thành 'admin' để dùng được cả 2
  await mongoose.connection.collection('users').updateMany(
    { email: 'admin@toyshare.com' },
    { $set: { passwordHash: hash } }
  );

  console.log('Done updating admin credentials!');
  await mongoose.disconnect();
}

setAdmin().catch(e => {
  console.error(e);
  process.exit(1);
});
