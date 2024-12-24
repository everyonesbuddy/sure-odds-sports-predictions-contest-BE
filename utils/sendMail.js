const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = async (senderOptions) => {
  const msg = {
    to: senderOptions.email,
    from: 'info@sure-odds.com',
    subject: senderOptions.subject,
    text: senderOptions.message,
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent');
    })
    .catch((error) => {
      console.error(error);
    });
};
