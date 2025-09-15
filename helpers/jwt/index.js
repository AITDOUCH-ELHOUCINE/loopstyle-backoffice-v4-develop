const { model, Types } = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('@config/index');
// const utils = require('@helpers/utils');
const { jwt: jwtConfig } = require('@config/index');

/**
 * decode jwt
 * @param {*} usersToNotify
 * @param {*} template
 * @param {*} data
 */
exports.decode_jwt_request = async (req, res, next) => {

  const User = model('User');

  if (!jwtConfig.enabled) {
    return false;
  }

  const { public: pub, private: pr } = jwtConfig.key;

  let decoded;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return next();
  }

  try {
    decoded = jwt.verify(token, pub || pr);
  } catch (e) {
    return next();
  }

  if (!decoded || !Types.ObjectId.isValid(decoded.u)) {
    return next();
  }

  try {
    const connectedUser = await User.findOne({
      _id: decoded.u,
      accountEnabled: true,
    }).select(config.app.profile.private_attrs.map((attr) => `-${attr}`).join(' '));
    

    req.user = connectedUser || null;

  } catch (e) {
    return next(e);
  }

  return next();
};
