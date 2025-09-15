const Role = require('../modules/users/models/role.server.model');

module.exports = async () => {
  const existing = await Role.findOne({ name: 'superadmin' });
  if (existing) return;

  const roles = [
    {
      name: 'superadmin',
      description: 'Accès complet à toutes les ressources',
    },
    {
      name: 'admin',
      description: 'Accès aux fonctions d’administration',
    },
    {
      name: 'user',
      description: 'Accès utilisateur standard',
    },
  ];

  await Role.insertMany(roles);
  console.log('✅ Roles seeded');
};
