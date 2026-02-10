const { last } = require('lodash');
const {
  resolve,
} = require('path');

module.exports = {
  log: {
    format: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  },
  db: {
    promise: global.Promise,
  },
  app: {
    secure: process.env.HTTP_SECURE === 'true',
    name: process.env.APP_TITLE || 'LoopStyle',
  },
  lib: {
    mongoose: {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    obvy: {
      apiUrl: 'https://apisandbox.obvy-app.com/api/v1',
      apiKey: 'f72a256ac7c44a3cbc3e2c94b85b2518',
      deliveryId: '686a7ee62e574395a682558152f9d3b8',
    },
    onesignal: {
      clientApp: {
        restApiKey: 'NmE0ZjQ1NzUtMzQ5MS00ODgyLTk5YmYtZjMwMGEzZTBkZTJh',
        appId: '0bd509bc-0694-4b76-bc99-0cd5d1154e1a',

        ttl: 10800,// (3h) Time To Live - In seconds. The notification will be expired if the device does not come back online within this time. The default is 259,200 seconds (3 days) Max is (28 days).
        priority: 10,// Delivery priority through the push server (example GCM/FCM). Pass 10 for high priority or any other integer for normal priority.
        i18n: {
          ACCOUNT_ACTIVATED_EN: 'Your account has been activated',
          ACCOUNT_ACTIVATED_FR: 'Votre compte a été activé',

          ORDER_DEPOSED_EN: 'Commande livrée',
          ORDER_DEPOSED_FR: 'Commande livrée',

          ORDER_CANCELLED_EN: 'Commande annulée depuis le backoffice',
          ORDER_CANCELLED_FR: 'Commande annulée depuis le backoffice',

          ORDER_EXPIRED_EN: 'Commande expirée',
          ORDER_EXPIRED_FR: 'Commande expirée',

          NEW_CHAT_MSG_FR: 'Nouveau message',
          NEW_CHAT_MSG_EN: 'Nouveau message',




          TRANSACTION_STARTED_FR: 'En cours de paiement',
          TRANSACTION_STARTED_EN: 'En cours de paiement',



          TRANSACTION_CREATED_FR: 'Commande payée',
          TRANSACTION_CREATED_EN: 'Commande payée',


          TRANSACTION_ACCEPTED_EN: 'Commande acceptée',
          TRANSACTION_ACCEPTED_FR: 'Commande acceptée',



          TRANSACTION_DELIVERY_EN: 'En cours de livraison',
          TRANSACTION_DELIVERY_FR: 'En cours de livraison',



          TRANSACTION_COMPLETED_FR: 'Commande recupérée',
          TRANSACTION_COMPLETED_EN: 'Commande recupérée',



          NEW_OFFER_FR: 'Nouvelle proposition',
          NEW_OFFER_EN: 'Nouvelle proposition',

          OFFER_ACCEPTED_FR: 'Proposition acceptée',
          OFFER_ACCEPTED_EN: 'Proposition acceptée',

          OFFER_REJECTED_FR: 'Proposition rejeteée',
          OFFER_REJECTED_EN: 'Proposition rejeteée',



        },
      },
    },
  },
  auth2: {
    google: {
      apiKey: 'xxxxxx',
      // Google Strategy
      appId: 'xxxx',
      appSecret: 'xxx',
    },
    apple: {
      // Apple Strategy
      appId: 'xxxx', // Services ID
      teamId: 'xxxx', // Team ID of your Apple Developer Account
    },
    facebook: {
      // Facebook Strategy
      appId: 'xxxx',
      appSecret: 'xxx',
    },
  },
  portail: {
    version: process.env.PORTAIL_VERSION || '1.0.0',
  },
  i18next: {
    detector: {
      // order and from where user language should be detected
      order: ['querystring', 'cookie'],

      // keys or params to lookup language from
      lookupQuerystring: '$lng',
      lookupCookie: 'i18next',
      lookupFromPathIndex: 0,

      // cache user language
      caches: false,
    },
    init: {
      fallbackLng: 'fr',
      preload: ['fr', 'en'],
      saveMissing: true,
      fallbackNS: 'modules:core',
      defaultNS: 'modules:core',
      debug: false,
      backend: {
        loadPath: (lng, ns) => {
          const [type, name] = ns.split(':');
          return resolve(`${type}/${name}/i18n/${lng}.json`);
        },
        addPath: (lng, ns) => {
          const [type, name] = ns.split(':');
          return resolve(`${type}/${name}/i18n/${lng}.missing.json`);
        },
      },
    },
  },
  seedAdmins: [{
    name: {
      first: 'Admin1',
      last: 'LoopStyle',
    },
    email: 'admin1@loopstyle.com',
    password: 'Ab@123456',
    accountEnabled: true,
    provider: 'local',
    roles: 'admin',
    role: 'admin',
    validations: [{
      type: 'admin',
      validated: true,
    },
    {
      type: 'email',
      validated: true,
    },
    ],
  },
  {
    name: {
      first: 'Admin1',
      last: 'LoopStyle',
    },
    email: 'admin2@loopstyle.com',
    password: 'Ab@123456',
    accountEnabled: true,
    provider: 'local',
    roles: 'admin',
    role: 'admin',
    validations: [{
      type: 'admin',
      validated: true,
    },
    {
      type: 'email',
      validated: true,
    },
    ],
  },
  ],
  seedUsers: [{
    name: 'Cient1',
    email: 'user1@loopstyle.com',
    password: 'Ab@123456',
    accountEnabled: true,
    provider: 'local',
    roles: 'user',
    role: 'user',
    validations: [{
      type: 'email',
      validated: true,
    }],
  },
  {
    name: 'Cient2',
    email: 'user2@loopstyle.com',
    password: 'Ab@123456',
    accountEnabled: true,
    provider: 'local',
    roles: 'user',
    role: 'user',
    validations: [{
      type: 'email',
      validated: true,
    }],
  },
  ],
  session: {
    secret: process.env.SESSION_SECRET || 'DEFAULT_SESSION_SECRET',
    name: 'loopstyle.sid',
    collection: 'sessions',
    cookie: {
      httpOnly: true,
      secure: false,
    },
  },
  global: {
    utcOffset: 0, // UTC offset in minutes. (GMT+1 => 60)
    boUrl: 'https://loopstyle.com/', // backoffice url
  },
};
