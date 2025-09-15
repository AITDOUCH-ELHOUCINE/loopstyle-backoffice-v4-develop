const mongoose = require('mongoose');
require('module-alias/register');
const config = require('@config/index');

//const seedUsers = require('./users.seed');
const seedRoles = require('./roles.seed');
const seedAdmin = require('./admin.seed');
const seedIAM = require('./iam.seed');

(async () => {
  try {
    await mongoose.connect(config.db.uri, config.db.options);
    console.log('📡 Connected to database');

    //await seedUsers();   // Étape 1 : Users
    await seedRoles();     // Étape 2 : Rôles
    await seedAdmin();   // Étape 3 : Utilisateur admin
    await seedIAM();     // Étape 4 : IAM (permissions, etc.)

    await mongoose.disconnect();
    console.log('✅ Seeding completed');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
})();
