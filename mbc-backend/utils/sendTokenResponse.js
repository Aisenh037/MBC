import jwt from 'jsonwebtoken';
import logger from './logger.js';

/**
 * Sends JWT token in response with secure cookie settings
 * @param {object} user - User document
 * @param {number} statusCode - HTTP status code
 * @param {object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    domain: process.env.COOKIE_DOMAIN || 'localhost'
  };

  // Remove sensitive data
  user.password = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  logger.info(`Token generated for user ${user._id}`);

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        profilePhoto: user.profilePhoto
      }
    });
};

export default sendTokenResponse;
