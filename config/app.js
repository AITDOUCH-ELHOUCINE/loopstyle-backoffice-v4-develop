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

  // Default Express session configuration
  session: {
    // Cookie name
    name: process.env.SESSION_NAME || 'loopstyle.sid',

    // Session secret
    secret:
      process.env.SESSION_SECRET ||
      process.env.SESSIONS_MODULE_SECRET ||
      'DEFAULT_SESSION_SECRET',

    // Mongo collection name for sessions
    collection: process.env.SESSION_COLLECTION || 'sessions',

    // Cookie options
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isTrue(process.env.SESSION_SECURE || process.env.APP_SECURE || 'false'),
      maxAge: Number(process.env.SESSION_MAX_AGE || 1000 * 60 * 60 * 24 * 7), // 7 days
    },
  },
};


