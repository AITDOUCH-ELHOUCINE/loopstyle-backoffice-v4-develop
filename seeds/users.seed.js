const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../modules/users/models/user.server.model');

module.exports = async () => {
  // Vérifie si l'utilisateur existe déjà en base
  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  // Crée l'utilisateur local dans MongoDB
  const user = new User({
    type: 'natural',
    name: { first: 'Admin', last: 'User' },
    email: 'admin@example.com',
    password: 'Admin@123', // sera hashé par le hook `pre('save')`
    mobile_phone: {
      code: '212', // Code du pays
      number: '600000000', 
    },
    role: 'admin',
    roles: ['admin'],
    provider: 'local',
  });

  await user.save();
  console.log('✅ Admin user saved to MongoDB');     
};
