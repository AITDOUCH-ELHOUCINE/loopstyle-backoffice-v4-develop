/**
 * Module dependencies.
 */
const i18nextMiddleware = require('i18next-express-middleware');
const { lstatSync, readdirSync, readFileSync } = require('fs');
const { createServer: createHTTPsServer } = require('https');
const { createServer: createHTTPServer } = require('http');
const debug = require('debug')('app:config:express');
const Backend = require('i18next-node-fs-backend');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const { connection } = mongoose;
const bodyParser = require('body-parser');
const compress = require('compression');
const flash = require('connect-flash');
const nunjucks = require('nunjucks');
const i18next = require('i18next');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const url = require('url');
const { resolve, join } = require('path');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const pkg = require('@modules/../package.json');
const crons = require('./agenda');
const { v4: uuidv4 } = require('uuid');
const MongoStore = require('connect-mongo')(session);
const config = require('..');

const logger = require('./logger');
const { init: initSocketIO } = require('./socket.io');

const { modules } = config.files.server;

const dotenv = require('dotenv');

dotenv.config(); // Charger les variables d'environnement


/**
 * Initialize local variables
 */
module.exports.initLocalVariables = (app) => {
  const { locals } = app;
  const { secure } = config.app;

  // Setting application local variables
  if (secure.ssl === true) {
    locals.secure = secure.ssl;
  }

  // Passing the request url to environment locals
  app.use((req, res, next) => {
    res.locals.host = `${req.protocol}://${req.hostname}`;
    res.locals.url = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
    next();
  });
};

/**
 * Initialize Sentry
 */
module.exports.initSentry = (app) => {
  // init sentry
  // Sentry.init({
  //   dsn: process.env.SENTRY_DSN || '',
  //   debug: process.env.NODE_ENV === 'development',
  //   environment: process.env.NODE_ENV,
  // });

  Sentry.init({
    release: `${process.env.npm_package_version}`,
    dsn: process.env.SENTRY_DSN || '',
    debug: process.env.NODE_ENV === 'development',
    environment: process.env.NODE_ENV,
    integrations: [
      // enable HTTP calls tracing
      // new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      // new Tracing.Integrations.Express({
      // // to trace all requests to the default router
      //   app,
      // // alternatively, you can specify the routes you want to trace:
      // // router: someRouter,
      // }),
    ],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  });

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  // app.use(Sentry.Handlers.tracingHandler());
};

/**
 * Run bootstrap files
 */
module.exports.runBootstrap = (app, mongoose) => {
  const promises = config.files.server.bootstraps.map(async (f) => {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    const m = require(resolve(f));

    if (typeof m === 'function') {
      try {
        debug('Bootstraping file %s', f);
        await m(config, app, mongoose);
        debug('file "%s" executed successfully', f);
      } catch (e) {
        console.error('Error bootstraping file "%s"', f, e);
        return false;
      }
    }

    return true;
  });

  return Promise.all(promises);
};

/**
 * Initialize application middleware
 */
