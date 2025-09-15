/**
 * Module dependencies.
 */
const mongoose = require('mongoose');
const { resolve } = require('path');
const { getIO ,getDocId} = require('@helpers/utils');
const { v4: uuidv4 } = require('uuid');
// eslint-disable-next-line import/no-dynamic-require
const config = require(resolve('./config'));
const utils = require('@helpers/utils');

const i18nMessages = config.lib.onesignal.clientApp.i18n || {};
const { model, Types, Schema } = mongoose;

const ProductOfferSchema = new Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      immutable:true,
    },
    product: {
      type: Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sender: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSellerOffer: {
      type: Boolean,
    },
    isBuyerOffer: {
      type: Boolean,
    },
    seller: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyer: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: 'Le prix est obligatoire',
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending','negotiated', 'accepted', 'rejected'],
      default: 'pending',
    },
    last_updated_by: {
      type: String,
      enum: ['seller', 'buyer'],
    },
  },
  {
    timestamps: config.lib.mongoose.timestamps,
    collection: 'product-offers',
  },
);

// const autoPopulate = function (next) {

//   next();
// };



/**
 * Sends a notification to the buyer or seller depending on who updated the offer.
 * @param {Object} options - The options for the notification.
 * @param {Object} options.offer - The offer object.
 * @param {string} options.notif_type - The type of notification.
 * @returns {Promise<boolean>} - A promise that resolves to true.
 */
const notifyUser = async ({ offer, notif_type }) => {



  // Destructure the necessary properties from the offer object.
  const { buyer, seller, last_updated_by } = offer;


  console.log('send Offer Notification = ',last_updated_by);
  // Get the User model.
  const UserModel = model('User');
  const NotificationModel = model('Notification');

  if (last_updated_by === 'seller') {
    // Notify the buyer.
    const _buyer = await UserModel.findById(buyer);
    if (_buyer) {

      const product = await model('Product').findById(offer.product);

      // Create notification
      const notification = new NotificationModel({
        product: getDocId(offer.product),
        product_info:product? await product.getInfo():undefined,
        offer: getDocId(offer),
        offer_info: offer,
        last_updated_by,
        type:notif_type,
        users:[_buyer._id],
        title: i18nMessages.NEW_OFFER_EN || '',
      });

      await notification.save();


      // Send the push notification to the buyer.
      await _buyer.send_push_notification({
        notif_type,
        headings_labels: [],
        content_labels: [],
        custom_data: { offer: getDocId(offer),last_updated_by ,product: getDocId(offer.product)},
      });
    }
  } else if (last_updated_by === 'buyer') {
    // Notify the seller.
    const _seller = await UserModel.findById(seller);
    if (_seller) {


      const product = await model('Product').findById(offer.product);

      // Create notification
      const notification = new NotificationModel({
        product: getDocId(offer.product),
        product_info:product? await product.getInfo():undefined,
        offer: getDocId(offer),
        offer_info: offer,
        type:notif_type,
        users:[_seller._id],
        title: i18nMessages.NEW_OFFER_EN || '',
      });
  
      await notification.save();

        
      // Send the push notification to the seller.
      await _seller.send_push_notification({
        notif_type,
        headings_labels: [],
        content_labels: [],
        custom_data: { offer: getDocId(offer),last_updated_by ,product: getDocId(offer.product)},
      });
    }
  }

  return true;
};

/**
 * Pre save event implementation
 */
ProductOfferSchema.pre('save', async function preSave() {

  const offer=this;
  const { status} = offer;


  console.log('presave offer ');

  if (getDocId(offer.sender) === getDocId(offer.seller)) {
    offer.isSellerOffer = true;
    offer.isBuyerOffer = false;

  } else if (getDocId(offer.sender) === getDocId(offer.buyer)) {
    offer.isBuyerOffer = true;
    offer.isSellerOffer = false;
  }

  // Send Push notification 
  if(offer.isNew || offer.isModified('status') || offer.isModified('price')){
    
    switch (offer.status) {
      // new offer
      case 'pending':

        await notifyUser({
          offer,
          notif_type: 'new_offer',
        });
        
        break;
        // new offer
      case 'negotiated':

        await notifyUser({
          offer,
          notif_type: 'new_offer',
        });

        break;

        // Offer accepted
      case 'accepted':

        await notifyUser({
          offer,
          notif_type: 'offer_accepted',
        });
    
      
        break;
        // Offer rejected
      case 'rejected':

        await notifyUser({
          offer,
          notif_type: 'offer_rejected',
        });
  
    
        break;
    
      default:
        break;
    }
    
  }
  

});




/**
 * Check if is mine msg
 * @param { Object } user The user
 */
ProductOfferSchema.statics.isMine = async function isMine({user,offer}) {

  if (!user || !offer) {
    return false;
  }


  const { sender } = offer;
  const uId = getDocId(user);
  const sId = getDocId(sender);


  if (sId && uId &&sId === uId) {
    return true;
  }

  return false;
};

module.exports = mongoose.model('ProductOffer', ProductOfferSchema);
