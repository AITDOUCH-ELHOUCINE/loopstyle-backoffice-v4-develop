const jwt_helper = require('@helpers/jwt');


/**
 * Module init function.
 */
module.exports = (app) => {
  app.use(
    jwt_helper.decode_jwt_request
  );
};
