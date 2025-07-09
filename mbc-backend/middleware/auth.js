import jwt from "jsonwebtoken";
import ErrorResponse from "../utils/errorResponse.js";
import User from "../models/user.js";

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    next(new ErrorResponse("Invalid token", 401));
  }
};

// Middleware to authorize roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`User role '${req.user.role}' not authorized`, 403)
      );
    }
    next();
  };
};
