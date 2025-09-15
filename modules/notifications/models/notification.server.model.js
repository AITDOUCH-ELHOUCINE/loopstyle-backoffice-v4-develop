/**
 * Module dependencies
 */
const mongoose = require('mongoose');

const { Types } = mongoose;
const config = require('@config/index');
const { v4: uuidv4 } = require('uuid');



const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      immutable:true,
    },
    product: {
      ref: 'Product',
      type: 'ObjectId',
    },
    product_info: {
      name:String,
      description:String,
      images:[{
        ref: 'FMFiles',
        type: 'ObjectId',
      }],
    },
    offer: {
      ref: 'Offer',
      type: 'ObjectId',
    },
    offer_info: {
      product: {
        type: Types.ObjectId,
        ref: 'Product',
      },
      sender: {
        type: Types.ObjectId,
        ref: 'User',
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
      },
      buyer: {
        type: Types.ObjectId,
        ref: 'User',
      },
      price: {
        type: Number,
        min: 0,
      },
      status: {
        type: String,
        enum: ['pending','negotiated', 'accepted', 'rejected'],
      },
      last_updated_by: {
        type: String,
        enum: ['seller', 'buyer'],
      },
    },
    // type notification : is it a broadcast or to specific users notification?
    type: {
      type: String,
      enum: [
        'broadcast_notification',
        'admin_notification',
        'new_chat_message',
        'new_offer',
        'offer_accepted',
        'offer_rejected',
        'transaction_started',
        'transaction_created',
        'transaction_accepted',
        'transaction_delivery',
        'transaction_completed',
      ],
    },
    // list of users that will receive notification ()
    users: [{
      ref: 'User',
      type: 'ObjectId',
      required: 'Le destinataire est obligatoire',
    }],
    // notification title (header)
    title: {
      type: String,
      index: true,
      required: 'Le titre est obligatoire',
    },
    // notification content
    content: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    // onesiognal response data
    oneSignalResponse: {
      type: Object,
    },
  },
  {
    collection: 'notifications',
    timestamps: config.lib.mongoose.timestamps,
    toObject: {
      transform(doc, ret) {
        const private_attrs = config.app.notification.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
    toJSON: {
      transform(doc, ret) {
        const private_attrs = config.app.notification.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
  },
);

/**
 * Hook a pre save method
 */
NotificationSchema.pre('save', function pre_save(next) {
  next();
});

/**
 * Virtual attributes
 */
NotificationSchema.virtual('id').get(function getId() {
  return this._id;
});





NotificationSchema.index({ created_at: -1 });
NotificationSchema.index({ updated_at: -1 });

const NotificationModel = mongoose.model('Notification', NotificationSchema);

NotificationModel.createIndexes();
module.exports = NotificationModel;
