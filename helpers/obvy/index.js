const config = require('@config/index');
const axios = require('axios');
const mongoose = require('mongoose');

const {model}=mongoose;
const utils = require('@helpers/utils');

const { getDocId } = utils;

const {
  apiUrl,
  apiKey,
  deliveryId, // createe depui le backoffice obvy menu (Pages hébergées)
} = config.lib.obvy;

const { publicAddress, prefix } = config.app;

const isObvyEnabled = String(process.env.OBVY_ENABLED || 'true').toLowerCase() === 'true';



const axiosErroMessage = (err) => {
  const { isAxiosError } = err;
  if (isAxiosError) {
    return (
      err.response && err.response.data && err.response.data.message?
        err.response.data.message : err.message )|| JSON.stringify(err);
  } 
  return  err.message || JSON.stringify(err);
    
};

exports.createObvyPostalDelivery = async({product,buyer}) => {
  try {

    if (!isObvyEnabled) {
      throw new Error('Obvy integration is disabled');
    }

    const {
      _id:productId,
      user,
      uid:productUid,
      name:productName,
      description:productDescription,
      accepted_offer_info,
    }=product;


    const {buyer:acceptedBuyer,price:acceptedPrice}=accepted_offer_info;

    const productPrice =
      accepted_offer_info && acceptedPrice
        ? acceptedPrice
        : product.price;

    // Get seller Info
    const UserModel=model('User');
    const seller=await UserModel.findById(user);
    if(!seller) {
      throw new Error('seller not found');
    };
    const {obvyProfile:sellerObvyProfile}=seller;
    if(!sellerObvyProfile || !sellerObvyProfile.created) {
      throw new Error('Seller obvyProfile not found');
    };
    const {id:sellerObvyId}=sellerObvyProfile;



    // Get buyer Info

    if(!buyer && !acceptedBuyer ) {
      throw new Error('buyer not found');
    };

    if(buyer && acceptedBuyer && getDocId(buyer)!==getDocId(acceptedBuyer)) {
      throw new Error('the buyer must be the same as the accepted buyer');
    };


    const buyer_=await UserModel.findById(buyer);
    if(!buyer_) {
      throw new Error('buyer not found');
    };


    
    const {obvyProfile:buyerObvyProfile}=buyer_;
    if(!buyerObvyProfile || !buyerObvyProfile.created) {
      throw new Error('Buyer obvyProfile not found');
    };


    const {id:buyerObvyId}=buyerObvyProfile;



    const data = JSON.stringify({
    
      'delivery_id': deliveryId,
      'currency': 'eur',
      'payment_methods': [
        'card',
      ],
      'items': [
        {
          'delivery': {
            'weight': 1000,// todo
            'destination_relay_country_code': 'FR',
          },
          'seller_id': sellerObvyId,
          'title': productName,
          'price': accepted_offer_info && accepted_offer_info.acceptedPrice ? accepted_offer_info.acceptedPrice : productPrice,
          'quantity': 1,
          'sku': productUid,
          'description': productDescription,
        },
      ],
      'buyer_id': buyerObvyId,
      'external_id': getDocId(productId),
      'success_url':`${publicAddress}${prefix}/obvy/payment/success`,
      'cancel_url': `${publicAddress}${prefix}/obvy/payment/cancel`,

        
    });


    const conf = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${apiUrl}/hosted/payment/postal`,
      headers: { 
        'X-Secret-Key': `${apiKey}`, 
        'Content-Type': 'application/json',
      },
      data,
    };

    const response = await axios(conf);


    const result = response.data;




    const {id:responseId,urls}=result;
    const {buyer:buyerResponse,sellers:sellersResponse=[]}=urls;

    if(!responseId || !buyerResponse) {
      throw new Error('obvy delivery not created');
    };


    product.obvyInfo.postalDelivery={
      created:true,

      'id': responseId,
      'urls': {
        'buyer': {...buyerResponse,internal_id:getDocId(buyer_)},
        'sellers':sellersResponse.map((s)=>({...s,internal_id:getDocId(user)})),
      },
    };

    product.obvyInfo.postalDelivery={...result,created:true};

    product.status='transaction_started';

    
    const p= await product.save();

    return p;

  } catch (error) {
  
    /**
     * log at job error
     */
    console.error(`createObvyPostalDelivery :${axiosErroMessage(error)}`);
    console.error( error.isAxiosError ? error.response.data : JSON.stringify(error));

    throw error.isAxiosError ? error.response.data : error;
  }

};
  



exports.getObvyEventById = async({eventId}) => {
  try {

    if (!isObvyEnabled) {
      throw new Error('Obvy integration is disabled');
    }


    if(!eventId) {
      throw new Error('eventId not found');
    };




    const conf = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${apiUrl}/event/${eventId}`,
      headers: { 
        'X-Secret-Key': `${apiKey}`, 
        'Content-Type': 'application/json',
      },
    };


    const response = await axios(conf);


    const result = response.data;


    return result;

  } catch (error) {
  
    /**
     * log at job error
     */
    console.error(`getObvyEventById :${axiosErroMessage(error)}`);
    console.error( error.isAxiosError ? error.response.data : JSON.stringify(error));

    throw error.isAxiosError ? error.response.data : error;
  }

};
  
exports.getObvyTransactionById = async({transactionId}) => {
  try {

    if (!isObvyEnabled) {
      throw new Error('Obvy integration is disabled');
    }


    if(!transactionId) {
      throw new Error('transactionId not found');
    };



    const conf = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${apiUrl}/transaction/${transactionId}`,
      headers: { 
        'X-Secret-Key': `${apiKey}`, 
        'Content-Type': 'application/json',
      },
    };

    const response = await axios(conf);


    const result = response.data;

    return result;

  } catch (error) {
  
    /**
     * log at job error
     */
    console.error(`getObvyTransactionById :${axiosErroMessage(error)}`);
    console.error( error.isAxiosError ? error.response.data : JSON.stringify(error));

    throw error.isAxiosError ? error.response.data : error;
  }

};
  