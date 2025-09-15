const mongoose = require('mongoose');
const IAM = require('../modules/users/models/iam.server.model'); 
const seedIAM = async () => {
  try {
    await IAM.deleteMany({});

    const data = [
      {
        iam: 'superadmin',
        title: 'Super Administrateur',
        description: 'Accès complet à toutes les fonctionnalités',
        resource: 'all',
        permission: 'full',
        module: 'core',
        affectable: true,
        system: true,
        excluded: false,
        groups: ['admin', 'system'],
        children: []
      },
      {
        iam: 'editor',
        title: 'Éditeur de contenu',
        description: 'Peut modifier le contenu sans gérer les utilisateurs',
        resource: 'content',
        permission: 'write',
        module: 'cms',
        affectable: true,
        system: false,
        excluded: false,
        groups: ['editor'],
        children: []
      }
      // Ajoute d'autres rôles IAM ici si nécessaire
    ];

    await IAM.insertMany(data);
    console.log('✅ IAM seeded');
  } catch (error) {
    console.error('❌ IAM seeding error:', error);
  }
};

module.exports = seedIAM;
