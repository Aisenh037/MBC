// middleware/auth.js
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';  
import User from '../models/user.js';  

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Optional: Check for token in cookies as a fallback
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token and then find the user from the database
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
        return next(new ErrorResponse('No user found with this id', 404));
    }
    
    next();
  } catch (err) {
    // This will catch expired tokens, malformed tokens, etc.
    return next(new ErrorResponse('Not authorized, token failed', 401));
  }
});

export default protect;