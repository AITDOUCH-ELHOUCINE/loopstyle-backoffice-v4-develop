const config = require('@config/index');
const axios = require('axios');

const {
  apiUrl,
  apiKey,
} = config.lib.obvy;
  
const utils = require('@helpers/utils');

const { getDocId } = utils;
const crypto = require('crypto');
const { resolve } = require('path');
const mongoose = require('mongoose');

const { Schema } = mongoose;




const axiosErroMessage = (err) => {
  const { isAxiosError } = err;
  if (isAxiosError) {
    return (
      err.response && err.response.data && err.response.data.message?
        err.response.data.message : err.message )|| JSON.stringify(err);
  } 
  return  err.message || JSON.stringify(err);
  
};


// eslint-disable-next-line no-multi-assign
module.exports = function(schema) {
  schema.add({
    obvyProfile: 
    {
      created:{
        type:Boolean,
        default:false,
      },
      'full_name': String,
      'birth_date':Date,
      'date_created': Date,
      'statistics': {
        'transactions_as_seller':Number,
        'transactions_as_buyer': Number,
        'ratings_count': Number,
        'rating_value': Number,
      },
      'balance': {
        'amount': Number,
        'currency': String,
      },
      'discount_balance': {
        'amount': String,
        'currency':String,
      },
      'statuses': {
        'status': String,
        'email_verified': {
          type:Boolean,
          default: false,
        },
        'mobile_phone_verified':  {
          type:Boolean,
          default: false,
        },
        'identity_verified':  {
          type:Boolean,
          default: false,
        },
        'address_verified':  {
          type:Boolean,
          default: false,
        },
        'bank_verified':  {
          type:Boolean,
          default: false,
        },
      },
      'id': {
        type:String,
      },
      'type': {
        type:String,
        immutable:true,
      },
      'email':{
        type:String,
      },
      'display_name':{
        type:String,
      },
      'first_name':{
        type:String,
      },
      'last_name':{
        type:String,
      },
      'mobile_phone': {
        'number': String,
        'code': String,
      },
      'custom_id':String,
      'tag':String,
      'urls': {
        'kyc_url': String,
        'bank_url': String,
        'cashout_url':String,
        'information_url': String,
      },
      error: Schema.Types.Mixed,
    },
  });


  // Remove blocking pre-save network call and use post-save fire-and-forget instead
  schema.post('save', function(doc) {
    // Avoid parallel syncs on the same instance
    if (doc.__obvySyncInFlight) return;
    doc.__obvySyncInFlight = true;
    Promise.resolve()
      .then(() => doc.syncObvyUser())
      .catch((error) => {
        console.error('createObvyUser Error');
        console.error(error);
        console.error(`createObvyUser :${axiosErroMessage(error)}`);
      })
      .finally(() => {
        doc.__obvySyncInFlight = false;
      });
  });

  /**
   * Delete Card By Id
   * @param {String} id
   */
  //   schema.methods.deleteCardById = async function (id) {
  //     try {
  //       const user = this;
  //       // Find Card By Id
  //       user.cards = user.cards
  //         .map((c) => {
  //           if (c.id === id) {
  //             return false;
  //           }
  //           return c;
  //         })
  //         .filter(Boolean);

  //       await user.save();
  //       return true;
  //     } catch (e) {
  //       console.error(e.message || e);
  //       return false;
  //     }
  //   };



  /**
   * Add New Card 
   * @param {Object} card
   */
  schema.methods.syncObvyUser = async function () {
    try {
      const user=this;

      // Skip if already synced
      if(user && user.obvyProfile && user.obvyProfile.created){
        return true;
      }

      const {
        _id,
        name,
        email,
        phone,
        countryCode,
        birthdate:birth_date,
      }=user || {};

      // Ensure we have minimal data; otherwise skip silently
      if (!email) return true;

      const { first:first_name = '', last:last_name = '' } = (name || {});

      const data = JSON.stringify({
        'type': 'natural',
        'mobile_phone': {
          'number': phone || '',
          'code': countryCode || '',
        },
        email,
        first_name,
        last_name,
        birth_date,
        display_name: email,
        custom_id: _id,
      });

      const conf = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${apiUrl}/user`,
        headers: { 
          'X-Secret-Key': `${apiKey}`, 
          'Content-Type': 'application/json',
        },
        data,
      };
    
      const response = await axios(conf);
      const result = response.data;

      if(result && result.id){
        user.obvyProfile={...result,created:true};
      }

      return true;
    } catch (error) {
      console.error('createObvyUser Error');
      console.error(error);
      console.error(`createObvyUser :${axiosErroMessage(error)}`);
      console.error( error.isAxiosError ? error.response?.data : JSON.stringify(error));
    
      this.obvyProfile = this.obvyProfile || {};
      this.obvyProfile.error= error.isAxiosError ? (error.response?.data || axiosErroMessage(error)) : JSON.stringify(error);

      // Do not throw; avoid breaking the user save
      return false;
    }
  };


  /**
   * Cards list card by id
   * @param {string} cardId
   */
  schema.methods.cardsList = async function () {
    const user = this;
  
    return user.cards;
  };
};
