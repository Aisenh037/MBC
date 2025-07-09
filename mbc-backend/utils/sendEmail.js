import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (email, tempPassword) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const message = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to MBC Portal',
    text: `Your temporary password is: ${tempPassword}. Please reset it after your first login.`,
  };

  await transporter.sendMail(message);
};
