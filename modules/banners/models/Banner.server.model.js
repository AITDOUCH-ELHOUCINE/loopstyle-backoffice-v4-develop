/**
 * Module dependencies
 */
const mongoose = require('mongoose');
const config = require('@config/index');
const { v4: uuidv4 } = require('uuid');
const utils = require('@helpers/utils');

const { Schema } = mongoose;

// Ensure mongoose connection is available
if (!mongoose) {
  throw new Error('Mongoose is not available');
}

const { generateCode } = utils;

const BannerSchema = new Schema(
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
      type: String,
      index: true,
      required: 'Le nom de banner est obligatoire',
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      ref: 'FMFiles',
      type: 'ObjectId',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'banners',
    timestamps: config.lib.mongoose.timestamps,
    toObject: {
      transform(doc, ret) {
        const private_attrs = config.app.banner.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
    toJSON: {
      transform(doc, ret) {
        const private_attrs = config.app.banner.private_attrs || [];
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
BannerSchema.pre('save', async function pre_save(next) {
  if (this.isNew) {
    this.uid = generateCode('banners');
  }
  next();
});

/**
 * Virtual attributes
 */
BannerSchema.virtual('id').get(function getId() {
  return this._id;
});

BannerSchema.virtual('imageUrl').get(function getImageUrl() {
  if (this.image) {
    return `${config.app.prefix}/files/${this.image}/view?size=300x300`;
  }
  return '/assets/img/banner.jpg';
});

const autoPopulate = function (next) {
  this.populate('clients', 'name');
  this.populate('motifs', 'name');
  this.populate('demandeType', 'name affchName');
  next();
};

/**
 * Hook a pre find method
 */
BannerSchema.pre('findOne', autoPopulate).pre('find', autoPopulate);

BannerSchema.index({ name: 1, isDeleted: 1 }, { unique: true, background: true });

BannerSchema.index({ created_at: -1 });
BannerSchema.index({ updated_at: -1 });



// Add this check before creating the model
if (mongoose.models.Banner) {
  module.exports = mongoose.models.Banner;
} else {
  const Banner = mongoose.model('Banner', BannerSchema);
  
  // Create indexes in background
  Banner.createIndexes().catch(err => {
    console.error('Error creating indexes for Banner model:', err);
  });
  
  module.exports = Banner;
}


// After model creation
// Banner.on('index', function(error) {
//   if (error) {
//     console.error('Banner index error:', error);
//   } else {
//     console.log('Banner indexes created');
//   }
// });