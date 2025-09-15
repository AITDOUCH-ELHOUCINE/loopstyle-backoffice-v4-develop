/**
 * Module dependencies
 */
const mongoose = require('mongoose');
const config = require('@config/index');
const { v4: uuidv4 } = require('uuid');
const utils = require('@helpers/utils');

const { generateCode, getDocId } = utils;
const { Schema } = mongoose;


const SizeSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    immutable: true,
  },
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    immutable: true,
  },
  name: {
    type: String,
    index: true,
    required: 'Le nom de la taille est obligatoire',
  },
  description: {
    type: String,
    default: '',
  },
});

const UsageSizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: 'Le genre est obligatoire',
    enum: ['men', 'babies', 'girls', 'boys', 'women','baby-female','baby-male'],
  },
  sizes: [SizeSchema],
});

const SubCategorySchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    immutable: true,
  },
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    immutable: true,
  },
  name: {
    type: String,
    index: true,
    required: 'Le nom de la sous catégorie est obligatoire',
  },
  description: {
    type: String,
    default: '',
  },
  usageSizes: [UsageSizeSchema],
});


const CategorySchema = new Schema(
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
      required: 'Le nom de category est obligatoire',
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: 'ObjectId',
      required: true,
      ref: 'User',
    },
    subCategories: [SubCategorySchema],

   
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
    collection: 'categories',
    timestamps: config.lib.mongoose.timestamps,
    toObject: {
      transform(doc, ret) {
        const private_attrs = config.app.category.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
    toJSON: {
      transform(doc, ret) {
        const private_attrs = config.app.category.private_attrs || [];
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
CategorySchema.pre('save', async function pre_save(next) {
  if (this.isNew) {
    this.uid = generateCode('categories');
  }

  this.subCategories.forEach(subCategory => {
    const uniqueUsages = new Set();
    subCategory.usageSizes.forEach(usageSizes => {
      if (uniqueUsages.has(usageSizes.name)) {
        const error = new Error(`Le genre "${usageSizes.name}" doit être unique dans les tailles de la sous-catégorie "${subCategory.name}".`);
        return next(error);
      }
      uniqueUsages.add(usageSizes.name);
    });
  });

  next();
});

/**
 * Virtual attributes
 */
CategorySchema.virtual('id').get(function getId() {
  return this._id;
});

CategorySchema.virtual('imageUrl').get(function getImageUrl() {
  if (this.image) {
    return `${config.app.prefix}/files/${this.image}/view?size=300x300`;
  }
  return '/assets/img/category.jpg';
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
CategorySchema.pre('findOne', autoPopulate).pre('find', autoPopulate);

CategorySchema.index({ name: 1, isDeleted: 1 }, { unique: true });

CategorySchema.index({ created_at: -1 });
CategorySchema.index({ updated_at: -1 });

const CategoryModel = mongoose.model('Category', CategorySchema);

CategoryModel.createIndexes();
module.exports = CategoryModel;
