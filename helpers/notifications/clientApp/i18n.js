const config = require('@config/index');


const defaultHeadings = {
  en: config.app.title,
  fr: config.app.title,
};

const i18nMessages = config.lib.onesignal.clientApp.i18n || {};

module.exports = {
  /**
   * New ACCOUNT ACtivated
   * notif will be sent to client
   */
  account_activated: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.ACCOUNT_ACTIVATED_EN || '',
      fr: i18nMessages.ACCOUNT_ACTIVATED_FR || '',
    },
  },


  /*
  * Chat message
  */
  new_chat_message: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.NEW_CHAT_MSG_EN || '',
      fr: i18nMessages.NEW_CHAT_MSG_FR || '',
    },
  },

  /*
  * Nouvelle proposition
  */
  new_offer: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.NEW_OFFER_EN || '',
      fr: i18nMessages.NEW_OFFER_FR || '',
    },
  },

  /*
  * Proposition acceptée
  */
  offer_accepted: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.OFFER_ACCEPTED_EN || '',
      fr: i18nMessages.OFFER_ACCEPTED_FR || '',
    },
  },

  /*
  * Proposition rejettée
  */
  offer_rejected: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.OFFER_REJECTED_EN || '',
      fr: i18nMessages.OFFER_REJECTED_FR || '',
    },
  },
  /*
  * Transaction started 
  */
  transaction_started: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.TRANSACTION_STARTED_EN || '',
      fr: i18nMessages.TRANSACTION_STARTED_FR || '',
    },
  },

  /*
  * Transaction created 
  */
  transaction_created: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.TRANSACTION_CREATED_EN || '',
      fr: i18nMessages.TRANSACTION_CREATED_FR || '',
    },
  },

  /*
  * Transaction accepted 
  */
  transaction_accepted: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.TRANSACTION_ACCEPTED_EN || '',
      fr: i18nMessages.TRANSACTION_ACCEPTED_FR || '',
    },
  },
  
  /*
  * Transaction completed 
  */
  transaction_completed: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.TRANSACTION_COMPLETED_EN || '',
      fr: i18nMessages.TRANSACTION_COMPLETED_FR || '',
    },
  },
  /*
  * poduct purchased
  */
  transaction_delivery: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: i18nMessages.TRANSACTION_DELIVERY_EN || '',
      fr: i18nMessages.TRANSACTION_DELIVERY_FR || '',
    },
  },


  /**
   * Admin notification
   */
  admin_notification: {
    headings: {
      en: 'XXXXX',
      fr: 'XXXXX',
    },
    contents: {
      en: 'XXXXX',
      fr: 'XXXXX',
    },
  },
  /**
   * Admin notification
   */
  admin: {
    headings: {
      ...defaultHeadings,
    },
    contents: {
      en: 'XXXXX',
      fr: 'XXXXX',
    },
  },
};
