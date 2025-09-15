/* eslint-disable no-case-declarations */
/**
 * Module dependencies.
 */
const mongoose = require('mongoose');

const { v4: uuidv4 } = require('uuid');

const { model, Schema } = mongoose;

const RatingSchema = new Schema(
  {
    uuid:{
      type:String,
      default:uuidv4,
    },
    seller: { type: 'ObjectId', ref: 'User' ,required: 'le vendeur est obligatoire'  },
    buyer: { type: 'ObjectId', ref: 'User',required: 'l\'acheteur est obligatoire'   },
    product: { type: 'ObjectId', ref: 'Product' ,required: 'le produit est obligatoire' },
    note: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
    comment: { type: String, default:'' },
  },
  {
    timestamps: true,
    collection: 'ratings',
  },
);


RatingSchema.statics.getUserRatings = async function getUserRatings(userId) {
  if (userId) {
    const list = await this.find({ seller: userId}).lean();

    const count = list.length;

    const note = count > 0 ? list.map((r) => r.note).reduce((prev, next) => prev + next) : 0;

    const result = {
      count,
      note: count > 0 ? note / count : 0,
    };

    return result;
  }
  return {
    note: 0,
    count: 0,
  };
};

/**
 * Hook a pre save method update  rating
 */

RatingSchema.post('save', async function pre_save(doc, next) {
  const RatingModel = model('Rating');
  const UserModel = model('User');



  // get store rating
  const ur = await RatingModel.getUserRatings(doc.seller);
  // get user
  const u = await UserModel.findById(doc.seller);

  // update user rating
  if (u) {
    u.rating = ur;
    await u.save();
  }


  next();
});

const RatingModel = mongoose.model('Rating', RatingSchema);

module.exports = RatingModel;
