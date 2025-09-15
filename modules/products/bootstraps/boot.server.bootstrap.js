const debug = require('debug')('modules:products');
const mongoose = require('mongoose');

const { model } = mongoose;
// Seed roles when bootstraping
module.exports = async () => {
  debug('Module "products" bootstraped');


  (async () => {
    const ProductModel = model('Product');
    await ProductModel.syncIndexes();

  })().catch(e => {
    console.error(e);
  });

};    
