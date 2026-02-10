require('./helpers/polyfill');
const mongoose = require('./config/lib/mongoose');
const express = require('./config/lib/express');

async function startServer() {
  try {
    // 1. First load all models
    mongoose.loadModels();

    // 2. Then connect to database
    await mongoose.connect();

    // 3. Then initialize express app
    const app = await express.init(mongoose);



    const port = process.env.PORT || 3000;
    const host = '0.0.0.0';

    app.listen(port, host, () => {
      console.log(`Server running on http://${host}:6065`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();


// Initialisation de l'application
// startServer();

// // Démarrez l'application
// app.start();
