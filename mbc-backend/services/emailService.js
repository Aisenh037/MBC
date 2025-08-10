// services/emailService.js
import nodemailer from 'nodemailer';

// You must configure the transporter with your email provider's credentials
// It's best to use environment variables for this sensitive data.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * A generic function to send an email.
 * @param {object} options - Email options { to, subject, text, html }.
 */
export const sendEmail = async (options) => {
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email: ', error);
    // Do not throw an error that stops the application flow, just log it.
  }
};

/**
 * Sends a welcome email to a new user.
 * @param {object} user - The user object.
 */
export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to NIT Bhopal Department Portal!';
  const message = `<h1>Hi ${user.name},</h1><p>Welcome! Your account has been created successfully.</p>`;
  
  await sendEmail({
    to: user.email,
    subject,
    html: message
  });
};