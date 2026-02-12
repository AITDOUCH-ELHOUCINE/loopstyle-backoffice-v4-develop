const mongooseConfig = require('./config/lib/mongoose');
const expressConfig = require('./config/lib/express');

/**
 * Build an Express application instance for serverless environments.
 * - Loads models
 * - Connects to MongoDB
 * - Builds the Express app (without creating an HTTP server)
 *
 * This module is intended to be used by platforms like Vercel.
 */
module.exports = async function createServerlessApp() {
  // 1. Load all Mongoose models (synchronous)
  mongooseConfig.loadModels();

  // 2. Connect to MongoDB (async)
  await mongooseConfig.connect();

  // 3. Build the Express application (no HTTP server or Socket.io here)
  const app = await expressConfig.buildApp(mongooseConfig);

  return app;
};

