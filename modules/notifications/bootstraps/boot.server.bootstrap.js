const debug = require('debug')('modules:notifications');
const mongoose = require('mongoose');

const {model}=mongoose;
// Seed roles when bootstraping
module.exports = async () => {
  debug('Module "notifications" bootstraped');

  (async ()=> {
    const NotificationModel = model('Notification');
    await NotificationModel.syncIndexes();

  })().catch(e => {
    console.error(e);
  });
};
