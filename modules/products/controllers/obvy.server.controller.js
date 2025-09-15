const mongoose = require('mongoose');

const { model } = mongoose;
const config = require('@config/index');
const utils = require('@helpers/utils');
const obvyHelper = require('@helpers/obvy');
const svc = require('../services/user.server.service');

const { getDocId } = utils;
const Product = mongoose.model('Product');
const Category = mongoose.model('Category');

/**
 *  handle Post ObvyWebhook
 * @controller Check "Product" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.handlePostObvyWebhook = async function handlePostObvyWebhook(req, res, next) {
  const { body, query } = req;

  console.log({
    action: 'handlePostObvyWebhook',
    payload: body,
    query,
  });

  return res.status(200).json({
    ok: true,
  });
};

/**
 *  handle Get ObvyWebhook
 * @controller Check "Product" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.handleGetObvyWebhook = async function handleGetObvyWebhook(req, res, next) {
  const { query, body } = req;
  const { EventType, EventId } = query;

  // query: { EventType: 'TRANSACTION_CREATED', EventId: '10556' },

  // https://dev.api.loopstyle.flexi-apps.com/api/v1/obvy/webhooks?EventType=TRANSACTION_CREATED&EventId=10406
  console.log({
    action: 'handleGetObvyWebhook',
    query,
    body,
  });

  if (!EventType || !EventId) {
    return res.status(400).json({
      ok: false,
      error: 'Missing EventType or EventId',
    });
  }




  





  // 1-TRANSACTION_CREATED;
  // 2-TRANSACTION_ACCEPTED;
  // TRANSACTION_FUNDED;
  // 3-TRANSACTION_DELIVERY;
  // 5-TRANSACTION_COMPLETED;



  // OBVY webhooks events
  // 1- TRANSACTION_CREATED : A transaction has been created
  // 2- TRANSACTION_ACCEPTED : A transaction has been accepted by the seller
  // TRANSACTION_REJECTED : A transaction has been rejected by the seller
  // TRANSACTION_FUNDED: The transaction has been funded, buyer and seller can finalize the transaction or create a litigation. This hook is also sent for recurring payments
  // TRANSACTION_REFUNDED: The transaction has been refunded (Cb3x/Cb4x ONLY)
  // TRANSACTION_NEGOCIATED : The amount of a transaction has been negociated

  // TRANSACTION_CANCELLED : A transaction has been cancelled
  // 3- TRANSACTION_DELIVERY : The status of a transaction delivery has changed
  // 4- TRANSACTION_COMPLETED : A transaction has been completed, the seller has been paid


  // TRANSACTION_CREATED : A transaction has been created
  if (EventType === 'TRANSACTION_CREATED' && EventId) {
    // Step1:  Get obvy event by eventId
    const obvyEvent = await obvyHelper.getObvyEventById({ eventId: EventId });

    if (!obvyEvent) {
      return res.status(400).json({
        ok: false,
        error: 'Event not found',
      });
    }

    // Step2:  Get obvy  transaction by id
    if (
      obvyEvent &&
      obvyEvent.eventType &&
      obvyEvent.eventType === 'TRANSACTION_CREATED' &&
      obvyEvent.data &&
      obvyEvent.data.id
    ) {

      const obvyTransaction = await obvyHelper.getObvyTransactionById({
        transactionId: obvyEvent.data.id,
      });


      if (!obvyTransaction) {
        return res.status(400).json({
          ok: false,
          error: 'Transaction not found',
        });
      }

      const { external_id } = obvyTransaction;

      // Step3:  Get product by external_id

      const product = await Product.findOne({ _id: getDocId(external_id) });

      if (!product) {
        return res.status(400).json({
          ok: false,
          error: 'Product not found',
        });
      }

      console.log({
        transaction: {
          created: true,
          ...JSON.parse(JSON.stringify(obvyTransaction)),
        },
      });
      
      product.obvyInfo.transaction = {
        created: true,
        ...JSON.parse(JSON.stringify(obvyTransaction)),
      };

      product.status = 'transaction_created';

      await product.save();


      return res.status(200).json({
        ok: true,
      });
    }

    return res.status(400).json({
      ok: false,
      error: 'EventType is not TRANSACTION_CREATED',
    });
  }



  // TRANSACTION_ACCEPTED :  A transaction has been accepted by the seller
  if (EventType === 'TRANSACTION_ACCEPTED' && EventId) {
    // Step1:  Get obvy event by eventId
    const obvyEvent = await obvyHelper.getObvyEventById({ eventId: EventId });

    if (!obvyEvent) {
      return res.status(400).json({
        ok: false,
        error: 'Event not found',
      });
    }

    // Step2:  Get obvy  transaction by id
    if (
      obvyEvent &&
      obvyEvent.eventType &&
      obvyEvent.eventType === 'TRANSACTION_ACCEPTED' &&
      obvyEvent.data &&
      obvyEvent.data.id
    ) {

      const obvyTransaction = await obvyHelper.getObvyTransactionById({
        transactionId: obvyEvent.data.id,
      });


      if (!obvyTransaction) {
        return res.status(400).json({
          ok: false,
          error: 'Transaction not found',
        });
      }

      const { external_id } = obvyTransaction;

      // Step3:  Get product by external_id

      const product = await Product.findOne({ _id: getDocId(external_id) });

      if (!product) {
        return res.status(400).json({
          ok: false,
          error: 'Product not found',
        });
      }

      console.log({
        transaction: {
          created: true,
          ...JSON.parse(JSON.stringify(obvyTransaction)),
        },
      });
      
      product.obvyInfo.transaction = {
        created: true,
        ...JSON.parse(JSON.stringify(obvyTransaction)),
      };

      product.status = 'transaction_accepted';

      await product.save();


      return res.status(200).json({
        ok: true,
      });
    }

    return res.status(400).json({
      ok: false,
      error: 'EventType is not TRANSACTION_ACCEPTED',
    });
  }


  // TRANSACTION_DELIVERY
  if (EventType === 'TRANSACTION_DELIVERY' && EventId) {
    // Step1:  Get obvy event by eventId
    const obvyEvent = await obvyHelper.getObvyEventById({ eventId: EventId });
    
    if (!obvyEvent) {
      return res.status(400).json({
        ok: false,
        error: 'Event not found',
      });
    }
    
    // Step2:  Get obvy  transaction by id
    if (
      obvyEvent &&
          obvyEvent.eventType &&
          obvyEvent.eventType === 'TRANSACTION_DELIVERY' &&
          obvyEvent.data &&
          obvyEvent.data.id
    ) {
      const obvyTransaction = await obvyHelper.getObvyTransactionById({
        transactionId: obvyEvent.data.id,
      });
    
      if (!obvyTransaction) {
        return res.status(400).json({
          ok: false,
          error: 'Transaction not found',
        });
      }
    
      const { external_id } = obvyTransaction;
    
      // Step3:  Get product by external_id
    
      const product = await Product.findOne({ _id: getDocId(external_id) });
    
      if (!product) {
        return res.status(400).json({
          ok: false,
          error: 'Product not found',
        });
      }
    
      console.log({
        transaction :JSON.stringify({ created: true, ...obvyTransaction }),
      });
          
      product.obvyInfo.transaction = { created: true, ...obvyTransaction };
    
      product.status = 'transaction_delivery';
    
      await product.save();
    
    
      return  res.status(200).json({
        ok: true,
      });
    }
    
    return res.status(400).json({
      ok: false,
      error: 'EventType is not TRANSACTION_DELIVERY',
    });
  }


  // TRANSACTION_COMPLETED
  if (EventType === 'TRANSACTION_COMPLETED' && EventId) {
    // Step1:  Get obvy event by eventId
    const obvyEvent = await obvyHelper.getObvyEventById({ eventId: EventId });
    
    if (!obvyEvent) {
      return res.status(400).json({
        ok: false,
        error: 'Event not found',
      });
    }
    
    // Step2:  Get obvy  transaction by id
    if (
      obvyEvent &&
          obvyEvent.eventType &&
          obvyEvent.eventType === 'TRANSACTION_COMPLETED' &&
          obvyEvent.data &&
          obvyEvent.data.id
    ) {
      const obvyTransaction = await obvyHelper.getObvyTransactionById({
        transactionId: obvyEvent.data.id,
      });
    
      if (!obvyTransaction) {
        return res.status(400).json({
          ok: false,
          error: 'Transaction not found',
        });
      }
    
      const { external_id } = obvyTransaction;
    
      // Step3:  Get product by external_id
    
      const product = await Product.findOne({ _id: getDocId(external_id) });
    
      if (!product) {
        return res.status(400).json({
          ok: false,
          error: 'Product not found',
        });
      }
    
      console.log({
        transaction :JSON.stringify({ created: true, ...obvyTransaction }),
      });
          
      product.obvyInfo.transaction = { created: true, ...obvyTransaction };
    
      product.status = 'transaction_completed';
    
      await product.save();
    
    
      return res.status(200).json({
        ok: true,
      });
    }
    
    return res.status(400).json({
      ok: false,
      error: 'EventType is not TRANSACTION_COMPLETED',
    });
  }

};
/**
 *  handle Get Payment Success
 * @controller Check "Product" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.handleObvyPaymentSuccess = async function handleObvyPaymentSuccess(req, res, next) {
  // Set the Content-Type header to 'text/html'
  res.setHeader('Content-Type', 'text/html');

  // Define the HTML content
  const htmlContent = `
     <!DOCTYPE html>
     <html lang="en">
     <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>paiement réussi</title>
     </head>
     <body style="text-align: center;">
       <h1>Paiement réussi</h1>
     </body>
     </html>
   `;

  // Send the HTML content and end the response
  res.end(htmlContent);
};

/**
 *  handle Get Payment Success
 * @controller Check "Product" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.handleObvyPaymentCancel = async function handleObvyPaymentCancel(req, res, next) {
  // Set the Content-Type header to 'text/html'
  res.setHeader('Content-Type', 'text/html');

  // Define the HTML content
  const htmlContent = `
     <!DOCTYPE html>
     <html lang="en">
     <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>paiement annulé</title>
     </head>
     <body style="text-align: center;">
       <h1>Paiement annulé</h1>
     </body>
     </html>
   `;

  // Send the HTML content and end the response
  res.end(htmlContent);
};
