/**
 * Module dependencies.
 */
const mongoose = require('mongoose');
const { resolve } = require('path');
const { v4: uuidv4 } = require('uuid');
// eslint-disable-next-line import/no-dynamic-require
const config = require(resolve('./config'));
const txtSymbol = Symbol.for('text');
const updatedAtSymbol = Symbol.for('updated_at');
const utils = require('@helpers/utils');

const { getDocId } = utils;

const { Schema } = mongoose;

const ChatMessageSchema = new Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      immutable:true,
    },
    type: {
      type: String,
      required: 'The type is required',
      trim: true,
      enum: ['text', 'media', 'location', 'invitation'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      set(v) {
        this[txtSymbol] = this.text;
        return v;
      },
    },
    media: {
      type: String,
    },
    mediaType: {
      type: String,
      emun: ['image', 'video', 'audio', 'pdf'],
    },
    location: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    },
    sender: {
      // user is used to refer which user placed the order
      type: 'ObjectId',
      refPath: 'senderModel',
      required: true,
    },
    senderModel: {
      type: String,
      required: true,
      default:'User',
      enum: ['User'],
    },
    chatChannel: {
      type: Schema.Types.ObjectId,
      ref: 'ChatChannel',
      required: true,
    },
    product: {
      type:Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    seller: {
      type:Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyer: {
      type:Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    removed: {
      type: Boolean,
      default: false,
    },
    versions: [
      {
        text: String,
        date: Date,
      },
    ],
  },
  {
    timestamps: config.lib.mongoose.timestamps,
    collection: 'chat-messages',
    toObject: {
      transform(doc, ret) {
        const private_attrs = config.app.chatMessage.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
    toJSON: {
      transform(doc, ret) {
        const private_attrs = config.app.chatMessage.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
  },
);

ChatMessageSchema.path('updated_at').set(function onUpdatedAtSet(v) {
  this[updatedAtSymbol] = this.updated_at;
  return v;
});

ChatMessageSchema.pre('save', function preSave() {
  const modified = this.modifiedPaths();
  if (!this.isNew && modified.includes('text') && config.chat.versionning) {
    const text = this[txtSymbol];
    const date = this[updatedAtSymbol] || this.updated_at;

    this.versions.unshift({ text, date });

    if (config.chat.nbMsgVersions >= 0 && config.chat.nbMsgVersions <= this.versions.length) {
      this.versions = this.versions.slice(0, config.chat.nbMsgVersions);
    }
  }
});

ChatMessageSchema.virtual('mediaUrl').get(function get_media_url() {
  if (this.media) {
    return `${config.app.prefix}/files/${this.media}/view`;
  }

  return '';
});


/**
 * Check if is mine msg
 * @param { Object } user The user
 */
ChatMessageSchema.statics.isMine = async function isMine({user,message}) {

  if (!user || !message) {
    return false;
  }


  const { sender } = message;
  const uId = getDocId(user);
  const sId = getDocId(sender);


  if (sId && uId &&sId === uId) {
    return true;
  }

  return false;
};
module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
