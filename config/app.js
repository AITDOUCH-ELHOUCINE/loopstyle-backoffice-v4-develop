const path = require('path');

const isTrue = (v) => String(v).toLowerCase() === 'true';

module.exports = {
  app: {
    // Application name
    name: process.env.APP_NAME || 'LoopStyle API',

    // Public base URL of the API (Vercel URL or custom domain)
    publicAddress:
      process.env.APP_PUBLIC_ADDRESS ||
      'https://loopstyle-backoffice-v4-develop.vercel.app',

    // HTTP port (used only in classic/PM2 mode, ignored by Vercel)
    port: Number(process.env.PORT) || 6066,

    // Global API prefix
    prefix: process.env.APP_PREFIX || '/api/v1',

    // Static files directory
    webFolder: process.env.APP_WEB_FOLDER || path.resolve('public'),

    // CORS configuration
    cors: {
      enabled: isTrue(process.env.ENABLE_CORS || 'true'),
    },

    // HTTPS configuration (should be disabled on Vercel)
    secure: {
      ssl: isTrue(process.env.APP_SECURE || 'false'),
      privateKey:
        process.env.APP_SSL_KEY || path.resolve('config/sslcerts/key.pem'),
      certificate:
        process.env.APP_SSL_CERT || path.resolve('config/sslcerts/cert.pem'),
      caBundle:
        process.env.APP_SSL_CA || path.resolve('config/sslcerts/bundle.pem'),
    },
  },
};

