const mongoose = require('mongoose');

const {model} = mongoose;
const config = require('@config/index');
const utils = require('@helpers/utils');
const { getIO ,getDocId} = require('@helpers/utils');
const svc = require('../services/bo.server.service');

const ChatChannel = model('ChatChannel');
const ChatMessage = model('ChatMessage');





/**
 * Find channel by id
 * @controller Check "Product" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.getChannelById = async function getChannelById(req, res, next, id) {
  try {
    const { entity:product ,user} = req;

    const isSeller=product.isMine(user);

    const channelQry={
      _id:id,
      product,
      seller:product.user,
    };

    if (!isSeller) {
      channelQry.buyer=user;
    }
     

    const channel=await ChatChannel.findOne(channelQry);

 
    if (!channel) {
      return res.status(404).send({
        message: req.t('CHANNEL_NOT_FOUND')});
    }


    req.chatChannel=channel;

    return next();

  } catch (e) {
    return next(e);
  }
};



/**
 * Sanitize the query for specific product Chat
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeQuery = async function sanitizeQuery(req, res, next) {
  try {

    // console.log('sanitizeQuery');

    const { entity:product,user } = req;

    const isSeller=product.isMine(user);

    const customQry= { product ,seller:product.user};


    if(!isSeller){
      customQry.buyer=user;
    }


    // only not deleted and not selled products to show.
    return await svc.sanitizeQuery('ChatChannel',customQry)(req, res, next);
  } catch (e) {
    return next(e);
  }
};




/**
 * Create new chatChannel
 * @controller Create
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.createBuyerChannelIfNotExist = async function createBuyerChannelIfNotExist(req, res, next) {

  try {
    const { entity:product, user } = req;

    const isSeller=product.isMine(user);


 
    if (isSeller) {
      return next();
    }


    // get channel if already exist
    const existedChannel = await ChatChannel.findOne({
      product,
      buyer:user,
      seller:product.user});


    if (existedChannel) {
      return next();
    }



    // Create the chatChannel
    const c = new ChatChannel({
      product,
      buyer:user,
      owner:user,
      seller:product.user,
    });


  

    await c.save({ new: true });
 
    return next();

  } catch (e) {
    return next(e);
  }
};


/**
 * Chat List
 * @controller  "Chat"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.list = async function list(req, res, next) {
  try {

    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};



/**
 * List messages of a chatChannel
 * @controller List Messages
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.messages = async function messages(req, res, next) {
  const { chatChannel, query, user} = req;

  const { $top: top = 10, $skip: skip = 0 } = query;
  try {
    const list = await ChatMessage.find({
      chatChannel,
    })
      .populate({
        path: 'sender',
        select: 'name email phone image',
      })
      .sort({
        created_at: -1,
      })
      .paginate({ top, skip });


    // if (parseInt(skip, 10) === 0) {
    //   await chatChannel.saw({user});
    // }

    
    const { value:mesages} = list;

    const list$= mesages.map(async (msg) => {
      const isMine = await ChatMessage.isMine({user, message: msg});


      return {...msg.toJSON(), isMine};
    });


    list.value = await Promise.all(list$);
    return res.json(list);
  } catch (e) {
    return next(e);
  }
};


/**
 * Send a chatMessage to a specific user
 * @controller Send chatMessage
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.send = async function send(req, res, next) {
  const {entity:product,user, body, query, chatChannel } = req;
  let { $expand = '' } = query;
  const io = getIO();




  $expand = $expand.split(',');

  let msg = new ChatMessage({
    ...body,
    chatChannel,
    sender:user,
    seller:chatChannel.seller,
    buyer:chatChannel.buyer,
    product,

  });

  try {
    msg = await msg.save({ new: true });
  } catch (e) {
    return next(e);
  }

  let q = ChatMessage.findById(msg.id);
  if ($expand.includes('sender')) {
    q = q.populate({
      path: 'sender',
      select: 'name email phone image',
    });
  }

  if ($expand.includes('users')) {
    q = q.populate({
      path: 'chatChannel',
      select: 'name users',
      populate: {
        path: 'users.user',
        select: 'name email phone image',
      },
    });
  }

  try {
    msg = await q.exec();
  } catch (e) {
    return next(e);
  }

  // Get receiver
  const receiverId =
    getDocId(msg.sender) === getDocId(msg.buyer) ? getDocId(msg.seller) : getDocId(msg.buyer);
  const receiver = await model('User').findById(receiverId);


  if (receiver){

    // send socket io
    io.to(`chat:users:${getDocId(receiver)}`).emit('chat:new:message', {
      chatChannel: getDocId(chatChannel),
      ...msg,
    });

    // console.log ( 'send socket io to ',`chat:users:${getDocId(receiver)}`);

    

    // send push notification
    await receiver.send_push_notification({
      notif_type: 'new_chat_message',
      headings_labels: [],
      content_labels: [`${user.name}`],
      custom_data: {
        chatChannel: getDocId(chatChannel),
        sender: getDocId(user),
        product: getDocId(product),
      },
    });
  }
  


  // Touch the chatChannel
  chatChannel.touch(false, msg);
  // await chatChannel.saw(user, false);
  chatChannel.save().catch(console.error);


  const isMine = await ChatMessage.isMine({user, message: msg});


  return res.json({...msg.toJSON(), isMine});
};

exports.canAdd = async function canAdd(req, res, next) {
  const { user, entity } = req;
  if (entity.isMine(user) || entity.is_deleted)
    return res.status(401).json({
      ok: false,
      message: req.t('YOU_ARE_NOT_ALLOWED_TO_CHAT'),
    });
  return next();
};

