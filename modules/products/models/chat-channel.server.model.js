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

const { model, Types, Schema } = mongoose;

const ChatChannelSchema = new Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      immutable:true,
    },
    name: {
      type: String,
      trim: true,
    },
    product: {
      type: Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
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
    type: {
      type: String,
      // enum: ['private', 'internal', 'public', 'p2p'],
      enum: ['p2p'],
      default: 'p2p',
    },
    archived: {
      type: Boolean,
      default: false,
    },
    users: {
      type: [
        {
          // user: {
          //   type: Types.ObjectId,
          //   required: true,
          //   ref: 'User',
          // },
          user: {
            // user is used to refer which user placed the order
            type: 'ObjectId',
            refPath: 'users.userModel',
            required: true,
          },
          userModel: {
            type: String,
            required: true,
            default: 'User',
            enum: ['User'],
          },
          isAdmin: Boolean,
          mute: Boolean,
          last_seen_date: Date,
        },
      ],
    },
    last_msg: {
      type: 'ObjectId',
      ref: 'ChatMessage',
    },
    last_msg_date: Date,
  },
  {
    timestamps: config.lib.mongoose.timestamps,
    collection: 'chat-channels',
  },
);

const autoPopulate = function (next) {
  this.populate({
    path: 'users.user',
    select: 'name email phone image',
  });
  next();
};
/**
 * Hook a pre find method
 */

// ChatChannelSchema.pre('findOne', autoPopulate).pre('find', autoPopulate);
/**
 * Check if a user is an admin
 */
ChatChannelSchema.methods.isAdmin = function userIsAdmin(u) {
  const oId = getDocId(this.owner);
  const uId = getDocId(u);

  if (!uId) {
    return false;
  }

  const { users = [] } = this;
  return uId === oId || users.filter(({ user, isAdmin }) => uId === getDocId(user) && isAdmin);
};

/**
 * Touch a channel, and update the last message date
 */
ChatChannelSchema.methods.touch = function touch(isSave = true, msg) {
  this.last_msg_date = new Date();
  this.last_msg = msg;
  if (!isSave) {
    return this;
  }
  return this.save();
};

/**
 * Public List user channels and return a query
 * @param { Object } user The user
 */
ChatChannelSchema.statics.publicUserChannels = function publicUserChannels(user) {
  const $or = [
    {
      type: 'public',
    },
  ];
  const filter = {
    $and: [
      {
        archived: {
          $in: [false, null],
        },
      },
      { $or },
    ],
  };

  if (user) {
    $or.push(
      {
        owner: user,
      },
      {
        type: 'internal',
      },
      {
        'users.user': user,
      },
    );
  }

  return this.find(filter).sort('-last_msg');
};


/**
 * P2P List user channels and return a query
 * @param { Object } user The user
 */
ChatChannelSchema.statics.p2pUserChannels = function p2pUserChannels({
  buyer,
  product,
  $q}) {

  const UserModel=model('User');


  const stringQ = [];
  if($q) {
    Object.entries(UserModel.schema.paths).forEach(([k, v]) => {
      if (v.instance === 'String' && v._index && config.app.profile.private_attrs.indexOf(k) === -1) {
        stringQ.push({
          [k]: {
            $regex: $q,
            $options: 'i',
          },
        });
      }
    });
  }


  const usersPipeline = [
    // Stage 1: Get Users 
    {
      $match: {
        $and: [
          { product:mongoose.Types.ObjectId(getDocId(product)) },
          { saller:mongoose.Types.ObjectId(getDocId(saller)) },
          { $or: stringQ.length ? stringQ : [{}] },
        ],
      }, 
    },
    {
      $project: {
        _id: 1,
        type: 1,
        name: 1,
        email: 1,
        phone: 1,
        image: 1,
      },
    },
    {
      $lookup: {
        from: 'chat-channels',
        let: {
          userId: '$_id',
          channelOwner: '$owner',
          channelUsers: '$users',
          connectedUser:mongoose.Types.ObjectId(getDocId(user)),

        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {type:'p2p'},
                  {
                    $or:[{
                      $and: [
                       
                        { $eq: [ '$owner','$$userId' ] },
                        {
                          $gt: [
                            {
                              $size: {
                                $filter: {
                                  input: '$users',
                                  as: 'item',
                                  cond: {
                                    $and: [
                                      {
                                        $eq: [
                                          '$$item.user',
                                          '$$connectedUser',
                                        ],
                                      },
                                    ],
                                  },
                                },
                              },
                            },
                            0,
                          ],
                        },
                      ],
                    },
                    {
                      $and: [
                       
                        { $eq: [ '$owner','$$connectedUser' ] },
                        {
                          $gt: [
                            {
                              $size: {
                                $filter: {
                                  input: '$users',
                                  as: 'item',
                                  cond: {
                                    $and: [
                                      {
                                        $eq: [
                                          '$$item.user',
                                          '$$userId',
                                        ],
                                      },
                                    ],
                                  },
                                },
                              },
                            },
                            0,
                          ],
                        },
                      ],
                    },
                    ]},
             
                ],
              },
            },
          },

          
        ],
        as: 'channels',
      },
    },
    { $addFields: {
      channelsCount: {$size: '$channels'},
      channel: { $arrayElemAt: ['$channels', 0] },
    }},
    {
      $project: {
        channels: 0,
      },
    },
    {
      $sort: { created_at: 1 },
    },
  ];



  const $aggregate = UserModel.aggregate(usersPipeline);


  return $aggregate;

};

