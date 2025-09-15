const config = require('@config/index');
const OneSignal = require('onesignal-node');
const mongoose = require('mongoose');

const {model} =mongoose;
const userI18N = require('./i18n');

const onesignalConfig = config.lib.onesignal;
const { clientApp } = onesignalConfig;
const { restApiKey = '', appId = '', ttl, priority } = clientApp;
const onesignalHelper = require('@helpers/notifications/clientApp');

const node_env=process.env.NODE_ENV;

// Instanciate client With default options
const client = new OneSignal.Client(appId, restApiKey);

/**
 * sendNotification
 * @param {*} notification
 */
const sendNotification = async (notification) => {
  try {

       
    console.log('sendNotification: ');
    console.log(JSON.stringify(notification));
    const response = await client.createNotification(notification);
    console.info('sendNotification: ', response.body.id);

  } catch (e) {
    console.error('sendNotification Error');
    if (e instanceof OneSignal.HTTPError) {
      // When status code of HTTP response is not 2xx, HTTPError is thrown.
      console.error(e.statusCode);
      console.error(e.body);
    } else {
      console.error(e.message || e);
    }
  }
};

/**
 * Update an existing device in one of your OneSignal apps
 * @param {*} external_user_id
 * @param {*} data
 */
const updateDeviceByUserId = async (user_id, data) => {
  try {
    const { tags = {} } = data;
    // set NODE_ENV as tag
    tags.mode = node_env;
       

    client.editTagsWithExternalUserIdDevice(user_id, {
      tags,
    });

  } catch (e) {
    console.error('updateClientDeviceByUserId Error');
    console.error(e);
    if (e instanceof OneSignal.HTTPError) {
      // When status code of HTTP response is not 2xx, HTTPError is thrown.
      console.error(e.statusCode);
      console.error(e.body);
    } else {
      console.error(e.message || e);
    }
  }
};


/**
 * Notif message
 * @param {*} props
 * @returns
 */
const userMessage = async(props) => {
  const {
    include_external_user_ids,
    include_player_ids,
    notif_type,
    headings_labels = [],
    content_labels = [],
    custom_data = {},
    filters,
    included_segments,
    send_after,
  } = props;


  // Chek the type of targeting
  let selectedTargetingParam;
  if (
    include_external_user_ids &&
    Array.isArray(include_external_user_ids) &&
    include_external_user_ids.length
  ) {
    selectedTargetingParam = 'user_ids';
  } else if (include_player_ids && Array.isArray(include_player_ids) && include_player_ids.length) {
    selectedTargetingParam = 'player_ids';
  } else if (filters && Array.isArray(filters) && filters.length) {
    selectedTargetingParam = 'filters';
  } else if (included_segments && Array.isArray(included_segments) && included_segments.length) {
    selectedTargetingParam = 'segments';
  }

  const message = {
    name: '',
    /**
     * Ios Badge config
     */
    // ios_badgeType: 'Increase',
    // ios_badgeCount: 1,
    android_group: 'LoopStyle',
    app_id: appId,
    send_after,
    ttl, // Time To Live - In seconds.
    priority, // Time To Live - In seconds.
    data: { ...custom_data },
    contents: {
      en: notif_type
        ? userI18N[notif_type].contents.en
          .replace('XXXXX', content_labels[0])
          .replace('YYYYY', content_labels[2])
          .replace('ZZZZZ', content_labels[2])
        : content_labels.join(' '),

      fr: notif_type
        ? userI18N[notif_type].contents.fr
          .replace('XXXXX', content_labels[0])
          .replace('YYYYY', content_labels[1])
          .replace('ZZZZZ', content_labels[2])
        : content_labels.join(' '),
    },
    headings: {
      en: notif_type
        ? userI18N[notif_type].headings.en
          .replace('XXXXX', headings_labels[0])
          .replace('YYYYY', headings_labels[1])
          .replace('ZZZZZ', headings_labels[2])
        : headings_labels.join(' '),
      fr: notif_type
        ? userI18N[notif_type].headings.fr
          .replace('XXXXX', headings_labels[0])
          .replace('YYYYY', headings_labels[1])
          .replace('ZZZZZ', headings_labels[2])
        : headings_labels.join(' '),
    },
  };

  switch (selectedTargetingParam) {
    case 'user_ids':
      message.include_external_user_ids = include_external_user_ids;
      message.channel_for_external_user_ids = 'push';
      break;
    case 'player_ids':
      message.include_player_ids = include_player_ids;
      break;
    case 'filters':
      message.filters = filters;
      break;
    case 'segments':
      message.included_segments = included_segments;
      break;
    default:
      message.include_player_ids = include_player_ids;
      break;
  }
  return message;
};


// User
exports.sendClientNotification = sendNotification;
exports.clientMessage = userMessage;
exports.updateClientDeviceByUserId = updateDeviceByUserId;

