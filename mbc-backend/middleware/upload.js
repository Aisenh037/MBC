import ErrorResponse from '../utils/errorResponse.js';

export const uploadFile = (fieldName, allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return next(new ErrorResponse(`Please upload a ${fieldName} file`, 400));
    }

    const file = req.files[fieldName];

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return next(
        new ErrorResponse(
          `Please upload a file of type: ${allowedTypes.join(', ')}`,
          400
        )
      );
    }

    // Check file size
    if (file.size > maxSize) {
      return next(
        new ErrorResponse(
          `Please upload a file less than ${maxSize / 1000000}MB`,
          400
        )
      );
    }

    next();
  };
};
