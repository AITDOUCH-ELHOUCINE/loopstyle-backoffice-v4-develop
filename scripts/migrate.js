const mongoose = require('mongoose');
const config = require('@config/index'); // Assure-toi que l'URL MongoDB est bien ici

// Import des modèles
const User = require('@modules/users/models/User.model');
const Product = require('@modules/products/models/Product.model');
const File = require('@modules/files/models/File.model');
const Banner = require('@modules/banners/models/Banner.model');
const Category = require('@modules/categories/models/Category.server.model');

async function seedDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB Atlas');

    // Données initiales
    const users = [
      { name: 'Admin', email: 'admin@example.com', role: 'admin' },
    ];

    const products = [
      { name: 'T-shirt', price: 19.99, stock: 100 },
    ];

    const files = [
      { filename: 'image1.png', url: 'https://cdn.example.com/image1.png' },
    ];

    const banners = [
      { title: 'Promo Été', image: 'https://cdn.example.com/banner.png' },
    ];

    const categories = [
      { name: 'Vêtements', slug: 'vetements' },
    ];

    // Suppression si besoin
    await User.deleteMany({});
    await Product.deleteMany({});
    await File.deleteMany({});
    await Banner.deleteMany({});
    await Category.deleteMany({});

    // Insertion
    await User.insertMany(users);
    await Product.insertMany(products);
    await File.insertMany(files);
    await Banner.insertMany(banners);
    await Category.insertMany(categories);

    console.log('✅ Données initiales insérées avec succès');

  } catch (error) {
    console.error('❌ Erreur de migration :', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

seedDatabase();
