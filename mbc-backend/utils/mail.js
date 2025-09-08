// utils/mail.js
const nodemailer = require('nodemailer');
const logger = require('./logger.js');
const config = require('../config/config.js');


// Conditionally create transporter only if email is configured
let transporter = null;
if (config.email) {
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: process.env.NODE_ENV === 'production', // Use true for 465, false for other ports
    auth: config.email.auth,
  });

  // Verify connection configuration on startup
  transporter.verify(function (error, success) {
    if (error) {
      logger.error('Mail transporter connection error:', error);
    } else {
      logger.info('Mail server is ready to take our messages');
    }
  });
} else {
  logger.info('Email service not configured. Emails will not be sent.');
}

/**
 * Sends an email using the pre-configured transporter.
 * @param {object} options - Email options { to, subject, text, html }
 */
const sendEmail = async (options) => {
  if (!transporter) {
    logger.warn(`Email not sent to ${options.to}: Email service not configured.`);
    return;
  }

  const mailOptions = {
    from: config.email.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to} with messageId: ${info.messageId}`);
  } catch (error) {
    logger.error(`Error sending email to ${options.to}:`, error);
  }
};

module.exports = { sendEmail };
