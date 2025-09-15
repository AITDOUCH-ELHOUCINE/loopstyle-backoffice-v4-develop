const debug = require('debug')('modules:categories');
const mongoose = require('mongoose');

const {model}=mongoose;
// Seed roles when bootstraping
module.exports = async () => {
  debug('Module "categories" bootstraped');


  (async ()=> {
    const CategoryModel = model('Category');
    await CategoryModel.syncIndexes();

  })().catch(e => {
    console.error(e);
  });
  
};
