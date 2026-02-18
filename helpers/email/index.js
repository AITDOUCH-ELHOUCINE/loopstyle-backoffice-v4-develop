import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';

const config = require('@config/index');
const util = require('util');

let smtpTransport;
let isSendGrid = false;

if (config.mailer.options && config.mailer.options.auth && config.mailer.options.auth.pass) {
  smtpTransport = nodemailer.createTransport(config.mailer.options);
} else if (config.sendGrid && config.sendGrid.key && config.sendGrid.key !== 'SENDGRID_API_KEY') {
  isSendGrid = true;
  const sgKey = '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';
  // sgMail.setApiKey(config.sendGrid.key);
  sgMail.setApiKey(sgKey);
}


async function sendMail(subject, body, emails = [], opts = {}) {
  const msg = {
    ...opts,
    to: emails,
    from: config.mailer.from,
    subject,
    html: body,
  };

  if (!Array.isArray(emails) || emails.length === 0) {
    return false;
  }

  if (isSendGrid) {
    try {
      const send = util.promisify(sgMail.send).bind(sgMail);
      const data = await send(msg, false);
      if (Array.isArray(data) && data.length > 0) {
        const [d] = data;

        return d.toJSON();
      }
      return data;
    } catch (e) {
      return false;
    }
  } else if (smtpTransport) {
    const send = util.promisify(smtpTransport.sendMail).bind(smtpTransport);
    try {
      const data = await send(msg);
      // console.info(data);
      return data;
    } catch (e) {
      console.error(e);
      debug('Error while sending email', e, subject, emails);
      return false;
    }
  }

  return false;
}


export const sendNewAdminEmail = async (admin) => {
  try {


    const mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: config.app.title,
        link: 'http://smelly_cats.com',
      },
    });

    const email = {
      body: {
        name: 'Admin',
        intro: [
          'Hey !! someone contacted you from our app',
          `From:  ${admin.email}`,
          `Name:  ${admin.name}`,
          'Message:  Bienvenue',
        ],
        outro: 'Bye !!',
      },
    };

    const emailBody = mailGenerator.generate(email);


    await sendMail(
      'Nouveau Compte LoopStyle Backoffice',
      emailBody,
      [admin.email],
      {},
    );
    return true;
  } catch (error) {
    throw error;
  }
};
