const User = require('../modules/users/models/admin.server.model');

module.exports = async () => {
  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) return;

  const admin = new User({
    name: { first: 'Admin', last: 'User' },
    email: 'admin@example.com',
    password: 'Admin@123', // Hashé par le hook pre('save')
    phone: '+212612345678',
    role: 'admin',
    roles: ['admin'],
    provider: 'local',
  });

  await admin.save();
  console.log('✅ Admin user seeded');
};
