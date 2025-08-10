// utils/sendTokenResponse.js
import jwt from 'jsonwebtoken';
import logger from './logger.js';

/**
 * Signs a JWT, sets it in a secure cookie, and sends the response.
 * @param {object} user - User document from the database.
 * @param {number} statusCode - The HTTP status code for the response.
 * @param {object} res - The Express response object.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    //  Ensure COOKIE_DOMAIN is set correctly in your .env for production
    domain: process.env.COOKIE_DOMAIN,
  };

  user.password = undefined; // Remove password from the user object

  logger.info(`Token sent for user ${user._id}`);

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    data: user, // Send the cleaned user object
  });
};

export default sendTokenResponse;