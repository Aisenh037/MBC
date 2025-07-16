// npm install nodemailer
import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or any SMTP service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = { from: process.env.EMAIL_USER, to, subject, text, html };
  await transporter.sendMail(mailOptions);
};
