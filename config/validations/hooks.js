/*
eslint-disable import/no-dynamic-require,global-require
*/

/**
 * Local dependencies.
 */
const config = require('@config/index');
const mongoose = require('mongoose');

const { model } = mongoose;
const utils = require('./utils');

exports.onInit = async (user) => {
  const vConfig = config.validations;
  const types = vConfig.types || [];

  types.forEach((t) => {
    const m = require(`./types/${t}`);
    const v = utils.getValidationObj(user, t);

    m.init(user, v);
  });

  user.markModified('validations');
  return user;
};

exports.onSignup = async (user, req) => {
  const vConfig = config.validations;
  const types = vConfig.types || [];

  // notify new account
  types.forEach((t) => utils.tryNotify(user, t, req));

  user.markModified('validations');
  // notify admins
  // const UserModel = model('User');
  // await UserModel.notifyAdmins('signup', user, {}, req);

  return user;
};

/**
 * notifyAdminsByEmail
 * @param {*} user
 * @param {*} req
 * @returns
 */
exports.notifyAdminsByEmail = async (user, req) => {
  try{

    const AdminModel = model('Admin');
    await AdminModel.notifyAdmins('signup', user, {}, req);

  }catch(e){
    console.error(e);
  }finally{
    return user;
  }

};



exports.validateAccount = async (user) => {
  if (user && user.validations) {
    user.set(
      'validations',
      user.validations.map((v) => ({ ...v.toJSON(), validated: true })),
    );
    user.markModified('validations');
  }

  return user;
};

exports.setNewProfileSession = async (user, req) => {
  try {


    console.log('setNewProfileSession');
    // get Sessionid from request
    const sessionId = req.sessionID;

    console.log({sessionId});

    // set current session id to user
    user.sessionId = sessionId;


  } catch (e) {
    console.error(e.message || e);
  } finally {
    return user;
  }
};


exports.destroyOldProfileSession = async (user, req) => {
  try {

    console.log('destroyOldProfileSession');

    // get Sessionid from request
    const {sessionId} = user;
    const {  collection } = config.session;

    await mongoose.connection.db.collection(collection).deleteOne({_id: sessionId});

    user.sessionId = undefined;



  } catch (e) {
    console.error(e.message || e);
  } finally {
    return user;
  }
};