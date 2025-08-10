// utils/fileUpload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ErrorResponse from './errorResponse.js';

/**
 * Factory function to create a multer upload instance for a specific destination.
 * @param {string} destinationSubfolder - The subfolder within './public/uploads'
 * @returns {multer.Instance}
 */
const createUploader = (destinationSubfolder) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join('./public/uploads', destinationSubfolder);
      // Create directory if it doesn't exist
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Create a unique filename to avoid overwrites
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    },
  });

  const fileFilter = (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new ErrorResponse('Error: File type not allowed!', 400));
  };

  return multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter,
  });
};

// Export configured middleware instead of controller functions
export const uploadProfilePhoto = createUploader('profiles').single('profilePhoto');
export const uploadAssignmentFile = createUploader('assignments').single('assignmentFile');
export const uploadSubmissionFile = createUploader('submissions').single('submissionFile');
export const uploadGalleryImages = createUploader('gallery').array('images', 10);