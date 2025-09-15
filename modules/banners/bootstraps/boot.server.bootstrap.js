const debug = require('debug')('modules:banners');
const mongoose = require('mongoose');

const {model}=mongoose;
// Seed roles when bootstraping
module.exports = async () => {
  debug('Module "banners" bootstraped');


  (async ()=> {
    const BannerModel = model('Banner');
    await BannerModel.syncIndexes();

  })().catch(e => {
    console.error(e);
  });
  
};
