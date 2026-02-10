const cookieParser = require('cookie-parser');
const { connection } = require('mongoose');
const session = require('express-session');
// const socketio = require('socket.io');//v2
const { Server } = require('socket.io');// v4
const passport = require('passport');
const { resolve } = require('path');
const MongoStore = require('connect-mongo')(session);


const { createClient: createRedisClient } = require('redis');
const { createAdapter: createRedisAdapter } = require('@socket.io/redis-adapter');

const { jwt: jwtConfig } = require('@config/index');
const jwt_helper = require('../../helpers/jwt/index');
const config = require('..');

let io;

// Define the io property
Object.defineProperty(exports, 'io', {
  get: () => io,
});

// Define the Socket.io configuration method
exports.init = (server) => {
  // Create a new Socket.io server
  // io = socketio.listen(server); //socketio v2
  io = new Server(server, {
    /* options */
  }); // socketio v4

  // Create a MongoDB storage object
  const mongoStore = new MongoStore({
    collection: config.sessionCollection,
    mongooseConnection: connection,
  });

  // Redis adapater
  if (config.sockets.adapter === 'redis') {
    const pubClient = createRedisClient({ url: `${config.sockets.redisOptions.uri}` });

    pubClient.on('error', (err) => {
      console.error('== Redis Error == ');
      console.error(err.message || err);
      console.error('== == == == == == ');
    });

    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createRedisAdapter(pubClient, subClient));
    });
  }


  // Intercept Socket.io's handshake request
  io.use((socket, next) => {
    // Use JWT authentication if enabled
    if (jwtConfig.enabled) {
      const req = socket.request;
      /**
       * Get socket transport mode
       */
      const transport = socket.conn.transport.name;

      // console.info('socket transport mode=', transport);

      /**
       * Get Token from query for non polling (ws)
       */

      if (socket.handshake.query && socket.handshake.query.token) {
        req.headers.authorization = socket.handshake.query.token;
      }

      /**
       * If polling mode
       */
      const authHeader = req.headers.authorization;

      if (authHeader) {
        jwt_helper.decode_jwt_request(socket.request, null, next);
      }
    } else {
      // Use the 'cookie-parser' module to parse the request cookies
      cookieParser(config.sessionSecret)(socket.request, {}, () => {
        // Get the session id from the request cookies
        const sessionId = socket.request.signedCookies
          ? socket.request.signedCookies[config.sessionKey]
          : false;

        if (!sessionId) {
          if (config.sockets.public) {
            return next(null, true);
          }
          return next(new Error('sessionId was not found in socket.request'), false);
        }
        // Use the mongoStorage instance to get the Express session information
        return mongoStore.get(sessionId, (error, sess) => {
          const s = socket;
          if (error) return next(error, false);
          if (!sess) return next(new Error(`session was not found for ${sessionId}`), false);

          // Set the Socket.io session information
          s.request.session = sess;

          // Use Passport to populate the user details
          return passport.initialize()(socket.request, {}, () => {
            passport.session()(socket.request, {}, async () => {
              const { request: req } = socket;

              if (req.user || config.sockets.public) {
                next(null, true);
              } else {
                next(new Error('User is not authenticated'), false);
              }
            });
          });
        });
      });
    }

  });

  config.files.server.socketsConfig.forEach((c) => {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    require(resolve(c))(io);
  });

  // Add an event listener to the 'connection' event
  io.on('connection', (socket) => {
    // console.log('new socket connection');
    config.files.server.sockets.forEach((c) => {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      require(resolve(c))(io, socket);
    });
  });

  // return server;
  return server;
};
