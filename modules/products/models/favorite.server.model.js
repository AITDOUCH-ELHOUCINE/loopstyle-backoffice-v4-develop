/**
  model storing users favorites products mapping
 */
const mongoose = require('mongoose');
const config = require('@config/index');

const { Schema } = mongoose;



const FavoriteSchema = new Schema(
  {
    user: {
      type: 'ObjectId',
      ref: 'User',
      required: true,
      index:true,
    },
    product: {
      type: 'ObjectId',
      ref: 'Product',
      required: true,
      index:true,
    },
  },
  {
    collection: 'favorites',
    timestamps: config.lib.mongoose.timestamps,
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  },
);
/**
 * Hook a pre save method
 */
FavoriteSchema.pre('save', function pre_save(next) {
  next();
});




FavoriteSchema.index({ user: 1, product: 1 }, { unique: true });

FavoriteSchema.index({ created_at: -1 });
FavoriteSchema.index({ updated_at: -1 });

const FavoriteModel =  mongoose.model('Favorite', FavoriteSchema);
FavoriteModel.createIndexes();
module.exports =FavoriteModel;