module.exports.initMiddleware = (app) => {
  // Indique à Express de faire confiance au premier proxy sur le chemin de la requête
  // C'est ESSENTIEL pour que les cookies `secure: true` fonctionnent derrière un proxy (comme sur Render)
  app.set('trust proxy', 1);
  const { locals } = app;
  // stripe
  app.use(
    bodyParser.json({
      // We need the raw body to verify webhook signatures.
      // Let's compute it only when hitting the Stripe webhook endpoint.
      verify(req, res, buf) {
        if (req.originalUrl.includes('/webhook')) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );

  // /**
  //  * PORTAIL_VERSION
  //  */
  app.use((req, res, next) => {
    const PORTAIL_VERSION = config.portail.version;
    // console.log('PORTAIL_VERSION : ', PORTAIL_VERSION);
    res.setHeader('x-portail-version', PORTAIL_VERSION);

    return next();
  });

  /**
   * Redirect all non-HTTPS requests.
   */
  // app.use((req, res, next) => {
  //   const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //   const { method } = req;

  //   // Parse the URL and the query string using Node's URL module
  //   const parsedUrl = new url.URL(req.originalUrl, `http://${req.get('host')}`);
  //   const queryParams = new url.URLSearchParams(parsedUrl.search);

  //   // Create a formatted list of query parameters
  //   let formattedQueries = '';
  //   let i = 1;
  //   queryParams.forEach((value, key) => {
  //     try {
  //       // Try to parse the JSON to pretty-print it
  //       const jsonValue = JSON.parse(value);
  //       value = JSON.stringify(jsonValue, null, 2);
  //     } catch (e) {
  //       // If it's not JSON, it will just keep the value as is
  //     }
  //     formattedQueries += `${i}: ${key} - ${value}\n`;
  //     i++;
  //   });

  //   // console.log(`IP ${ip} ${method} ${req.originalUrl}`);
  //   console.log('Query Parameters:\n' + formattedQueries);

  //   return next();
  // });

  // Showing stack errors
  app.set('showStackError', true);

  // Enable jsonp
  app.enable('jsonp callback');

  // Should be placed before express.static
  app.use(
    compress({
      filter(req, res) {
        return /json|text|javascript|css|font|svg/.test(res.getHeader('Content-Type'));
      },
      level: 9,
    }),
  );

  // Enable logger (morgan)
  app.use(morgan(logger.getFormat(), logger.getOptions()));

  // Environment dependent middleware
  if (process.env.NODE_ENV === 'development') {
    // Disable views cache
    app.set('view cache', false);
  } else if (process.env.NODE_ENV === 'production') {
    locals.cache = 'memory';
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.json({ limit: '4mb', extended: true }));
  app.use(bodyParser.urlencoded({ limit: '4mb', extended: true }));
  app.use(methodOverride());
  // Add the cookie parser and flash middleware
  app.use(cookieParser());
  app.use(flash());
  app.use('/assets', express.static('assets'));
  app.use(express.static(config.app.webFolder));

  if (config.app.cors.enabled) {
    //const whitelist = process.env.WHITE_LIST_DOMAINS;
    const whitelist = [
      'https://loopstype-bo.devrootapp.com',  // Le domaine de votre BackOffice en production
      'http://localhost:5173'                 // Gardez ceci pour le développement local
    ];

    // const corsOptions = {
    //   credentials: true,
    //   optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204,
    //   origin(origin, callback) {
    //     // allow all
    //     callback(null, true);
    //   },
    // };

    const corsOptions = {
      credentials: true,
      optionsSuccessStatus: 200,
      origin: function (origin, callback) {
        // Si le domaine de la requête est dans notre liste blanche (ou si la requête ne vient pas d'un navigateur)
        if (whitelist.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          // Sinon, on refuse la requête
          callback(new Error('Not allowed by CORS'));
        }
      }
    };
    app.use(cors(corsOptions));
  }
};

/**
 * Configure view engine
 */
module.exports.initViewEngine = (app) => {
  nunjucks.configure('./', {
    autoescape: true,
    express: app,
  });

  // Set views path and view engine
  app.set('view engine', 'server.view.swig');
};

/**
 * Configure Express session
 */
module.exports.initSession = (app) => {
  const { cookie, name, secret, collection } = config.session;

  // Express Mongomongoose session storage
  app.use(
    session({
      genid(req) {
        return uuidv4();
      },
      saveUninitialized: true,
      resave: true,
      secret: process.env.SESSION_SECRET || 'VOTRE_SECRET_PAR_DEFAUT',
      cookie: {
        maxAge: 86400000, // 24 heures en millisecondes
        httpOnly: true,
        // La modification cruciale est ici
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production', // Mettre à `true` en production
      },
      name,
      store: new MongoStore({
        collection,
        mongooseConnection: connection,
      }),
    }),
  );

  // Add Lusca CSRF Middleware
  // app.use(lusca(config.csrf));
};

/**
 * Invoke modules server configuration
 */
module.exports.initModulesConfiguration = (app, mongoose) => {
  config.files.server.configs.forEach((configPath) => {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    require(resolve(configPath))(app, mongoose, config);
  });
};

/**
 * Configure Helmet headers configuration
 */
module.exports.initHelmetHeaders = (app) => {
  // Use helmet to secure Express headers
  const SIX_MONTHS = 15778476000;
  app.use(
    helmet({
      maxAge: SIX_MONTHS,
      includeSubdomains: true,
      force: true,
    }),
  );
  app.disable('x-powered-by');
};

/**
 * Configure the modules server routes
 */
module.exports.initModulesServerRoutes = (app) => {
  // Add files routes directly to fix file upload endpoint
  try {
    const filesController = require(resolve('./modules/files/controllers/main.server.controller'));

    // Files upload endpoint
    app.route('/api/v1/files')
      .post(filesController.multer, filesController.upload);

    // File access endpoints
    app.route('/api/v1/files/:fileID')
      .get(filesController.canAccess, filesController.one);

    app.route('/api/v1/files/:fileID/view')
      .get(filesController.canAccess, filesController.download(false));

    // Bind file parameter middleware
    app.param('fileID', filesController.fileById);

    console.log('Files routes loaded successfully');
  } catch (error) {
    console.error('Error loading files routes:', error);
  }


  // Globbing routing files
  config.files.server.routes.forEach((routePath) => {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    const m = require(resolve(routePath));
    if (typeof m === 'function') {
      m(app);
    } else {
      app.use(config.app.prefix + m.prefix, m.router(app));
    }
  });
};

/**
 * Configure Agenda JOBS (crons)
 */
module.exports.initCrons = (app) => {
  const agenda = crons.init(connection);

  app.use((req, res, next) => {
    try {
      // set agenda as  local variable within the application.
      app.locals.agenda = agenda;
      next();
    } catch (e) {
      next(e);
    }
  });
};

module.exports.createServer = (app) => {
  let server;
  const { secure } = config.app;
  if (secure.ssl === true) {
    // Load SSL key and certificate
    const privateKey = readFileSync(resolve(secure.privateKey), 'utf8');
    const certificate = readFileSync(resolve(secure.certificate), 'utf8');
    let caBundle;

    try {
      caBundle = readFileSync(resolve(secure.caBundle), 'utf8');
    } catch (err) {
      console.warn('Warning: could not find or read caBundle file');
    }

    const options = {
      key: privateKey,
      cert: certificate,
      ca: caBundle,
      //  requestCert : true,
      //  rejectUnauthorized : true,
      secureProtocol: 'TLSv1_method',
      ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-SHA256',
        'DHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'DHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES256-SHA256',
        'DHE-RSA-AES256-SHA256',
        'HIGH',
        '!aNULL',
        '!eNULL',
        '!EXPORT',
        '!DES',
        '!RC4',
        '!MD5',
        '!PSK',
        '!SRP',
        '!CAMELLIA',
      ].join(':'),
      honorCipherOrder: true,
    };

    // Create new HTTPS Server
    server = createHTTPsServer(options, app);
  } else {
    // Create a new HTTP server
    server = createHTTPServer(app);
  }

  return server;
};

/**
 * Configure i18n
 */
module.exports.initI18n = (app) => {
  const lngDetector = new i18nextMiddleware.LanguageDetector(null, config.i18next.detector);

  const getDirsNames = () => {
    const names = readdirSync(modules)
      .map((name) => {
        // exclude devtools & data-browser modules from global namspace
        if (['devtools', 'data-browser'].includes(name)) {
          return false;
        }
        const p = join(modules, name);

        if (!lstatSync(p).isDirectory()) {
          return false;
        }

        return `${modules}:${name}`;
      })
      .filter(Boolean);

    return Array.prototype.concat.apply([], names);
  };

  i18next
    .use(Backend)
    .use(lngDetector)
    .init({
      ...config.i18next.init,
      ns: getDirsNames(),
    });

  app.use(i18nextMiddleware.handle(i18next));
};

/**
 * Configure error handling
 */
module.exports.initErrorRoutes = (app) => {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
  const { publicAddress } = config.app;
  app.use((err, req, res, next) => {
    // If the error object doesn't exists
    if (!err) {
      return next();
    }

    // Log it
    console.error(err.stack);

    if (!req.i18n) {
      return res.status(500).json({
        error: 'ERROR_500',
        message: err.message,
        sentry: res.sentry,
      });
    }

    const { options } = req.i18n;

    options.defaultNS = 'modules:core';

    const loopstyle_logo_url = `${publicAddress}/assets/img/email/logo.png`;

    return res.format({
      'text/plain': () => {
        res
          .status(500)
          .send(
            err.message || (req.i18n ? req.t('ERROR_500') : 'Oops! Quelque chose a mal tourné...'),
          );
      },
      'text/html': () => {
        res.status(500).render(`${modules}/core/views/500.server.view.html`, {
          loopstyle_logo_url,
          message:
            err.message || (req.i18n ? req.t('ERROR_500') : 'Oops! Quelque chose a mal tourné...'),
        });
      },
      'application/json': () => {
        res.status(500).send({
          ok: false,
          message:
            err.message || (req.i18n ? req.t('ERROR_500') : 'Oops! Quelque chose a mal tourné...'),
        });
      },
      '*/*': () => {
        res.status(500).send({
          ok: false,
          message:
            err.message || (req.i18n ? req.t('ERROR_500') : 'Oops! Quelque chose a mal tourné...'),
        });
      },
      default() {
        res
          .status(500)
          .send(
            err.message || (req.i18n ? req.t('ERROR_500') : 'Oops! Quelque chose a mal tourné...'),
          );
      },
    });
  });
};

/**
 * Initialize the Express application
 */
module.exports.init = async (mongoose) => {
  // Initialize express app
  const app = express();

  // Run bootstrap files
  await this.runBootstrap(app, mongoose);

  // Initialize Agenda Jobs (crons)
  this.initCrons(app);

  // Initialize local variables
  this.initLocalVariables(app, mongoose);

  // Initialize sentry
  // this.initSentry(app);

  // Initialize Express middleware
  this.initMiddleware(app);

  // Initialize Express view engine
  this.initViewEngine(app);

  // Initialize Express session
  this.initSession(app, mongoose);

  // Initialize modules server i18n
  this.initI18n(app);

  // Initialize Modules configuration
  this.initModulesConfiguration(app, mongoose);

  // Initialize Helmet security headers
  this.initHelmetHeaders(app);

  // Initialize modules server routes
  this.initModulesServerRoutes(app);

  // Initialize error routes
  this.initErrorRoutes(app);

  // create the server, then return the instance
  const server = this.createServer(app);

  // Configure Socket.io
  initSocketIO(server);

  return server;
};
