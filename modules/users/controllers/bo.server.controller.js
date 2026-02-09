/**
 * Module dependencies.
 */
const _ = require('lodash');

/**
 * Extend user's controller
 */
module.exports = _.extend(
  require('./bo/bo.authentication.server.controller'),
  require('./bo/bo.authorization.server.controller'),
  require('./bo/bo.password.server.controller'),
  require('./bo/bo.profile.server.controller'),
  require('./bo/bo.server.controller'),
  require('./bo/bo.users.server.controller'),
  require('./bo/bo.admins.server.controller'),
);