/**
 * List user channels and return a query
 * @param { Object } user The user
 */
ChatChannelSchema.statics.p2pChannel = function p2pChannel(user1, user2) {
  const filter = {
    $and: [
      {
        archived: {
          $in: [false, null],
        },
      },
      {
        type: 'p2p',
      },
      {
        owner: {$in: [user1, user2]}, // {user:user1},
      },
      {
        'users.user': {$in: [user1, user2]},
      },
    ],
  };

  return this.find(filter).sort('-last_msg');
};
/**
 * Find a user in the list of users
 */
ChatChannelSchema.methods.findUser = function findUser(user) {
  if (!user) {
    return false;
  }

  const { users, owner } = this;
  const uId = getDocId(user);
  const oId = getDocId(owner);

  let found = users.find(({ user: u }) => uId === getDocId(u));

  if (!found && uId === oId) {
    found = {
      user: oId,
      isAdmin: true,
    };

    users.push(found);
    found = users[users.length - 1];
  }

  if (!found) {
    return false;
  }

  return found;
};

/**
 * Update the last_seen_date attribute
 * @param { Object } user The user
 */
ChatChannelSchema.methods.saw = async function saw({user, isSave = true}) {
  if (!user) {
    return false;
  }

  const found = this.findUser(user);

  if (!found) {
    return false;
  }

  found.last_seen_date = new Date();
  this.markModified('users');

  if (isSave === true) {
    console.log(this);
    await this.save({ new: true });
  }

  return this;
};


/**
 * Update the mute attribute
 * @param { Object } user The user
 */
ChatChannelSchema.methods.mute = function mute(user) {
  if (!user) {
    return false;
  }

  const found = this.findUser(user);

  if (!found) {
    return false;
  }

  found.mute = true;
  this.markModified('users');

  return this.save({ new: true });
};

/**
 * Check if the user can access to the channel
 * @param { Object } user The user
 */
ChatChannelSchema.methods.canAccess = function canAccess(user) {
  if (!user) {
    return this.type === 'public';
  }

  if (this.type === 'internal') {
    return true;
  }

  const oId = getDocId(this.owner);
  const users = this.users.map(({ user: u }) => getDocId(u));

  return [oId, ...users].includes(getDocId(user));
};

/**
 * Get the preview of a specific channel
 */
ChatChannelSchema.methods.getPreview = async function getPreview(user) {
  console.log('getPreview');
  const cUId = getDocId(user);
  const { modelName } = user.constructor;
  const { _id: id } = this;
  console.log('modelName = ', modelName);
  const ChatMessage = model('ChatMessage');
  let { name, muted = false } = this;
  let read = false;

  if (!name || user) {
    await this.populate({
      path: 'users.user',
      select: 'name email phone image',
    })
      .populate({
        path: 'owner',
        select: '_id name email phone image',
      })
      .execPopulate();
  }

  let found = false;
  if (cUId) {
    found = this.findUser(cUId);

    if (found) {
      muted = found.mute;
    }
  }

  // if (!name && !['public', 'internal'].includes(this.type)) {
  //   users = this.users
  //     .filter((u) => {
  //       const uId = getDocId(u.user);
  //       return uId !== cUId && u && u.user && u.user.name;
  //     })
  //     .slice(0, 3)
  //     .map((u) => u.user.name);

  //   const nbUsers = found ? this.users.length - 1 : this.users.length;
  //   name = users.join(' & ') + (users.length < nbUsers && users.length > 0 ? '...' : '');
  // }

  // console.log('users');
  // console.log(users);

  const chatMessage = await ChatMessage.findOne({
    channel: id,
    // type: 'message',
    removed: false,
  })
    .sort({ created_at: -1 })
    .select('sender text created_at')
    .populate({
      path: 'sender',
      select: 'name email phone image',
    });

  console.log('chatMessage');
  console.log(chatMessage);

  if (found) {
    muted = found.mute;
    console.log({
      last_seen_date: found.last_seen_date,
      created_at: chatMessage,
    });
    read = !chatMessage || Boolean(found.last_seen_date && chatMessage.created_at < found.last_seen_date);
  }

  return {
    _id: id,
    owner: this.owner,
    type: this.type,
    name: !name && ['public', 'internal'].includes(this.type) ? this.type : name || 'Untitled',
    read,
    muted,
    chatMessage,
    users: this.users,
  };
};

/**
 * Pre save event implementation
 */
ChatChannelSchema.pre('save', function preSave() {
  const modified = this.modifiedPaths();

  if (modified.length === 0) {
    return;
  }

  const { users } = this;
  this.increment();

  if (modified.includes('users')) {
    if (Array.isArray(users)) {
      this.users = users.filter(({ user }, index, arr) => {
        const uId = getDocId(user);
        const i = arr.findIndex(({ user: u }) => getDocId(u) === uId);
        return i === index;
      });
    }
  }
});

/**
 * Pre remove event implementation
 */
ChatChannelSchema.post('remove', function postRemove() {
  const ChatMessage = model('ChatMessage');
  ChatMessage.deleteMany({ channel: this }).catch((e) => console.error(e));
});

module.exports = mongoose.model('ChatChannel', ChatChannelSchema);
