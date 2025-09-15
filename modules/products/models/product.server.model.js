/**
 * Module dependencies
 */
const mongoose = require('mongoose');
const config = require('@config/index');
const { v4: uuidv4 } = require('uuid');
const utils = require('@helpers/utils');

const i18nMessages = config.lib.onesignal.clientApp.i18n || {};
const { generateCode, getDocId } = utils;
const { Schema,model } = mongoose;

const ProductSchema = new Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      immutable: true,
    },
    uid: {
      type: String,
      index: true,
    },
    name: {
      // name of product
      type: String,
      trim: true,
      index: true,
      required: 'Le titre est obligatoire',
    },
    // product description
    description: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    // Prix
    price: {
      type: Number,
      required: 'Le prix est obligatoire',
      min: 0,
      index: true,
    },
    // Catgorie
    category: {
      type: 'ObjectId',
      ref: 'Category',
      required: 'La catégorie est obligatoire',
    },
    categoryInfo: {
      name: {
        type: String,
        trim: true,
      },
      subCategory: {
        type: String,
        trim: true,
      },
      size: {
        type: String,
        trim: true,
      },
      usage: {
        type: String,
        trim: true,
      },
    },
    // pour Homme/Femme/Enfant/Fille
    // usage: {
    //   type: String,
    //   trim: true,
    //   required: 'L\'usage est obligatoire',
    //   enum: config.app.product.usages || [],
    // },
    // Marque (opt)
    brand: {
      type: String,
      trim: true,
    },
    // product color, must be in config defined colors list
    color: {
      type: String,
      lowercase: true,
      enum: config.app.product.colors.map((x) => x.name) || [],
      required: 'La couleur est obligatoire',
      trim: true,
      index: true,
    },
    images: [
      {
        ref: 'FMFiles',
        type: 'ObjectId',
      },
    ],
    non_conform_image:{
      ref: 'FMFiles',
      type: 'ObjectId',
    },
    address1: {
      type: String,
      trim: true,
      default: '',
    },
    address2: {
      type: String,
      trim: true,
      default: '',
    },
    zipcode: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    etat: {
      type: String,
      lowercase: true,
      default: '',
    },
    status: {
      // product status, must be in config defined status.
      type: String,
      lowercase: true,
      default: 'available',
      enum: [
        'available',
        'deleted',
        'transaction_started',// 0 obvy transaction started  => AM  (En paiement)
        'transaction_created', // 1- obvy transaction created => AM (En cours)
        'transaction_exited', // Quand le client quite le circuit (en cliquant sur le btn annuler)
        'transaction_accepted', // 2- obvy transaction created => AM (Payé)
        'transaction_delivery', // 3- obvy transaction delivery => AM (En livraison)
        'transaction_completed', // 4- obvy transaction completed => AM (Récupéré)
        'conform',  // 5 => AM (Confirmé)
        'non_conform', // 6- conform => AM (Décliné)
      ],
      required: 'L état est obligatoire',
      trim: true,
      index: true,
    },
    user: {
      type: 'ObjectId',
      required: true,
      ref: 'User',
      immutable: true,
    },
    userInfo:{
      uuid:String,
      name: String,
      email: String,
      phone: String,
      countryCode: String,
      image: 'ObjectId',
      profileImageUrl: String,
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
      address1: String,
      address2: String,
      zipcode: String,
      city: String,
      country: String,
    },
    createdBy: {
      type: 'ObjectId',
      required: true,
      ref: 'User',
      immutable: true,
    },
    // to be verified
    is_selled: {
      type: Boolean,
      index: true,
      default: false,
    },
    // negotiation offer
    accepted_offer: {
      type: 'ObjectId',
      ref: 'ProductOffer',
    },
    // negotiation offer info
    accepted_offer_info: {
      offer: {
        type: 'ObjectId',
        ref: 'ProductOffer',
      },
      price: {
        type: Number,
      },
      buyer: {
        type: 'ObjectId',
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['accepted'],
      },
    },
    motif_delete: {
      type: String,
      trim: true,
    },

    is_published: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    is_enabled: {
      type: Boolean,
      default: true,
    },
    obvyInfo: {
      postalDelivery: {
        created: { type: Boolean, default: false },
        id: { type: String },
        urls: {
          buyer: {
            id: { type: String },
            payment_url: String,
            event_url: { type: String },
            internal_id: { type: String },
          },
          sellers: [
            {
              id: { type: String },
              internal_id: { type: String },
              transaction_id: String,
              event_url: { type: String },
            },
          ],
        },
      },
      transaction: {
        amount: {
          amount: { type: Number },
          currency: { type: String },
        },
        attributes: {
          channel: { type: String },
          payment_process: { type: String },
          qrcode: { type: String },
          typology: { type: String },
          workflow: { type: String },
        },
        buyer: {
          id: { type: String },
          type: { type: String },
          email: { type: String },
          display_name: { type: String },
          first_name: { type: String },
          last_name: { type: String },
          mobile_phone: {
            number: { type: String },
            code: { type: Number },
          },
          custom_id: { type: String },
        },
        date_created: { type: Date },
        date_updated: { type: Date },
        delivery: {
          amount: {
            amount: { type: Number },
            currency: { type: String },
          },
          channel: { type: String },
          date_updated: { type: Date },
          destination_relay: {
            address: {
              address_line_1: { type: String },
              address_line_2: { type: String },
              city: { type: String },
              coordinates: {
                lat: { type: Number },
                lng: { type: Number },
              },
              country_code: { type: String },
              postal_code: { type: String },
            },
            name: { type: String },
            relay_id: { type: String },
          },
          proof: { type: Boolean },
          shipper_amount: {
            amount: { type: Number },
            currency: { type: String },
          },
          size: { type: String },
          status: { type: String },
          type: { type: String },
        },
        delivery_amount: {
          amount: { type: Number },
          currency: { type: String },
        },
        external_id: { type: String },
        fees: {
          buyer: {
            delivery_amount: {
              amount: { type: Number },
              currency: { type: String },
            },
            discount_amount: {
              amount: { type: Number },
              currency: { type: String },
            },
            fees_amount: {
              amount: { type: Number },
              currency: { type: String },
            },
            funding_fees: {
              amount: { type: Number },
              currency: { type: String },
            },
            total_amount: {
              amount: Number,
              currency: { type: String },
            },
          },
          seller: {
            delivery_amount: {
              amount: { type: Number },
              currency: { type: String },
            },
            fees_amount: {
              amount: { type: Number },
              currency: { type: String },
            },
            total_amount: {
              amount: { type: Number },
              currency: { type: String },
            },
          },
        },
        id: { type: String },
        invoices: {
          history: {
            buyer_invoices: [],
            seller_invoices: [],
          },
        },
        items: [
          {
            custom_id: { type: String },
            description: { type: String },
            fees: {
              delivery_buyer: {
                amount: { type: Number },
                currency: { type: String },
              },
              delivery_seller: {
                amount: { type: Number },
                currency: { type: String },
              },
              transaction_buyer: {
                amount: { type: Number },
                currency: { type: String },
              },
              transaction_seller: {
                amount: { type: Number },
                currency: { type: String },
              },
            },
            quantity: { type: Number },
            title: { type: String },
            total_price: {
              amount: { type: Number },
              currency: { type: String },
            },
            unit_price: {
              amount: { type: Number },
              currency: { type: String },
            },
            weight: { type: Number },
          },
        ],
        lock_status: { type: String },
        name: { type: String },
        negociated_amount: {
          amount: { type: Number },
          currency: { type: String },
        },
        negociated_refund_type: String,
        payment_status: { type: String },
        seller: {
          custom_id: { type: String },
          display_name: String,
          email: String,
          first_name: String,
          id: { type: String },
          last_name: { type: String },
          mobile_phone: {
            code: { type: Number },
            number: { type: String },
          },
          type: { type: String },
        },
        status: { type: String },
        urls: {
          buyer: {
            event_url: { type: String },
            id: { type: String },
          },
          sellers: [
            {
              event_url: { type: String },
              id: String,
              transaction_id: String,
            },
          ],
        },
      },
    },
    rating:{
      note: { type: Number, enum: [1, 2, 3, 4, 5] },
      comment: { type: String },
    },
  },

  {
    collection: 'products',
    timestamps: config.lib.mongoose.timestamps,
    toObject: {
      transform(doc, ret) {
        const private_attrs = config.app.product.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
    toJSON: {
      transform(doc, ret) {
        const private_attrs = config.app.product.private_attrs || [];
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
ProductSchema.pre('save', async function pre_save(next) {
  const product = this;
  const {user,accepted_offer_info}=product;

  if (this.isNew) {
    this.uid = generateCode('products');
  }

  // set is_selled
  if (['transaction_started','transaction_created','transaction_completed','transaction_delivery','transaction_completed' ,'conform', 'non_conform'].includes(product.status)) {
    product.is_selled = true;
  }

  if(this.isModified('status')){

    const User=model('User');
    const NotificationModel = model('Notification');

    // 'transaction_started',// obvy transaction started
    // 'transaction_created', // obvy transaction created
    // 'transaction_delivery', // obvy transaction delivery
    // 'transaction_completed', // obvy transaction completed

    switch (this.status) {
      case 'transaction_started':
        // notify buyer
        if(accepted_offer_info && accepted_offer_info.buyer){
          // Get byuer
          const _buyer=await User.findById(accepted_offer_info.buyer);
          if(_buyer){


            // Create notification
            const notification = new NotificationModel({
              product: getDocId(product),
              product_info:product? await product.getInfo():undefined,
              type:'transaction_started',
              users:[_buyer._id],
              title: i18nMessages.TRANSACTION_STARTED_FR || '',
            });
  
            await notification.save();
            
            // Send push notification
            await _buyer.send_push_notification({
              notif_type: 'transaction_started',
              headings_labels: [],
              content_labels: [`${product.name}`],
              custom_data: { product: getDocId(product), product_name: product.name },
            });
          }

        }      
        break;
      case 'transaction_created':
        // notify seller
        if(user){
          // Get seller
          const _seller=await User.findById(user);
          if(_seller){

            // Create notification
            const notification = new NotificationModel({
              product: getDocId(product),
              product_info:product? await product.getInfo():undefined,
              type:'transaction_created',
              users:[_seller._id],
              title: i18nMessages.TRANSACTION_CREATED_FR || '',
            });
      
            await notification.save();

                
            await _seller.send_push_notification({
              notif_type: 'transaction_created',
              headings_labels: [],
              content_labels: [`${product.name}`],
              custom_data: { product: getDocId(product), product_name: product.name },
            });
          }

        }      
        break;
      case 'transaction_accepted':
        // notify buyer
        // notify buyer
        if(accepted_offer_info && accepted_offer_info.buyer){
          // Get byuer
          const _buyer=await User.findById(accepted_offer_info.buyer);
          if(_buyer){


            // Create notification
            const notification = new NotificationModel({
              product: getDocId(product),
              product_info:product? await product.getInfo():undefined,
              type:'transaction_accepted',
              users:[_buyer._id],
              title: i18nMessages.TRANSACTION_ACCEPTED_FR || '',
            });
  
            await notification.save();
            
            // Send push notification
            await _buyer.send_push_notification({
              notif_type: 'transaction_accepted',
              headings_labels: [],
              content_labels: [`${product.name}`],
              custom_data: { product: getDocId(product), product_name: product.name },
            });
          }

        }   
        break;
  
       
      case 'transaction_completed':
        // notify buyer
        if(accepted_offer_info && accepted_offer_info.buyer){
          // Get byuer
          const _buyer=await User.findById(accepted_offer_info.buyer);
          if(_buyer){

        
            // Create notification
            const notification = new NotificationModel({
              product: getDocId(product),
              product_info:product? await product.getInfo():undefined,
              type:'transaction_completed',
              users:[_buyer._id],
              title: i18nMessages.TRANSACTION_COMPLETED_FR || '',
            });
      
            await notification.save();
            
            // send push notification
            await _buyer.send_push_notification({
              notif_type: 'transaction_completed',
              headings_labels: [],
              content_labels: [`${product.name}`],
              custom_data: { product: getDocId(product), product_name: product.name },
            });
          }
  
        }   
        break;
      case 'transaction_delivery':
        // notify seller
        if(user){
          // Get seller
          const _seller=await User.findById(user);
          if(_seller){


            // TRANSACTION_CREATED_FR;
            // TRANSACTION_STARTED_FR;
            // TRANSACTION_COMPLETED_FR;
            // PRODUCT_PURCHASED_FR;
            // OFFER_ACCEPTED_FR;
            // OFFER_REJECTED_FR;
            // Create notification
            const notification = new NotificationModel({
              product: getDocId(product),
              product_info:product? await product.getInfo():undefined,
              type:'transaction_delivery',
              users:[_seller._id],
              title: i18nMessages.TRANSACTION_DELIVERY_FR || '',
            });
            await notification.save();

            // send push notification
            await _seller.send_push_notification({
              notif_type: 'transaction_delivery',
              headings_labels: [],
              content_labels: [`${product.name}`],
              custom_data: { product: getDocId(product), product_name: product.name },
            });
          }
  
        }      
        break;   
      case 'conform': 
        break;  
      case 'non_conform': 
        break;  
      default:
        break;
    }
    
   
  }

  next();
});

/**
 * virtuals
 * */
ProductSchema.virtual('imageUrls').get(function getImageUrl() {
  if (this.images) {
    return this.images.map((img) => `${config.app.prefix}/files/${img}/view?size=300x300`);
  }
  return [];
});

ProductSchema.virtual('colorCode').get(function colorCode() {
  const obj = config.app.product.colors.find((x) => x.name === this.color);
  return obj ? obj.code : '';
});

/**
 * checks if product is created by {{me}}.
 * @param {User} me
 * @returns {Boolean}
 */
ProductSchema.methods.isMine = function isMine(me) {
  if (!me) return false;
  return getDocId(this.user) === getDocId(me);
};


/**
 * get info
 * @param {User} me
 * @returns {Boolean}
 */
ProductSchema.methods.getInfo = async function getInf() {
  const info = {
    name: this.name,
    description: this.description,
    images: this.images,
  };
  return info;
};
/**
 * checks if user is blacklisted
 * @param {User} user
 * @returns {Boolean}
 */
ProductSchema.methods.isBlacklisted = function isBlacklisted(user) {
  return !this.blacklist || this.blacklist.find((u) => getDocId(u) === getDocId(user));
};
/**
 * checks if product is in sell ( can be selled)
 * @param {User} me
 * @returns {Boolean}
 */
ProductSchema.methods.isInSell = function isInSell() {
  return this.is_published && !this.is_selled && !this.is_deleted;
};
/**
 * set product to selled.
 * @param {ObjectId} user_id
 */
ProductSchema.methods.sellTo = async function sellTo(user_id, price) {
  this.is_selled = true;
  this.selled_to = user_id;
  this.selled_at = Date.now();
  this.selled_price = price;
  return this.save();
};
/**
 * checks if this product is loved by {{me}}.
 * @param {User} me user
 * @returns {Boolean} true if user has added product to favorite
 */
ProductSchema.methods.lovedBy = async function doILoveIt() {
  const FavoriteModel = mongoose.model('Favorite');
  return FavoriteModel.find({ product: this._id });
};

/**
 * checks if this product is loved by {{me}}.
 * @param {User} me user
 * @returns {Boolean} true if user has added product to favorite
 */
ProductSchema.methods.doILoveIt = async function doILoveIt(me) {
  const FavoriteModel = mongoose.model('Favorite');
  const favorite = await FavoriteModel.findOne({ product: this, user: me });

  if (favorite) {
    return true;
  }
  return false;
};

/**
 * add this product to my favorties
 * @param {User} me user
 * @returns {Boolean} true if user has added product to favorite
 */
ProductSchema.methods.loveIT = async function loveIT(me) {
  const FavoriteModel = mongoose.model('Favorite');
  const favorite = new FavoriteModel({ user: me, product: this });
  const result = await favorite.save({ new: true });
  return result;
};

/**
 * add this product to my favorties
 * @param {User} me user
 * @returns {Boolean} true if user has added product to favorite
 */
ProductSchema.methods.unloveIt = async function unloveIt(me) {
  const FavoriteModel = mongoose.model('Favorite');
  await FavoriteModel.deleteOne({ user: me, product: this });
  return true;
};

/**
 * Virtual attributes
 */
ProductSchema.virtual('id').get(function getId() {
  return this._id;
});

ProductSchema.index({ created_at: -1 });
ProductSchema.index({ updated_at: -1 });

const ProductModel = mongoose.model('Product', ProductSchema);

ProductModel.createIndexes();
module.exports = ProductModel;
