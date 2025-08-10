// middleware/requireRole.js
import ErrorResponse from '../utils/errorResponse.js';

const requireRole = (...roles) => {
  return (req, res, next) => {
    // Check that req.user exists before checking the role.
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user?.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

export default requireRole;