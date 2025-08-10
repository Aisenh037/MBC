// utils/mail.js
import nodemailer from 'nodemailer';
import logger from './logger.js';

//   Create the transporter outside the sendEmail function
// This ensures it's created only once and reused for all emails.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.NODE_ENV === 'production', // Use true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    logger.error('Mail transporter connection error:', error);
  } else {
    logger.info('Mail server is ready to take our messages');
  }
});

/**
 * Sends an email using the pre-configured transporter.
 * @param {object} options - Email options { to, subject, text, html }
 */
export const sendEmail = async (options) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
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