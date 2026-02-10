const { resolve } = require('path');

module.exports = {
  db: {
    uri:
      process.env.MONGODB_URI ||
      'mongodb+srv://loopstyle:REDb0OIAs74R8cn@cluster0.plrlmh5.mongodb.net/loopstyle-prod?retryWrites=true&w=majority',
    options: {
      dbName: 'loopstyle-prod',
      auth: process.env.MONGODB_USERNAME ? { authSource: 'admin' } : undefined,
      user: process.env.MONGODB_USERNAME || '',
      pass: process.env.MONGODB_PASSWORD || '',
      useNewUrlParser: true,
    },
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false,
  },
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: process.env.LOG_FORMAT || 'combined',
    options: {
      // Stream defaults to process.stdout
      // Uncomment/comment to toggle the logging to a log on the file system
      stream: {
        directoryPath: process.env.LOG_DIR_PATH || resolve('logs'),
        fileName: process.env.LOG_FILE || 'access.log',
        rotatingLogs: {
          // for more info on rotating logs - https://github.com/holidayextras/file-stream-rotator#usage
          active: process.env.LOG_ROTATING_ACTIVE === 'true', // activate to use rotating logs
          fileName: process.env.LOG_ROTATING_FILE || 'access-%DATE%.log', // if rotating logs are active, this fileName setting will be used
          frequency: process.env.LOG_ROTATING_FREQUENCY || 'daily',
          verbose: process.env.LOG_ROTATING_VERBOSE === 'true',
        },
      },
    },
  },
  lib: {
    sockets: {
      public: true,
      adapter: '',
      redisOptions: {
        uri: process.env.REDIS_URI || 'redis://localhost:6379',
      },
    },
    googlemaps: {
      apiKey: '',
    },
    mailchimp: {
      apiKey: 'y-us1',
      serverPrefix: 'y',
      listId: 'y',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || 'STRIPE_SECRET_KEY',
      publicKey: process.env.STRIPE_PUBLISHABLE_KEY || 'STRIPE_PUBLISHABLE_KEY',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'STRIPE_WEBHOOK_SECRET',
    },
  },
  session: {
    secret: process.env.SESSION_SECRET || 'super amazing secret',
    cookie: {
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'none',
    },
  },
  app: {
    webFolder: 'public',
    cors: {
      enabled: true,
    },
  },
};
