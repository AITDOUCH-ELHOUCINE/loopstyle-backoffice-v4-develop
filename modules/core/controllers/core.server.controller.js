const config = require('@config/index');

const { modules } = config.files.server;

/**
 * Render the main application page
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.renderIndex = async function renderIndex(req, res) {
  res.render(`${modules}/core/views/index`, {
    user: req.user ? req.user.toJSON({ virtuals: true }) : null,
  });
};
/**
 * Render socket test view
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.renderSocktTest = async function renderSocktTest(req, res) {
  res.render(`${modules}/core/views/socket-test`);
};

/**
 * Render the server error page
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.renderServerError = async function renderServerError(req, res) {
  req.i18n.setDefaultNamespace('modules:core');
  res.status(500).render(`${modules}/core/views/500`, {
    title: req.t('ERROR_500_TITLE'),
    error: req.t('ERROR_500'),
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.renderNotFound = async function renderNotFound(req, res) {
  req.i18n.setDefaultNamespace('modules:core');
  res.status(404).format({
    'text/html': () => {
      res.render(`${modules}/core/views/404.server.view.html`, {
        title: req.t('PAGE_NOT_FOUND_TITLE'),
        details: req.t('PAGE_NOT_FOUND_DETAILS', {
          url: req.originalUrl,
        }),
      });
    },
    'application/json': () => {
      res.json({
        error: req.t('ERROR_404'),
      });
    },
    default() {
      res.send(req.t('ERROR_404'));
    },
  });
};
